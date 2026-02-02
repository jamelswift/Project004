"use client"

import { useState } from "react"

export default function SettingsPage() {
  const [temp, setTemp] = useState("30")
  const [hum, setHum] = useState("70")
  const [email, setEmail] = useState("admin@example.com")
  const [saved, setSaved] = useState(false)

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">ตั้งค่าระบบ</div>
          <div className="text-sm text-gray-500">
            กำหนดเกณฑ์แจ้งเตือนและช่องทางแจ้งเตือน (Mock UI)
          </div>
        </div>

        {saved && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            บันทึกแล้ว (Mock)
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Box title="เกณฑ์อุณหภูมิ (°C)">
          <input
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            placeholder="เช่น 30"
          />
          <div className="mt-2 text-xs text-gray-500">ใช้สำหรับเงื่อนไขแจ้งเตือนอุณหภูมิสูงเกินกำหนด</div>
        </Box>

        <Box title="เกณฑ์ความชื้น (%)">
          <input
            value={hum}
            onChange={(e) => setHum(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            placeholder="เช่น 70"
          />
          <div className="mt-2 text-xs text-gray-500">ใช้สำหรับเงื่อนไขแจ้งเตือนความชื้นสูง/ต่ำผิดปกติ</div>
        </Box>

        <Box title="อีเมลสำหรับรับแจ้งเตือน">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            placeholder="admin@example.com"
          />
          <div className="mt-2 text-xs text-gray-500">เมื่อเกิดเหตุการณ์สำคัญ ระบบจะส่งแจ้งเตือน (เชื่อมจริงโดย Backend)</div>
        </Box>

        <Box title="รูปแบบการแจ้งเตือน">
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              แจ้งเตือนเมื่ออุปกรณ์ออฟไลน์
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              แจ้งเตือนเมื่อค่าเกิน Threshold
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              แจ้งเตือนรายวัน (สรุปสถานะ)
            </label>
          </div>
        </Box>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={() => setSaved(true)}
          className="rounded-2xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg transition"
        >
          บันทึกการตั้งค่า (Mock)
        </button>
        <button
          onClick={() => {
            setTemp("30")
            setHum("70")
            setEmail("admin@example.com")
            setSaved(false)
          }}
          className="rounded-2xl bg-white border border-gray-200 text-gray-800 px-5 py-2.5 text-sm font-semibold hover:shadow-sm transition"
        >
          รีเซ็ต
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        หมายเหตุ: ส่วนนี้เป็น UI เตรียมไว้ก่อน เมื่อ Backend พร้อมจะเชื่อม API เพื่อบันทึกจริง
      </div>
    </div>
  )
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {children}
    </div>
  )
}
