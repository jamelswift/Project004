"use client"

import { useState } from "react"
import { useEffect } from "react"
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
import { SoilMoistureCard } from "@/components/system/soil-moisture-card"

/* ---------------- HELPERS ---------------- */

function getOverallHealth(devices: any[]) {
  if (!devices || devices.length === 0) return "GOOD"
  
  const criticalCount = devices.filter(d => d.status === "offline" || d.health === "critical").length
  const warningCount = devices.filter(d => d.health === "warning").length
  
  if (criticalCount > 0) return "CRITICAL"
  if (warningCount > 0) return "DEGRADED"
  return "GOOD"
}

/* ---------------- PAGE ---------------- */

export default function DashboardPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [sensors, setSensors] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [kpiData, setKpiData] = useState({ totalDevices: 0, activeSensors: 0, power: 0, onlineUsers: 0 })
  const [loading, setLoading] = useState(true)

  const overallHealth = getOverallHealth(devices)
  const [openAddDevice, setOpenAddDevice] = useState(false)
  const [openAddRule, setOpenAddRule] = useState(false)
  const [newDevice, setNewDevice] = useState({ name: "", type: "", location: "" })
  const [newRule, setNewRule] = useState({ name: "", trigger: "", action: "", condition: "" })

  // ดึงข้อมูลจากการรีเฟรช
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      
      // ดึง devices
      const devicesRes = await fetch(`${apiUrl}/api/devices`)
      const devicesJson = await devicesRes.json()
      const devicesData = Array.isArray(devicesJson)
        ? devicesJson
        : Array.isArray(devicesJson?.data)
          ? devicesJson.data
          : []
      setDevices(devicesData)
      
      // ดึง sensors
      const sensorsRes = await fetch(`${apiUrl}/api/sensors`)
      const sensorsJson = await sensorsRes.json()
      const sensorsData = Array.isArray(sensorsJson)
        ? sensorsJson
        : Array.isArray(sensorsJson?.data)
          ? sensorsJson.data
          : []
      setSensors(sensorsData)
      
      // ดึง notifications
      const notificationsRes = await fetch(`${apiUrl}/api/notifications`)
      const notificationsJson = await notificationsRes.json()
      const notificationsData = Array.isArray(notificationsJson)
        ? notificationsJson
        : Array.isArray(notificationsJson?.data)
          ? notificationsJson.data
          : []
      setNotifications(notificationsData)
      
      // คำนวณ KPI
      const activeSensorCount = sensorsData.length
      const totalDeviceCount = devicesData.length
      
      setKpiData({
        totalDevices: totalDeviceCount,
        activeSensors: activeSensorCount,
        power: 1.2, // ค่าที่ดึงจาก simulator หรือจริง
        onlineUsers: 573
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // ดึงข้อมูลเมื่อ component mount
  useEffect(() => {
    fetchDashboardData()
    // ตั้งค่าการรีเฟรชข้อมูลทุก 30 วินาที
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAddDevice = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      await fetch(`${apiUrl}/api/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: `DEV-${Date.now()}`,
          name: newDevice.name,
          type: newDevice.type,
          location: newDevice.location,
          status: "online",
          health: "healthy"
        })
      })
      setNewDevice({ name: "", type: "", location: "" })
      setOpenAddDevice(false)
      fetchDashboardData()
    } catch (error) {
      console.error("Failed to add device:", error)
    }
  }

  const handleAddRule = () => {
    console.log("Adding rule:", newRule)
    setNewRule({ name: "", trigger: "", action: "", condition: "" })
    setOpenAddRule(false)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* ===== KPI ===== */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="อุปกรณ์ทั้งหมด" value={kpiData.totalDevices.toString()} desc="+4 จากเดือนที่แล้ว" icon={<Radio className="h-4 w-4" />} color="blue" />
          <KpiCard title="เซ็นเซอร์ทำงาน" value={kpiData.activeSensors.toString()} desc="+12 จากชั่วโมงที่แล้ว" icon={<Activity className="h-4 w-4" />} color="green" />
          <KpiCard title="การใช้พลังงาน" value={kpiData.power.toFixed(1) + " kW"} desc="-5% จากเมื่อวาน" icon={<Zap className="h-4 w-4" />} color="orange" />
          <KpiCard title="ผู้ใช้งานออนไลน์" value={kpiData.onlineUsers.toString()} desc="+201 จากชั่วโมงที่แล้ว" icon={<Users className="h-4 w-4" />} color="purple" />
        </div>

        {/* ===== OVERALL SYSTEM HEALTH (เพิ่มวันนี้) ===== */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="p-2.5 rounded-xl bg-purple-50">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-lg font-semibold">สุขภาพระบบโดยรวม</CardTitle>
          </CardHeader>
          <CardContent>
            {overallHealth === "GOOD" && (
              <Badge className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full text-sm font-medium">
                <ShieldCheck className="mr-2 h-4 w-4" />
                ดีเยี่ยม – ระบบทำงานปกติ
              </Badge>
            )}
            {overallHealth === "DEGRADED" && (
              <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-2 rounded-full text-sm font-medium">
                <ShieldAlert className="mr-2 h-4 w-4" />
                เสื่อมสภาพ – บางอุปกรณ์ต้องดูแล
              </Badge>
            )}
            {overallHealth === "CRITICAL" && (
              <Badge className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-full text-sm font-medium">
                <ShieldAlert className="mr-2 h-4 w-4" />
                วิกฤติ – ต้องดำเนินการทันที
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* ===== ENVIRONMENT + STATUS ===== */}
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-6">
            <DashboardCharts />

            {/* 🔹 Soil Moisture Card */}
            <SoilMoistureCard />

            {/* 🔹 Insight Text */}
            <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
              <CardContent className="pt-5 space-y-2 text-sm text-gray-600">
                <p>
                  สภาพแวดล้อมปัจจุบันอยู่ในช่วงการทำงานปกติ
                  อุณหภูมิเกินค่าปลอดภัยช่วงเที่ยงวันสั้นๆ
                  ซึ่งทำให้เกิดการแจ้งเตือนคำเตือน
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span suppressHydrationWarning>
                    อัปเดตล่าสุด: {new Date().toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <SystemStatusCard devices={devices} />
          </div>
        </div>

        {/* ===== ALERTS + QUICK ACTIONS ===== */}
        <div className="grid gap-6 md:grid-cols-2">
          <AlertsCard notifications={notifications} />
          <QuickActionsCard onOpenAddDevice={() => setOpenAddDevice(true)} onOpenAddRule={() => setOpenAddRule(true)} />
        </div>

        {/* ===== RECENT DEVICES ===== */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">อุปกรณ์ล่าสุด</CardTitle>
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

function KpiCard({ title, value, desc, icon, color }: any) {
  const colorClasses = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/30"
    },
    green: {
      bg: "from-green-500 to-green-600",
      shadow: "shadow-green-500/30"
    },
    orange: {
      bg: "from-orange-500 to-orange-600",
      shadow: "shadow-orange-500/30"
    },
    purple: {
      bg: "from-purple-600 to-purple-700",
      shadow: "shadow-purple-500/30"
    }
  }
  
  const selectedColor = colorClasses[color] || colorClasses.blue
  
  return (
    <Card className={`bg-gradient-to-br ${selectedColor.bg} border-0 shadow-lg ${selectedColor.shadow} transition-all hover:shadow-xl hover:scale-105`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-white/80 uppercase tracking-wide">{title}</CardTitle>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
          <div className="text-white">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <p className="text-xs text-white/70 font-medium">{desc}</p>
      </CardContent>
    </Card>
  )
}

/* ===== System Status + Tooltip (เพิ่มวันนี้) ===== */

function SystemStatusCard({ devices }: any) {
  if (!devices || devices.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">สถานะระบบ</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-400 py-8">
          ไม่มีอุปกรณ์
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">สถานะระบบ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {devices.map((device: any) => (
          <div key={device.deviceId} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{device.name || device.deviceId}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {device.status === "online" ? "ออนไลน์" : "ออฟไลน์"} · {device.location || "ไม่มีข้อมูล"}
              </p>
            </div>

            <Tooltip>
              <TooltipTrigger>
                {device.health === "healthy" && (
                  <Badge className="bg-green-100 text-green-700 border-0 rounded-full">ปกติ</Badge>
                )}
                {device.health === "warning" && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-0 rounded-full">เตือน</Badge>
                )}
                {device.health === "critical" && (
                  <Badge className="bg-red-100 text-red-700 border-0 rounded-full">วิกฤติ</Badge>
                )}
                {!device.health && device.status === "offline" && (
                  <Badge className="bg-gray-100 text-gray-700 border-0 rounded-full">ออฟไลน์</Badge>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {device.health === "healthy" && "อุปกรณ์ทำงานปกติ"}
                {device.health === "warning" && "อุปกรณ์ออนไลน์แต่ต้องดูแล"}
                {device.health === "critical" && "อุปกรณ์ออฟไลน์หรือสภาพไม่ปลอดภัย"}
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ===== Alerts ===== */

function AlertsCard({ notifications }: any) {
  // แปลง notifications เป็น alerts format
  const displayAlerts = (notifications || []).slice(0, 5).map((notif: any) => ({
    message: notif.message || notif.text,
    level: notif.level || "info",
    time: notif.time || new Date(notif.timestamp).toLocaleString(),
  }))

  if (displayAlerts.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">การแจ้งเตือนระบบ</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-400 py-8">
          ไม่มีการแจ้งเตือน
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">การแจ้งเตือนระบบ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAlerts.map((alert: any, index: number) => (
          <div
            key={index}
            className={`flex items-start gap-3 rounded-xl p-3.5 ${
              alert.level === "critical" ? "bg-red-50 border border-red-100" : alert.level === "warning" ? "bg-yellow-50 border border-yellow-100" : "bg-blue-50 border border-blue-100"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 mt-0.5 shrink-0 ${
                alert.level === "critical"
                  ? "text-red-600"
                  : alert.level === "warning"
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{alert.message}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
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
    <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">การดำเนินการด่วน</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button onClick={onOpenAddDevice} className="w-full gradient-button shadow-md hover:shadow-lg h-12 rounded-xl font-medium">
          <PlusCircle className="mr-2 h-5 w-5" />
          เพิ่มอุปกรณ์ใหม่
        </Button>
        <Button onClick={onOpenAddRule} variant="outline" className="w-full bg-white h-12 rounded-xl border-2 border-gray-200 hover:bg-gray-50 font-medium">
          <Sliders className="mr-2 h-5 w-5" />
          ตั้งค่ากฎอัตโนมัติ
        </Button>
      </CardContent>
    </Card>
  )
}
