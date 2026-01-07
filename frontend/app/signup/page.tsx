import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        
        {/* LEFT CONTENT */}
        <section className="max-w-xl space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              เริ่มต้นใช้งาน
              <span className="block text-blue-600 mt-1">
                WSN IoT Platform
              </span>
            </h1>
            <p className="text-lg text-slate-600">
              สมัครสมาชิกฟรี เพื่อเริ่มจัดการระบบ IoT ของคุณ
            </p>
          </div>

          <p className="text-slate-700">
            สร้างบัญชีผู้ใช้งานและเริ่มต้นจัดการระบบเซ็นเซอร์และอุปกรณ์ควบคุมแบบไร้สายบนคลาวด์
          </p>

          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              เข้าถึงแดชบอร์ดข้อมูลแบบเรียลไทม์
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              ควบคุมอุปกรณ์ได้จากทุกที่ทุกเวลา
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              รับการแจ้งเตือนอัตโนมัติผ่านอีเมล
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              รองรับ AWS IoT Core และ Weather API
            </li>
          </ul>

          <div className="rounded-xl bg-blue-50/60 px-4 py-3 text-sm text-blue-700">
            <span className="font-medium">Tip:</span> ฟอร์มจะปรับเป็นแนวตั้งอัตโนมัติเมื่อเปิดบนมือถือ
          </div>
        </section>

        {/* RIGHT CARD */}
        <section className="flex justify-center lg:justify-end">
          <SignupForm />
        </section>
      </div>
    </main>
  )
}
