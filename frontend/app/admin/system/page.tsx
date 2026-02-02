export default function SystemPage() {
  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 p-5">
      <div>
        <div className="text-lg font-semibold text-gray-900">สถานะระบบ</div>
        <div className="text-sm text-gray-500">
          ตรวจสอบสุขภาพของระบบและความพร้อมในการเชื่อม Cloud/Device จริง
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="สถานะ Backend">
          <StatusLine label="สถานะ" value="รอเชื่อม API จริง" tone="warn" />
          <StatusLine label="โหมด" value="Development" tone="info" />
        </Card>

        <Card title="สถานะ Cloud IoT">
          <StatusLine label="การเชื่อมต่อ" value="พร้อมใช้งาน (Mock)" tone="ok" />
          <StatusLine label="โปรโตคอล" value="MQTT/TLS (ฝั่ง Backend)" tone="info" />
        </Card>

        <Card title="ระบบแจ้งเตือน">
          <StatusLine label="กฎแจ้งเตือน" value="พร้อมตั้งค่า" tone="ok" />
          <StatusLine label="ช่องทาง" value="อีเมล/แจ้งเตือนระบบ" tone="info" />
        </Card>

        <Card title="เวอร์ชันระบบ">
          <StatusLine label="Frontend" value="v1.0.0" tone="ok" />
          <StatusLine label="Admin UI" value="พร้อมใช้งาน" tone="ok" />
        </Card>
      </div>

      <div className="mt-5 rounded-3xl bg-white border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-900">การควบคุมระบบ (Mock)</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition">
            รีเฟรชสถานะ
          </button>
          <button className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:shadow-sm transition">
            ทดสอบแจ้งเตือน
          </button>
          <button className="rounded-2xl bg-rose-600 text-white px-4 py-2 text-sm font-semibold hover:bg-rose-700 transition">
            โหมดฉุกเฉิน (Mock)
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        หมายเหตุ: ปุ่มทั้งหมดเป็น Mock UI ระหว่างรอ Backend รองรับคำสั่งจริง
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  )
}

function StatusLine({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "ok" | "warn" | "bad" | "info"
}) {
  const map = {
    ok: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    bad: "bg-rose-100 text-rose-700",
    info: "bg-blue-100 text-blue-700",
  }[tone]

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-gray-600">{label}</div>
      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${map}`}>
        {value}
      </div>
    </div>
  )
}
