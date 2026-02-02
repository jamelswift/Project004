"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

/* ===== FIX NEXT.JS RECHARTS BUG ===== */
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })

/* ===== MOCK SENSOR DATA ===== */
const initialData = [
  { time: "10:00", temp: 28, hum: 60 },
  { time: "10:10", temp: 29, hum: 59 },
  { time: "10:20", temp: 30, hum: 58 },
  { time: "10:30", temp: 31, hum: 57 },
  { time: "10:40", temp: 30, hum: 58 },
  { time: "10:50", temp: 29, hum: 59 },
]

export default function AdminDashboard() {
  const [data, setData] = useState(initialData)

  /* ===== REAL-TIME MOCK STREAMING ===== */
  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => [
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
    <div className="p-6 space-y-6">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="อุปกรณ์ทั้งหมด" value="12" color="bg-blue-500" />
        <Card title="ออนไลน์" value="9" color="bg-green-500" />
        <Card title="แจ้งเตือน" value="3" color="bg-red-500" />
        <Card title="ความเสถียรระบบ" value="99.9%" color="bg-purple-500" />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* SENSOR GRAPH */}
        <div className="xl:col-span-2 apple-card p-6">
          <div className="flex justify-between mb-3">
            <h2 className="text-lg font-semibold">แนวโน้มอุณหภูมิและความชื้น</h2>
            <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">● Live Sensor (Mock)</span>
          </div>

          <div className="flex gap-2 mb-4 text-xs">
            <span className="bg-green-100 px-2 py-1 rounded">MQTT Connected</span>
            <span className="bg-blue-100 px-2 py-1 rounded">AWS IoT Core</span>
            <span className="bg-purple-100 px-2 py-1 rounded">TLS Secured</span>
          </div>

          {/* CHART */}
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

          {/* AI ALERT */}
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
            🤖 <b>AI Alert:</b> พบความผิดปกติของอุณหภูมิ (Probability 87%) <br />
            ใช้โมเดล: Z-Score + Moving Average (Mock)
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Network Latency: 42ms • Packet Loss: 0.1% • Sampling Rate: 2s
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">

          {/* SYSTEM HEALTH */}
          <div className="apple-card p-6">
            <h2 className="font-semibold mb-2">สุขภาพระบบ (System Health)</h2>
            <p className="text-green-600 font-medium">ระบบทำงานปกติ</p>

            <div className="mt-3 bg-blue-50 p-4 rounded-xl">
              <p className="text-sm">สถานะ Cloud IoT</p>
              <p className="font-semibold">พร้อมใช้งาน (รอเซ็นเซอร์จริง)</p>

              <div className="w-full bg-white h-2 rounded-full mt-2">
                <div className="bg-blue-600 h-2 rounded-full w-[85%]" />
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="apple-card p-6 space-y-3">
            <h2 className="font-semibold">คำสั่งด่วนผู้ดูแลระบบ</h2>
            <button className="apple-button w-full">+ เพิ่มอุปกรณ์</button>
            <button className="soft-card w-full py-2">ตั้งค่า Threshold</button>
            <button className="soft-card w-full py-2">บันทึกระบบ (Logs)</button>
          </div>

        </div>
      </div>

      {/* LOGS */}
      <div className="apple-card p-6">
        <h2 className="text-lg font-semibold mb-4">กิจกรรมล่าสุดของระบบ</h2>
        <LogItem text="ESP32-001 ส่งข้อมูลอุณหภูมิ" />
        <LogItem text="Admin เปิดพัดลมผ่าน Dashboard" />
        <LogItem text="ESP32-002 Offline (Timeout)" />
      </div>

    </div>
  )
}

/* COMPONENTS */
function Card({ title, value, color }: any) {
  return (
    <div className="apple-card p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      <div className={`h-1 mt-2 w-full rounded-full ${color}`} />
    </div>
  )
}

function LogItem({ text }: any) {
  return <div className="p-3 bg-white border rounded-xl shadow-sm mb-2">{text}</div>
}
