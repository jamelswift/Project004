"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { time: "10:00", temp: 25, hum: 60 },
  { time: "10:05", temp: 26, hum: 62 },
  { time: "10:10", temp: 28, hum: 65 },
]

export default function TempChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="temp" stroke="#3b82f6" />
        <Line type="monotone" dataKey="hum" stroke="#10b981" />
      </LineChart>
    </ResponsiveContainer>
  )
}
