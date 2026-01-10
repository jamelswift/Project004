"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import ThresholdSettings from "@/components/threshold-settings"
import NotificationCenter from "@/components/notification-center"
import { Bell, Settings, TrendingUp, RefreshCw } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

interface Device {
  deviceId: string
  name: string
  type: string
  status: string
}

export default function AlertsPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState("")
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)

  // ดึง Device List จาก Backend
  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/devices`)
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setDevices(data)
        // ตั้ง default device เป็นอันแรก
        if (data.length > 0) {
          setSelectedDeviceId(data[0].deviceId)
        }
      }
    } catch (error) {
      console.error("Error loading devices:", error)
      // ถ้าโหลดไม่ได้ ให้ใช้ device placeholder
      setDevices([
        { deviceId: "ESP32_001", name: "ESP32 #1", type: "sensor", status: "online" },
        { deviceId: "ESP32_002", name: "ESP32 #2", type: "sensor", status: "online" },
      ])
      setSelectedDeviceId("ESP32_001")
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ระบบแจ้งเตือน</h1>
          <p className="text-muted-foreground">
            ตั้งค่าและจัดการการแจ้งเตือนเมื่อค่าเซ็นเซอร์เกินขีดจำกัด
          </p>
        </div>
      </div>

      {/* Device Selector */}
      <Card>
        <CardHeader>
          <CardTitle>เลือกอุปกรณ์</CardTitle>
          <CardDescription>เลือกจากอุปกรณ์ที่เชื่อมต่ออยู่</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="deviceSelect" className="block mb-2">Device</Label>
                <select
                  id="deviceSelect"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="">-- เลือกอุปกรณ์ --</option>
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.name} ({device.deviceId}) - {device.status === "online" ? "🟢 Online" : "🔴 Offline"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={loadDevices}
                  disabled={loading}
                  title="รีเฟรชรายชื่ออุปกรณ์"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            
            {devices.length === 0 && !loading && (
              <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md">
                ⚠️ ไม่พบอุปกรณ์ที่เชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่อ WiFi
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedDeviceId && (
        <>
          <Tabs defaultValue="notifications" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                การแจ้งเตือน
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                ตั้งค่าขีดจำกัด
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationCenter deviceId={selectedDeviceId} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <ThresholdSettings deviceId={selectedDeviceId} />
            </TabsContent>
          </Tabs>

          {/* คำแนะนำ */}
          <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <TrendingUp className="w-5 h-5" />
                คำแนะนำการใช้งาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <p>
                <strong>1. ตั้งค่าขีดจำกัด:</strong> กำหนดค่าต่ำสุด (Min) หรือค่าสูงสุด (Max)
                สำหรับแต่ละประเภทเซ็นเซอร์
              </p>
              <p>
                <strong>2. เปิดการแจ้งเตือน:</strong> เลือกช่องทางการแจ้งเตือนผ่าน Email หรือ
                Browser Notification
              </p>
              <p>
                <strong>3. ตรวจสอบการแจ้งเตือน:</strong> ดูประวัติการแจ้งเตือนทั้งหมดในแท็บ
                "การแจ้งเตือน"
              </p>
              <p>
                <strong>4. Browser Notification:</strong> อย่าลืมอนุญาตการแจ้งเตือนบน Browser
                เพื่อรับการแจ้งเตือนแบบ Real-time
              </p>
              <p className="mt-4">
                <strong>ตัวอย่างค่าแนะนำ:</strong>
                <br />• อุณหภูมิ: 15-35°C
                <br />• ความชื้น: 30-80%
                <br />• PM2.5: 0-50 µg/m³
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedDeviceId && devices.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <p className="text-yellow-800 dark:text-yellow-300">
              👆 กรุณาเลือกอุปกรณ์ด้านบนเพื่อเริ่มต้นใช้งาน
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
