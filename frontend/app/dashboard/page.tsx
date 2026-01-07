"use client"

import { useState } from "react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  X,
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
  const [openAddDevice, setOpenAddDevice] = useState(false)
  const [openAddRule, setOpenAddRule] = useState(false)
  const [newDevice, setNewDevice] = useState({ name: "", type: "", location: "" })
  const [newRule, setNewRule] = useState({ name: "", trigger: "", action: "", condition: "" })

  const handleAddDevice = () => {
    console.log("Adding device:", newDevice)
    setNewDevice({ name: "", type: "", location: "" })
    setOpenAddDevice(false)
  }

  const handleAddRule = () => {
    console.log("Adding rule:", newRule)
    setNewRule({ name: "", trigger: "", action: "", condition: "" })
    setOpenAddRule(false)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">

        {/* ===== KPI ===== */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="อุปกรณ์ทั้งหมด" value="128" desc="+4 จากเดือนที่แล้ว" icon={<Radio className="h-4 w-4" />} />
          <KpiCard title="เซ็นเซอร์ทำงาน" value="112" desc="+12 จากชั่วโมงที่แล้ว" icon={<Activity className="h-4 w-4" />} />
          <KpiCard title="การใช้พลังงาน" value="1.2 kW" desc="-5% จากเมื่อวาน" icon={<Zap className="h-4 w-4" />} />
          <KpiCard title="ผู้ใช้งานออนไลน์" value="573" desc="+201 จากชั่วโมงที่แล้ว" icon={<Users className="h-4 w-4" />} />
        </div>

        {/* ===== OVERALL SYSTEM HEALTH (เพิ่มวันนี้) ===== */}
        <Card className="soft-card soft-card-hover transition-all">
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
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-4">
            <DashboardCharts />

            {/* 🔹 Insight Text */}
            <Card className="soft-card">
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
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <AlertsCard />
          <QuickActionsCard onOpenAddDevice={() => setOpenAddDevice(true)} onOpenAddRule={() => setOpenAddRule(true)} />
        </div>

        {/* ===== RECENT DEVICES ===== */}
        <Card className="soft-card">
          <CardHeader>
            <CardTitle>อุปกรณ์ล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentDevicesTable />
          </CardContent>
        </Card>

        {/* ===== ADD DEVICE MODAL ===== */}
        <Dialog open={openAddDevice} onOpenChange={setOpenAddDevice}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-600" />
                เพิ่มอุปกรณ์ใหม่
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="device-name">ชื่ออุปกรณ์</Label>
                <Input
                  id="device-name"
                  placeholder="เช่น เซ็นเซอร์อุณหภูมิ 1"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-type">ประเภทอุปกรณ์</Label>
                <Select value={newDevice.type} onValueChange={(value) => setNewDevice({ ...newDevice, type: value })}>
                  <SelectTrigger id="device-type">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temp-sensor">เซ็นเซอร์อุณหภูมิ</SelectItem>
                    <SelectItem value="humidity-sensor">เซ็นเซอร์ความชื้น</SelectItem>
                    <SelectItem value="relay">รีเลย์</SelectItem>
                    <SelectItem value="light">ไฟ</SelectItem>
                    <SelectItem value="fan">พัดลม</SelectItem>
                    <SelectItem value="other">อื่น ๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-location">ตำแหน่ง</Label>
                <Input
                  id="device-location"
                  placeholder="เช่น ห้องพืช A"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">ยกเลิก</Button>
              </DialogClose>
              <Button onClick={handleAddDevice} className="gradient-button">
                <PlusCircle className="mr-2 h-4 w-4" />
                เพิ่มอุปกรณ์
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== ADD RULE MODAL ===== */}
        <Dialog open={openAddRule} onOpenChange={setOpenAddRule}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-600" />
                ตั้งค่ากฎอัตโนมัติ
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">ชื่อกฎ</Label>
                <Input
                  id="rule-name"
                  placeholder="เช่น เปิดพัดลมเมื่อร้อน"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-trigger">เงื่อนไขที่กระตุ้น</Label>
                <Select value={newRule.trigger} onValueChange={(value) => setNewRule({ ...newRule, trigger: value })}>
                  <SelectTrigger id="rule-trigger">
                    <SelectValue placeholder="เลือกเงื่อนไข" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temp-high">อุณหภูมิสูง</SelectItem>
                    <SelectItem value="temp-low">อุณหภูมิต่ำ</SelectItem>
                    <SelectItem value="humidity-high">ความชื้นสูง</SelectItem>
                    <SelectItem value="humidity-low">ความชื้นต่ำ</SelectItem>
                    <SelectItem value="time-based">ตามเวลา</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-condition">ค่า</Label>
                <Input
                  id="rule-condition"
                  placeholder="เช่น 30°C"
                  value={newRule.condition}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-action">การกระทำที่ดำเนินการ</Label>
                <Select value={newRule.action} onValueChange={(value) => setNewRule({ ...newRule, action: value })}>
                  <SelectTrigger id="rule-action">
                    <SelectValue placeholder="เลือกการกระทำ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="turn-on">เปิด</SelectItem>
                    <SelectItem value="turn-off">ปิด</SelectItem>
                    <SelectItem value="send-alert">ส่งการแจ้งเตือน</SelectItem>
                    <SelectItem value="adjust-level">ปรับระดับ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">ยกเลิก</Button>
              </DialogClose>
              <Button onClick={handleAddRule} className="gradient-button">
                <Sliders className="mr-2 h-4 w-4" />
                สร้างกฎ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Pass state setters to QuickActionsCard */}
      {typeof window !== "undefined" && (
        <div className="hidden">
          {openAddDevice && null}
          {openAddRule && null}
        </div>
      )}
    </TooltipProvider>
  )
}

/* ---------------- COMPONENTS ---------------- */

function KpiCard({ title, value, desc, icon }: any) {
  return (
    <Card className="soft-card soft-card-hover transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600 shadow-inner">
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}

/* ===== System Status + Tooltip (เพิ่มวันนี้) ===== */

function SystemStatusCard() {
  return (
    <Card className="soft-card">
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
    <Card className="soft-card">
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

function QuickActionsCard({ onOpenAddDevice, onOpenAddRule }: any) {
  return (
    <Card className="soft-card">
      <CardHeader>
        <CardTitle>การดำเนินการด่วน</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button onClick={onOpenAddDevice} className="w-full gradient-button shadow-md hover:shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          เพิ่มอุปกรณ์ใหม่
        </Button>
        <Button onClick={onOpenAddRule} variant="outline" className="w-full bg-white/70 backdrop-blur">
          <Sliders className="mr-2 h-4 w-4" />
          ตั้งค่ากฎอัตโนมัติ
        </Button>
      </CardContent>
    </Card>
  )
}
