"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

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
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Cpu,
} from "lucide-react"

import { SensorSimulator, ActuatorSimulator, analyzePlantCondition } from "@/lib/simulator"
import type { SimulatorData, ActuatorState, PlantCondition } from "@/types"

/* ============================= */
/* Sensor Metric Card            */
/* ============================= */
function SensorMetricCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
  color: string
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2 pb-6">
        <div className={`text-4xl font-semibold ${color}`}>
          {value}
          <span className="text-base ml-1">{unit}</span>
        </div>
      </CardContent>
    </Card>
  )
}

/* ============================= */
/* Main Page                     */
/* ============================= */
export default function SimulatorPage() {
  const router = useRouter()

  const [sensorData, setSensorData] = useState<SimulatorData>({
    temperature: 28,
    humidity: 65,
    light: 5000,
    rain: 0,
    pm25: 35,
    timestamp: new Date().toISOString(),
  })

  const [manual, setManual] = useState({
    temperature: "28",
    humidity: "65",
    light: "5000",
    rain: "0",
    pm25: "35",
  })

  const [isRunning, setIsRunning] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)

  const [actuatorState, setActuatorState] = useState<ActuatorState>({
    led: "off",
    relay: "off",
    fan: 0,
    sprinkler: "off",
  })

  const [plantCondition, setPlantCondition] = useState<PlantCondition | null>(null)

  const [simulator] = useState(() => new SensorSimulator())
  const [actuatorSim] = useState(() => new ActuatorSimulator())

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) router.push("/")
    return () => simulator.stop()
  }, [router, simulator])

  /* ============================= */
  /* Control Functions             */
  /* ============================= */
  const startSimulation = () => {
    setIsRunning(true)
    setIsManualMode(false)

    simulator.start((data) => {
      setSensorData(data)
      setPlantCondition(analyzePlantCondition(data))
      setActuatorState(actuatorSim.autoControl(data))
    })
  }

  const stopSimulation = () => {
    setIsRunning(false)
    simulator.stop()
  }

  const applyManualValues = () => {
    const data: SimulatorData = {
      temperature: Number(manual.temperature),
      humidity: Number(manual.humidity),
      light: Number(manual.light),
      rain: Number(manual.rain),
      pm25: Number(manual.pm25),
      timestamp: new Date().toISOString(),
    }

    setSensorData(data)
    setPlantCondition(analyzePlantCondition(data))
    setActuatorState(actuatorSim.autoControl(data))
    setIsManualMode(true)
  }

  const resetSimulation = () => {
    stopSimulation()
    setPlantCondition(null)
    setIsManualMode(false)
  }

  /* ============================= */
  /* Render                        */
  /* ============================= */
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="max-w-[1400px] mx-auto px-8 py-12 space-y-12">

        {/* ===== Header ===== */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Virtual Sensor Simulator
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Simulation environment for testing IoT sensors and automated control logic
            </p>
          </div>
          <Badge variant="outline" className="border-blue-400 text-blue-600">
            🧪 Simulation Mode
          </Badge>
        </div>

        {/* ===== Simulation Control ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              Simulation Control
            </CardTitle>
            <CardDescription>
              ควบคุมการเริ่ม หยุด และรีเซ็ตการจำลองระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            {!isRunning ? (
              <Button onClick={startSimulation} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopSimulation} size="lg">
                <Pause className="h-4 w-4 mr-2" />
                Stop Simulation
              </Button>
            )}
            <Button variant="outline" onClick={resetSimulation} size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </CardContent>
        </Card>

        {/* ===== Manual Input ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-green-600" />
              Manual Sensor Input
            </CardTitle>
            <CardDescription>
              ป้อนค่าเซ็นเซอร์ด้วยตนเองเพื่อทดสอบสถานการณ์
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-5 gap-6">
            {[
              { key: "temperature", label: "Temperature (°C)" },
              { key: "humidity", label: "Humidity (%)" },
              { key: "light", label: "Light (Lux)" },
              { key: "rain", label: "Rain (mm/hr)" },
              { key: "pm25", label: "PM2.5 (µg/m³)" },
            ].map((item) => (
              <div key={item.key} className="space-y-1">
                <Label>{item.label}</Label>
                <Input
                  type="number"
                  value={(manual as any)[item.key]}
                  onChange={(e) =>
                    setManual({ ...manual, [item.key]: e.target.value })
                  }
                  disabled={isRunning}
                />
              </div>
            ))}
            <div className="md:col-span-5">
              <Button onClick={applyManualValues} disabled={isRunning}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply Manual Values
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===== Sensor Data ===== */}
        <section>
          <h2 className="text-3xl font-semibold mb-2 flex items-center gap-3">
            <Thermometer className="h-7 w-7 text-red-500" />
            Sensor Data
            {isManualMode && <Badge className="bg-green-600">Manual</Badge>}
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Last update: {new Date(sensorData.timestamp).toLocaleString()}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <SensorMetricCard icon={<Thermometer className="h-4 w-4 text-red-500" />} label="Temperature" value={sensorData.temperature.toFixed(1)} unit="°C" color="text-red-600" />
            <SensorMetricCard icon={<Droplets className="h-4 w-4 text-blue-500" />} label="Humidity" value={sensorData.humidity.toFixed(1)} unit="%" color="text-blue-600" />
            <SensorMetricCard icon={<Sun className="h-4 w-4 text-yellow-500" />} label="Light" value={sensorData.light.toFixed(0)} unit="Lux" color="text-yellow-600" />
            <SensorMetricCard icon={<CloudRain className="h-4 w-4 text-cyan-500" />} label="Rain" value={sensorData.rain.toFixed(1)} unit="mm/hr" color="text-cyan-600" />
            <SensorMetricCard icon={<Wind className="h-4 w-4 text-gray-500" />} label="PM2.5" value={sensorData.pm25.toFixed(0)} unit="µg/m³" color="text-gray-600" />
          </div>
        </section>

        {/* ===== Actuator Status ===== */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Power className="h-6 w-6 text-blue-600" />
            Actuator Status
            <Badge variant="secondary">Auto Control</Badge>
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "LED", value: actuatorState.led, icon: <Lightbulb className="h-4 w-4" /> },
              { label: "Relay", value: actuatorState.relay, icon: <Power className="h-4 w-4" /> },
              { label: "Fan", value: `${actuatorState.fan}%`, icon: <Fan className="h-4 w-4" /> },
              { label: "Sprinkler", value: actuatorState.sprinkler, icon: <Droplets className="h-4 w-4" /> },
            ].map((act) => (
              <Card key={act.label} className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {act.icon}
                    {act.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge>{act.value}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ===== Plant Condition Analysis ===== */}
        {plantCondition && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-600" />
                Plant Condition Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                Status: <strong>{plantCondition.status}</strong>
              </div>
              {plantCondition.alerts.length > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {plantCondition.alerts.join(", ")}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===== Simulator Overview ===== */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              เกี่ยวกับ Simulator
            </CardTitle>
            <CardDescription>
              ภาพรวมโครงสร้างและแนวคิดการทำงานของระบบจำลอง
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Thermometer className="h-5 w-5 text-red-500 mt-0.5" />
              <span>
                <strong>Sensor Engine:</strong> จำลองข้อมูลจากเซ็นเซอร์ทั้งหมด (อุณหภูมิ ความชื้น แสง ฝน PM2.5)
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Sliders className="h-5 w-5 text-green-600 mt-0.5" />
              <span>
                <strong>Manual Mode:</strong> ป้อนค่าเซ็นเซอร์ด้วยตนเองเพื่อทดสอบสถานการณ์
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Power className="h-5 w-5 text-blue-600 mt-0.5" />
              <span>
                <strong>Actuator Engine:</strong> ควบคุมอุปกรณ์อัตโนมัติ (LED, Relay, Fan, Sprinkler)
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Sprout className="h-5 w-5 text-green-700 mt-0.5" />
              <span>
                <strong>Plant Analysis:</strong> วิเคราะห์สภาพสวน/ต้นไม้และให้คำแนะนำการดูแล
              </span>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
