"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, Wind } from "lucide-react"
import type { WeatherData } from "@/types"

const API_URL = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") : "http://localhost:5000"

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // อัพเดททุก 10 นาที
    return () => clearInterval(interval)
  }, [])

  const fetchWeather = async () => {
    try {
      const response = await fetch(`${API_URL}/api/weather?city=Bangkok`)
      const data = await response.json()
      setWeather(data)
    } catch (error) {
      console.error("Failed to fetch weather:", error)
    } finally {
      setLoading(false)
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

  if (!weather) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">สภาพอากาศ - {weather.city}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl">
              {weather.icon.includes("01") && <Sun className="h-12 w-12 text-yellow-500" />}
              {weather.icon.includes("02") && <Cloud className="h-12 w-12 text-gray-400" />}
              {weather.icon.includes("09") && <CloudRain className="h-12 w-12 text-blue-500" />}
              {weather.icon.includes("10") && <CloudRain className="h-12 w-12 text-blue-500" />}
              {!["01", "02", "09", "10"].some((code) => weather.icon.includes(code)) && (
                <Wind className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div>
              <div className="text-3xl font-bold">{weather.temperature}°C</div>
              <div className="text-sm text-muted-foreground capitalize">{weather.description}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">ความชื้น</div>
            <div className="text-2xl font-semibold">{weather.humidity}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
