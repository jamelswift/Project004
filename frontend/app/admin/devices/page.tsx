"use client"

import { useMemo, useState } from "react"

const MOCK_DEVICES = [
  { id: "ESP32-001", name: "เซ็นเซอร์อุณหภูมิ 1", type: "Sensor", location: "Warehouse A", status: "ออนไลน์", last: "2 นาทีที่แล้ว" },
  { id: "ESP32-002", name: "เซ็นเซอร์ความชื้น 1", type: "Sensor", location: "Warehouse A", status: "ออนไลน์", last: "2 นาทีที่แล้ว" },
  { id: "ESP32-003", name: "พัดลมระบายอากาศ", type: "Actuator", location: "Server Room", status: "ออฟไลน์", last: "1 ชั่วโมงที่แล้ว" },
  { id: "ESP32-004", name: "ตรวจจับการเคลื่อนไหว", type: "Sensor", location: "Entrance", status: "เตือน", last: "5 นาทีที่แล้ว" },
  { id: "ESP32-005", name: "สวิตช์ไฟหลัก", type: "Actuator", location: "Office", status: "ออนไลน์", last: "10 นาทีที่แล้ว" },
]

function badge(status: string) {
  if (status === "ออนไลน์") return "bg-emerald-100 text-emerald-700"
  if (status === "ออฟไลน์") return "bg-rose-100 text-rose-700"
  return "bg-amber-100 text-amber-700"
}

export default function DevicesPage() {
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"ทั้งหมด" | "ออนไลน์" | "ออฟไลน์" | "เตือน">("ทั้งหมด")

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return MOCK_DEVICES.filter((d) => {
      const okFilter = filter === "ทั้งหมด" ? true : d.status === filter
      const okSearch = !qq
        ? true
        : `${d.id} ${d.name} ${d.type} ${d.location} ${d.status}`.toLowerCase().includes(qq)
      return okFilter && okSearch
    })
  }, [q, filter])

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">จัดการอุปกรณ์</div>
          <div className="text-sm text-gray-500">
            ใช้สำหรับตรวจสอบสถานะอุปกรณ์/ควบคุมคำสั่ง (Mock UI รอเชื่อม API จริง)
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา: ID / ชื่อ / สถานที่..."
            className="w-full sm:w-[280px] rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option>ทั้งหมด</option>
            <option>ออนไลน์</option>
            <option>ออฟไลน์</option>
            <option>เตือน</option>
          </select>

          <button className="rounded-2xl bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg transition">
            + เพิ่มอุปกรณ์ (Mock)
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">ชื่ออุปกรณ์</th>
              <th className="px-4 py-3 text-left font-semibold">ประเภท</th>
              <th className="px-4 py-3 text-left font-semibold">ตำแหน่ง</th>
              <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
              <th className="px-4 py-3 text-left font-semibold">อัปเดตล่าสุด</th>
              <th className="px-4 py-3 text-left font-semibold">การควบคุม</th>
            </tr>
          </thead>

          <tbody className="text-gray-800">
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-semibold">{d.id}</td>
                <td className="px-4 py-3">{d.name}</td>
                <td className="px-4 py-3">{d.type}</td>
                <td className="px-4 py-3">{d.location}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge(d.status)}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{d.last}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold hover:shadow-sm transition">
                      ดูรายละเอียด
                    </button>
                    <button className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold hover:shadow-sm transition">
                      ส่งคำสั่ง
                    </button>
                    <button className="rounded-xl bg-rose-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-rose-700 transition">
                      รีสตาร์ท (Mock)
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  ไม่พบข้อมูลอุปกรณ์ตามเงื่อนไขที่เลือก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        หมายเหตุ: ปุ่มควบคุมเป็น Mock ระหว่างรอ Backend/Cloud เชื่อมข้อมูลจากเซ็นเซอร์จริง
      </div>
    </div>
  )
}
