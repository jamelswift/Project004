"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock, Sunrise, Sunset, Bell, Plus, Trash2 } from "lucide-react"

interface Schedule {
  id: string
  name: string
  time: string
  action: "on" | "off"
  enabled: boolean
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: "1", name: "เปิดไฟตอนเช้า", time: "06:00", action: "off", enabled: true },
    { id: "2", name: "ปิดไฟตอนเย็น", time: "18:00", action: "on", enabled: true },
  ])
  const [newScheduleName, setNewScheduleName] = useState("")
  const [newScheduleTime, setNewScheduleTime] = useState("12:00")
  const [newScheduleAction, setNewScheduleAction] = useState<"on" | "off">("on")
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }
  }, [router])

  const addSchedule = () => {
    if (newScheduleName.trim()) {
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        name: newScheduleName,
        time: newScheduleTime,
        action: newScheduleAction,
        enabled: true,
      }
      setSchedules([...schedules, newSchedule])
      setNewScheduleName("")
      setNewScheduleTime("12:00")
    }
  }

  const deleteSchedule = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id))
  }

  const toggleSchedule = (id: string) => {
    setSchedules(schedules.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Schedule Management
            </h1>
            <p className="text-muted-foreground mt-2">ตั้งเวลาการเปิด/ปิดไฟอัตโนมัติและแจ้งเตือนผ่านอีเมล</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sunrise className="h-5 w-5 text-orange-500" />
                  Morning Schedule
                </CardTitle>
                <CardDescription>เวลาเช้าให้ปิดไฟ (06:00 - 12:00)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">เปิดไฟตอนเช้า</span>
                    </div>
                    <Switch checked={schedules[0]?.enabled} onCheckedChange={() => toggleSchedule("1")} />
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{schedules[0]?.time}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Action: Turn {schedules[0]?.action?.toUpperCase()}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <Bell className="h-4 w-4 inline mr-2 text-blue-600" />
                  <span className="text-blue-700">จะส่งอีเมลแจ้งเตือนเมื่อถึงเวลา</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sunset className="h-5 w-5 text-purple-500" />
                  Evening Schedule
                </CardTitle>
                <CardDescription>เวลาเย็นให้เปิดไฟ (18:00 - 23:59)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">ปิดไฟตอนเย็น</span>
                    </div>
                    <Switch checked={schedules[1]?.enabled} onCheckedChange={() => toggleSchedule("2")} />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{schedules[1]?.time}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Action: Turn {schedules[1]?.action?.toUpperCase()}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <Bell className="h-4 w-4 inline mr-2 text-blue-600" />
                  <span className="text-blue-700">จะส่งอีเมลแจ้งเตือนเมื่อถึงเวลา</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Add New Schedule
              </CardTitle>
              <CardDescription>สร้างตารางเวลาใหม่</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-name">ชื่อตารางเวลา</Label>
                  <Input
                    id="schedule-name"
                    placeholder="เช่น: เปิดไฟเที่ยง"
                    value={newScheduleName}
                    onChange={(e) => setNewScheduleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">เวลา</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={newScheduleTime}
                    onChange={(e) => setNewScheduleTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-action">การกระทำ</Label>
                  <select
                    id="schedule-action"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newScheduleAction}
                    onChange={(e) => setNewScheduleAction(e.target.value as "on" | "off")}
                  >
                    <option value="on">เปิดไฟ (ON)</option>
                    <option value="off">ปิดไฟ (OFF)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={addSchedule} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่ม
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                All Schedules
              </CardTitle>
              <CardDescription>ตารางเวลาทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{schedule.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.time} - Turn {schedule.action.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={schedule.enabled} onCheckedChange={() => toggleSchedule(schedule.id)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
