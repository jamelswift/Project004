"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureCurrentUser } from "@/lib/auth"
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
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const verify = async () => {
      const user = await ensureCurrentUser()
      if (!user || user.role !== "admin") {
        router.push("/")
        return
      }

      setEmail(user.email)
    }

    verify()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    // บันทึกการตั้งค่า
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    alert("บันทึกการตั้งค่าเรียบร้อยแล้ว")
  }

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">ตั้งค่าระบบ</div>
          <div className="text-sm text-gray-500">จัดการการตั้งค่าการแจ้งเตือนและการควบคุมอัตโนมัติ</div>
        </div>

        {saved && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            บันทึกแล้ว
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Box title="การตั้งค่า AWS IoT">
          <div className="space-y-3">
            <div>
              <Label>WiFi SSID</Label>
              <Input value="Getzy" disabled className="mt-2" />
            </div>
            <div>
              <Label>WiFi Password</Label>
              <Input type="password" value="Wipatsasicha7" disabled className="mt-2" />
            </div>
            <div>
              <Label>IoT Policy</Label>
              <Input value="wsn-iot-policy" disabled className="mt-2" />
            </div>
            <div>
              <Label>AWS Endpoint</Label>
              <Input placeholder="your-endpoint.iot.region.amazonaws.com" className="mt-2 font-mono text-sm" />
            </div>
          </div>
        </Box>

        <Box title="การตั้งค่าการแจ้งเตือน">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>เปิดใช้การแจ้งเตือนทางอีเมล</Label>
                <p className="text-xs text-muted-foreground">รับการแจ้งเตือนเมื่อถึงเวลาควบคุมไฟ</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>ควบคุมอัตโนมัติ</Label>
                <p className="text-xs text-muted-foreground">เปิด/ปิดไฟอัตโนมัติตามเวลาที่กำหนด</p>
              </div>
              <Switch
                checked={settings.autoControl}
                onCheckedChange={(checked) => setSettings({ ...settings, autoControl: checked })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="morningTime">เวลาเช้า (ปิดไฟ)</Label>
                <Input
                  id="morningTime"
                  type="time"
                  value={settings.morningTime}
                  onChange={(e) => setSettings({ ...settings, morningTime: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">ระบบจะปิดไฟอัตโนมัติและส่งอีเมลแจ้งเตือน</p>
              </div>

              <div>
                <Label htmlFor="eveningTime">เวลามืด (เปิดไฟ)</Label>
                <Input
                  id="eveningTime"
                  type="time"
                  value={settings.eveningTime}
                  onChange={(e) => setSettings({ ...settings, eveningTime: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">ระบบจะเปิดไฟอัตโนมัติและส่งอีเมลแจ้งเตือน</p>
              </div>
            </div>

            <div>
              <Label htmlFor="email">อีเมลสำหรับรับการแจ้งเตือน</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
            </div>
          </div>
        </Box>

        <Box title="การตั้งค่า Weather API">
          <div className="space-y-3">
            <div>
              <Label>API URL</Label>
              <Input value="https://api.openweathermap.org/data/2.5" disabled className="mt-2 font-mono text-sm" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input value="97d8748855b720c2dd02ca6143d2553e" disabled className="mt-2 font-mono text-sm" />
            </div>
            <div>
              <Label htmlFor="city">เมือง</Label>
              <Input id="city" defaultValue="Bangkok" placeholder="Bangkok" className="mt-2" />
            </div>
          </div>
        </Box>
      </div>

      <div className="mt-5 flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          ยกเลิก
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </Button>
      </div>
    </div>
  )
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  )
}
