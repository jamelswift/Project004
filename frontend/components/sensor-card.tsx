"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Thermometer, Droplets, Activity } from "lucide-react"

interface SensorCardProps {
  title: string
  value: number | string
  unit: string
  icon: "temperature" | "humidity" | "activity"
  trend?: "up" | "down" | "stable"
}

export function SensorCard({ title, value, unit, icon, trend }: SensorCardProps) {
  const icons = {
    temperature: Thermometer,
    humidity: Droplets,
    activity: Activity,
  }

  const Icon = icons[icon]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {typeof value === "number" ? value.toFixed(1) : value}
          <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend === "up" && "↗ เพิ่มขึ้น"}
            {trend === "down" && "↘ ลดลง"}
            {trend === "stable" && "→ คงที่"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
