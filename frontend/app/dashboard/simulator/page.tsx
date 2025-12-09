"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SimulatorPage() {
  const [temp, setTemp] = useState<number | null>(null)
  const [humidity, setHumidity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/sensors")
        const data = await res.json()

        // ✅ ดึงค่า sensor อุณหภูมิ
        const tempSensor = data.find((s: any) => s.type === "temperature")
        const humiditySensor = data.find((s: any) => s.type === "humidity")

        setTemp(tempSensor?.value ?? null)
        setHumidity(humiditySensor?.value ?? null)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch sensor data:", error)
        setTemp(null)
        setHumidity(null)
        setLoading(false)
      }
    }

    // ดึงครั้งแรกทันที
    fetchSensorData()

    // ดึงซ้ำทุก 2 วินาที
    const interval = setInterval(fetchSensorData, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sensor Simulator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {/* ✅ Temperature Card */}
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

        {/* ✅ Humidity Card */}
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
    </div>
  )
}
