"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Lightbulb } from "lucide-react"
import type { DeviceStatus } from "@/types"

const API_URL = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") : "http://localhost:5000"

export function DeviceControl() {
  const [devices, setDevices] = useState<DeviceStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevices()
  }, [])

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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ควบคุมอุปกรณ์</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices
          .filter((d) => d.type === "light")
          .map((device) => (
            <div key={device.deviceId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Lightbulb className={`h-5 w-5 ${device.status === "on" ? "text-yellow-500" : "text-gray-400"}`} />
                <div>
                  <Label htmlFor={device.deviceId} className="text-base font-medium">
                    {device.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    อัพเดทล่าสุด: {new Date(device.lastUpdate).toLocaleTimeString("th-TH")}
                  </p>
                </div>
              </div>
              <Switch
                id={device.deviceId}
                checked={device.status === "on"}
                onCheckedChange={() => toggleDevice(device.deviceId, device.status)}
              />
            </div>
          ))}
      </CardContent>
    </Card>
  )
}
