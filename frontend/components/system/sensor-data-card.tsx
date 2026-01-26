"use client"

import { Sensor } from "@/types/system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Thermometer,
  Sun,
  Droplets,
  AlertCircle,
} from "lucide-react"

interface SensorCardProps {
  sensor: Sensor
  isMockData?: boolean
}

/**
 * ส่วนแสดงข้อมูลเซ็นเซอร์รายตัว
 */
export function SensorDataCard({
  sensor,
  isMockData = true,
}: SensorCardProps) {
  const getIcon = () => {
    switch (sensor.type) {
      case "temperature_humidity":
        return <Thermometer className="h-6 w-6 text-orange-500" />
      case "light":
        return <Sun className="h-6 w-6 text-yellow-500" />
      case "soil_moisture":
        return <Droplets className="h-6 w-6 text-blue-500" />
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />
    }
  }

  const renderSensorData = () => {
    switch (sensor.type) {
      case "temperature_humidity": {
        const s = sensor as any
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                อุณหภูมิ
              </p>
              <p className="text-2xl font-bold mt-1">
                {s.temperature.toFixed(1)}
                <span className="text-lg ml-1">°C</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ความชื้นอากาศ
              </p>
              <p className="text-2xl font-bold mt-1">
                {s.humidity.toFixed(0)}
                <span className="text-lg ml-1">%</span>
              </p>
            </div>
          </div>
        )
      }
      case "light": {
        const s = sensor as any
        return (
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              ความเข้มแสง
            </p>
            <p className="text-2xl font-bold mt-1">
              {s.illuminance.toFixed(0)}
              <span className="text-lg ml-1">lux</span>
            </p>
          </div>
        )
      }
      case "soil_moisture": {
        const s = sensor as any
        const moistureValue = s.moisture ?? s.value ?? 0
        return (
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              ความชื้นในดิน
            </p>
            <p className="text-2xl font-bold mt-1">
              {moistureValue.toFixed(0)}
              <span className="text-lg ml-1">%</span>
            </p>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{sensor.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={sensor.isActive ? "bg-green-50" : "bg-red-50"}
              >
                {sensor.isActive ? "✓ ใช้งาน" : "✗ ไม่ใช้งาน"}
              </Badge>
              {isMockData && (
                <Badge variant="secondary">ข้อมูลจำลอง</Badge>
              )}
            </div>
          </div>
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* ข้อมูลเซ็นเซอร์ */}
        <div>{renderSensorData()}</div>

        {/* เวลาอัปเดต */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            อัปเดต:{" "}
            <span className="font-mono">
              {new Date(sensor.timestamp).toLocaleTimeString("th-TH")}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface SensorGridProps {
  sensors: Sensor[]
  isMockData?: boolean
}

/**
 * ตารางแสดงเซ็นเซอร์ทั้งหมด
 */
export function SensorDataGrid({
  sensors,
  isMockData = true,
}: SensorGridProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">ข้อมูลเซ็นเซอร์</h2>
        {isMockData && (
          <Badge className="bg-blue-500">ข้อมูลจำลอง</Badge>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((sensor) => (
          <SensorDataCard
            key={sensor.sensorId || sensor.id}
            sensor={sensor}
            isMockData={isMockData}
          />
        ))}
      </div>
    </div>
  )
}
