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
    name: "เกตเวย์หลัก",
    detail: "ออนไลน์ · ทำงาน 99.9%",
    status: "active",
    health: "healthy",
  },
  {
    name: "โหนดเซ็นเซอร์ A",
    detail: "ออนไลน์ · แบตเตอรี่ 85%",
    status: "active",
    health: "healthy",
  },
  {
    name: "โหนดเซ็นเซอร์ B",
    detail: "ออฟไลน์ · เห็นล่าสุด 2 ชั่วโมงก่อน",
    status: "offline",
    health: "critical",
  },
  {
    name: "ตัวควบคุมอุปกรณ์",
    detail: "ออนไลน์ · รอใช้งาน",
    status: "active",
    health: "warning",
  },
]

const alerts = [
  {
    message: "อุณหภูมิเกินค่าปลอดภัย (30°C)",
    level: "critical",
    time: "5 นาทีที่แล้ว",
  },
  {
    message: "โหนดเซ็นเซอร์ B ออฟไลน์",
    level: "warning",
    time: "12 นาทีที่แล้ว",
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
          <KpiCard title="อุปกรณ์ทั้งหมด" value="128" desc="+4 จากเดือนที่แล้ว" icon={<Radio className="h-4 w-4" />} />
          <KpiCard title="เซ็นเซอร์ทำงาน" value="112" desc="+12 จากชั่วโมงที่แล้ว" icon={<Activity className="h-4 w-4" />} />
          <KpiCard title="การใช้พลังงาน" value="1.2 kW" desc="-5% จากเมื่อวาน" icon={<Zap className="h-4 w-4" />} />
          <KpiCard title="ผู้ใช้งานออนไลน์" value="573" desc="+201 จากชั่วโมงที่แล้ว" icon={<Users className="h-4 w-4" />} />
        </div>

        {/* ===== OVERALL SYSTEM HEALTH (เพิ่มวันนี้) ===== */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Shield className="h-5 w-5" />
            <CardTitle>สุขภาพระบบโดยรวม</CardTitle>
          </CardHeader>
          <CardContent>
            {overallHealth === "GOOD" && (
              <Badge className="bg-green-100 text-green-700">
                <ShieldCheck className="mr-1 h-4 w-4" />
                ดีเยี่ยม – ระบบทำงานปกติ
              </Badge>
            )}
            {overallHealth === "DEGRADED" && (
              <Badge className="bg-yellow-100 text-yellow-700">
                <ShieldAlert className="mr-1 h-4 w-4" />
                เสื่อมสภาพ – บางอุปกรณ์ต้องดูแล
              </Badge>
            )}
            {overallHealth === "CRITICAL" && (
              <Badge className="bg-red-100 text-red-700">
                <ShieldAlert className="mr-1 h-4 w-4" />
                วิกฤติ – ต้องดำเนินการทันที
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
                  สภาพแวดล้อมปัจจุบันอยู่ในช่วงการทำงานปกติ
                  อุณหภูมิเกินค่าปลอดภัยช่วงเที่ยงวันสั้นๆ
                  ซึ่งทำให้เกิดการแจ้งเตือนคำเตือน
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  อัปเดตล่าสุด: {lastUpdated}
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
            <CardTitle>อุปกรณ์ล่าสุด</CardTitle>
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
        <CardTitle>สถานะระบบ</CardTitle>
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
                  <Badge className="bg-green-100 text-green-700">ปกติ</Badge>
                )}
                {item.health === "warning" && (
                  <Badge className="bg-yellow-100 text-yellow-700">เตือน</Badge>
                )}
                {item.health === "critical" && (
                  <Badge className="bg-red-100 text-red-700">วิกฤติ</Badge>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {item.health === "healthy" && "อุปกรณ์ทำงานปกติ"}
                {item.health === "warning" && "อุปกรณ์ออนไลน์แต่ต้องดูแล"}
                {item.health === "critical" && "อุปกรณ์ออฟไลน์หรือสภาพไม่ปลอดภัย"}
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
        <CardTitle>การแจ้งเตือนระบบ</CardTitle>
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
        <CardTitle>การดำเนินการด่วน</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          เพิ่มอุปกรณ์ใหม่
        </Button>
        <Button variant="outline" className="w-full">
          <Sliders className="mr-2 h-4 w-4" />
          ตั้งค่ากฎอัตโนมัติ
        </Button>
      </CardContent>
    </Card>
  )
}
