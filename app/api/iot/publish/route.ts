import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { topic, command } = await request.json()

    console.log("[v0] AWS IoT Publish:", { topic, command })

    // ในการใช้งานจริง ส่งคำสั่งไปยัง AWS IoT Core
    // ใช้ AWS SDK และ certificates ที่คุณมี

    // Simulate successful publish
    return NextResponse.json({
      success: true,
      message: "คำสั่งถูกส่งไปยังอุปกรณ์แล้ว",
      topic,
      command,
    })
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถส่งคำสั่งได้" }, { status: 500 })
  }
}
