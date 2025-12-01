import { NextResponse } from "next/server"

// GET: Get simulated sensor data
export async function GET() {
  try {
    const hour = new Date().getHours()

    // Generate realistic sensor data
    const baseTemp = 25
    const dailyVariation = Math.sin((hour - 6) * (Math.PI / 12)) * 8
    const temperature = baseTemp + dailyVariation + (Math.random() - 0.5) * 2

    const baseHumidity = 60
    const humidityVariation = Math.cos((hour - 6) * (Math.PI / 12)) * 15
    const humidity = baseHumidity + humidityVariation + (Math.random() - 0.5) * 5

    let light = 0
    if (hour >= 6 && hour <= 18) {
      const maxLight = 10000
      const lightCurve = Math.sin(((hour - 6) * Math.PI) / 12)
      light = Math.max(0, maxLight * lightCurve + (Math.random() - 0.5) * 1000)
    } else {
      light = Math.random() * 100
    }

    const rain = Math.random() < 0.1 ? Math.random() * 20 : 0
    const pm25 = 35 + (Math.random() - 0.5) * 20

    return NextResponse.json({
      temperature: Math.max(18, Math.min(38, temperature)),
      humidity: Math.max(30, Math.min(95, humidity)),
      light: Math.floor(light),
      rain,
      pm25: Math.max(0, Math.floor(pm25)),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Simulator error:", error)
    return NextResponse.json({ error: "Failed to generate sensor data" }, { status: 500 })
  }
}

// POST: Control actuators
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { device, action, value } = body

    console.log(`[v0] Actuator control: ${device} -> ${action}`, value)

    // In production, this would publish to AWS IoT
    return NextResponse.json({
      success: true,
      device,
      action,
      value,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Actuator control error:", error)
    return NextResponse.json({ error: "Failed to control actuator" }, { status: 500 })
  }
}
