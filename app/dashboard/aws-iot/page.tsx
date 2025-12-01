"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Thermometer, Lightbulb, Activity, Wifi, WifiOff, Cloud } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface SensorData {
  temperature: number
  timestamp: string
}

export default function AwsIoTPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [lightStatus, setLightStatus] = useState(false)
  const [currentTemp, setCurrentTemp] = useState(28.5)
  const [tempHistory, setTempHistory] = useState<SensorData[]>([])
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }

    // Simulate AWS IoT connection
    setTimeout(() => setIsConnected(true), 1000)

    // Simulate temperature updates from ESP32
    const interval = setInterval(() => {
      const newTemp = 25 + Math.random() * 10
      setCurrentTemp(newTemp)

      setTempHistory((prev) => {
        const newData = [
          ...prev,
          {
            temperature: newTemp,
            timestamp: new Date().toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
        ]
        return newData.slice(-20) // Keep last 20 readings
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [router])

  const handleLightToggle = async (checked: boolean) => {
    setLightStatus(checked)

    // Simulate MQTT publish to AWS IoT
    console.log("[v0] Publishing to AWS IoT:", {
      topic: "wsn/actuator/control",
      message: {
        device: "light",
        status: checked ? "on" : "off",
        timestamp: new Date().toISOString(),
      },
    })

    // In real implementation, this would publish to AWS IoT Core
    // Example: await publishToAWSIoT('wsn/actuator/control', { device: 'light', status: checked ? 'on' : 'off' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                AWS IoT Core
              </h1>
              <p className="text-muted-foreground mt-2">
                ESP32 Temperature Monitoring & Light Control via AWS IoT MQTT
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600" />
                  <Badge className="bg-green-600">Connected</Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">Disconnected</Badge>
                </>
              )}
            </div>
          </div>

          {/* Connection Info */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-600" />
                AWS IoT Connection Details
              </CardTitle>
              <CardDescription>ESP32 connected via MQTT with certificates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Policy Name:</span>
                  <span className="font-mono font-medium">wsn-iot-policy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WiFi SSID:</span>
                  <span className="font-mono font-medium">Getzy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sensor Topic:</span>
                  <span className="font-mono font-medium">wsn/sensor/data</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Control Topic:</span>
                  <span className="font-mono font-medium">wsn/actuator/control</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Temperature Monitor */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-red-500" />
                  Temperature from ESP32
                </CardTitle>
                <CardDescription>Real-time temperature reading from analog sensor (simulated voltage)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-red-600">{currentTemp.toFixed(1)}°C</div>
                      <div className="text-sm text-muted-foreground mt-2">Current Temperature</div>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Activity className="h-4 w-4 text-green-600 animate-pulse" />
                        <span className="text-xs text-green-600">Live Data</span>
                      </div>
                    </div>
                  </div>

                  {/* Temperature Chart */}
                  {tempHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Temperature History (Last 20 readings)</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={tempHistory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tick={{ fontSize: 10 }}
                            interval="preserveStartEnd"
                            tickFormatter={(value) => value.split(":").slice(0, 2).join(":")}
                          />
                          <YAxis domain={[20, 40]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Light Control */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Light Control (ESP32)
                </CardTitle>
                <CardDescription>Control LED/Light connected to ESP32 via AWS IoT MQTT</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-center p-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                    <div className="text-center">
                      <Lightbulb
                        className={`h-24 w-24 mx-auto mb-4 ${lightStatus ? "text-yellow-500" : "text-gray-400"}`}
                      />
                      <Badge
                        className={`text-lg px-6 py-2 ${lightStatus ? "bg-yellow-500" : "bg-gray-400"}`}
                        variant="secondary"
                      >
                        {lightStatus ? "ON" : "OFF"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <Label htmlFor="light-control" className="text-base font-medium">
                      Light Control
                    </Label>
                    <Switch
                      id="light-control"
                      checked={lightStatus}
                      onCheckedChange={handleLightToggle}
                      disabled={!isConnected}
                    />
                  </div>

                  {lightStatus && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Activity className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-yellow-900">MQTT Message Sent</div>
                          <div className="text-yellow-700 mt-1">
                            Topic: <span className="font-mono text-xs">wsn/actuator/control</span>
                          </div>
                          <div className="text-yellow-700">
                            Payload: <span className="font-mono text-xs">{`{"device":"light","status":"on"}`}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ESP32 Code Reference */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle>ESP32 Arduino Code Reference</CardTitle>
              <CardDescription>Sample code for ESP32 to connect to AWS IoT Core</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                <pre>{`// WiFi Configuration
const char* WIFI_SSID = "Getzy";
const char* WIFI_PASSWORD = "Wipatsasicha7";

// AWS IoT Configuration
const char* AWS_IOT_ENDPOINT = "your-endpoint.iot.region.amazonaws.com";
const char* MQTT_TOPIC_SENSOR = "wsn/sensor/data";
const char* MQTT_TOPIC_CONTROL = "wsn/actuator/control";

// Temperature Reading (Analog)
int analogValue = analogRead(TEMP_PIN);
float voltage = analogValue * (3.3 / 4095.0);
float temperature = voltage * 100; // Convert to Celsius

// Publish to AWS IoT
publishMessage(MQTT_TOPIC_SENSOR, temperature);`}</pre>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>ดูคู่มือการติดตั้งและโค้ดเต็มรูปแบบได้ที่เมนู "Docs" → "คู่มือการใช้งาน ESP32"</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
