import { LoginForm } from "@/components/login-form"

export default function HomePage() {
  return (
    <main className="relative h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">

      {/* background blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-200/40 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-cyan-200/40 rounded-full blur-3xl" />

      <div className="
        relative
        h-full
        mx-auto
        max-w-6xl
        px-6
        grid
        grid-cols-1
        lg:grid-cols-2
        items-center
        gap-6
        lg:gap-8
      ">

        {/* ===== LEFT CONTENT ===== */}
        <section className="
          space-y-6
          max-w-xl
          mx-auto
          lg:mx-0
          text-center
          lg:text-left
        ">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            WSN IoT Platform
          </h1>

          <p className="text-lg lg:text-xl text-slate-600">
            Cloud-Based Management Platform
          </p>

          <p className="text-base lg:text-lg text-slate-700">
            ระบบจัดการเซ็นเซอร์และอุปกรณ์ควบคุมแบบไร้สายบนคลาวด์
          </p>

          <ul className="space-y-3 text-slate-600 text-sm lg:text-base">
            {[
              "รับข้อมูลอุณหภูมิแบบเรียลไทม์จาก ESP32",
              "ควบคุมอุปกรณ์ไฟฟ้าผ่านเว็บแอปพลิเคชัน",
              "แจ้งเตือนอัตโนมัติผ่านอีเมล",
              "เชื่อมต่อ AWS IoT Core และ Weather API",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 justify-center lg:justify-start">
                <span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== LOGIN CARD ===== */}
        <section className="flex justify-center lg:justify-start">
          <LoginForm />
        </section>

      </div>
    </main>
  )
}
