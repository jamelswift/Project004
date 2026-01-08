"use client"

import { SystemStatus } from "@/types/system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Cloud,
  Radio,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface SystemStatusPanelProps {
  status: SystemStatus
  isLoading?: boolean
}

/**
 * ส่วนสถานะระบบ - แสดงโหมดระบบ, การเชื่อมต่อ Backend, และสถานะ Real-time
 */
export function SystemStatusPanel({
  status,
  isLoading = false,
}: SystemStatusPanelProps) {
  const getModeLabel = () => {
    return status.mode === "mock" ? "ข้อมูลจำลอง" : "ข้อมูลจริง"
  }

  const getModeColor = () => {
    return status.mode === "mock" ? "bg-blue-500" : "bg-green-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          สถานะระบบ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* โหมดระบบ */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              โหมด
            </p>
            <Badge className={`${getModeColor()} text-white`}>
              {getModeLabel()}
            </Badge>
            <p className="text-xs text-gray-500">
              {status.mode === "mock"
                ? "ใช้ข้อมูลจำลองสำหรับทดสอบ"
                : "เชื่อมต่อกับฮาร์ดแวร์จริง"}
            </p>
          </div>

          {/* การเชื่อมต่อ Backend */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Backend
            </p>
            <div className="flex items-center gap-2">
              {status.backendConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge variant="outline" className="bg-green-50">
                    เชื่อมต่อแล้ว
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Badge variant="outline" className="bg-red-50">
                    ไม่เชื่อมต่อ
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* สถานะ Real-time */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Real-time
            </p>
            <div className="flex items-center gap-2">
              <Radio className={`h-5 w-5 ${status.realtimeEnabled ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
              <Badge
                variant="outline"
                className={status.realtimeEnabled ? "bg-green-50" : "bg-gray-50"}
              >
                {status.realtimeEnabled ? "ใช้งาน" : "ปิดใช้งาน"}
              </Badge>
            </div>
          </div>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              อัปเดตครั้งล่าสุด:
            </span>
            <span className="font-mono text-xs">
              {new Date(status.lastUpdate).toLocaleTimeString("th-TH")}
            </span>
          </div>

          {status.errorMessage && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">
                {status.errorMessage}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
