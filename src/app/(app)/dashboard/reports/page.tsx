
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, TrendingUp, QrCode, Users, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts"

const chartDataScans = [
  { month: "January", totalScans: Math.floor(Math.random() * 500) + 50 },
  { month: "February", totalScans: Math.floor(Math.random() * 500) + 50 },
  { month: "March", totalScans: Math.floor(Math.random() * 500) + 50 },
  { month: "April", totalScans: Math.floor(Math.random() * 500) + 50 },
  { month: "May", totalScans: Math.floor(Math.random() * 500) + 50 },
  { month: "June", totalScans: Math.floor(Math.random() * 500) + 50 },
]

const chartDataVerification = [
  { name: "Verified", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "Tampered", value: 30, fill: "hsl(var(--chart-2))" },
  { name: "Expired", value: 70, fill: "hsl(var(--chart-3))" },
  { name: "Invalid Location", value: 20, fill: "hsl(var(--chart-4))" },
]

const chartConfigScans = {
  totalScans: {
    label: "Total Scans",
    color: "hsl(var(--chart-1))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

const chartConfigVerification = {
 Verified: { label: "Verified", color: "hsl(var(--chart-1))" },
 Tampered: { label: "Tampered", color: "hsl(var(--chart-2))" },
 Expired: { label: "Expired", color: "hsl(var(--chart-3))" },
 "Invalid Location": { label: "Invalid Location", color: "hsl(var(--chart-4))"},
} satisfies import("@/components/ui/chart").ChartConfig;


export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground">
          Gain insights into the performance and usage of your QR codes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Active QR Codes", value: "25", icon: QrCode, trend: "+5 this month" },
          { title: "Total Scans (Last 30 Days)", value: "1,280", icon: TrendingUp, trend: "+15% vs previous period" },
          { title: "Unique Users Scanned", value: "450", icon: Users, trend: "+8% new users" },
          { title: "Security Alerts", value: "12", icon: AlertTriangle, trend: "3 new alerts today" },
        ].map(stat => (
            <Card key={stat.title} className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground pt-1">{stat.trend}</p>
              </CardContent>
            </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary" /> Monthly Scan Trends</CardTitle>
            <CardDescription>Total scans per month for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigScans} className="min-h-[250px] w-full">
              <RechartsBarChart accessibilityLayer data={chartDataScans}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="totalScans" fill="var(--color-totalScans)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-primary" /> Verification Status Breakdown</CardTitle>
            <CardDescription>Distribution of QR code verification outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             <ChartContainer config={chartConfigVerification} className="mx-auto aspect-square max-h-[300px]">
              <RechartsPieChart accessibilityLayer>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartDataVerification}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
