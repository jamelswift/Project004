const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function sendEmailNotification(to: string, subject: string, message: string) {
  try {
    const response = await fetch(`${API_URL}/api/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, message }),
    })

    return response.ok
  } catch (error) {
    console.error("Email notification error:", error)
    return false
  }
}

export function checkTimeForLightControl() {
  const now = new Date()
  const hour = now.getHours()

  // เช้า (6:00-8:00) - ควรปิดไฟ
  if (hour >= 6 && hour < 8) {
    return { shouldChange: true, action: "off", reason: "เวลาเช้า" }
  }

  // มืด (18:00-20:00) - ควรเปิดไฟ
  if (hour >= 18 && hour < 20) {
    return { shouldChange: true, action: "on", reason: "เวลามืด" }
  }

  return { shouldChange: false, action: null, reason: null }
}
