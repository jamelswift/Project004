import { NextResponse } from "next/server"

// In-memory storage สำหรับเก็บข้อมูลเซ็นเซอร์
let sensorDataStore: any[] = []

export async function GET() {
  return NextResponse.json(sensorDataStore)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // เก็บข้อมูลเซ็นเซอร์
    sensorDataStore.push({
      ...data,
      timestamp: new Date().toISOString(),
    })

    // เก็บแค่ 1000 รายการล่าสุด
    if (sensorDataStore.length > 1000) {
      sensorDataStore = sensorDataStore.slice(-1000)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถบันทึกข้อมูลได้" }, { status: 500 })
  }
}
