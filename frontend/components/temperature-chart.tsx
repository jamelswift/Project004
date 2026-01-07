"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts"
import type { HistoricalData } from "@/types"

interface TemperatureDataPoint extends HistoricalData {
  status: "safe" | "warning" | "danger"
  autoRuleActive: boolean
}

interface ThresholdConfig {
  safe: number
  autoOn: number
  danger: number
}

export function TemperatureChart() {
  const [data, setData] = useState<TemperatureDataPoint[]>([])
  const [currentTemp, setCurrentTemp] = useState<number>(0)
  const [systemStatus, setSystemStatus] = useState<"safe" | "warning" | "danger">("safe")
  const [autoRuleActive, setAutoRuleActive] = useState<boolean>(false)
  const [eventLog, setEventLog] = useState<string[]>([])

  // กำหนด Threshold สำหรับ Auto Rule
  const threshold: ThresholdConfig = {
    safe: 20,
    autoOn: 30,
    danger: 35,
  }

  // ฟังก์ชันประเมินสถานะระบบ
  const evaluateSystemStatus = (temp: number): "safe" | "warning" | "danger" => {
    if (temp >= threshold.danger) return "danger"
    if (temp >= threshold.autoOn) return "warning"
    return "safe"
  }

  // ฟังก์ชันจัดการ Auto Rule
  const checkAutoRule = (status: "safe" | "warning" | "danger"): boolean => {
    return status === "warning" || status === "danger"
  }

  // ฟังก์ชันสร้างข้อมูลจำลอง
  const generateSimulatedTemperature = (index: number): number => {
    // สร้างรูปแบบอุณหภูมิที่มีความเป็นจริง
    const baseTemp = 22
    const sineWave = Math.sin(index / 5) * 3
    const randomNoise = (Math.random() - 0.5) * 2
    const trend = index > 40 ? (index - 40) * 0.3 : 0

    return Math.max(18, baseTemp + sineWave + randomNoise + trend)
  }

  useEffect(() => {
    // สร้างข้อมูลเริ่มต้น 50 จุด
    const generateInitialData = () => {
      const now = new Date()
      const newData: TemperatureDataPoint[] = []

      for (let i = 49; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 2 * 60 * 1000) // ทุก 2 นาที
        const temp = generateSimulatedTemperature(49 - i)
        const status = evaluateSystemStatus(temp)
        const autoRuleActive = checkAutoRule(status)

        newData.push({
          timestamp: time.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          temperature: parseFloat(temp.toFixed(2)),
          humidity: 45 + Math.random() * 30,
          status,
          autoRuleActive,
        })
      }

      return newData
    }

    const initialData = generateInitialData()
    setData(initialData)
    if (initialData.length > 0) {
      const latest = initialData[initialData.length - 1]
      setCurrentTemp(latest.temperature)
      setSystemStatus(latest.status)
      setAutoRuleActive(latest.autoRuleActive)
    }

    // อัพเดทข้อมูลแบบเรียลไทม์ทุก 10 วินาที
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData.slice(1)]
        const now = new Date()
        const newIndex = prevData.length
        const temp = generateSimulatedTemperature(newIndex)
        const status = evaluateSystemStatus(temp)
        const isAutoRuleActive = checkAutoRule(status)

        const newPoint: TemperatureDataPoint = {
          timestamp: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          temperature: parseFloat(temp.toFixed(2)),
          humidity: 45 + Math.random() * 30,
          status,
          autoRuleActive: isAutoRuleActive,
        }

        // อัพเดทสถานะปัจจุบัน
        setCurrentTemp(temp)
        setSystemStatus(status)
        setAutoRuleActive(isAutoRuleActive)

        // บันทึกเหตุการณ์เมื่อสถานะเปลี่ยน
        const prevStatus = prevData[prevData.length - 1]?.status
        if (status !== prevStatus) {
          const timestamp = now.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })

          let message = ""
          if (status === "danger") {
            message = `⚠️ [${timestamp}] ระบบเข้าสถานะ DANGER - อุณหภูมิ ${temp.toFixed(2)}°C ≥ ${threshold.danger}°C`
          } else if (status === "warning") {
            message = `⚡ [${timestamp}] ระบบเข้าสถานะ WARNING - AUTO RULE เปิดใช้งาน`
          } else if (status === "safe") {
            message = `✓ [${timestamp}] ระบบเข้าสถานะ SAFE - AUTO RULE ปิดใช้งาน`
          }

          if (message) {
            setEventLog((prev) => [message, ...prev.slice(0, 9)])
          }
        }

        return [...newData, newPoint]
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // สีของกราฟตามสถานะ
  const getLineColor = () => {
    if (systemStatus === "danger") return "hsl(0, 84%, 60%)" // Red
    if (systemStatus === "warning") return "hsl(38, 92%, 50%)" // Orange
    return "hsl(142, 71%, 45%)" // Green
  }

  const getStatusText = () => {
    if (systemStatus === "danger") return "อันตราย"
    if (systemStatus === "warning") return "แจ้งเตือน"
    return "ปลอดภัย"
  }

  const getStatusBgColor = () => {
    if (systemStatus === "danger") return "bg-red-500/10 border-red-500"
    if (systemStatus === "warning") return "bg-orange-500/10 border-orange-500"
    return "bg-green-500/10 border-green-500"
  }

  const getStatusTextColor = () => {
    if (systemStatus === "danger") return "text-red-600"
    if (systemStatus === "warning") return "text-orange-600"
    return "text-green-600"
  }

  return (
    <div className="space-y-6 col-span-full">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border-2 ${getStatusBgColor()}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">อุณหภูมิปัจจุบัน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getStatusTextColor()}`}>{currentTemp.toFixed(2)}°C</div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${getStatusBgColor()}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">สถานะระบบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getStatusTextColor()}`}>{getStatusText()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemStatus === "danger" && `≥ ${threshold.danger}°C`}
              {systemStatus === "warning" && `${threshold.autoOn}°C - ${threshold.danger}°C`}
              {systemStatus === "safe" && `< ${threshold.autoOn}°C`}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${autoRuleActive ? "bg-blue-500/10 border-blue-500" : "bg-slate-500/10 border-slate-500"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${autoRuleActive ? "text-blue-600" : "text-slate-600"}`}>
              {autoRuleActive ? "เปิด" : "ปิด"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {autoRuleActive ? "ระบบทำงานอัตโนมัติ" : "รอสัญญาณ"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>กราฟแสดงอุณหภูมิแบบเรียลไทม์พร้อม Auto Rule</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            ตรวจสอบอุณหภูมิตามเวลา โดยเปรียบเทียบกับค่า Threshold (SAFE: &lt;{threshold.autoOn}°C, AUTO-ON:
            ≥{threshold.autoOn}°C, DANGER: ≥{threshold.danger}°C)
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="timestamp" className="text-xs" tick={{ fill: "currentColor" }} />
              <YAxis
                className="text-xs"
                tick={{ fill: "currentColor" }}
                label={{ value: "°C", angle: -90, position: "insideLeft" }}
                domain={[15, 40]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TemperatureDataPoint
                    return (
                      <div className="p-3 bg-background border border-border rounded-lg space-y-1">
                        <p className="font-semibold">{data.timestamp}</p>
                        <p className="text-sm">อุณหภูมิ: {data.temperature.toFixed(2)}°C</p>
                        <p className="text-sm">สถานะ: {data.status}</p>
                        <p className={`text-sm font-semibold ${data.autoRuleActive ? "text-blue-600" : "text-slate-600"}`}>
                          Auto Rule: {data.autoRuleActive ? "เปิด" : "ปิด"}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />

              {/* Reference Lines สำหรับ Thresholds */}
              <ReferenceLine
                y={threshold.autoOn}
                stroke="hsl(38, 92%, 50%)"
                strokeDasharray="5 5"
                label={{
                  value: `AUTO-ON ${threshold.autoOn}°C`,
                  position: "right",
                  fill: "hsl(38, 92%, 50%)",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={threshold.danger}
                stroke="hsl(0, 84%, 60%)"
                strokeDasharray="5 5"
                label={{
                  value: `DANGER ${threshold.danger}°C`,
                  position: "right",
                  fill: "hsl(0, 84%, 60%)",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={threshold.safe}
                stroke="hsl(142, 71%, 45%)"
                strokeDasharray="5 5"
                label={{
                  value: `SAFE ${threshold.safe}°C`,
                  position: "right",
                  fill: "hsl(142, 71%, 45%)",
                  fontSize: 12,
                }}
              />

              <Line
                type="monotone"
                dataKey="temperature"
                stroke={getLineColor()}
                strokeWidth={3}
                dot={false}
                name="อุณหภูมิ"
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Event Log */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>บันทึกเหตุการณ์ (System Log)</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            แสดงประวัติการเปลี่ยนแปลงสถานะระบบและการทำงานของ Auto Rule
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-950 text-lime-400 p-4 rounded-lg font-mono text-sm space-y-1 max-h-40 overflow-y-auto">
            {eventLog.length > 0 ? (
              eventLog.map((log, index) => (
                <div key={index} className="break-all">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-400">รอสำหรับการอัพเดทข้อมูล...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}