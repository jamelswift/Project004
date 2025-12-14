"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RefreshCw } from "lucide-react"

type Sensor = {
  sensorId: string
  name: string
  type: "temperature" | "humidity" | string
  value: number
  unit: string
  timestamp: string
  location: string
}

export default function SimulatorPage() {
  const [temp, setTemp] = useState<number | null>(null)
  const [humidity, setHumidity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoMode, setAutoMode] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // ดึงข้อมูลจาก /api/sensors
  const fetchSensorData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sensors")
      const data: Sensor[] = await res.json()

      const tempSensor = data.find((s) => s.type === "temperature")
      const humiditySensor = data.find((s) => s.type === "humidity")

      setTemp(tempSensor?.value ?? null)
      setHumidity(humiditySensor?.value ?? null)
      setLastUpdated(
        tempSensor?.timestamp ?? humiditySensor?.timestamp ?? null
      )
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch sensor data:", error)
      setTemp(null)
      setHumidity(null)
      setLoading(false)
    }
  }

  // เรียกตอนโหลดหน้า + ทุก ๆ 3 วิ (อ่านค่าล่าสุดจาก backend)
  useEffect(() => {
    fetchSensorData()
    const interval = setInterval(fetchSensorData, 3000)
    return () => clearInterval(interval)
  }, [])

  // ฟังก์ชันสั่งให้ backend สุ่มค่าใหม่
  const handleGenerateOnce = async () => {
    try {
      setActionLoading(true)
      await fetch("http://localhost:5000/api/simulator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      // สุ่มแล้ว ดึงค่าล่าสุดมาโชว์ทันที
      await fetchSensorData()
    } catch (error) {
      console.error("Failed to generate data:", error)
    } finally {
      setActionLoading(false)
    }
  }

  // จัดการ Auto Mode (เรียก generate ทุก 5 วิ)
  useEffect(() => {
    if (!autoMode) return

    const interval = setInterval(async () => {
      try {
        await fetch("http://localhost:5000/api/simulator/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        await fetchSensorData()
      } catch (error) {
        console.error("Auto generate failed:", error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [autoMode])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Sensor Simulator</h1>
        <div className="text-sm text-muted-foreground">
          Mode:{" "}
          <span className={autoMode ? "text-green-600 font-semibold" : "font-semibold"}>
            {autoMode ? "Auto" : "Manual"}
          </span>
          {lastUpdated && (
            <span className="ml-3">
              Last update: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* การ์ดค่า Sensor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {loading
                ? "Loading..."
                : temp !== null
                ? `${temp.toFixed(1)} °C`
                : "--"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Humidity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {loading
                ? "Loading..."
                : humidity !== null
                ? `${humidity.toFixed(1)} %`
                : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ปุ่มควบคุม Simulator */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button
          onClick={handleGenerateOnce}
          disabled={actionLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {actionLoading ? "Generating..." : "สุ่มค่าทันที"}
        </Button>

        {!autoMode ? (
          <Button
            variant="outline"
            onClick={() => setAutoMode(true)}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            เริ่ม Auto
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setAutoMode(false)}
            className="flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            หยุด Auto
          </Button>
        )}
      </div>
    </div>
  )
}
