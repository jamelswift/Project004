import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { to, subject, message } = await request.json()

    console.log("[v0] Email Notification:", { to, subject, message })

    // ในการใช้งานจริง ควรใช้ Email Service เช่น SendGrid, AWS SES, หรือ Resend
    // สำหรับตอนนี้จะ log ข้อความแทน

    return NextResponse.json({
      success: true,
      message: "อีเมลถูกส่งแล้ว",
    })
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถส่งอีเมลได้" }, { status: 500 })
  }
}
