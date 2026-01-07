"use client"

import { FormEvent, useState } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  CheckCircle2,
} from "lucide-react"

import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentDevicesTable } from "@/components/recent-devices-table"

/* ---------------- ข้อมูลจำลอง ---------------- */

const systemStatus = [
  {
    name: "เกตเวย์หลัก",
    detail: "ออนไลน์ · 99.9% uptime",
    status: "active",
    health: "healthy",
  },
  {
    name: "เซ็นเซอร์โหนด A",
    detail: "ออนไลน์ · แบตเตอรี่ 85%",
    status: "active",
    health: "healthy",
  },
  {
    name: "เซ็นเซอร์โหนด B",
    detail: "ออฟไลน์ · เห็นครั้งสุดท้าย 2 ชั่วโมงที่แล้ว",
    status: "offline",
    health: "critical",
  },
  {
    name: "ตัวควบคุมอุปกรณ์",
    detail: "ออนไลน์ · ไม่ได้ใช้งาน",
    status: "active",
    health: "warning",
  },
]

const alerts = [
  {
    message: "อุณหภูมิเกินขีดจำกัดปลอดภัย (30°C)",
    level: "critical",
    time: "5 นาทีที่แล้ว",
  },
  {
    message: "เซ็นเซอร์โหนด B ออฟไลน์",
    level: "warning",
    time: "12 นาทีที่แล้ว",
  },
]

/* ---------------- ฟังก์ชันช่วย ---------------- */

function getOverallHealth() {
  if (systemStatus.some((d) => d.health === "critical")) return "วิกฤติ"
  if (systemStatus.some((d) => d.health === "warning")) return "ผิดปกติ"
  return "ดี"
}

const lastUpdated = new Date().toLocaleString("th-TH")

/* ---------------- หน้าหลัก ---------------- */

