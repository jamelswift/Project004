"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

import {
  Power,
  AlertCircle,
  CheckCircle2,
  Zap,
  Wifi,
  Thermometer,
} from "lucide-react"

import TemperatureChart from "@/components/charts/TemperatureChart"

/* ===================== Types ===================== */

interface RelayState {
  relay1: "on" | "off"
  relay2: "on" | "off"
  lastUpdate: string
}

interface TempPoint {
  timestamp: string
  value: number
}

/* ===================== Page ===================== */

export default function ControlPage() {
  const router = useRouter()
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  /* ---------- State ---------- */
  const [relayState, setRelayState] = useState<RelayState>({
    relay1: "off",
    relay2: "off",
    lastUpdate: new Date().toISOString(),
  })

  const [tempData, setTempData] = useState<TempPoint[]>([])
  const [threshold, setThreshold] = useState({
    onAbove: 30,
    offBelow: 28,
  })

  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState("")

  /* ===================== Auth ===================== */
  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }
  }, [router])

  /* ===================== Relay ===================== */
  const fetchRelayState = async () => {
    try {
      const res = await fetch(`${API_URL}/api/relay/state`)
      if (!res.ok) throw new Error("Relay offline")

      const data = await res.json()
      setRelayState(data)
      setConnected(true)
      setError("")
    } catch (err) {
      setConnected(false)
      setError("ไม่สามารถเชื่อมต่อ Relay ได้")
    }
  }

  const updateRelay = async (
    relay: "relay1" | "relay2",
    value: "on" | "off"
  ) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/relay/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [relay]: value }),
      })

      if (!res.ok) throw new Error("Update failed")

      const json = await res.json()
      setRelayState(json.state)
    } catch (err) {
      setError("ไม่สามารถสั่งงาน Relay ได้")
    } finally {
      setLoading(false)
    }
  }

  const toggleRelay = (relay: "relay1" | "relay2") => {
    const next = relayState[relay] === "on" ? "off" : "on"
    updateRelay(relay, next)
  }

  /* ===================== Graph ===================== */
  const fetchTemperatureGraph = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/graph/temperature`
      )
      if (!res.ok) return

      const json = await res.json()
      setTempData(json.data)
      setThreshold(json.threshold)
    } catch (err) {
      console.error("Graph error:", err)
    }
  }

  /* ===================== Polling ===================== */
  useEffect(() => {
    fetchRelayState()
    fetchTemperatureGraph()

    const relayInterval = setInterval(fetchRelayState, 2000)
    const graphInterval = setInterval(fetchTemperatureGraph, 3000)

    return () => {
      clearInterval(relayInterval)
      clearInterval(graphInterval)
    }
  }, [])

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100">
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* ================= Header ================= */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              แดชบอร์ดควบคุม
            </h1>
            <p className="text-muted-foreground mt-1">
              ระบบควบคุมด้วยตนเองและอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center gap-3">
            {connected ? (
              <>
                <Wifi className="h-5 w-5 text-green-600 animate-pulse" />
                <Badge className="bg-green-600">
                  เชื่อมต่อแล้ว
                </Badge>
              </>
            ) : (
              <>
                <Wifi className="h-5 w-5 text-red-600" />
                <Badge variant="destructive">
                  ไม่ได้เชื่อมต่อ
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* ================= Error ================= */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600" />
            <span className="text-red-700 text-sm">
              {error}
            </span>
          </div>
        )}

        {/* ================= Relay ================= */}
        <div className="grid md:grid-cols-2 gap-6">
          {(["relay1", "relay2"] as const).map((relay, i) => {
            const isOn = relayState[relay] === "on"
            return (
              <Card
                key={relay}
                className={`border-2 ${
                  isOn
                    ? "border-green-500 bg-green-50"
                    : "border-red-400 bg-white"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Power
                      className={
                        isOn
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    />
                    Relay {i + 1}
                  </CardTitle>
                  <CardDescription>
                    GPIO {i === 0 ? 26 : 27}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <Badge
                      className={`text-lg px-6 py-2 ${
                        isOn
                          ? "bg-green-600"
                          : "bg-red-500"
                      }`}
                    >
                      {relayState[relay].toUpperCase()}
                    </Badge>
                  </div>

                  <Button
                    onClick={() => toggleRelay(relay)}
                    disabled={loading || !connected}
                    className={`w-full ${
                      isOn
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isOn ? "ปิด" : "เปิด"}
                  </Button>

                  <div className="flex justify-between items-center p-3 border rounded">
                    <Label>สลับเปิด-ปิด</Label>
                    <Switch
                      checked={isOn}
                      onCheckedChange={() =>
                        toggleRelay(relay)
                      }
                      disabled={loading || !connected}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ================= Temperature Graph ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="text-blue-600" />
              ตรวจสอบอุณหภูมิ
            </CardTitle>
            <CardDescription>
              ข้อมูลเซ็นเซอร์จำลองแบบเรียลไทม์พร้อมกฎอัตโนมัติ
            </CardDescription>
          </CardHeader>

          <CardContent>
            <TemperatureChart
              data={tempData}
              threshold={threshold}
            />
          </CardContent>
        </Card>

        {/* ================= Info ================= */}
        <Card>
          <CardHeader>
            <CardTitle>กระบวนการทำงานของระบบ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <CheckCircle2 className="text-green-600" />
              ผู้ใช้สั่งงาน Relay ผ่านหน้าเว็บ
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="text-green-600" />
              Backend จัดการสถานะ Manual / Auto
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="text-green-600" />
              ระบบแสดงข้อมูลอุณหภูมิในรูปแบบกราฟ
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="text-green-600" />
              รองรับ ESP32 และ Sensor จริงในอนาคต
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
