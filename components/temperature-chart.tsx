"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import type { HistoricalData } from "@/types"

export function TemperatureChart() {
  const [data, setData] = useState<HistoricalData[]>([])

  useEffect(() => {
    // สร้างข้อมูลตัวอย่าง 24 ชั่วโมงที่ผ่านมา
    const generateData = () => {
      const now = new Date()
      const historicalData: HistoricalData[] = []

      for (let i = 24; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000)
        historicalData.push({
          timestamp: time.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          temperature: 22 + Math.random() * 8 + Math.sin(i / 4) * 3,
          humidity: 50 + Math.random() * 20,
        })
      }

      return historicalData
    }

    setData(generateData())

    // อัพเดทข้อมูลทุก 5 นาที
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData.slice(1)]
        const now = new Date()
        newData.push({
          timestamp: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          temperature: 22 + Math.random() * 8,
          humidity: 50 + Math.random() * 20,
        })
        return newData
      })
    }, 300000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>กราฟแสดงอุณหภูมิ 24 ชั่วโมง</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="timestamp" className="text-xs" tick={{ fill: "currentColor" }} />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              label={{ value: "°C", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number) => [`${value.toFixed(1)}°C`, "อุณหภูมิ"]}
            />
            <Line type="monotone" dataKey="temperature" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
