"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TemperatureChart } from "@/components/temperature-chart"
import { Users, Activity, Lightbulb, Database } from "lucide-react"

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalDevices: 3,
    activeDevices: 2,
    totalUsers: 2,
    dataPoints: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      router.push("/")
      return
    }

    fetchStats()
  }, [router])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  const fetchStats = async () => {
    try {
      const [devicesRes, sensorsRes] = await Promise.all([fetch(`${API_URL}/api/devices`), fetch(`${API_URL}/api/sensors`)])

      const devices = await devicesRes.json()
      const sensors = await sensorsRes.json()

      setStats({
        totalDevices: devices.length,
        activeDevices: devices.filter((d: any) => d.status === "on").length,
        totalUsers: 2,
        dataPoints: sensors.length,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ดผู้ดูแลระบบ</h1>
            <p className="text-muted-foreground">ภาพรวมและการจัดการระบบ IoT</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">อุปกรณ์ทั้งหมด</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalDevices}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.activeDevices} อุปกรณ์ทำงานอยู่</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ผู้ใช้งาน</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">ผู้ใช้งานทั้งหมดในระบบ</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ข้อมูลที่บันทึก</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.dataPoints}</div>
                <p className="text-xs text-muted-foreground mt-1">จุดข้อมูลทั้งหมด</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">สถานะระบบ</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">ปกติ</div>
                <p className="text-xs text-muted-foreground mt-1">ทุกระบบทำงานปกติ</p>
              </CardContent>
            </Card>
          </div>

          {/* Temperature Chart */}
          <TemperatureChart />

          {/* System Info */}
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
      </main>
    </div>
  )
}
