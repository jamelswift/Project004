"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { DeviceStatus } from "@/types"
import { Lightbulb, Activity, RefreshCw } from "lucide-react"

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<DeviceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      router.push("/")
      return
    }

    fetchDevices()
  }, [router])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/devices`)
      const data = await response.json()
      setDevices(data)
    } catch (error) {
      console.error("Failed to fetch devices:", error)
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

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">จัดการอุปกรณ์</h1>
              <p className="text-muted-foreground">ควบคุมและตรวจสอบสถานะอุปกรณ์ทั้งหมด</p>
            </div>
            <Button onClick={fetchDevices} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              รีเฟรช
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.deviceId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {device.type === "light" ? (
                        <Lightbulb
                          className={`h-6 w-6 ${device.status === "on" ? "text-yellow-500" : "text-gray-400"}`}
                        />
                      ) : (
                        <Activity
                          className={`h-6 w-6 ${device.status === "on" ? "text-green-500" : "text-gray-400"}`}
                        />
                      )}
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                    </div>
                    <Badge variant={device.status === "on" ? "default" : "secondary"}>
                      {device.status === "on" ? "เปิด" : "ปิด"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">รหัสอุปกรณ์:</span>
                      <span className="font-mono">{device.deviceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ประเภท:</span>
                      <span>{device.type === "light" ? "หลอดไฟ" : "เซ็นเซอร์"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">อัพเดทล่าสุด:</span>
                      <span>{new Date(device.lastUpdate).toLocaleTimeString("th-TH")}</span>
                    </div>
                  </div>

                  {device.type === "light" && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">ควบคุมอุปกรณ์</span>
                      <Switch
                        checked={device.status === "on"}
                        onCheckedChange={() => toggleDevice(device.deviceId, device.status)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
