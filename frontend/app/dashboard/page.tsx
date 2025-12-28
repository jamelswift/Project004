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
  Activity,
  Users,
  Zap,
  Radio,
  AlertTriangle,
  PlusCircle,
  Sliders,
} from "lucide-react"

import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentDevicesTable } from "@/components/recent-devices-table"

/* ---------------- MOCK DATA ---------------- */

const systemStatus = [
  {
    name: "Main Gateway",
    detail: "Online · 99.9% uptime",
    status: "active",
  },
  {
    name: "Sensor Node A",
    detail: "Online · Battery 85%",
    status: "active",
  },
  {
    name: "Sensor Node B",
    detail: "Offline · Last seen 2h ago",
    status: "offline",
  },
  {
    name: "Actuator Controller",
    detail: "Online · Idle",
    status: "active",
  },
]

const alerts = [
  {
    message: "Temperature exceeded safe threshold",
    level: "critical",
  },
  {
    message: "Sensor Node B is offline",
    level: "warning",
  },
]

/* ---------------- PAGE ---------------- */

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ===== KPI ===== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Devices"
          value="128"
          desc="+4 from last month"
          icon={<Radio className="h-4 w-4" />}
        />
        <KpiCard
          title="Active Sensors"
          value="112"
          desc="+12 since last hour"
          icon={<Activity className="h-4 w-4" />}
        />
        <KpiCard
          title="Power Usage"
          value="1.2 kW"
          desc="-5% from yesterday"
          icon={<Zap className="h-4 w-4" />}
        />
        <KpiCard
          title="Active Users"
          value="573"
          desc="+201 since last hour"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* ===== ENVIRONMENT + STATUS ===== */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <DashboardCharts />
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
  )
}

/* ---------------- COMPONENTS ---------------- */

function KpiCard({
  title,
  value,
  desc,
  icon,
}: {
  title: string
  value: string
  desc: string
  icon: React.ReactNode
}) {
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

function SystemStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {systemStatus.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.detail}
              </p>
            </div>
            <span
              className={
                item.status === "active"
                  ? "text-green-600 font-medium"
                  : "text-red-500 font-medium"
              }
            >
              {item.status === "active" ? "Active" : "Offline"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

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
            className="flex items-center gap-3 rounded-md border p-3"
          >
            <AlertTriangle
              className={
                alert.level === "critical"
                  ? "text-red-500"
                  : "text-yellow-500"
              }
            />
            <span className="text-sm">{alert.message}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button variant="default" className="w-full">
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
