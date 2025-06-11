
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, MapPin, CalendarDays, Smartphone } from "lucide-react";

export default function VerificationLogPage() {
  // Placeholder data - replace with actual data fetching
  const logs = [
    { id: "log1", qrName: "Campaign Alpha", status: "Verified", location: "New York, USA", timestamp: "2024-05-28 10:30 AM", device: "iPhone 15 Pro" },
    { id: "log2", qrName: "Product Launch Q2", status: "Tampered", location: "London, UK", timestamp: "2024-05-28 09:15 AM", device: "Android Pixel 8" },
    { id: "log3", qrName: "Event Ticket", status: "Verified", location: "Paris, France", timestamp: "2024-05-27 18:00 PM", device: "Samsung Galaxy S24" },
    { id: "log4", qrName: "Campaign Alpha", status: "Expired", location: "Tokyo, Japan", timestamp: "2024-05-27 15:45 PM", device: "iPhone 14" },
  ];

  const getStatusIcon = (status: string) => {
    if (status === "Verified") return <ShieldCheck className="h-5 w-5 text-green-500" />;
    if (status === "Tampered") return <ShieldAlert className="h-5 w-5 text-red-500" />;
    if (status === "Expired") return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
    return <ShieldCheck className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Verification Log</h1>
        <p className="text-muted-foreground">
          Track all scan attempts and verification statuses for your QR codes.
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Verification Attempts</CardTitle>
          <CardDescription>A detailed log of every time your QR codes were scanned and verified.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>QR Code Name</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden sm:table-cell">Timestamp</TableHead>
                  <TableHead className="hidden lg:table-cell">Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className={`font-medium ${
                        log.status === "Verified" ? "text-green-600" :
                        log.status === "Tampered" ? "text-red-600" :
                        log.status === "Expired" ? "text-yellow-600" : ""
                      }`}>{log.status}</span>
                    </TableCell>
                    <TableCell>{log.qrName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" /> {log.location}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                     <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" /> {log.timestamp}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                       <div className="flex items-center gap-1">
                        <Smartphone className="h-4 w-4 text-muted-foreground" /> {log.device}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold text-foreground">No Verification Activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Scan attempts will be recorded here once your QR codes are used.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
