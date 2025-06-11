'use client';

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, KeyRound, CreditCard, UserCircle, UploadCloud, Palette, Bell, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AccountPage() {
  const { currentUser, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <Card className="shadow-md">
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-2/5 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const userInitial = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, subscription, and application preferences.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle className="h-6 w-6 text-primary" /> Profile Information</CardTitle>
          <CardDescription>Update your personal details and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24 text-3xl">
              <AvatarImage src={currentUser?.photoURL || `https://placehold.co/200x200.png`} alt={currentUser?.displayName || currentUser?.email || "User"} data-ai-hint="user avatar" />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-2 text-center sm:text-left">
              <Label htmlFor="profilePicture">Profile Picture</Label>
              <Input id="profilePicture" type="file" className="text-sm" />
              <Button variant="outline" size="sm" className="mt-2">
                <UploadCloud className="mr-2 h-4 w-4" /> Upload New Picture
              </Button>
            </div>
          </div>
          
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-1.5">Display Name</Label>
            <Input id="displayName" defaultValue={currentUser?.displayName || ""} placeholder="Your Name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted-foreground" /> Email Address</Label>
            <Input id="email" type="email" value={currentUser?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">Your email address cannot be changed here.</p>
          </div>
          
          <Button className="w-full sm:w-auto">Save Profile Changes</Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-6 w-6 text-primary" /> Security</CardTitle>
          <CardDescription>Manage your password and account security settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input id="confirmNewPassword" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full sm:w-auto">Change Password</Button>
           <Separator className="my-4" />
           <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-muted-foreground" /> Two-Factor Authentication (2FA)</Label>
            <Button variant="outline" className="w-full sm:w-auto">Enable 2FA</Button>
            <p className="text-xs text-muted-foreground">Enhance your account security by enabling two-factor authentication.</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" /> Subscription & Billing</CardTitle>
          <CardDescription>View your current plan, manage billing details, and see invoice history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Plan: <span className="font-semibold text-primary">Free Tier</span></p>
                <p className="text-xs text-muted-foreground">10 QR Codes / month</p>
              </div>
              <Badge variant="outline" className="ml-2">Free</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• QR code validity: 5 days</p>
              <p>• Limited customization</p>
              <p>• Email support</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
              <Link href="/pricing">View All Plans</Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">Manage Billing</Button>
            <Button variant="link" className="w-full sm:w-auto px-0">View Invoice History</Button>
          </div>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /> Notification Preferences</CardTitle>
          <CardDescription>Control how you receive notifications from CodeSafe QR.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Placeholder for notification settings */}
          <p className="text-sm text-muted-foreground">Notification settings will be available here.</p>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-6 w-6 text-primary" /> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Placeholder for theme settings */}
          <p className="text-sm text-muted-foreground">Theme and appearance settings will be available here (e.g., Light/Dark mode toggle).</p>
        </CardContent>
      </Card>

    </div>
  );
}
