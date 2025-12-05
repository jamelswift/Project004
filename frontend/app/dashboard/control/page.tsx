"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { DeviceStatus } from "@/types"
import { Lightbulb, Power, Fan, Droplets, Zap, Clock, Activity } from "lucide-react"

export default function ControlPage() {
  const [devices, setDevices] = useState<DeviceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [fanSpeed, setFanSpeed] = useState(0)
  const [autoMode, setAutoMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }

    fetchDevices()
  }, [router])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  const fetchDevices = async () => {
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
        setDevices(
          devices.map((d) =>
            d.deviceId === deviceId ? { ...d, status: newStatus, lastUpdate: new Date().toISOString() } : d,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to toggle device:", error)
    }
  }

  const toggleAllDevices = async (status: "on" | "off") => {
    for (const device of devices.filter((d) => d.type === "light")) {
      await toggleDevice(device.deviceId, device.status === status ? "off" : "on")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ควบคุมอุปกรณ์
              </h1>
              <p className="text-muted-foreground mt-2">Device Control & Management System</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => toggleAllDevices("on")} className="bg-gradient-to-r from-green-600 to-emerald-600">
                <Zap className="h-4 w-4 mr-2" />
                เปิดทั้งหมด
              </Button>
              <Button onClick={() => toggleAllDevices("off")} variant="outline">
                <Power className="h-4 w-4 mr-2" />
                ปิดทั้งหมด
              </Button>
            </div>
          </div>

          {/* System Status */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  อุปกรณ์ทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{devices.length}</div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  ทำงานอยู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {devices.filter((d) => d.status === "on").length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Power className="h-4 w-4 text-gray-500" />
                  ปิดอยู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">
                  {devices.filter((d) => d.status === "off").length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  โหมดอัตโนมัติ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={autoMode ? "default" : "secondary"} className="text-base px-3 py-1">
                  {autoMode ? "เปิด" : "ปิด"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Auto Mode Control */}
          <Card className="border-2 border-blue-300 dark:border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                การควบคุมอัตโนมัติ
              </CardTitle>
              <CardDescription>ตั้งค่าเวลาเปิด-ปิดไฟอัตโนมัติตามเวลา</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div>
                  <Label className="text-base font-medium">เปิดใช้งานโหมดอัตโนมัติ</Label>
                  <p className="text-sm text-muted-foreground">เปิดไฟตอนมืด (18:00) ปิดไฟตอนเช้า (06:00)</p>
                </div>
                <Switch checked={autoMode} onCheckedChange={setAutoMode} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">เปิดไฟ (Evening)</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">18:00 - 20:00</p>
                  <p className="text-xs text-muted-foreground mt-1">เมื่อความเข้มแสง {"<"} 1000 Lux</p>
                </div>

                <div className="p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Power className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">ปิดไฟ (Morning)</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-600">06:00 - 08:00</p>
                  <p className="text-xs text-muted-foreground mt-1">เมื่อความเข้มแสง {">"} 2000 Lux</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Light Controls */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              ควบคุมไฟ (Lighting Control)
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices
                .filter((d) => d.type === "light")
                .map((device) => (
                  <Card
                    key={device.deviceId}
                    className={`border-2 transition-all ${device.status === "on" ? "border-yellow-500 shadow-lg shadow-yellow-500/20" : "border-gray-300"}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lightbulb
                            className={`h-5 w-5 ${device.status === "on" ? "text-yellow-500 animate-pulse" : "text-gray-400"}`}
                          />
                          {device.name}
                        </CardTitle>
                        <Badge variant={device.status === "on" ? "default" : "secondary"}>
                          {device.status === "on" ? "ON" : "OFF"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={device.deviceId}>สถานะ</Label>
                        <Switch
                          id={device.deviceId}
                          checked={device.status === "on"}
                          onCheckedChange={() => toggleDevice(device.deviceId, device.status)}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        อัพเดทล่าสุด: {new Date(device.lastUpdate).toLocaleString("th-TH")}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Advanced Controls */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Fan Control */}
            <Card className="border-2 border-cyan-300 dark:border-cyan-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fan className={`h-5 w-5 text-cyan-600 ${fanSpeed > 0 ? "animate-spin" : ""}`} />
                  ควบคุมพัดลม (Fan Control)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>ความเร็ว</Label>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {fanSpeed}%
                    </Badge>
                  </div>
                  <Slider
                    value={[fanSpeed]}
                    onValueChange={(value) => setFanSpeed(value[0])}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>ปิด</span>
                    <span>ช้า</span>
                    <span>กลาง</span>
                    <span>เร็ว</span>
                    <span>เต็มที่</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setFanSpeed(0)} variant="outline" size="sm" className="flex-1">
                    ปิด
                  </Button>
                  <Button onClick={() => setFanSpeed(50)} variant="outline" size="sm" className="flex-1">
                    50%
                  </Button>
                  <Button onClick={() => setFanSpeed(100)} variant="default" size="sm" className="flex-1">
                    100%
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sprinkler Control */}
            <Card className="border-2 border-blue-300 dark:border-blue-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  ควบคุมสปริงเกอร์ (Sprinkler Control)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">สปริงเกอร์ 1</Label>
                      <p className="text-sm text-muted-foreground">รดน้ำโซนหน้าสวน</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">สปริงเกอร์ 2</Label>
                      <p className="text-sm text-muted-foreground">รดน้ำโซนหลังสวน</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600">
                  <Droplets className="h-4 w-4 mr-2" />
                  เปิดทั้งหมด 10 นาที
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                เกี่ยวกับระบบควบคุม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• ควบคุมอุปกรณ์แบบเรียลไทม์ผ่าน AWS IoT Core</p>
              <p>• รองรับโหมดอัตโนมัติตามเวลาและสภาพแวดล้อม</p>
              <p>• บันทึกประวัติการทำงานของอุปกรณ์ทั้งหมด</p>
              <p>• แจ้งเตือนผ่านอีเมลเมื่อมีการเปลี่ยนแปลงสถานะ</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
