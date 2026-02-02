"use client"

import { useMemo } from "react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import type { User, SensorData } from "@/types"

interface UserUsageChartProps {
  users: User[]
  sensors: SensorData[]
}

function buildDailySeries(dates: string[], formatter: (date: Date) => string) {
  const map = new Map<string, number>()
  for (const date of dates) {
    map.set(date, (map.get(date) || 0) + 1)
  }

  const now = new Date()
  const days: { key: string; label: string }[] = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ key, label: formatter(d) })
  }

  return days.map((day) => ({
    key: day.key,
    label: day.label,
    value: map.get(day.key) || 0,
  }))
}

export default function UserUsageChart({ users, sensors }: UserUsageChartProps) {
  const data = useMemo(() => {
    const userDates = users
      .map((u) => u?.createdAt)
      .filter(Boolean)
      .map((date) => new Date(String(date)))
      .filter((d) => !Number.isNaN(d.getTime()))
      .map((d) => d.toISOString().slice(0, 10))

    const sensorDates = sensors
      .map((s) => s?.timestamp)
      .filter(Boolean)
      .map((date) => new Date(String(date)))
      .filter((d) => !Number.isNaN(d.getTime()))
      .map((d) => d.toISOString().slice(0, 10))

    const userSeries = buildDailySeries(userDates, (d) =>
      d.toLocaleDateString("th-TH", { month: "short", day: "numeric" })
    )
    const sensorSeries = buildDailySeries(sensorDates, (d) =>
      d.toLocaleDateString("th-TH", { month: "short", day: "numeric" })
    )

    return userSeries.map((item, index) => ({
      label: item.label,
      users: item.value,
      dataPoints: sensorSeries[index]?.value || 0,
    }))
  }, [users, sensors])

  return (
    <div className="apple-card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">สถิติการใช้งาน (7 วันล่าสุด)</h2>
        <span className="text-xs text-muted-foreground">ผู้ใช้ใหม่ / ข้อมูลเซ็นเซอร์</span>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" name="ผู้ใช้ใหม่" stroke="#6366f1" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="dataPoints" name="ข้อมูลเซ็นเซอร์" stroke="#10b981" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground">* ข้อมูลอิงจากวันที่สร้างผู้ใช้และเวลาที่เซ็นเซอร์ส่งข้อมูล</p>
    </div>
  )
}
