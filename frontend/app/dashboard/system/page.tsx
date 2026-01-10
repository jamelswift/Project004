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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader, RefreshCcw, Radio, AlertCircle, Thermometer } from "lucide-react"
import TemperatureChart from "@/components/charts/TemperatureChart"

/**
 * หน้า System Dashboard สำหรับ User ทั่วไป
 * รองรับเซ็นเซอร์ทั้ง 3 แบบและข้อมูลจำลองทั้งหมด
 */
export default function SystemPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

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

  // Relay & Temperature state
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const [relayState, setRelayState] = useState({
    relay1: "off",
    relay2: "off",
    lastUpdate: new Date().toISOString(),
  })
  const [tempData, setTempData] = useState<any[]>([])
  const [threshold, setThreshold] = useState({
    onAbove: 30,
    offBelow: 28,
  })
  const [relayLoading, setRelayLoading] = useState(false)
  const [relayConnected, setRelayConnected] = useState(false)
  const [relayError, setRelayError] = useState("")

  // ตรวจสอบการเข้าถึง - ให้ user ทั่วไปเข้าได้
  useEffect(() => {
    const verify = async () => {
      try {
        const user = await ensureCurrentUser()
        if (!user) {
          router.push("/login")
          return
        }
        // ให้ทุก user เข้าถึงได้ ไม่จำกัดเป็น admin
        setIsAuthorized(true)
      } catch {
        router.push("/login")
      }
    }

    verify()
  }, [router])

  // ฟังก์ชันโหลดข้อมูล (ใช้ทั้งครั้งแรกและรีเฟรช)
  const loadData = async (opts?: { initial?: boolean }) => {
    const isInitial = opts?.initial ?? false
    try {
      isInitial ? setIsLoading(true) : setIsRefreshing(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      
      // ดึงข้อมูลเซนเซอร์จากเซิร์ฟเวอร์จริง
      const sensorsRes = await fetch(`${apiUrl}/api/sensors`)
      const sensorsData = sensorsRes.ok ? await sensorsRes.json() : []
      setSensors(Array.isArray(sensorsData) ? sensorsData : sensorsData.data || [])
      
      // สำหรับข้อมูลอื่นๆ ยังใช้ mock API ไปก่อน
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
      isInitial ? setIsLoading(false) : setIsRefreshing(false)
    }
  }

  // ฟังก์ชัน: ดึงสถานะ Relay
  const fetchRelayState = async () => {
    try {
      const res = await fetch(`${API_URL}/api/relay/state`)
      if (!res.ok) throw new Error("Relay offline")
      const data = await res.json()
      setRelayState(data)
      setRelayConnected(true)
      setRelayError("")
    } catch (err) {
      setRelayConnected(false)
      setRelayError("ไม่สามารถเชื่อมต่อ Relay ได้")
    }
  }

  // ฟังก์ชัน: อัปเดต Relay
  const updateRelay = async (
    relay: "relay1" | "relay2",
    value: "on" | "off"
  ) => {
    setRelayLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/relay/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [relay]: value }),
      })
      if (!res.ok) throw new Error("Update failed")
      const json = await res.json()
      setRelayState(json.state)
    } catch (err) {
      setRelayError("ไม่สามารถสั่งงาน Relay ได้")
    } finally {
      setRelayLoading(false)
    }
  }

  // ฟังก์ชัน: สลับ Relay
  const toggleRelay = (relay: "relay1" | "relay2") => {
    const next = relayState[relay] === "on" ? "off" : "on"
    updateRelay(relay, next)
  }

  // ฟังก์ชัน: ดึงข้อมูลอุณหภูมิ
  const fetchTemperatureGraph = async () => {
    try {
      const res = await fetch(`${API_URL}/api/graph/temperature`)
      if (!res.ok) return
      const json = await res.json()
      setTempData(json.data)
      setThreshold(json.threshold)
    } catch (err) {
      console.error("Graph error:", err)
    }
  }

  // โหลดครั้งแรก
  useEffect(() => {
    if (!isAuthorized) return
    loadData({ initial: true })
    fetchRelayState()
    fetchTemperatureGraph()

    const relayInterval = setInterval(fetchRelayState, 2000)
    const graphInterval = setInterval(fetchTemperatureGraph, 3000)

    return () => {
      clearInterval(relayInterval)
      clearInterval(graphInterval)
    }
  }, [isAuthorized])

  // อัปเดตอัตโนมัติเมื่อเปิดสวิตช์
  useEffect(() => {
    if (!isAuthorized || !autoRefresh) return
    const interval = setInterval(() => loadData({ initial: false }), 15000)
    return () => clearInterval(interval)
  }, [isAuthorized, autoRefresh])

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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">ระบบควบคุมเซ็นเซอร์</h1>
            <p className="text-gray-600 dark:text-gray-400">
              ระบบจัดการเซ็นเซอร์ IoT พร้อมการควบคุม LED และเงื่อนไขอัตโนมัติ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => loadData({ initial: false })}
              disabled={isRefreshing}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              รีเฟรช
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              <Radio className={`h-4 w-4 mr-2 ${autoRefresh ? "text-green-500" : "text-gray-500"}`} />
              {autoRefresh ? "ปิดอัปเดตอัตโนมัติ" : "เปิดอัปเดตอัตโนมัติ"}
            </Button>
          </div>
        </div>
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
          <TabsTrigger value="control">ระบบควบคุม</TabsTrigger>
          <TabsTrigger value="automation">เงื่อนไข</TabsTrigger>
          <TabsTrigger value="events">Real-time</TabsTrigger>
        </TabsList>

        {/* แท็บ: ข้อมูลเซ็นเซอร์ */}
        <TabsContent value="sensors" className="space-y-4">
          <SensorDataGrid sensors={sensors} isMockData={false} />
        </TabsContent>

        {/* แท็บ: ระบบควบคุม (LED + Relay + Temperature) */}
        <TabsContent value="control">
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-slate-900/40">
            <CardHeader className="gap-3 pb-3">
              <CardTitle className="text-xl">ศูนย์ควบคุม Output (LED + Relay)</CardTitle>
              <CardDescription>
                รวมการควบคุม LED และ Relay อยู่ในกล่องเดียว มีสถานะการเชื่อมต่อและกราฟอุณหภูมิด้านล่าง
              </CardDescription>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline" className="bg-white/70 dark:bg-slate-800">
                  LED {ledStatuses.length} ดวง
                </Badge>
                <Badge variant="outline" className="bg-white/70 dark:bg-slate-800">
                  Relay 2 ช่อง
                </Badge>
                <Badge
                  variant="outline"
                  className={`bg-white/70 dark:bg-slate-800 ${relayConnected ? "border-green-500 text-green-700" : "border-red-500 text-red-700"}`}
                >
                  {relayConnected ? "Relay เชื่อมต่อแล้ว" : "Relay ไม่ได้เชื่อมต่อ"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-10">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-lg font-semibold">ระบบควบคุม LED</h3>
                </div>
                <LedControlPanel
                  ledStatuses={ledStatuses}
                  onToggle={handleToggleLed}
                  isLoading={toggleLedLoading}
                  variant="plain"
                />
              </section>

              <div className="h-px bg-gray-200 dark:bg-gray-700" />

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${relayConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  <h3 className="text-lg font-semibold">ระบบควบคุม Relay</h3>
                </div>

                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: relayConnected ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.1)",
                    borderColor: relayConnected ? "rgba(34, 197, 94, 0.35)" : "rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${relayConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className={relayConnected ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                      {relayConnected ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}
                    </span>
                  </div>
                </div>

                {relayError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-red-700 dark:text-red-200 text-sm">
                      {relayError}
                    </span>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {(["relay1", "relay2"] as const).map((relay, i) => {
                    const isOn = relayState[relay] === "on"
                    return (
                      <Card
                        key={relay}
                        className={`border-2 ${
                          isOn
                            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                            : "border-red-400 bg-white dark:bg-slate-800"
                        }`}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <span className={`w-4 h-4 rounded-full ${isOn ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                            Relay {i + 1}
                          </CardTitle>
                          <CardDescription className="text-xs">GPIO {i === 0 ? 26 : 27}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-center">
                            <Badge
                              className={`text-lg px-6 py-2 ${
                                isOn ? "bg-green-600" : "bg-red-500"
                              }`}
                            >
                              {relayState[relay].toUpperCase()}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => toggleRelay(relay)}
                            disabled={relayLoading || !relayConnected}
                            className={`w-full ${
                              isOn
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {isOn ? "ปิด" : "เปิด"}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="text-blue-600" />
                      ตรวจสอบอุณหภูมิ
                    </CardTitle>
                    <CardDescription>
                      ข้อมูลเซ็นเซอร์จำลองแบบเรียลไทม์พร้อมกฎอัตโนมัติ
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TemperatureChart
                      data={tempData}
                      threshold={threshold}
                    />
                  </CardContent>
                </Card>
              </section>
            </CardContent>
          </Card>
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
