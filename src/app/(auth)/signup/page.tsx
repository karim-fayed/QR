
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signupWithEmailAndPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match."); // Basic validation, more can be added
      return;
    }
    if (!email || !password) {
       alert("Please fill in all fields.");
       return;
    }
    await signupWithEmailAndPassword(email, password);
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" /> Create Account
        </CardTitle>
        <CardDescription>
          Join CodeSafe QR to create and manage your secure QR codes.
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
              required
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
              required
              minLength={6} // Firebase default minimum
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-muted-foreground" />Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Sign Up
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" asChild className="px-0">
              <Link href="/login">Login</Link>
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
