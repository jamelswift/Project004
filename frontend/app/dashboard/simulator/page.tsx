"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { SensorSimulator, ActuatorSimulator, analyzePlantCondition } from "@/lib/simulator"
import type { SimulatorData, ActuatorState, PlantCondition } from "@/types"
import {
  Thermometer,
  Droplets,
  Sun,
  CloudRain,
  Wind,
  Lightbulb,
  Power,
  Fan,
  Sprout,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"

export default function SimulatorPage() {
  const [sensorData, setSensorData] = useState<SimulatorData>({
    temperature: 28,
    humidity: 65,
    light: 5000,
    rain: 0,
    pm25: 35,
    timestamp: new Date().toISOString(),
  })
  const [manualTemp, setManualTemp] = useState("28")
  const [manualHumidity, setManualHumidity] = useState("65")
  const [manualLight, setManualLight] = useState("5000")
  const [manualRain, setManualRain] = useState("0")
  const [manualPM25, setManualPM25] = useState("35")
  const [isManualMode, setIsManualMode] = useState(false)

  const [actuatorState, setActuatorState] = useState<ActuatorState>({
    led: "off",
    relay: "off",
    fan: 0,
    sprinkler: "off",
  })
  const [plantCondition, setPlantCondition] = useState<PlantCondition | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [simulator] = useState(() => new SensorSimulator())
  const [actuatorSim] = useState(() => new ActuatorSimulator())
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }

    return () => {
      simulator.stop()
    }
  }, [router, simulator])

  const startSimulation = () => {
    setIsRunning(true)
    setIsManualMode(false)
    simulator.start((data) => {
      setSensorData(data)
      const plant = analyzePlantCondition(data)
      setPlantCondition(plant)

      const newState = actuatorSim.autoControl(data)
      setActuatorState(newState)
    })
  }

  const stopSimulation = () => {
    setIsRunning(false)
    simulator.stop()
  }

  const applyManualValues = () => {
    const newData: SimulatorData = {
      temperature: Number.parseFloat(manualTemp) || 28,
      humidity: Number.parseFloat(manualHumidity) || 65,
      light: Number.parseFloat(manualLight) || 5000,
      rain: Number.parseFloat(manualRain) || 0,
      pm25: Number.parseFloat(manualPM25) || 35,
      timestamp: new Date().toISOString(),
    }
    setSensorData(newData)
    const plant = analyzePlantCondition(newData)
    setPlantCondition(plant)
    const newState = actuatorSim.autoControl(newData)
    setActuatorState(newState)
    setIsManualMode(true)
  }

  const resetSimulation = () => {
    stopSimulation()
    setSensorData({
      temperature: 28,
      humidity: 65,
      light: 5000,
      rain: 0,
      pm25: 35,
      timestamp: new Date().toISOString(),
    })
    setManualTemp("28")
    setManualHumidity("65")
    setManualLight("5000")
    setManualRain("0")
    setManualPM25("35")
    setActuatorState({
      led: "off",
      relay: "off",
      fan: 0,
      sprinkler: "off",
    })
    setPlantCondition(null)
    setIsManualMode(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500"
      case "good":
        return "bg-blue-500"
      case "warning":
        return "bg-yellow-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle2 className="h-5 w-5" />
      case "good":
        return <TrendingUp className="h-5 w-5" />
      case "warning":
      case "critical":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Virtual Sensor Simulator
              </h1>
              <p className="text-muted-foreground mt-2">จำลองข้อมูลเซ็นเซอร์และทดสอบระบบควบคุมอัตโนมัติ</p>
            </div>
            <div className="flex gap-2">
              {!isRunning && !isManualMode ? (
                <Button onClick={startSimulation} size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600">
                  <Play className="h-5 w-5 mr-2" />
                  เริ่มจำลอง
                </Button>
              ) : (
                <Button onClick={stopSimulation} size="lg" variant="destructive">
                  <Pause className="h-5 w-5 mr-2" />
                  หยุดจำลอง
                </Button>
              )}
              <Button onClick={resetSimulation} size="lg" variant="outline">
                <RefreshCw className="h-5 w-5 mr-2" />
                รีเซ็ต
              </Button>
            </div>
          </div>

          {/* Manual Input Section */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle>ใส่ค่าเซ็นเซอร์ด้วยตัวเอง (Manual Input)</CardTitle>
              <CardDescription>ป้อนค่าที่ต้องการทดสอบเองได้</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="manual-temp">อุณหภูมิ (°C)</Label>
                  <Input
                    id="manual-temp"
                    type="number"
                    value={manualTemp}
                    onChange={(e) => setManualTemp(e.target.value)}
                    placeholder="28"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-humidity">ความชื้น (%)</Label>
                  <Input
                    id="manual-humidity"
                    type="number"
                    value={manualHumidity}
                    onChange={(e) => setManualHumidity(e.target.value)}
                    placeholder="65"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-light">ความเข้มแสง (Lux)</Label>
                  <Input
                    id="manual-light"
                    type="number"
                    value={manualLight}
                    onChange={(e) => setManualLight(e.target.value)}
                    placeholder="5000"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-rain">ปริมาณฝน (mm/hr)</Label>
                  <Input
                    id="manual-rain"
                    type="number"
                    value={manualRain}
                    onChange={(e) => setManualRain(e.target.value)}
                    placeholder="0"
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-pm25">PM2.5 (µg/m³)</Label>
                  <Input
                    id="manual-pm25"
                    type="number"
                    value={manualPM25}
                    onChange={(e) => setManualPM25(e.target.value)}
                    placeholder="35"
                    disabled={isRunning}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={applyManualValues} disabled={isRunning} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  ใช้ค่าที่ป้อน
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sensor Data Cards */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sun className="h-6 w-6 text-blue-600" />
              ข้อมูลเซ็นเซอร์ (Sensor Data)
              {isManualMode && <Badge className="bg-green-600">Manual Mode</Badge>}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    อุณหภูมิ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{sensorData.temperature.toFixed(1)}°C</div>
                  <p className="text-xs text-muted-foreground mt-1">Temperature</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    ความชื้น
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{sensorData.humidity.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Humidity</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    ความเข้มแสง
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{sensorData.light.toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Lux</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CloudRain className="h-4 w-4 text-cyan-500" />
                    ปริมาณฝน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-600">{sensorData.rain.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">mm/hr</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wind className="h-4 w-4 text-gray-500" />
                    PM2.5
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-600">{sensorData.pm25?.toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">µg/m³</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actuator Control */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Power className="h-6 w-6 text-blue-600" />
              สถานะอุปกรณ์ควบคุม (Actuator Status)
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <Card className={`border-2 ${actuatorState.led === "on" ? "border-yellow-500" : "border-gray-300"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb
                      className={`h-5 w-5 ${actuatorState.led === "on" ? "text-yellow-500" : "text-gray-400"}`}
                    />
                    LED Light
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={actuatorState.led === "on" ? "default" : "secondary"} className="text-lg px-4 py-1">
                    {actuatorState.led === "on" ? "ON" : "OFF"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className={`border-2 ${actuatorState.relay === "on" ? "border-blue-500" : "border-gray-300"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Power className={`h-5 w-5 ${actuatorState.relay === "on" ? "text-blue-500" : "text-gray-400"}`} />
                    Relay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={actuatorState.relay === "on" ? "default" : "secondary"} className="text-lg px-4 py-1">
                    {actuatorState.relay === "on" ? "ON" : "OFF"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className={`border-2 ${actuatorState.fan > 0 ? "border-cyan-500" : "border-gray-300"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Fan
                      className={`h-5 w-5 ${actuatorState.fan > 0 ? "text-cyan-500 animate-spin" : "text-gray-400"}`}
                    />
                    Fan Speed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600">{actuatorState.fan}%</div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${actuatorState.sprinkler === "on" ? "border-blue-500" : "border-gray-300"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplets
                      className={`h-5 w-5 ${actuatorState.sprinkler === "on" ? "text-blue-500" : "text-gray-400"}`}
                    />
                    Sprinkler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={actuatorState.sprinkler === "on" ? "default" : "secondary"}
                    className="text-lg px-4 py-1"
                  >
                    {actuatorState.sprinkler === "on" ? "ON" : "OFF"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plant Condition Analysis */}
          {plantCondition && (
            <Card className="border-2 border-blue-300 dark:border-blue-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${getStatusColor(plantCondition.status)} text-white`}>
                      <Sprout className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">การวิเคราะห์สภาพสวน/ต้นไม้</CardTitle>
                      <CardDescription>Plant Condition Analysis</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(plantCondition.status)}
                    <Badge
                      className={`text-lg px-4 py-1 ${getStatusColor(plantCondition.status)} text-white`}
                      variant="secondary"
                    >
                      {plantCondition.status === "excellent"
                        ? "ดีเยี่ยม"
                        : plantCondition.status === "good"
                          ? "ดี"
                          : plantCondition.status === "warning"
                            ? "ต้องระวัง"
                            : "วิกฤต"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">อุณหภูมิ</span>
                    </div>
                    <div className="text-xl font-bold text-red-600">
                      {plantCondition.temperature.current.toFixed(1)}°C
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      เหมาะสม: {plantCondition.temperature.min}-{plantCondition.temperature.max}°C
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">ความชื้น</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600">{plantCondition.humidity.current.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      เหมาะสม: {plantCondition.humidity.min}-{plantCondition.humidity.max}%
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">แสง</span>
                    </div>
                    <div className="text-xl font-bold text-yellow-600">
                      {plantCondition.light.current.toFixed(0)} Lux
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      เหมาะสม: {plantCondition.light.min}-{plantCondition.light.max} Lux
                    </div>
                  </div>
                </div>

                {plantCondition.alerts.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="font-bold text-red-600">การแจ้งเตือน</h3>
                    </div>
                    <ul className="space-y-1">
                      {plantCondition.alerts.map((alert, index) => (
                        <li key={index} className="text-sm text-red-700 dark:text-red-400">
                          • {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-bold text-green-600">คำแนะนำการดูแล</h3>
                  </div>
                  <ul className="space-y-1">
                    {plantCondition.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-green-700 dark:text-green-400">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CloudRain className="h-5 w-5 text-cyan-600" />
                      <span className="font-medium">สถานะฝน:</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyan-600">{plantCondition.rain.status}</div>
                      {plantCondition.rain.amount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {plantCondition.rain.amount.toFixed(1)} mm/hr
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Simulator Info */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle>เกี่ยวกับ Simulator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                • <strong>Sensor Engine:</strong> จำลองข้อมูลจากเซ็นเซอร์ทั้งหมด (อุณหภูมิ, ความชื้น, แสง, ฝน, PM2.5)
              </p>
              <p>
                • <strong>Manual Mode:</strong> สามารถใส่ค่าเซ็นเซอร์ด้วยตัวเองเพื่อทดสอบระบบ
              </p>
              <p>
                • <strong>Actuator Engine:</strong> ควบคุมอุปกรณ์อัตโนมัติ (LED, Relay, Fan, Sprinkler)
              </p>
              <p>
                • <strong>Plant Analysis:</strong> วิเคราะห์สภาพสวน/ต้นไม้และให้คำแนะนำการดูแล
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
