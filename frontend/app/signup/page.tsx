import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 text-center md:text-left">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">เริ่มต้นใช้งาน WSN IoT</h1>
            <p className="text-xl text-muted-foreground">สมัครสมาชิกฟรี</p>
          </div>

          <div className="space-y-4">
            <p className="text-lg">สร้างบัญชีผู้ใช้งานและเริ่มต้นจัดการระบบ IoT ของคุณ</p>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                เข้าถึงแดชบอร์ดข้อมูลเรียลไทม์
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ควบคุมอุปกรณ์จากทุกที่ทุกเวลา
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                รับการแจ้งเตือนผ่านอีเมล
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                จัดการอุปกรณ์ได้ไม่จำกัด
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <SignupForm />
        </div>
      </div>
    </main>
  )
}
