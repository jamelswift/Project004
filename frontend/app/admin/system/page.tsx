"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureCurrentUser } from "@/lib/auth"
import {
  Sensor,
  LedStatus,
  AutomationRule,
  SystemStatus,
  SystemEvent,
} from "@/types/system"
import { systemMockApi } from "@/lib/system-mock-api"
import { SystemStatusPanel } from "@/components/system/system-status-panel"
import { SensorDataGrid } from "@/components/system/sensor-data-card"
import { LedControlPanel } from "@/components/system/led-control-panel"
import { AutomationPanel } from "@/components/system/automation-panel"
import { RealtimeEventList } from "@/components/system/realtime-event-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader } from "lucide-react"

/**
 * หน้า System Dashboard
 * รองรับเซ็นเซอร์ทั้ง 3 แบบและข้อมูลจำลองทั้งหมด
 */
export default function SystemPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // ข้อมูลหลัก
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [ledStatuses, setLedStatuses] = useState<LedStatus[]>([])
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [events, setEvents] = useState<SystemEvent[]>([])

  // Loading states สำหรับ actions
  const [toggleLedLoading, setToggleLedLoading] = useState(false)
  const [createRuleLoading, setCreateRuleLoading] = useState(false)
  const [deleteRuleLoading, setDeleteRuleLoading] = useState(false)

  // ตรวจสอบการเข้าถึง
  useEffect(() => {
    const verify = async () => {
      try {
        const user = await ensureCurrentUser()
        if (!user || user.role !== "admin") {
          router.push("/")
          return
        }
        setIsAuthorized(true)
      } catch {
        router.push("/")
      }
    }

    verify()
  }, [router])

  // โหลดข้อมูลจำลอง
  useEffect(() => {
    if (!isAuthorized) return

    const loadData = async () => {
      try {
        setIsLoading(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        
        // ดึงข้อมูลเซนเซอร์จากเซิร์ฟเวอร์จริง
        const sensorsRes = await fetch(`${apiUrl}/api/sensors`)
        const sensorsData = sensorsRes.ok ? await sensorsRes.json() : []
        setSensors(Array.isArray(sensorsData) ? sensorsData : sensorsData.data || [])
        
        // สำหรับ LED, เงื่อไข และ events ยังใช้ mock
        const [ledsData, rulesData, statusData, eventsData] =
          await Promise.all([
            systemMockApi.getLedStatuses(),
            systemMockApi.getAutomationRules(),
            systemMockApi.getSystemStatus(),
            systemMockApi.getSystemEvents(),
          ])

        setLedStatuses(ledsData)
        setRules(rulesData)
        setSystemStatus(statusData)
        setEvents(eventsData)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // อัปเดตข้อมูล real-time ทุก 5 วินาที
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [isAuthorized])

  if (!isAuthorized) {
    return <div />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">
            กำลังโหลดข้อมูลระบบ...
          </p>
        </div>
      </div>
    )
  }

  // ฟังก์ชัน: สลับสถานะ LED
  const handleToggleLed = async (ledId: string, isOn: boolean) => {
    try {
      setToggleLedLoading(true)
      const result = await systemMockApi.toggleLed(ledId, isOn)
      if (result) {
        setLedStatuses(
          ledStatuses.map((led) =>
            led.id === ledId ? result : led
          )
        )
      }
    } catch (error) {
      console.error("Failed to toggle LED:", error)
    } finally {
      setToggleLedLoading(false)
    }
  }

  // ฟังก์ชัน: สร้างเงื่อนไขอัตโนมัติ
  const handleCreateRule = async (
    rule: Omit<AutomationRule, "id" | "createdAt" | "triggerCount">
  ) => {
    try {
      setCreateRuleLoading(true)
      const newRule = await systemMockApi.createRule(rule)
      setRules([...rules, newRule])
    } catch (error) {
      console.error("Failed to create rule:", error)
    } finally {
      setCreateRuleLoading(false)
    }
  }

  // ฟังก์ชัน: ลบเงื่อนไขอัตโนมัติ
  const handleDeleteRule = async (ruleId: string) => {
    try {
      setDeleteRuleLoading(true)
      const success = await systemMockApi.deleteRule(ruleId)
      if (success) {
        setRules(rules.filter((r) => r.id !== ruleId))
      }
    } catch (error) {
      console.error("Failed to delete rule:", error)
    } finally {
      setDeleteRuleLoading(false)
    }
  }

  // ฟังก์ชัน: สลับการเปิดใช้งานเงื่อนไข
  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      setRules(
        rules.map((r) =>
          r.id === ruleId ? { ...r, isActive } : r
        )
      )
    } catch (error) {
      console.error("Failed to toggle rule:", error)
    }
  }

  return (
    <main className="container mx-auto py-8 px-4">
      {/* หัวข้อหน้า */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ระบบควบคุมเซ็นเซอร์</h1>
        <p className="text-gray-600 dark:text-gray-400">
          ระบบจัดการเซ็นเซอร์ IoT พร้อมการควบคุม LED และเงื่อนไขอัตโนมัติ
        </p>
      </div>

      {/* ส่วนสถานะระบบ */}
      {systemStatus && (
        <section className="mb-8">
          <SystemStatusPanel status={systemStatus} isLoading={isLoading} />
        </section>
      )}

      {/* Tabs สำหรับส่วนต่างๆ */}
      <Tabs defaultValue="sensors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="sensors">เซ็นเซอร์</TabsTrigger>
          <TabsTrigger value="leds">LED</TabsTrigger>
          <TabsTrigger value="automation">เงื่อนไข</TabsTrigger>
          <TabsTrigger value="events">Real-time</TabsTrigger>
        </TabsList>

        {/* แท็บ: ข้อมูลเซ็นเซอร์ */}
        <TabsContent value="sensors" className="space-y-4">
          <SensorDataGrid sensors={sensors} isMockData={false} />
        </TabsContent>

        {/* แท็บ: ควบคุม LED */}
        <TabsContent value="leds" className="space-y-4">
          <LedControlPanel
            ledStatuses={ledStatuses}
            onToggle={handleToggleLed}
            isLoading={toggleLedLoading}
          />
        </TabsContent>

        {/* แท็บ: เงื่อนไขอัตโนมัติ */}
        <TabsContent value="automation" className="space-y-4">
          <AutomationPanel
            rules={rules}
            sensors={sensors}
            leds={ledStatuses}
            onCreate={handleCreateRule}
            onDelete={handleDeleteRule}
            onToggle={handleToggleRule}
            isLoading={createRuleLoading || deleteRuleLoading}
          />
        </TabsContent>

        {/* แท็บ: สถานะเรียลไทม์ */}
        <TabsContent value="events" className="space-y-4">
          <RealtimeEventList events={events} />
        </TabsContent>
      </Tabs>

      {/* ข้อมูลเพิ่มเติมที่ด้านล่าง */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          ℹ️ ข้อมูลเพิ่มเติม
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>✓ ระบบนี้ใช้ข้อมูลจำลองเพื่อการทดสอบ</li>
          <li>✓ รองรับเซ็นเซอร์ 3 ประเภท: อุณหภูมิ/ความชื้นอากาศ, ความเข้มแสง, ความชื้นดิน</li>
          <li>✓ เงื่อนไขอัตโนมัติอ้างอิงเซ็นเซอร์เป็นรายตัว ไม่ผูกกับเซ็นเซอร์รวม</li>
          <li>✓ พร้อมรองรับการเชื่อมต่อเซ็นเซอร์จริงและฮาร์ดแวร์ในอนาคต</li>
        </ul>
      </div>
    </main>
  )
}
