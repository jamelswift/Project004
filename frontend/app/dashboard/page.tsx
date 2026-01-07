"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Activity,
  Users,
  Zap,
  Radio,
  AlertTriangle,
  PlusCircle,
  Sliders,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Shield,
} from "lucide-react"

import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentDevicesTable } from "@/components/recent-devices-table"

/* ---------------- MOCK DATA ---------------- */

const systemStatus = [
  {
    name: "Main Gateway",
    detail: "Online · 99.9% uptime",
    status: "active",
    health: "healthy",
  },
  {
    name: "Sensor Node A",
    detail: "Online · Battery 85%",
    status: "active",
    health: "healthy",
  },
  {
    name: "Sensor Node B",
    detail: "Offline · Last seen 2h ago",
    status: "offline",
    health: "critical",
  },
  {
    name: "Actuator Controller",
    detail: "Online · Idle",
    status: "active",
    health: "warning",
  },
]

const alerts = [
  {
    message: "Temperature exceeded safe threshold (30°C)",
    level: "critical",
    time: "5 minutes ago",
  },
  {
    message: "Sensor Node B is offline",
    level: "warning",
    time: "12 minutes ago",
  },
]

/* ---------------- HELPERS ---------------- */

function getOverallHealth() {
  if (systemStatus.some((d) => d.health === "critical")) return "CRITICAL"
  if (systemStatus.some((d) => d.health === "warning")) return "DEGRADED"
  return "GOOD"
}

const lastUpdated = new Date().toLocaleString()

/* ---------------- PAGE ---------------- */

export default function DashboardPage() {
  const overallHealth = getOverallHealth()

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* ===== KPI ===== */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Devices" value="128" desc="+4 from last month" icon={<Radio className="h-4 w-4" />} />
          <KpiCard title="Active Sensors" value="112" desc="+12 since last hour" icon={<Activity className="h-4 w-4" />} />
          <KpiCard title="Power Usage" value="1.2 kW" desc="-5% from yesterday" icon={<Zap className="h-4 w-4" />} />
          <KpiCard title="Active Users" value="573" desc="+201 since last hour" icon={<Users className="h-4 w-4" />} />
        </div>

        {/* ===== OVERALL SYSTEM HEALTH (เพิ่มวันนี้) ===== */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Shield className="h-5 w-5" />
            <CardTitle>Overall System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {overallHealth === "GOOD" && (
              <Badge className="bg-green-100 text-green-700">
                <ShieldCheck className="mr-1 h-4 w-4" />
                GOOD – System operating normally
              </Badge>
            )}
            {overallHealth === "DEGRADED" && (
              <Badge className="bg-yellow-100 text-yellow-700">
                <ShieldAlert className="mr-1 h-4 w-4" />
                DEGRADED – Some devices require attention
              </Badge>
            )}
            {overallHealth === "CRITICAL" && (
              <Badge className="bg-red-100 text-red-700">
                <ShieldAlert className="mr-1 h-4 w-4" />
                CRITICAL – Immediate action required
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* ===== ENVIRONMENT + STATUS ===== */}
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-4">
            <DashboardCharts />

            {/* 🔹 Insight Text */}
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  Current conditions are mostly within the normal operating range.
                  Temperature briefly exceeded the safe threshold around midday,
                  which triggered a warning alert.
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  Last updated: {lastUpdated}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <SystemStatusCard />
          </div>
        </div>

        {/* ===== ALERTS + QUICK ACTIONS ===== */}
        <div className="grid gap-6 md:grid-cols-2">
          <AlertsCard />
          <QuickActionsCard />
        </div>

        {/* ===== RECENT DEVICES ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentDevicesTable />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

/* ---------------- COMPONENTS ---------------- */

function KpiCard({ title, value, desc, icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}

/* ===== System Status + Tooltip (เพิ่มวันนี้) ===== */

function SystemStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {systemStatus.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </div>

            <Tooltip>
              <TooltipTrigger>
                {item.health === "healthy" && (
                  <Badge className="bg-green-100 text-green-700">Healthy</Badge>
                )}
                {item.health === "warning" && (
                  <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>
                )}
                {item.health === "critical" && (
                  <Badge className="bg-red-100 text-red-700">Critical</Badge>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {item.health === "healthy" && "Device operating normally"}
                {item.health === "warning" && "Device online but needs attention"}
                {item.health === "critical" && "Device offline or unsafe condition"}
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ===== Alerts ===== */

function AlertsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 rounded-md border p-3 ${
              alert.level === "critical" ? "bg-red-50" : "bg-yellow-50"
            }`}
          >
            <AlertTriangle
              className={alert.level === "critical" ? "text-red-500" : "text-yellow-500"}
            />
            <div>
              <p className="text-sm font-medium">{alert.message}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {alert.time}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ===== Quick Actions ===== */

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Device
        </Button>
        <Button variant="outline" className="w-full">
          <Sliders className="mr-2 h-4 w-4" />
          Configure Automation Rules
        </Button>
      </CardContent>
    </Card>
  )
}
