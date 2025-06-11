'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { UserCircle, LayoutDashboard, LogIn, LogOut, ScanLine } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  const { currentUser, loading, logoutUser } = useAuth();

  return (
    <header className="py-4 px-4 md:px-6 shadow-md bg-card">
      <div className="container mx-auto flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/verify-qr" className="flex items-center gap-1">
              <ScanLine className="h-4 w-4" /> Verify QR
            </Link>
          </Button>
          {loading ? (
            <div className="flex items-center gap-2 md:gap-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ) : currentUser ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/account" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" /> Account
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="outline" onClick={logoutUser} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
