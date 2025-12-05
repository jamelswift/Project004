"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { NotificationSettings } from "@/types"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    morningTime: "06:00",
    eveningTime: "18:00",
    emailNotifications: true,
    autoControl: true,
  })
  const [email, setEmail] = useState("admin@wsn.com")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      router.push("/")
      return
    }

    setEmail(user.email)
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    // บันทึกการตั้งค่า
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    alert("บันทึกการตั้งค่าเรียบร้อยแล้ว")
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ตั้งค่าระบบ</h1>
            <p className="text-muted-foreground">จัดการการตั้งค่าการแจ้งเตือนและการควบคุมอัตโนมัติ</p>
          </div>

          {/* AWS IoT Settings */}
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่า AWS IoT</CardTitle>
              <CardDescription>ข้อมูลการเชื่อมต่อกับ AWS IoT Core</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>WiFi SSID</Label>
                <Input value="Getzy" disabled />
              </div>
              <div className="space-y-2">
                <Label>WiFi Password</Label>
                <Input type="password" value="Wipatsasicha7" disabled />
              </div>
              <div className="space-y-2">
                <Label>IoT Policy</Label>
                <Input value="wsn-iot-policy" disabled />
              </div>
              <div className="space-y-2">
                <Label>AWS Endpoint</Label>
                <Input placeholder="your-endpoint.iot.region.amazonaws.com" className="font-mono text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าการแจ้งเตือน</CardTitle>
              <CardDescription>กำหนดเวลาและการแจ้งเตือนอัตโนมัติ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>เปิดใช้การแจ้งเตือนทางอีเมล</Label>
                  <p className="text-sm text-muted-foreground">รับการแจ้งเตือนเมื่อถึงเวลาควบคุมไฟ</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ควบคุมอัตโนมัติ</Label>
                  <p className="text-sm text-muted-foreground">เปิด/ปิดไฟอัตโนมัติตามเวลาที่กำหนด</p>
                </div>
                <Switch
                  checked={settings.autoControl}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoControl: checked })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="morningTime">เวลาเช้า (ปิดไฟ)</Label>
                  <Input
                    id="morningTime"
                    type="time"
                    value={settings.morningTime}
                    onChange={(e) => setSettings({ ...settings, morningTime: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">ระบบจะปิดไฟอัตโนมัติและส่งอีเมลแจ้งเตือน</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eveningTime">เวลามืด (เปิดไฟ)</Label>
                  <Input
                    id="eveningTime"
                    type="time"
                    value={settings.eveningTime}
                    onChange={(e) => setSettings({ ...settings, eveningTime: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">ระบบจะเปิดไฟอัตโนมัติและส่งอีเมลแจ้งเตือน</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">อีเมลสำหรับรับการแจ้งเตือน</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Weather API Settings */}
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่า Weather API</CardTitle>
              <CardDescription>ข้อมูลการเชื่อมต่อกับ OpenWeatherMap API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API URL</Label>
                <Input value="https://api.openweathermap.org/data/2.5" disabled className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input value="97d8748855b720c2dd02ca6143d2553e" disabled className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">เมือง</Label>
                <Input id="city" defaultValue="Bangkok" placeholder="Bangkok" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
