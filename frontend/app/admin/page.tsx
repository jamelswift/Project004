"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TemperatureChart } from "@/components/temperature-chart"
import StatItem from "@/components/admin/dashboard/StatItem"
import SystemOverview from "@/components/admin/dashboard/SystemOverview"
import SystemInformation from "@/components/admin/dashboard/SystemInformation"
import QuickActions from "@/components/admin/dashboard/QuickActions"
import SystemActivity from "@/components/admin/dashboard/SystemActivity"
import UserUsageChart from "@/components/admin/dashboard/UserUsageChart"
import type { User, SensorData } from "@/types"

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalDevices: 3,
    activeDevices: 2,
    totalUsers: 2,
    dataPoints: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [sensors, setSensors] = useState<SensorData[]>([])
  const router = useRouter()

  useEffect(() => {
    const verify = async () => {
      const user = await ensureCurrentUser()
      if (!user || user.role !== "admin") {
        router.push("/")
        return
      }

      fetchStats()
    }

    verify()
  }, [router])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  const fetchStats = async () => {
    try {
      const [devicesRes, sensorsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/devices`),
        fetch(`${API_URL}/api/sensors`),
        fetch(`${API_URL}/api/users`),
      ])

      const devicesPayload = await devicesRes.json()
      const sensorsPayload = await sensorsRes.json()
      const usersPayload = await usersRes.json()

      const devices = Array.isArray(devicesPayload)
        ? devicesPayload
        : Array.isArray(devicesPayload?.devices)
          ? devicesPayload.devices
          : Array.isArray(devicesPayload?.data)
            ? devicesPayload.data
            : []

      const sensors = Array.isArray(sensorsPayload)
        ? sensorsPayload
        : Array.isArray(sensorsPayload?.sensors)
          ? sensorsPayload.sensors
          : Array.isArray(sensorsPayload?.data)
            ? sensorsPayload.data
            : []

      const users = Array.isArray(usersPayload)
        ? usersPayload
        : Array.isArray(usersPayload?.users)
          ? usersPayload.users
          : Array.isArray(usersPayload?.data)
            ? usersPayload.data
            : []

      setStats({
        totalDevices: devices.length,
        activeDevices: devices.filter((d: any) => d?.status === "on").length,
        totalUsers: users.length || 2,
        dataPoints: sensors.length,
      })

      setUsers(users)
      setSensors(sensors)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-muted-foreground">ภาพรวมและการจัดการระบบ IoT</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="อุปกรณ์ทั้งหมด"
          value={stats.totalDevices}
          icon="📡"
          gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
        />
        <StatItem
          title="อุปกรณ์ทำงานอยู่"
          value={stats.activeDevices}
          icon="✅"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
        />
        <StatItem
          title="ผู้ใช้งาน"
          value={stats.totalUsers}
          icon="👥"
          gradient="bg-gradient-to-br from-purple-500 to-fuchsia-500"
        />
        <StatItem
          title="ข้อมูลทั้งหมด"
          value={stats.dataPoints}
          icon="📈"
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <SystemOverview />

          <UserUsageChart users={users} sensors={sensors} />

          <div className="apple-card p-6">
            <TemperatureChart />
          </div>
        </div>

        <div className="space-y-6">
          <SystemInformation />
          <QuickActions />
        </div>
      </div>

      <SystemActivity />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>การเชื่อมต่อ AWS IoT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Endpoint</span>
              <span className="text-sm font-mono">your-endpoint.iot.region.amazonaws.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Policy</span>
              <span className="text-sm font-mono">wsn-iot-policy</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">สถานะ</span>
              <span className="text-sm font-semibold text-green-600">เชื่อมต่อแล้ว</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>การตั้งค่าการแจ้งเตือน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">เวลาเช้า (ปิดไฟ)</span>
              <span className="text-sm font-mono">06:00 - 08:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">เวลามืด (เปิดไฟ)</span>
              <span className="text-sm font-mono">18:00 - 20:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">การแจ้งเตือน</span>
              <span className="text-sm font-semibold text-green-600">เปิดใช้งาน</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
