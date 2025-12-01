import { NextResponse } from "next/server"
import { getWeatherData } from "@/lib/weather"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city") || "Bangkok"

  try {
    const weather = await getWeatherData(city)

    if (!weather) {
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลสภาพอากาศได้" }, { status: 500 })
    }

    return NextResponse.json(weather)
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  }
}
