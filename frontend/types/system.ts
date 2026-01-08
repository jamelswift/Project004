// ประเภทเซ็นเซอร์
export type SensorType = 
  | "temperature_humidity" 
  | "light" 
  | "soil_moisture"

// ประเภท LED
export type LedType = "led_1" | "led_2"

// ประเภทเงื่อนไข
export type ConditionOperator = ">" | "<" | "="

// ประเภทแหล่งที่มาของคำสั่ง
export type CommandSource = "manual" | "rule"

/**
 * อินเตอร์เฟซเซ็นเซอร์อุณหภูมิและความชื้นอากาศ
 */
export interface TemperatureHumiditySensor {
  id: string
  type: "temperature_humidity"
  name: string
  temperature: number // °C
  humidity: number // %
  unit: {
    temperature: "°C"
    humidity: "%"
  }
  timestamp: string
  isActive: boolean
}

/**
 * อินเตอร์เฟซเซ็นเซอร์วัดความเข้มแสง
 */
export interface LightSensor {
  id: string
  type: "light"
  name: string
  illuminance: number // Lux
  unit: "lux"
  timestamp: string
  isActive: boolean
}

/**
 * อินเตอร์เฟซเซ็นเซอร์วัดความชื้นในดิน
 */
export interface SoilMoistureSensor {
  id: string
  type: "soil_moisture"
  name: string
  moisture: number // %
  unit: "%"
  timestamp: string
  isActive: boolean
}

// Union type สำหรับเซ็นเซอร์ทั้งหมด
export type Sensor = 
  | TemperatureHumiditySensor 
  | LightSensor 
  | SoilMoistureSensor

/**
 * สถานะ LED
 */
export interface LedStatus {
  id: LedType
  name: string // เช่น "LED ดวงที่ 1"
  isOn: boolean
  source: CommandSource // manual หรือ rule
  lastChangedBy?: string // ชื่อ rule หรือ "ผู้ใช้"
  timestamp: string
}

/**
 * เงื่อนไขอัตโนมัติ (Automation Rule)
 */
export interface AutomationRule {
  id: string
  name: string
  sensorId: string // รหัสเซ็นเซอร์เฉพาะตัว
  sensorType: SensorType
  sensorProperty: string // เช่น "temperature", "humidity", "illuminance", "moisture"
  condition: ConditionOperator
  targetValue: number
  targetLedId: LedType
  targetLedAction: "on" | "off"
  isActive: boolean
  createdAt: string
  lastTriggered?: string
  triggerCount: number // จำนวนครั้งที่เงื่อนไขเป็นจริง
}

/**
 * สถานะระบบ
 */
export interface SystemStatus {
  mode: "mock" | "real" // mock = ข้อมูลจำลอง, real = ข้อมูลจริง
  backendConnected: boolean
  realtimeEnabled: boolean
  lastUpdate: string
  errorMessage?: string
}

/**
 * เหตุการณ์ระบบเรียลไทม์
 */
export interface SystemEvent {
  id: string
  type: "sensor_update" | "rule_triggered" | "led_changed" | "system_error"
  description: string
  timestamp: string
  data?: Record<string, any>
}

/**
 * ข้อมูลตรวจสอบเซ็นเซอร์เรียลไทม์
 */
export interface SensorReading {
  sensorId: string
  sensorType: SensorType
  value: number
  property: string
  timestamp: string
}
