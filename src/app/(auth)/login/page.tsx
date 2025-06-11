
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithEmailAndPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      // Basic validation, AuthContext also shows toasts for Firebase errors
      alert("Please enter email and password."); 
      return;
    }
    await loginWithEmailAndPassword(email, password);
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <LogIn className="h-6 w-6 text-primary" /> Welcome Back!
        </CardTitle>
        <CardDescription>
          Enter your credentials to access your CodeSafe QR account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted-foreground" />Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-muted-foreground" />Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-end">
              <Button variant="link" size="sm" asChild className="px-0">
                <Link href="#">Forgot password?</Link>
              </Button>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Login
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Button variant="link" asChild className="px-0">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
