"use client"

import SensorChart from "./SensorChart"

export default function SystemOverview() {
  return (
    <div className="apple-card p-6 space-y-4">

      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">แนวโน้มอุณหภูมิและความชื้น</h2>
        <span className="text-xs text-muted-foreground">
          โหมดแสดงผล: Mock Data
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        แสดงข้อมูลเซ็นเซอร์จำลอง (รองรับ Real-time เมื่อเชื่อมต่อ Cloud IoT)
      </p>

      {/* Chart */}
      <SensorChart />

      {/* Note for Thesis */}
      <p className="text-xs text-muted-foreground mt-2">
        * ข้อมูลจำลองเพื่อทดสอบ Dashboard ก่อนเชื่อมต่อ MQTT / Cloud IoT จริง
      </p>
    </div>
  )
}
