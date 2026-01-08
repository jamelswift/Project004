"use client"

import { SystemEvent } from "@/types/system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Zap,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
} from "lucide-react"

interface RealtimeEventProps {
  event: SystemEvent
}

/**
 * การ์ดเหตุการณ์เดี่ยว
 */
export function RealtimeEventCard({ event }: RealtimeEventProps) {
  const getEventIcon = () => {
    switch (event.type) {
      case "sensor_update":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case "rule_triggered":
        return <Zap className="h-4 w-4 text-purple-500" />
      case "led_changed":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case "system_error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventTypeLabel = () => {
    switch (event.type) {
      case "sensor_update":
        return "อัปเดตเซ็นเซอร์"
      case "rule_triggered":
        return "เงื่อนไขถูกสัมผัส"
      case "led_changed":
        return "เปลี่ยนสถานะ LED"
      case "system_error":
        return "ข้อผิดพลาดระบบ"
      default:
        return "เหตุการณ์"
    }
  }

  const getEventTypeBadgeColor = () => {
    switch (event.type) {
      case "sensor_update":
        return "bg-blue-100 text-blue-800"
      case "rule_triggered":
        return "bg-purple-100 text-purple-800"
      case "led_changed":
        return "bg-yellow-100 text-yellow-800"
      case "system_error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        {getEventIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge className={getEventTypeBadgeColor()}>
            {getEventTypeLabel()}
          </Badge>
          <span className="text-xs text-gray-500">
            {new Date(event.timestamp).toLocaleTimeString("th-TH")}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {event.description}
        </p>
      </div>
    </div>
  )
}

interface RealtimeEventListProps {
  events: SystemEvent[]
  maxItems?: number
}

/**
 * ส่วนแสดงสถานะเรียลไทม์
 */
export function RealtimeEventList({
  events,
  maxItems = 10,
}: RealtimeEventListProps) {
  // เรียงลำดับจากใหม่ไปเก่า
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const displayEvents = sortedEvents.slice(0, maxItems)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          สถานะเรียลไทม์
          <Badge variant="secondary" className="ml-auto">
            {events.length} เหตุการณ์
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayEvents.length > 0 ? (
          <div className="space-y-2">
            {displayEvents.map((event) => (
              <RealtimeEventCard key={event.id} event={event} />
            ))}

            {events.length > maxItems && (
              <div className="text-center text-xs text-gray-500 pt-2 border-t">
                แสดง {maxItems} เหตุการณ์ล่าสุด จากทั้งหมด {events.length}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>ไม่มีเหตุการณ์ล่าสุด</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
