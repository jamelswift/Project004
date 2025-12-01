"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cloud, Droplets, Wind, Eye, Sunrise, Sunset, Gauge, Sun, Search, CloudRain } from "lucide-react"

interface WeatherData {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  visibility: number
  sys: {
    sunrise: number
    sunset: number
  }
}

interface ForecastData {
  list: Array<{
    dt: number
    main: {
      temp: number
    }
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
  }>
}

export default function WeatherPage() {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [city, setCity] = useState("Bangkok")
  const [searchCity, setSearchCity] = useState("Bangkok")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }
    fetchWeather(city)
  }, [router])

  const fetchWeather = async (cityName: string) => {
    setLoading(true)
    try {
      const API_KEY = "97d8748855b720c2dd02ca6143d2553e"
      const BASE_URL = "https://api.openweathermap.org/data/2.5"

      // Fetch current weather
      const currentRes = await fetch(`${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`)
      const currentData = await currentRes.json()

      // Fetch 5-day forecast
      const forecastRes = await fetch(`${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric`)
      const forecastData = await forecastRes.json()

      if (currentRes.ok && forecastRes.ok) {
        setCurrentWeather(currentData)
        setForecast(forecastData)
        setCity(cityName)
      }
    } catch (error) {
      console.error("Error fetching weather:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchCity.trim()) {
      fetchWeather(searchCity)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDayName = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "short",
    })
  }

  // Get daily forecast (one per day)
  const getDailyForecast = () => {
    if (!forecast) return []
    const dailyData: { [key: string]: any } = {}

    forecast.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString()
      if (!dailyData[date]) {
        dailyData[date] = item
      }
    })

    return Object.values(dailyData).slice(0, 5)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading weather data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Weather Information</h1>
              <p className="text-muted-foreground mt-2">Real-time weather data from OpenWeatherMap API</p>
            </div>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Current Weather</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter city name..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="max-w-xs"
                />
                <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentWeather && (
            <>
              {/* Current Weather */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="md:col-span-2 lg:col-span-1">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Cloud className="h-16 w-16 text-gray-600" />
                      <div>
                        <div className="text-5xl font-bold">{Math.round(currentWeather.main.temp)}°C</div>
                        <div className="text-lg font-medium capitalize">{currentWeather.weather[0].description}</div>
                        <div className="text-sm text-muted-foreground">
                          Feels like {Math.round(currentWeather.main.feels_like)}°C
                        </div>
                        <div className="font-bold mt-1">{currentWeather.name}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Humidity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{currentWeather.main.humidity}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Wind className="h-4 w-4 text-green-500" />
                      Wind Speed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{currentWeather.wind.speed.toFixed(2)} m/s</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      Visibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {(currentWeather.visibility / 1000).toFixed(1)} km
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-gray-500" />
                      Condition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold capitalize">{currentWeather.weather[0].main}</div>
                  </CardContent>
                </Card>
              </div>

              {/* 5-Day Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle>5-Day Forecast</CardTitle>
                  <CardDescription>Weather predictions for the next 5 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                    {getDailyForecast().map((day, index) => (
                      <div key={index} className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="font-bold mb-2">{getDayName(day.dt)}</div>
                        <CloudRain className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                        <div className="text-2xl font-bold">{Math.round(day.main.temp)}°C</div>
                        <div className="text-xs text-muted-foreground capitalize mt-1">
                          {day.weather[0].description}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>Detailed weather metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Sunrise className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Sunrise</span>
                      </div>
                      <span className="font-bold">{formatTime(currentWeather.sys.sunrise)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Sunset className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Sunset</span>
                      </div>
                      <span className="font-bold">{formatTime(currentWeather.sys.sunset)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Gauge className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Pressure</span>
                      </div>
                      <span className="font-bold">{currentWeather.main.pressure} hPa</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Sun className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">UV Index</span>
                      </div>
                      <span className="font-bold">Moderate</span>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-muted-foreground text-center">
                      Weather data is updated every 10 minutes from OpenWeatherMap API
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
