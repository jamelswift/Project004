import Section from "./Section"

export default function SystemActivity() {
  const items = [
    { time: "10:42", text: "อุณหภูมิสูงเกินกำหนด (ESP32-003)", level: "เตือน" },
    { time: "09:15", text: "อุปกรณ์ออฟไลน์ (ESP32-007)", level: "เตือน" },
    { time: "08:50", text: "ผู้ดูแลปรับเกณฑ์แจ้งเตือนอุณหภูมิ", level: "สำเร็จ" },
  ]

  const pill = (level: string) => {
    if (level === "สำเร็จ") return "bg-emerald-100 text-emerald-700"
    return "bg-amber-100 text-amber-700"
  }

  return (
    <Section title="กิจกรรมล่าสุดของระบบ (ตัวอย่าง Logs)">
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">
                [{it.time}] {it.text}
              </div>
              <div className="text-xs text-gray-500">ประเภท: บันทึกเหตุการณ์ระบบ</div>
            </div>
            <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${pill(it.level)}`}>
              {it.level}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        หมายเหตุ: ส่วนนี้ทำหน้าที่ “ตัวอย่าง Logs” เพื่อให้หน้าแดชบอร์ดมีข้อมูลสรุปก่อนเข้าไปดูหน้า “บันทึกระบบ”
      </div>
    </Section>
  )
}
