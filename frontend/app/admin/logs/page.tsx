"use client"

import { useMemo, useState } from "react"

const MOCK_LOGS = [
  { time: "23/01/2569 14:04:41", who: "ผู้ดูแลระบบ", action: "ตั้งค่าเกณฑ์อุณหภูมิ", target: "Temp > 30°C", result: "สำเร็จ" },
  { time: "23/01/2569 10:42:12", who: "ESP32-003", action: "อุณหภูมิสูงเกินกำหนด", target: "temperature=31.2", result: "เตือน" },
  { time: "23/01/2569 09:15:07", who: "ระบบ", action: "อุปกรณ์ออฟไลน์", target: "ESP32-007", result: "เตือน" },
  { time: "23/01/2569 08:15:55", who: "ESP32-001", action: "ส่งค่าความชื้น", target: "humidity=62", result: "สำเร็จ" },
]

function pill(result: string) {
  if (result === "สำเร็จ") return "bg-emerald-100 text-emerald-700"
  if (result === "ล้มเหลว") return "bg-rose-100 text-rose-700"
  return "bg-amber-100 text-amber-700"
}

export default function LogsPage() {
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"ทั้งหมด" | "สำเร็จ" | "เตือน" | "ล้มเหลว">("ทั้งหมด")

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return MOCK_LOGS.filter((r) => {
      const okFilter = filter === "ทั้งหมด" ? true : r.result === filter
      const okSearch = !qq
        ? true
        : `${r.time} ${r.who} ${r.action} ${r.target} ${r.result}`.toLowerCase().includes(qq)
      return okFilter && okSearch
    })
  }, [q, filter])

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">บันทึกระบบ (Logs/Audit)</div>
          <div className="text-sm text-gray-500">
            ใช้ตรวจสอบเหตุการณ์ของระบบและกิจกรรมผู้ดูแลระบบ เพื่อการตรวจสอบย้อนหลัง
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา: ผู้กระทำ / เหตุการณ์ / เป้าหมาย..."
            className="w-full sm:w-[320px] rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option>ทั้งหมด</option>
            <option>สำเร็จ</option>
            <option>เตือน</option>
            <option>ล้มเหลว</option>
          </select>
          <button className="rounded-2xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:shadow-sm transition">
            รีเฟรช (Mock)
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">เวลา</th>
              <th className="px-4 py-3 text-left font-semibold">ผู้กระทำ</th>
              <th className="px-4 py-3 text-left font-semibold">เหตุการณ์</th>
              <th className="px-4 py-3 text-left font-semibold">เป้าหมาย</th>
              <th className="px-4 py-3 text-left font-semibold">ผลลัพธ์</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-3">{r.time}</td>
                <td className="px-4 py-3">{r.who}</td>
                <td className="px-4 py-3 font-medium">{r.action}</td>
                <td className="px-4 py-3">{r.target}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${pill(r.result)}`}>
                    {r.result}
                  </span>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  ไม่พบข้อมูลบันทึกตามเงื่อนไขที่เลือก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        หมายเหตุ: Logs ตัวอย่าง (Mock) เพื่อเตรียมหน้า Admin ระหว่างรอ Backend ส่ง API จริง
      </div>
    </div>
  )
}
