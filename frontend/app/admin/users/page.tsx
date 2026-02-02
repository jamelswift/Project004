"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureCurrentUser } from "@/lib/auth"
import type { User } from "@/types"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<"ทั้งหมด" | "admin" | "user">("ทั้งหมด")
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  useEffect(() => {
    const verify = async () => {
      const user = await ensureCurrentUser()
      if (!user || user.role !== "admin") {
        router.push("/")
        return
      }

      fetchUsers()
    }

    verify()
  }, [router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/users`)
      const payload = await response.json()
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.users)
          ? payload.users
          : Array.isArray(payload?.data)
            ? payload.data
            : []
      setUsers(list)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      const okRole = role === "ทั้งหมด" ? true : u.role === role
      const okSearch = !q
        ? true
        : `${u.email} ${u.name} ${u.role}`.toLowerCase().includes(q)
      return okRole && okSearch
    })
  }, [users, query, role])

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">ผู้ใช้งานระบบ</div>
          <div className="text-sm text-gray-500">จัดการและตรวจสอบผู้ใช้งานที่สมัครในระบบ</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา: อีเมล / ชื่อ / บทบาท..."
            className="w-full sm:w-[280px] rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option>ทั้งหมด</option>
            <option>admin</option>
            <option>user</option>
          </select>
          <button
            onClick={fetchUsers}
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
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">อีเมล</th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อ</th>
                <th className="px-4 py-3 text-left font-semibold">บทบาท</th>
                <th className="px-4 py-3 text-left font-semibold">สร้างเมื่อ</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold">{u.email}</td>
                  <td className="px-4 py-3">{u.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString("th-TH") : "-"}
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    ไม่พบผู้ใช้งานตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
