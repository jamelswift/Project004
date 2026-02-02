"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false })
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false })

const initialData = [
  { time: "10:00", temp: 28, hum: 60 },
  { time: "10:10", temp: 29, hum: 59 },
  { time: "10:20", temp: 30, hum: 58 },
  { time: "10:30", temp: 31, hum: 57 },
  { time: "10:40", temp: 30, hum: 58 },
  { time: "10:50", temp: 29, hum: 59 },
]

export default function SensorChart() {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    const timer = setInterval(() => {
      setData((prev) => [
        ...prev.slice(1),
        {
          time: new Date().toLocaleTimeString(),
          temp: 27 + Math.random() * 5,
          hum: 55 + Math.random() * 10,
        },
      ])
    }, 2000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[20, 80]} />
          <Tooltip />
          <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="hum" stroke="#ef4444" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
