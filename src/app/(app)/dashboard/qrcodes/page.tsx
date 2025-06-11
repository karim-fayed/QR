
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreHorizontal, Search, QrCode as QrCodeIcon, Edit, Trash2, Copy, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { collection, query, where, onSnapshot, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface QrCodeData {
  id: string; // Firestore document ID
  name: string;
  shortId: string;
  uuid: string;
  originalContent: string;
  dataType: 'url' | 'text';
  encryptedPayload: string;
  qrCodeDataUrl?: string;
  createdAt: Timestamp;
  status: 'Active' | 'Expired' | 'Draft';
  scans: number;
  userId: string;
}

export default function MyQrCodesPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [qrCodes, setQrCodes] = useState<QrCodeData[]>([]);
  const [filteredQrCodes, setFilteredQrCodes] = useState<QrCodeData[]>([]);
  const [loadingQrCodes, setLoadingQrCodes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      if (!authLoading) {
        setLoadingQrCodes(false);
        // Potentially redirect or show login prompt if not loading and no user
      }
      return;
    }

    setLoadingQrCodes(true);
    setError(null);

    const q = query(
      collection(db, "qrcodes"), 
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const codes: QrCodeData[] = [];
      querySnapshot.forEach((doc) => {
        codes.push({ id: doc.id, ...doc.data() } as QrCodeData);
      });
      setQrCodes(codes);
      setLoadingQrCodes(false);
    }, (err) => {
      console.error("Error fetching QR codes:", err);
      setError("Failed to load QR codes. Please try again later.");
      toast({
        title: "Error Loading QR Codes",
        description: err.message || "Could not fetch your QR codes from the database.",
        variant: "destructive",
      });
      setLoadingQrCodes(false);
    });

    return () => unsubscribe();
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredQrCodes(qrCodes);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = qrCodes.filter(
        (qr) =>
          qr.name.toLowerCase().includes(lowercasedFilter) ||
          qr.shortId.toLowerCase().includes(lowercasedFilter) ||
          qr.originalContent.toLowerCase().includes(lowercasedFilter) ||
          qr.uuid.toLowerCase().includes(lowercasedFilter)
      );
      setFilteredQrCodes(filtered);
    }
  }, [searchTerm, qrCodes]);
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleDeleteQrCode = (id: string) => {
    console.log("Delete QR Code:", id);
    // TODO: Implement actual Firestore delete
    toast({ title: "Delete Action (Placeholder)", description: `QR Code ${id} would be deleted.`});
  };
  
  const handleCopyShortId = (shortId: string) => {
    navigator.clipboard.writeText(shortId);
    toast({ title: "Short ID Copied", description: `${shortId} copied to clipboard.`});
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Card className="shadow-md">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-3 border-b">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser && !authLoading) {
     return (
        <div className="text-center py-10">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold text-foreground">Authentication Required</h3>
            <p className="mt-1 text-sm text-muted-foreground">
            Please <Link href="/login" className="text-primary hover:underline">log in</Link> to view your QR codes.
            </p>
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My QR Codes</h1>
          <p className="text-muted-foreground">
            View, manage, and organize your saved QR codes.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/qrcodes/new" className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" /> Create New QR Code
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle>Your QR Code Library</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search by name, ID, content..." 
                className="pl-8 sm:w-[250px] md:w-[350px] w-full" 
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <CardDescription>
            {loadingQrCodes ? "Loading your QR codes..." : 
             `A list of all QR codes you have generated and saved. Found ${filteredQrCodes.length} of ${qrCodes.length} codes.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingQrCodes ? (
             <div className="space-y-3 mt-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : filteredQrCodes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] sm:w-auto">Name</TableHead>
                  <TableHead className="hidden md:table-cell">Short ID</TableHead>
                  <TableHead className="hidden lg:table-cell">Content Preview</TableHead>
                  <TableHead className="text-center">Scans</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQrCodes.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell className="font-medium">{qr.name || "Untitled QR"}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono">
                      <Button variant="ghost" size="sm" onClick={() => handleCopyShortId(qr.shortId)} className="p-1 h-auto text-xs">
                        {qr.shortId} <Copy className="ml-1.5 h-3 w-3"/>
                      </Button>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell truncate max-w-xs text-xs">
                      {qr.dataType === 'url' ? (
                        <Link href={qr.originalContent} target="_blank" className="text-primary hover:underline">
                          {qr.originalContent}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{qr.originalContent.substring(0, 50)}{qr.originalContent.length > 50 ? "..." : ""}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{qr.scans}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        qr.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" : 
                        qr.status === "Expired" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" // Draft or other
                        }`}>
                        {qr.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs">{qr.createdAt.toDate().toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyShortId(qr.shortId)}>
                            <Copy className="mr-2 h-4 w-4" /> Copy Short ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteQrCode(qr.id)} className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/50 focus:text-red-700 dark:focus:text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <QrCodeIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {searchTerm ? "No Matching QR Codes" : "No QR Codes Yet"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? "Try a different search term or create a new QR code." : "Get started by creating your first secure QR code."}
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/qrcodes/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create QR Code
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