export default function DashboardPage() {
  const overallHealth = getOverallHealth()

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* ===== ตัวชี้วัด ===== */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="อุปกรณ์ทั้งหมด" value="128" desc="+4 จากเดือนที่แล้ว" icon={<Radio className="h-4 w-4" />} />
          <KpiCard title="เซ็นเซอร์ที่ใช้งานอยู่" value="112" desc="+12 ตั้งแต่ชั่วโมงที่แล้ว" icon={<Activity className="h-4 w-4" />} />
          <KpiCard title="การใช้พลังงาน" value="1.2 kW" desc="-5% จากเมื่อวาน" icon={<Zap className="h-4 w-4" />} />
          <KpiCard title="ผู้ใช้ที่ใช้งานอยู่" value="573" desc="+201 ตั้งแต่ชั่วโมงที่แล้ว" icon={<Users className="h-4 w-4" />} />
        </div>

        {/* ===== สุขภาพระบบโดยรวม ===== */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Shield className="h-5 w-5" />
            <CardTitle>สุขภาพระบบโดยรวม</CardTitle>
          </CardHeader>
          <CardContent>
            {overallHealth === "ดี" && (
              <Badge className="bg-green-100 text-green-700">
                <ShieldCheck className="mr-1 h-4 w-4" />
                ดี – ระบบทำงานปกติ
              </Badge>
            )}
            {overallHealth === "ผิดปกติ" && (
              <Badge className="bg-yellow-100 text-yellow-700">
                <ShieldAlert className="mr-1 h-4 w-4" />
                ผิดปกติ – อุปกรณ์บางตัวต้องการความสนใจ
              </Badge>
            )}
            {overallHealth === "วิกฤติ" && (
              <Badge className="bg-red-100 text-red-700">
                <ShieldAlert className="mr-1 h-4 w-4" />
                วิกฤติ – ต้องดำเนินการทันที
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* ===== สิ่งแวดล้อม + สถานะ ===== */}
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-4">
            <DashboardCharts />

            {/* 🔹 ข้อมูลเชิงลึก */}
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  สภาวะปัจจุบันส่วนใหญ่อยู่ในช่วงการทำงานปกติ
                  อุณหภูมิเกินขีดจำกัดปลอดภัยช่วงเที่ยงวัน
                  ซึ่งทำให้มีการแจ้งเตือน
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

        {/* ===== การแจ้งเตือน + การดำเนินการด่วน ===== */}
        <div className="grid gap-6 md:grid-cols-2">
          <AlertsCard />
          <QuickActionsCard />
        </div>

        {/* ===== อุปกรณ์ล่าสุด ===== */}
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

/* ---------------- ส่วนประกอบ ---------------- */

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

/* ===== สถานะระบบ + Tooltip ===== */

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
                  <Badge className="bg-green-100 text-green-700">แข็งแรง</Badge>
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
                {item.health === "warning" && "อุปกรณ์ออนไลน์แต่ต้องการความสนใจ"}
                {item.health === "critical" && "อุปกรณ์ออฟไลน์หรือสภาวะไม่ปลอดภัย"}
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ===== การแจ้งเตือน ===== */

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

/* ===== การดำเนินการด่วน ===== */

function QuickActionsCard() {
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showAutomation, setShowAutomation] = useState(false)
  const [deviceName, setDeviceName] = useState("เซ็นเซอร์ใหม่")
  const [deviceType, setDeviceType] = useState("temperature")
  const [deviceLocation, setDeviceLocation] = useState("พื้นที่ A / โรงงานหลัก")
  const [ruleName, setRuleName] = useState("แจ้งเตือนอุณหภูมิสูง")
  const [metric, setMetric] = useState("temperature")
  const [condition, setCondition] = useState(">")
  const [threshold, setThreshold] = useState("30")
  const [ruleAction, setRuleAction] = useState("notify")
  const [recentActions, setRecentActions] = useState<string[]>([])

  const deviceTypeLabels: Record<string, string> = {
    temperature: "เซ็นเซอร์อุณหภูมิ",
    humidity: "เซ็นเซอร์ความชื้น",
    relay: "ตัวควบคุมรีเลย์",
    camera: "กล้องเฝ้าระวัง",
  }

  const metricLabels: Record<string, { label: string; unit: string }> = {
    temperature: { label: "อุณหภูมิ", unit: "°C" },
    humidity: { label: "ความชื้นสัมพัทธ์", unit: "%" },
    battery: { label: "แบตเตอรี่", unit: "%" },
  }

  const addQuickActionLog = (summary: string) => {
    setRecentActions((prev) => [summary, ...prev].slice(0, 3))
  }

  const handleAddDevice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const typeLabel = deviceTypeLabels[deviceType] || "อุปกรณ์"
    const location = deviceLocation.trim() || "ไม่ระบุสถานที่"
    const name = deviceName.trim() || "อุปกรณ์ใหม่"

    addQuickActionLog(`สร้าง ${typeLabel}: ${name} @ ${location}`)
    setShowAddDevice(false)
  }

  const handleCreateAutomation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const metricInfo = metricLabels[metric] || { label: "พารามิเตอร์", unit: "" }
    const conditionLabel = condition === ">" ? "มากกว่า" : condition === "<" ? "น้อยกว่า" : "เท่ากับ"
    const unit = metricInfo.unit ? ` ${metricInfo.unit}` : ""
    const actionLabel = ruleAction === "notify" ? "ส่งการแจ้งเตือน" : "สั่งปิดอุปกรณ์"
    const name = ruleName.trim() || "กฎอัตโนมัติใหม่"

    addQuickActionLog(
      `ตั้งกฎ "${name}" เมื่อ ${metricInfo.label} ${conditionLabel} ${threshold}${unit} → ${actionLabel}`
    )
    setShowAutomation(false)
  }

  const addDeviceDisabled = !deviceName.trim() || !deviceLocation.trim()
  const automationDisabled = !ruleName.trim() || !threshold.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle>การดำเนินการด่วน</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
          <Button className="w-full" onClick={() => setShowAddDevice(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            เพิ่มอุปกรณ์ใหม่
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มอุปกรณ์ใหม่</DialogTitle>
              <DialogDescription>
                ระบุรายละเอียดเพื่อให้ระบบสร้างอุปกรณ์และเชื่อมต่อเข้ากับแดชบอร์ดทันที
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleAddDevice}>
              <div className="space-y-2">
                <Label htmlFor="device-name">ชื่ออุปกรณ์</Label>
                <Input
                  id="device-name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="เช่น เกตเวย์โรงงาน หรือ เซ็นเซอร์อุณหภูมิสายการผลิต"
                />
              </div>

              <div className="space-y-2">
                <Label>ประเภท</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทอุปกรณ์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temperature">เซ็นเซอร์อุณหภูมิ</SelectItem>
                    <SelectItem value="humidity">เซ็นเซอร์ความชื้น</SelectItem>
                    <SelectItem value="relay">รีเลย์/ตัวสั่งงาน</SelectItem>
                    <SelectItem value="camera">กล้องเฝ้าระวัง</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-location">ตำแหน่งติดตั้ง</Label>
                <Input
                  id="device-location"
                  value={deviceLocation}
                  onChange={(e) => setDeviceLocation(e.target.value)}
                  placeholder="ระบุพื้นที่ อาคาร หรือโหนด"
                />
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddDevice(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={addDeviceDisabled}>
                  สร้างอุปกรณ์
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showAutomation} onOpenChange={setShowAutomation}>
          <Button variant="outline" className="w-full" onClick={() => setShowAutomation(true)}>
            <Sliders className="mr-2 h-4 w-4" />
            ตั้งค่ากฎอัตโนมัติ
          </Button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>ตั้งค่ากฎอัตโนมัติ</DialogTitle>
              <DialogDescription>
                นิยามเงื่อนไขและการดำเนินการเมื่อถึงจุดวิกฤติ เพื่อให้ระบบตอบสนองทันที
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleCreateAutomation}>
              <div className="space-y-2">
                <Label htmlFor="rule-name">ชื่อกฎ</Label>
                <Input
                  id="rule-name"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="เช่น แจ้งเตือนอุณหภูมิสูง หรือ ปิดรีเลย์เมื่อเกินกำหนด"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>พารามิเตอร์</Label>
                  <Select value={metric} onValueChange={setMetric}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกพารามิเตอร์" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">อุณหภูมิ</SelectItem>
                      <SelectItem value="humidity">ความชื้นสัมพัทธ์</SelectItem>
                      <SelectItem value="battery">ระดับแบตเตอรี่</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>เงื่อนไข</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเงื่อนไข" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">">มากกว่า</SelectItem>
                      <SelectItem value="<">น้อยกว่า</SelectItem>
                      <SelectItem value="=">เท่ากับ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">ค่าที่ต้องตรวจจับ</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="เช่น 30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>การดำเนินการ</Label>
                <Select value={ruleAction} onValueChange={setRuleAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกการดำเนินการ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notify">ส่งการแจ้งเตือน</SelectItem>
                    <SelectItem value="shutdown">สั่งปิดอุปกรณ์/รีเลย์</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAutomation(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={automationDisabled}>
                  บันทึกกฎ
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {recentActions.length > 0 && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="mb-2 font-medium">อัปเดตล่าสุด</p>
            <div className="space-y-2">
              {recentActions.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
