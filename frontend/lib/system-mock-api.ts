import {
  TemperatureHumiditySensor,
  LightSensor,
  SoilMoistureSensor,
  Sensor,
  LedStatus,
  AutomationRule,
  SystemStatus,
  SystemEvent,
} from "@/types/system"

/**
 * ข้อมูลจำลองเซ็นเซอร์อุณหภูมิและความชื้นอากาศ
 */
export const mockTemperatureHumiditySensor: TemperatureHumiditySensor = {
  id: "sensor_001",
  type: "temperature_humidity",
  name: "เซ็นเซอร์อุณหภูมิและความชื้นอากาศ",
  temperature: 28.5,
  humidity: 65,
  unit: {
    temperature: "°C",
    humidity: "%",
  },
  timestamp: new Date().toISOString(),
  isActive: true,
}

/**
 * ข้อมูลจำลองเซ็นเซอร์วัดความเข้มแสง
 */
export const mockLightSensor: LightSensor = {
  id: "sensor_002",
  type: "light",
  name: "เซ็นเซอร์วัดความเข้มแสง",
  illuminance: 450,
  unit: "lux",
  timestamp: new Date().toISOString(),
  isActive: true,
}

/**
 * ข้อมูลจำลองเซ็นเซอร์วัดความชื้นในดิน
 */
export const mockSoilMoistureSensor: SoilMoistureSensor = {
  id: "sensor_003",
  type: "soil_moisture",
  name: "เซ็นเซอร์วัดความชื้นในดิน",
  moisture: 55,
  unit: "%",
  timestamp: new Date().toISOString(),
  isActive: true,
}

/**
 * ข้อมูลจำลองทั้งเซ็นเซอร์
 */
export const mockSensors: Sensor[] = [
  mockTemperatureHumiditySensor,
  mockLightSensor,
  mockSoilMoistureSensor,
]

/**
 * ข้อมูลจำลอง LED
 */
export const mockLedStatuses: LedStatus[] = [
  {
    id: "led_1",
    name: "LED ดวงที่ 1",
    isOn: false,
    source: "manual",
    lastChangedBy: "ผู้ใช้",
    timestamp: new Date().toISOString(),
  },
  {
    id: "led_2",
    name: "LED ดวงที่ 2",
    isOn: true,
    source: "rule",
    lastChangedBy: "ชุมชนอัตโนมัติ: อุณหภูมิสูง",
    timestamp: new Date().toISOString(),
  },
]

/**
 * ข้อมูลจำลองเงื่อนไขอัตโนมัติ
 */
export const mockAutomationRules: AutomationRule[] = [
  {
    id: "rule_001",
    name: "ทำให้ LED เปิดเมื่ออุณหภูมิสูง",
    sensorId: "sensor_001",
    sensorType: "temperature_humidity",
    sensorProperty: "temperature",
    condition: ">",
    targetValue: 30,
    targetLedId: "led_1",
    targetLedAction: "on",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // เมื่อวาน
    lastTriggered: new Date(Date.now() - 300000).toISOString(), // 5 นาทีที่แล้ว
    triggerCount: 12,
  },
  {
    id: "rule_002",
    name: "ปิด LED เมื่อความชื้นต่ำ",
    sensorId: "sensor_003",
    sensorType: "soil_moisture",
    sensorProperty: "moisture",
    condition: "<",
    targetValue: 40,
    targetLedId: "led_2",
    targetLedAction: "off",
    isActive: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 วันที่แล้ว
    triggerCount: 0,
  },
  {
    id: "rule_003",
    name: "เปิด LED เมื่อแสงน้อย",
    sensorId: "sensor_002",
    sensorType: "light",
    sensorProperty: "illuminance",
    condition: "<",
    targetValue: 300,
    targetLedId: "led_1",
    targetLedAction: "on",
    isActive: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 วันที่แล้ว
    lastTriggered: new Date(Date.now() - 1800000).toISOString(), // 30 นาทีที่แล้ว
    triggerCount: 28,
  },
]

/**
 * ข้อมูลจำลองสถานะระบบ
 */
export const mockSystemStatus: SystemStatus = {
  mode: "mock",
  backendConnected: true,
  realtimeEnabled: true,
  lastUpdate: new Date().toISOString(),
}

/**
 * ข้อมูลจำลองเหตุการณ์ระบบ
 */
