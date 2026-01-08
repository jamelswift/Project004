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
  Info,
  ListChecks,
} from "lucide-react"

import {
  SensorSimulator,
  ActuatorSimulator,
  analyzePlantCondition,
} from "@/lib/simulator"

import type {
  SimulatorData,
  ActuatorState,
  PlantCondition,
} from "@/types"

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
  const [manualApplied, setManualApplied] = useState(false)

  const [actuatorState, setActuatorState] = useState<ActuatorState>({
    led: "off",
    relay: "off",
    fan: 0,
    sprinkler: "off",
  })

  const [plantCondition, setPlantCondition] =
    useState<PlantCondition | null>(null)

  const [simulator] = useState(() => new SensorSimulator())
  const [actuatorSim] = useState(() => new ActuatorSimulator())

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) router.push("/")
    return () => simulator.stop()
  }, [router, simulator])

  /* ===== Controls ===== */
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

  const resetSimulation = () => {
    simulator.stop()
    setIsRunning(false)
    setIsManualMode(false)
    setManualApplied(false)
    setPlantCondition(null)
  }

  const applyManualValues = () => {
    simulator.stop()
    setIsRunning(false)

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
    setManualApplied(true)

    setTimeout(() => setManualApplied(false), 3000)
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

        {/* ===== TOP GRID (LEFT / RIGHT) ===== */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">

          {/* ===== LEFT ===== */}
          <div className="space-y-8">

            {/* Simulation Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-600" />
                  Simulation Control
                </CardTitle>
                <CardDescription>
                  ควบคุมการเริ่ม หยุด และรีเซ็ตระบบจำลอง
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {!isRunning ? (
                  <Button onClick={startSimulation}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Simulation
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={stopSimulation}>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Simulation
                  </Button>
                )}
                <Button variant="outline" onClick={resetSimulation}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                {isManualMode && (
                  <Badge className="bg-amber-100 text-amber-700">
                    Manual Override Active
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Manual Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-green-600" />
                  Manual Sensor Input
                </CardTitle>
                <CardDescription>
                  ใช้สำหรับสร้างสถานการณ์จำลอง
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
                  <div key={item.key}>
                    <Label>{item.label}</Label>
                    <Input
                      type="number"
                      value={(manual as any)[item.key]}
                      onChange={(e) =>
                        setManual({ ...manual, [item.key]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div className="md:col-span-5 flex items-center gap-4">
                  <Button onClick={applyManualValues}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Apply Manual Values
                  </Button>
                  {manualApplied && (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      กำลังใช้ค่าจำลองนี้อยู่
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ===== RIGHT (Decision Rule Preview) ===== */}
          <Card className="h-fit border-blue-200 bg-blue-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <ListChecks className="h-5 w-5" />
                Decision Rule Preview
              </CardTitle>
              <CardDescription>
                อธิบายเหตุผลการตัดสินใจของระบบจากข้อมูลเซ็นเซอร์
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                ระบบประมวลผลข้อมูลล่าสุดเรียบร้อย
              </div>

              {plantCondition ? (
                <>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span className="capitalize">
                      {plantCondition.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Evaluation Logic</div>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Temperature & Humidity ถูกตรวจสอบก่อน</li>
                      <li>Light และ Rain ใช้ประกอบการตัดสินใจ</li>
                      <li>PM2.5 ส่งผลต่อคำแนะนำด้านสุขภาพพืช</li>
                    </ul>
                  </div>

                  {plantCondition.alerts.length > 0 && (
                    <div className="flex items-start gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <span>
                        {plantCondition.alerts.join(", ")}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground">
                  ยังไม่มีข้อมูลสำหรับวิเคราะห์
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== Sensor Data ===== */}
        <section>
          <h2 className="text-3xl font-semibold mb-4 flex items-center gap-3">
            <Thermometer className="h-7 w-7 text-red-500" />
            Sensor Data
            {isManualMode && <Badge className="bg-green-600">Manual</Badge>}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <SensorMetricCard icon={<Thermometer className="h-4 w-4 text-red-500" />} label="Temperature" value={sensorData.temperature.toFixed(1)} unit="°C" color="text-red-600" />
            <SensorMetricCard icon={<Droplets className="h-4 w-4 text-blue-500" />} label="Humidity" value={sensorData.humidity.toFixed(1)} unit="%" color="text-blue-600" />
            <SensorMetricCard icon={<Sun className="h-4 w-4 text-yellow-500" />} label="Light" value={sensorData.light.toFixed(0)} unit="Lux" color="text-yellow-600" />
            <SensorMetricCard icon={<CloudRain className="h-4 w-4 text-cyan-500" />} label="Rain" value={sensorData.rain.toFixed(1)} unit="mm/hr" color="text-cyan-600" />
            <SensorMetricCard icon={<Wind className="h-4 w-4 text-gray-500" />} label="PM2.5" value={sensorData.pm25.toFixed(0)} unit="µg/m³" color="text-gray-600" />
          </div>
        </section>
      </main>
    </div>
  )
}
