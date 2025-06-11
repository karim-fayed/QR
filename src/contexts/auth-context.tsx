'use client';

import type { User } from '@/lib/types/user';
import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  type ReactNode,
  type FC
} from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  type AuthError,
  type UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithEmailAndPassword: (email: string, password: string) => Promise<UserCredential | AuthError>;
  signupWithEmailAndPassword: (email: string, password: string) => Promise<UserCredential | AuthError>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from your backend
        try {
          const response = await fetch(`/api/users/${firebaseUser.uid}`);
          const userProfile = await response.json();
          
          // Merge Firebase user with profile data
          const user: User = {
            ...firebaseUser,
            subscriptionPlan: userProfile.subscriptionPlan || 'free',
            monthlyQrCount: userProfile.monthlyQrCount || 0,
            lastQrResetDate: userProfile.lastQrResetDate || new Date().toISOString()
          };
          
          setCurrentUser(user);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Set default values if profile fetch fails
          const user: User = {
            ...firebaseUser,
            subscriptionPlan: 'free',
            monthlyQrCount: 0,
            lastQrResetDate: new Date().toISOString()
          };
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
      
      if (firebaseUser && (pathname === '/login' || pathname === '/signup')) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);

  const loginWithEmailAndPassword = async (email: string, password: string): Promise<UserCredential | AuthError> => {
    setLoading(true);
    try {
      const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      // No need to call setCurrentUser here, onAuthStateChanged handles it
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/dashboard'); // onAuthStateChanged will also trigger this if on login/signup
      return userCredential;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      toast({ title: 'Login Failed', description: authError.message || 'An unexpected error occurred.', variant: 'destructive' });
      return authError;
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const signupWithEmailAndPassword = async (email: string, password: string): Promise<UserCredential | AuthError> => {
    setLoading(true);
    try {
      const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
      // No need to call setCurrentUser here, onAuthStateChanged handles it
      toast({ title: 'Signup Successful', description: 'Welcome to CodeSafe QR!' });
      router.push('/dashboard'); // onAuthStateChanged will also trigger this if on login/signup
      return userCredential;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Signup error:', authError);
      toast({ title: 'Signup Failed', description: authError.message || 'An unexpected error occurred.', variant: 'destructive' });
      return authError;
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const logoutUser = async () => {
    // setLoading(true); // Not strictly needed as onAuthStateChanged will handle UI update
    try {
      await signOut(auth);
      // setCurrentUser(null); // onAuthStateChanged will handle this
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error) {
      const authError = error as AuthError;
      console.error('Logout error:', authError);
      toast({ title: 'Logout Failed', description: authError.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      // setLoading(false); // onAuthStateChanged will eventually set loading to false
    }
  };

  const value = {
    currentUser,
    loading,
    loginWithEmailAndPassword,
    signupWithEmailAndPassword,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
