import { NextResponse } from "next/server"
import type { DeviceStatus } from "@/types"

// In-memory device status
const devices: DeviceStatus[] = [
  {
    deviceId: "LIGHT_001",
    name: "หลอดไฟห้องนั่งเล่น",
    type: "light",
    status: "off",
    lastUpdate: new Date().toISOString(),
  },
  {
    deviceId: "LIGHT_002",
    name: "หลอดไฟห้องนอน",
    type: "light",
    status: "off",
    lastUpdate: new Date().toISOString(),
  },
  {
    deviceId: "ESP32_001",
    name: "เซ็นเซอร์อุณหภูมิ",
    type: "sensor",
    status: "on",
    lastUpdate: new Date().toISOString(),
  },
]

export async function GET() {
  return NextResponse.json(devices)
}

export async function POST(request: Request) {
  try {
    const { deviceId, status } = await request.json()

    const deviceIndex = devices.findIndex((d) => d.deviceId === deviceId)
    if (deviceIndex !== -1) {
      devices[deviceIndex].status = status
      devices[deviceIndex].lastUpdate = new Date().toISOString()

      // ส่งคำสั่งไปยัง AWS IoT
      await fetch("/api/iot/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `wsn/device/${deviceId}/control`,
          command: { action: status, device: deviceId },
        }),
      })
    }

    return NextResponse.json({ success: true, devices })
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถควบคุมอุปกรณ์ได้" }, { status: 500 })
  }
}