export const generateMockSystemEvents = (): SystemEvent[] => [
  {
    id: "event_001",
    type: "sensor_update",
    description: "อุณหภูมิเพิ่มขึ้นเป็น 28.5°C",
    timestamp: new Date(Date.now() - 5000).toISOString(),
    data: {
      sensorId: "sensor_001",
      property: "temperature",
      value: 28.5,
    },
  },
  {
    id: "event_002",
    type: "rule_triggered",
    description: "เงื่อนไข 'ทำให้ LED เปิดเมื่ออุณหภูมิสูง' ถูกสัมผัส",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    data: {
      ruleId: "rule_001",
      sensorValue: 31.2,
      thresholdValue: 30,
    },
  },
  {
    id: "event_003",
    type: "led_changed",
    description: "LED ดวงที่ 2 เปลี่ยนสถานะเป็น เปิด โดยเงื่อนไขอัตโนมัติ",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    data: {
      ledId: "led_2",
      newStatus: "on",
      source: "rule",
      ruleId: "rule_003",
    },
  },
  {
    id: "event_004",
    type: "sensor_update",
    description: "ความชื้นดินเพิ่มขึ้นเป็น 55%",
    timestamp: new Date(Date.now() - 10000).toISOString(),
    data: {
      sensorId: "sensor_003",
      property: "moisture",
      value: 55,
    },
  },
]

/**
 * ส่วน API สำหรับจำลองข้อมูล
 */
export const systemMockApi = {
  /**
   * ดึงข้อมูลเซ็นเซอร์ทั้งหมด
   */
  getSensors: async (): Promise<Sensor[]> => {
    // จำลองการเชื่อมต่อ Network
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockSensors
  },

  /**
   * ดึงข้อมูลเซ็นเซอร์เฉพาะตัว
   */
  getSensor: async (sensorId: string): Promise<Sensor | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockSensors.find((s) => s.id === sensorId) || null
  },

  /**
   * ดึงข้อมูล LED ทั้งหมด
   */
  getLedStatuses: async (): Promise<LedStatus[]> => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    return mockLedStatuses
  },

  /**
   * ปรับปรุงสถานะ LED
   */
  toggleLed: async (ledId: string, isOn: boolean): Promise<LedStatus | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const led = mockLedStatuses.find((l) => l.id === ledId)
    if (led) {
      led.isOn = isOn
      led.source = "manual"
      led.lastChangedBy = "ผู้ใช้"
      led.timestamp = new Date().toISOString()
    }
    return led || null
  },

  /**
   * ดึงข้อมูลเงื่อนไขอัตโนมัติทั้งหมด
   */
  getAutomationRules: async (): Promise<AutomationRule[]> => {
    await new Promise((resolve) => setTimeout(resolve, 350))
    return mockAutomationRules
  },

  /**
   * สร้างเงื่อนไขอัตโนมัติใหม่
   */
  createRule: async (rule: Omit<AutomationRule, "id" | "createdAt" | "triggerCount">): Promise<AutomationRule> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newRule: AutomationRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    }
    mockAutomationRules.push(newRule)
    return newRule
  },

  /**
   * ลบเงื่อนไขอัตโนมัติ
   */
  deleteRule: async (ruleId: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const index = mockAutomationRules.findIndex((r) => r.id === ruleId)
    if (index >= 0) {
      mockAutomationRules.splice(index, 1)
      return true
    }
    return false
  },

  /**
   * ดึงข้อมูลสถานะระบบ
   */
  getSystemStatus: async (): Promise<SystemStatus> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return {
      ...mockSystemStatus,
      lastUpdate: new Date().toISOString(),
    }
  },

  /**
   * ดึงข้อมูลเหตุการณ์ระบบเรียลไทม์
   */
  getSystemEvents: async (): Promise<SystemEvent[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return generateMockSystemEvents()
  },

  /**
   * ส่วนเลียนแบบการเปลี่ยนแปลงข้อมูลเซ็นเซอร์
   */
  simulateSensorUpdate: async (sensorId: string, property: string, value: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const sensor = mockSensors.find((s) => s.id === sensorId)
    if (!sensor) return

    switch (sensor.type) {
      case "temperature_humidity":
        if (property === "temperature") {
          (sensor as TemperatureHumiditySensor).temperature = value
        } else if (property === "humidity") {
          (sensor as TemperatureHumiditySensor).humidity = value
        }
        break
      case "light":
        if (property === "illuminance") {
          (sensor as LightSensor).illuminance = value
        }
        break
      case "soil_moisture":
        if (property === "moisture") {
          (sensor as SoilMoistureSensor).moisture = value
        }
        break
    }
    sensor.timestamp = new Date().toISOString()
  },
}
