import type { SimulatorData, ActuatorState, PlantCondition } from "@/types"

export class SensorSimulator {
  private intervalId: NodeJS.Timeout | null = null
  private data: SimulatorData = {
    temperature: 28,
    humidity: 65,
    light: 5000,
    rain: 0,
    pm25: 35,
    timestamp: new Date().toISOString(),
  }

  // Simulate realistic sensor data with day/night cycles
  generateTemperature(): number {
    const hour = new Date().getHours()
    const baseTemp = 25
    const dailyVariation = Math.sin((hour - 6) * (Math.PI / 12)) * 8 // Peak at 2 PM
    const randomNoise = (Math.random() - 0.5) * 2
    return Math.max(18, Math.min(38, baseTemp + dailyVariation + randomNoise))
  }

  generateHumidity(): number {
    const hour = new Date().getHours()
    const baseHumidity = 60
    // Higher humidity at night, lower during day
    const dailyVariation = Math.cos((hour - 6) * (Math.PI / 12)) * 15
    const randomNoise = (Math.random() - 0.5) * 5
    return Math.max(30, Math.min(95, baseHumidity + dailyVariation + randomNoise))
  }

  generateLight(): number {
    const hour = new Date().getHours()
    // Daylight hours: 6 AM - 6 PM
    if (hour >= 6 && hour <= 18) {
      const maxLight = 10000 // Max lux at noon
      const lightCurve = Math.sin(((hour - 6) * Math.PI) / 12)
      return Math.max(0, Math.floor(maxLight * lightCurve + (Math.random() - 0.5) * 1000))
    }
    return Math.floor(Math.random() * 100) // Very low light at night
  }

  generateRain(): number {
    // Random rain events
    if (Math.random() < 0.1) {
      // 10% chance of rain
      return Math.random() * 20 // 0-20 mm/hr
    }
    return 0
  }

  generatePM25(): number {
    const baseValue = 35
    const randomVariation = (Math.random() - 0.5) * 20
    return Math.max(0, Math.floor(baseValue + randomVariation))
  }

  start(callback: (data: SimulatorData) => void) {
    this.intervalId = setInterval(() => {
      this.data = {
        temperature: this.generateTemperature(),
        humidity: this.generateHumidity(),
        light: this.generateLight(),
        rain: this.generateRain(),
        pm25: this.generatePM25(),
        timestamp: new Date().toISOString(),
      }
      callback(this.data)
    }, 3000) // Update every 3 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  getCurrentData(): SimulatorData {
    return this.data
  }
}

export class ActuatorSimulator {
  private state: ActuatorState = {
    led: "off",
    relay: "off",
    fan: 0,
    sprinkler: "off",
  }

  setState(newState: Partial<ActuatorState>) {
    this.state = { ...this.state, ...newState }
    console.log("[v0] Actuator state updated:", this.state)
  }

  getState(): ActuatorState {
    return this.state
  }

  // Auto control based on sensor data
  autoControl(sensorData: SimulatorData): ActuatorState {
    const hour = new Date().getHours()

    // LED control based on light level
    if (sensorData.light < 1000 && hour >= 18) {
      this.state.led = "on"
    } else if (sensorData.light > 2000 || hour < 18) {
      this.state.led = "off"
    }

    // Fan control based on temperature
    if (sensorData.temperature > 32) {
      this.state.fan = 80
    } else if (sensorData.temperature > 28) {
      this.state.fan = 50
    } else {
      this.state.fan = 0
    }

    // Sprinkler control based on rain and humidity
    if (sensorData.rain > 0 || sensorData.humidity > 80) {
      this.state.sprinkler = "off"
    } else if (sensorData.humidity < 40 && hour >= 6 && hour <= 8) {
      this.state.sprinkler = "on"
    }

    return this.state
  }
}

// Plant care recommendations based on sensor data
export function analyzePlantCondition(data: SimulatorData): PlantCondition {
  const recommendations: string[] = []
  const alerts: string[] = []

  let tempStatus: "excellent" | "good" | "warning" | "critical" = "good"
  let humidityStatus: "excellent" | "good" | "warning" | "critical" = "good"
  let lightStatus: "excellent" | "good" | "warning" | "critical" = "good"

  // Temperature analysis
  if (data.temperature < 20) {
    tempStatus = "warning"
    alerts.push("อุณหภูมิต่ำเกินไป")
    recommendations.push("ควรเพิ่มอุณหภูมิหรือย้ายพืชไปที่อบอุ่นกว่า")
  } else if (data.temperature > 35) {
    tempStatus = "critical"
    alerts.push("อุณหภูมิสูงเกินไป!")
    recommendations.push("ต้องลดอุณหภูมิด่วน เปิดพัดลมหรือให้ร่มเงา")
  } else if (data.temperature >= 25 && data.temperature <= 30) {
    tempStatus = "excellent"
    recommendations.push("อุณหภูมิเหมาะสมสำหรับการเจริญเติบโต")
  }

  // Humidity analysis
  if (data.humidity < 40) {
    humidityStatus = "warning"
    alerts.push("ความชื้นต่ำเกินไป")
    recommendations.push("ควรรดน้ำหรือเปิดสปริงเกอร์")
  } else if (data.humidity > 85) {
    humidityStatus = "warning"
    alerts.push("ความชื้นสูงเกินไป")
    recommendations.push("เพิ่มการระบายอากาศ ป้องกันเชื้อรา")
  } else if (data.humidity >= 60 && data.humidity <= 75) {
    humidityStatus = "excellent"
    recommendations.push("ความชื้นเหมาะสมมาก")
  }

  // Light analysis
  const hour = new Date().getHours()
  if (data.light < 2000 && hour >= 8 && hour <= 17) {
    lightStatus = "warning"
    alerts.push("แสงน้อยเกินไป")
    recommendations.push("ย้ายพืชไปที่ได้รับแสงมากขึ้น")
  } else if (data.light > 8000) {
    lightStatus = "warning"
    alerts.push("แสงแรงเกินไป")
    recommendations.push("ให้ร่มเงาบางส่วน")
  } else if (data.light >= 4000 && data.light <= 7000) {
    lightStatus = "excellent"
  }

  // Rain analysis
  let rainStatus = "ไม่มีฝน"
  if (data.rain > 10) {
    rainStatus = "ฝนตกหนัก"
    recommendations.push("ไม่จำเป็นต้องรดน้ำในวันนี้")
  } else if (data.rain > 0) {
    rainStatus = "ฝนตกเล็กน้อย"
  }

  // Overall status
  const statuses = [tempStatus, humidityStatus, lightStatus]
  const overallStatus = statuses.includes("critical")
    ? "critical"
    : statuses.includes("warning")
      ? "warning"
      : statuses.filter((s) => s === "excellent").length >= 2
        ? "excellent"
        : "good"

  return {
    name: "สวนผัก/ต้นไม้",
    status: overallStatus,
    temperature: {
      min: 20,
      max: 32,
      current: data.temperature,
    },
    humidity: {
      min: 50,
      max: 80,
      current: data.humidity,
    },
    light: {
      min: 3000,
      max: 8000,
      current: data.light,
    },
    rain: {
      status: rainStatus,
      amount: data.rain,
    },
    recommendations: recommendations.length > 0 ? recommendations : ["สภาพแวดล้อมดี ดูแลรักษาระดับปัจจุบัน"],
    alerts,
  }
}
