"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureCurrentUser } from "@/lib/auth"

interface NotificationLog {
  id: number
  to: string
  subject: string
  message: string
  status: string
  timestamp: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"ทั้งหมด" | "สำเร็จ" | "เตือน" | "ล้มเหลว">("ทั้งหมด")
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  useEffect(() => {
    const verify = async () => {
      const user = await ensureCurrentUser()
      if (!user || user.role !== "admin") {
        router.push("/")
        return
      }

      fetchLogs()
    }

    verify()
  }, [router])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/notifications`)
      const data = await response.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return { label: "สำเร็จ", pill: "bg-emerald-100 text-emerald-700" }
      case "failed":
        return { label: "ล้มเหลว", pill: "bg-rose-100 text-rose-700" }
      case "pending":
        return { label: "เตือน", pill: "bg-amber-100 text-amber-700" }
      default:
        return { label: status || "ไม่ทราบ", pill: "bg-slate-100 text-slate-700" }
    }
  }

  const rows = useMemo(() => {
    const qq = query.trim().toLowerCase()
    return logs
      .slice()
      .reverse()
      .filter((log) => {
        const { label } = statusLabel(log.status)
        const okFilter = filter === "ทั้งหมด" ? true : label === filter
        const okSearch = !qq
          ? true
          : `${log.timestamp} ${log.to} ${log.subject} ${log.message} ${label}`
              .toLowerCase()
              .includes(qq)
        return okFilter && okSearch
      })
      .slice(0, 100)
  }, [logs, query, filter])

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">บันทึกระบบ (Logs/Audit)</div>
          <div className="text-sm text-gray-500">ประวัติการแจ้งเตือนและการทำงานของระบบ</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา: ผู้กระทำ / เหตุการณ์ / เป้าหมาย..."
            className="w-full sm:w-[320px] rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option>ทั้งหมด</option>
            <option>สำเร็จ</option>
            <option>เตือน</option>
            <option>ล้มเหลว</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="rounded-2xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:shadow-sm transition disabled:opacity-60"
          >
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-500 py-8">ไม่พบข้อมูลบันทึกตามเงื่อนไขที่เลือก</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">เวลา</th>
                <th className="px-4 py-3 text-left font-semibold">ผู้รับ</th>
                <th className="px-4 py-3 text-left font-semibold">เหตุการณ์</th>
                <th className="px-4 py-3 text-left font-semibold">รายละเอียด</th>
                <th className="px-4 py-3 text-left font-semibold">ผลลัพธ์</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {rows.map((log) => {
                const status = statusLabel(log.status)
                return (
                  <tr key={log.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString("th-TH")}</td>
                    <td className="px-4 py-3">{log.to}</td>
                    <td className="px-4 py-3 font-medium">{log.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{log.message}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${status.pill}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
