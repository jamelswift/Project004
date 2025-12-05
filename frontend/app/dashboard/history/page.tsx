"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SensorData } from "@/types"

export default function HistoryPage() {
  const [history, setHistory] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }

    fetchHistory()
  }, [router])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sensors`)
      const data = await response.json()
      setHistory(data.reverse()) // แสดงล่าสุดก่อน
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ประวัติข้อมูลเซ็นเซอร์</h1>
            <p className="text-muted-foreground">ข้อมูลที่บันทึกจากเซ็นเซอร์ทั้งหมด</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>รายการข้อมูลเซ็นเซอร์</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">ยังไม่มีข้อมูลในระบบ</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>วันที่/เวลา</TableHead>
                        <TableHead>อุปกรณ์</TableHead>
                        <TableHead className="text-right">อุณหภูมิ (°C)</TableHead>
                        <TableHead className="text-right">ความชื้น (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.slice(0, 100).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.timestamp).toLocaleString("th-TH")}</TableCell>
                          <TableCell>{item.deviceId}</TableCell>
                          <TableCell className="text-right font-mono">{item.temperature.toFixed(1)}</TableCell>
                          <TableCell className="text-right font-mono">{item.humidity?.toFixed(1) || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
