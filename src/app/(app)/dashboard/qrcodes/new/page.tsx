
'use client';
import { QrCodeGenerator } from "@/components/features/qr-code-generator";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewQrCodePage() {
  const { currentUser, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/qrcodes">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to My QR Codes</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create New QR Code</h1>
          <p className="text-muted-foreground">
            Generate an encrypted and signed QR code. Authenticated users can save and manage codes.
          </p>
        </div>
      </div>
      
      <QrCodeGenerator userId={currentUser?.uid} />

    </div>
  );
}
