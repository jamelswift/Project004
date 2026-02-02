"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureCurrentUser } from "@/lib/auth"
import { Switch } from "@/components/ui/switch"
import type { DeviceStatus } from "@/types"
import { RefreshCw } from "lucide-react"

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<DeviceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"ทั้งหมด" | "เปิด" | "ปิด">("ทั้งหมด")
  const router = useRouter()

  useEffect(() => {
    const verify = async () => {
      const user = await ensureCurrentUser()
      if (!user || user.role !== "admin") {
        router.push("/")
        return
      }

      fetchDevices()
    }

    verify()
  }, [router])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/devices`)
      const payload = await response.json()
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.devices)
          ? payload.devices
          : Array.isArray(payload?.data)
            ? payload.data
            : []
      setDevices(list)
    } catch (error) {
      console.error("Failed to fetch devices:", error)
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  const toggleDevice = async (deviceId: string, currentStatus: string) => {
    const newStatus = currentStatus === "on" ? "off" : "on"

    try {
      const response = await fetch(`${API_URL}/api/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, status: newStatus }),
      })

      if (response.ok) {
        await fetchDevices()
      }
    } catch (error) {
      console.error("Failed to toggle device:", error)
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return devices.filter((device) => {
      const statusLabel = device.status === "on" ? "เปิด" : "ปิด"
      const okFilter = filter === "ทั้งหมด" ? true : statusLabel === filter
      const okSearch = !q
        ? true
        : `${device.deviceId} ${device.name} ${device.type} ${statusLabel}`
            .toLowerCase()
            .includes(q)
      return okFilter && okSearch
    })
  }, [devices, query, filter])

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">จัดการอุปกรณ์</div>
          <div className="text-sm text-gray-500">ควบคุมและตรวจสอบสถานะอุปกรณ์ทั้งหมด</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา: ID / ชื่อ / ประเภท..."
            className="w-full sm:w-[280px] rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option>ทั้งหมด</option>
            <option>เปิด</option>
            <option>ปิด</option>
          </select>

          <button
            onClick={fetchDevices}
            disabled={loading}
            className="rounded-2xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:shadow-sm transition disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              รีเฟรช
            </span>
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
              <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
              <th className="px-4 py-3 text-left font-semibold">อัปเดตล่าสุด</th>
              <th className="px-4 py-3 text-left font-semibold">การควบคุม</th>
            </tr>
          </thead>

          <tbody className="text-gray-800">
            {rows.map((device) => {
              const statusLabel = device.status === "on" ? "เปิด" : "ปิด"
              const statusClass =
                statusLabel === "เปิด"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"

              return (
                <tr key={device.deviceId} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold">{device.deviceId}</td>
                  <td className="px-4 py-3">{device.name}</td>
                  <td className="px-4 py-3">{device.type === "light" ? "หลอดไฟ" : "เซ็นเซอร์"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(device.lastUpdate).toLocaleTimeString("th-TH")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold hover:shadow-sm transition">
                        ดูรายละเอียด
                      </button>
                      {device.type === "light" && (
                        <Switch
                          checked={device.status === "on"}
                          onCheckedChange={() => toggleDevice(device.deviceId, device.status)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  ไม่พบข้อมูลอุปกรณ์ตามเงื่อนไขที่เลือก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
