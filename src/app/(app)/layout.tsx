
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/global/logo';
import { Button } from '@/components/ui/button';
import { Bell, UserCircle, LogOut, Settings } from 'lucide-react';
import { SidebarNav } from '@/components/global/sidebar-nav';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { useRouter } from 'next/navigation'; // Import useRouter
import { useEffect } from 'react'; // Import useEffect
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, logoutUser } = useAuth(); // Use the auth context
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login'); // Redirect to login if not authenticated
    }
  }, [currentUser, loading, router]);

  if (loading || (!currentUser && typeof window !== 'undefined' && window.location.pathname !== '/login')) {
    // You can show a loading spinner or a skeleton screen here
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Loading application...</p> {/* More generic loading message */}
      </div>
    );
  }
  
  // If not loading and no current user, and we are not already on login page,
  // this indicates a redirect is likely happening or should have happened.
  // Rendering nothing or a minimal loader avoids flashing content.
  if (!currentUser && !loading) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Redirecting to login...</p>
      </div>
    );
  }


  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar className="border-r bg-card" collapsible="icon">
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
               <Logo size="md" />
              <div className="group-data-[collapsible=icon]:hidden flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href="/dashboard/account">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start group-data-[collapsible=icon]:justify-center"
              onClick={logoutUser} // Use logoutUser from context
            >
              <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col bg-background">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-8">
            <div>
              <SidebarTrigger className="md:hidden" />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/account">
                  <UserCircle className="h-6 w-6" />
                  <span className="sr-only">User Profile</span>
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
