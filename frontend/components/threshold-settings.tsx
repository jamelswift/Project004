"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  getThresholdsByDevice, 
  createThreshold, 
  updateThreshold, 
  deleteThreshold 
} from "@/lib/notifications"
import type { SensorThreshold } from "@/types"
import { Trash2, Plus, Save, Clock } from "lucide-react"

interface ThresholdSettingsProps {
  deviceId: string
}

export default function ThresholdSettings({ deviceId }: ThresholdSettingsProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const [thresholds, setThresholds] = useState<SensorThreshold[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [devices, setDevices] = useState<any[]>([])

  // Form state สำหรับ threshold ใหม่
  const [newThreshold, setNewThreshold] = useState({
    sensorType: "temperature" as const,
    minValue: undefined as number | undefined,
    maxValue: undefined as number | undefined,
    lightOnTime: "06:00" as string,
    lightOffTime: "18:00" as string,
    enabled: true,
    notifyEmail: false,
    notifyBrowser: true,
  })

  useEffect(() => {
    loadDevices()
    loadThresholds()
  }, [deviceId])

  // เมื่อ deviceId เปลี่ยน ให้ auto-detect ประเภท sensor
  const selectedDevice = devices.find(d => d.deviceId === deviceId)
  useEffect(() => {
    if (selectedDevice) {
      // ถ้า device เป็น LIGHT ให้ตั้ง sensorType เป็น "light"
      if (selectedDevice.type?.toLowerCase().includes("light")) {
        setNewThreshold(prev => ({ ...prev, sensorType: "light" as const }))
      } else {
        setNewThreshold(prev => ({ ...prev, sensorType: "temperature" as const }))
      }
    }
  }, [selectedDevice])

  const loadDevices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/devices`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setDevices(data)
      }
    } catch (error) {
      console.error("Error loading devices:", error)
    }
  }

  const loadThresholds = async () => {
    setLoading(true)
    const data = await getThresholdsByDevice(deviceId)
    setThresholds(data)
    setLoading(false)
  }

  const isLightSensor = newThreshold.sensorType === "light"

  const handleCreate = async () => {
    if (isLightSensor) {
      // สำหรับหลอดไฟ ไม่ต้องตรวจ min/max
      if (!newThreshold.lightOnTime || !newThreshold.lightOffTime) {
        alert("กรุณาระบุเวลาเปิดและปิดไฟ")
        return
      }
    } else {
      // สำหรับเซ็นเซอร์อื่นๆ ต้องตรวจ min/max
      if (!newThreshold.minValue && !newThreshold.maxValue) {
        alert("กรุณาระบุค่าต่ำสุดหรือค่าสูงสุดอย่างน้อย 1 ค่า")
        return
      }
    }

    setLoading(true)
    const threshold = {
      deviceId,
      sensorType: newThreshold.sensorType,
      enabled: newThreshold.enabled,
      notifyEmail: newThreshold.notifyEmail,
      notifyBrowser: newThreshold.notifyBrowser,
      ...(isLightSensor ? {
        minValue: undefined,
        maxValue: undefined,
      } : {
        minValue: newThreshold.minValue,
        maxValue: newThreshold.maxValue,
      })
    }

    const created = await createThreshold(threshold as any)

    if (created) {
      await loadThresholds()
      // Reset form
      setNewThreshold({
        sensorType: "temperature",
        minValue: undefined,
        maxValue: undefined,
        lightOnTime: "06:00",
        lightOffTime: "18:00",
        enabled: true,
        notifyEmail: false,
        notifyBrowser: true,
      })
    }
    setLoading(false)
  }

  const handleUpdate = async (id: string, updates: Partial<SensorThreshold>) => {
    setLoading(true)
    await updateThreshold(id, updates)
    await loadThresholds()
    setEditingId(null)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบค่าขีดจำกัดนี้?")) return
    
    setLoading(true)
    await deleteThreshold(id)
    await loadThresholds()
    setLoading(false)
  }

  const sensorTypeLabels: Record<string, string> = {
    temperature: "อุณหภูมิ (°C)",
    humidity: "ความชื้น (%)",
    light: "แสง (Lux)",
    pm25: "PM2.5 (µg/m³)",
    rain: "ฝน (mm/hr)",
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ตั้งค่าขีดจำกัด (Threshold)</CardTitle>
          <CardDescription>
            กำหนดค่าขีดจำกัดสำหรับแจ้งเตือนเมื่อค่าเซ็นเซอร์เกินหรือต่ำกว่าที่กำหนด
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form สำหรับเพิ่ม Threshold ใหม่ */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <h3 className="font-semibold text-sm">เพิ่มค่าขีดจำกัดใหม่</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ประเภทเซ็นเซอร์</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={newThreshold.sensorType}
                  onChange={(e) =>
                    setNewThreshold({ ...newThreshold, sensorType: e.target.value as any })
                  }
                >
                  {Object.entries(sensorTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {isLightSensor ? (
                // สำหรับหลอดไฟ - แสดง Time picker
                <>
                  <div className="space-y-2">
                    <Label>เวลาเปิดไฟ</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <input
                        type="time"
                        value={newThreshold.lightOnTime}
                        onChange={(e) =>
                          setNewThreshold({ ...newThreshold, lightOnTime: e.target.value })
                        }
                        className="flex-1 border rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>เวลาปิดไฟ</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <input
                        type="time"
                        value={newThreshold.lightOffTime}
                        onChange={(e) =>
                          setNewThreshold({ ...newThreshold, lightOffTime: e.target.value })
                        }
                        className="flex-1 border rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </>
              ) : (
                // สำหรับเซ็นเซอร์อื่นๆ - แสดง Min/Max
                <>
                  <div className="space-y-2">
                    <Label>ค่าต่ำสุด (Min)</Label>
                    <Input
                      type="number"
                      placeholder="เช่น 15"
                      value={newThreshold.minValue ?? ""}
                      onChange={(e) =>
                        setNewThreshold({
                          ...newThreshold,
                          minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ค่าสูงสุด (Max)</Label>
                    <Input
                      type="number"
                      placeholder="เช่น 35"
                      value={newThreshold.maxValue ?? ""}
                      onChange={(e) =>
                        setNewThreshold({
                          ...newThreshold,
                          maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>แจ้งเตือนทาง Email</Label>
                  <Switch
                    checked={newThreshold.notifyEmail}
                    onCheckedChange={(checked) =>
                      setNewThreshold({ ...newThreshold, notifyEmail: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>แจ้งเตือนบน Browser</Label>
                  <Switch
                    checked={newThreshold.notifyBrowser}
                    onCheckedChange={(checked) =>
                      setNewThreshold({ ...newThreshold, notifyBrowser: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleCreate} disabled={loading} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มค่าขีดจำกัด
            </Button>
          </div>

          {/* รายการ Thresholds ที่มีอยู่ */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">ค่าขีดจำกัดที่ตั้งไว้</h3>
            
            {loading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
            
            {!loading && thresholds.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีค่าขีดจำกัด</p>
            )}

            {thresholds.map((threshold) => (
              <Card key={threshold.id} className="border-2">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={threshold.enabled ? "default" : "secondary"}>
                          {sensorTypeLabels[threshold.sensorType]}
                        </Badge>
                        {!threshold.enabled && (
                          <Badge variant="outline">ปิดใช้งาน</Badge>
                        )}
                      </div>

                      <div className="text-sm space-y-1">
                        {threshold.sensorType === "light" ? (
                          <>
                            <p>• เปิดไฟเวลา: <strong>06:00</strong></p>
                            <p>• ปิดไฟเวลา: <strong>18:00</strong></p>
                          </>
                        ) : (
                          <>
                            {threshold.minValue !== undefined && (
                              <p>• ค่าต่ำสุด: <strong>{threshold.minValue}</strong></p>
                            )}
                            {threshold.maxValue !== undefined && (
                              <p>• ค่าสูงสุด: <strong>{threshold.maxValue}</strong></p>
                            )}
                          </>
                        )}
                        
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {threshold.notifyEmail && <span>📧 Email</span>}
                          {threshold.notifyBrowser && <span>🔔 Browser</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleUpdate(threshold.id!, { enabled: !threshold.enabled })
                        }
                        disabled={loading}
                      >
                        {threshold.enabled ? "ปิด" : "เปิด"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(threshold.id!)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
