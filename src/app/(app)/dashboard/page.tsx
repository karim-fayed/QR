
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, ShieldCheck, BarChart3, PlusCircle, ArrowRight, Settings } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Placeholder data
  const stats = [
    { title: "Active QR Codes", value: "15", icon: QrCode, color: "text-primary" },
    { title: "Total Scans Today", value: "128", icon: ShieldCheck, color: "text-green-500" },
    { title: "Security Alerts", value: "2", icon: BarChart3, color: "text-red-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to CodeSafe QR</h1>
          <p className="text-muted-foreground">Manage your secure QR codes and monitor their activity.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/qrcodes/new" className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" /> Create New QR Code
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground pt-1">
                {index === 0 ? "+5 this month" : index === 1 ? "+12 since last hour" : "Needs attention"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest scans and verification attempts.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity list */}
            <ul className="space-y-3">
              {[1,2,3].map(i => (
              <li key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="font-medium text-sm">QR Code 'Campaign X' scanned</p>
                  <p className="text-xs text-muted-foreground">Location: New York, USA - {new Date().toLocaleTimeString()}</p>
                </div>
                <span className="text-xs text-green-500 font-semibold">Verified</span>
              </li>
              ))}
            </ul>
            <Button variant="link" className="mt-2 px-0 text-primary">
              View All Activity <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3" asChild>
              <Link href="/dashboard/qrcodes">
                <QrCode className="mr-2 h-5 w-5 text-primary"/> 
                <div>
                  <span className="font-semibold">Manage QR Codes</span>
                  <p className="text-xs text-muted-foreground">View, edit, or delete codes.</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3" asChild>
              <Link href="/dashboard/verification-log">
                <ShieldCheck className="mr-2 h-5 w-5 text-primary"/>
                <div>
                  <span className="font-semibold">View Verification Log</span>
                  <p className="text-xs text-muted-foreground">Track all scan attempts.</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3" asChild>
              <Link href="/dashboard/reports">
                <BarChart3 className="mr-2 h-5 w-5 text-primary"/>
                <div>
                  <span className="font-semibold">Analytics & Reports</span>
                  <p className="text-xs text-muted-foreground">Understand QR performance.</p>
                </div>
              </Link>
            </Button>
             <Button variant="outline" className="w-full justify-start text-left h-auto py-3" asChild>
                <Link href="/dashboard/account">
                  <Settings className="mr-2 h-5 w-5 text-primary"/>
                  <div>
                    <span className="font-semibold">Account Settings</span>
                    <p className="text-xs text-muted-foreground">Manage profile & plan.</p>
                  </div>
                </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
