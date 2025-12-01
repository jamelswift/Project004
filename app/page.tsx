import { LoginForm } from "@/components/login-form"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 text-center md:text-left">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">WSN IoT Platform</h1>
            <p className="text-xl text-muted-foreground">Cloud-Based Management Platform</p>
          </div>

          <div className="space-y-4">
            <p className="text-lg">ระบบจัดการเซ็นเซอร์และอุปกรณ์ควบคุมแบบไร้สายบนคลาวด์</p>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                รับข้อมูลอุณหภูมิแบบเรียลไทม์จาก ESP32
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ควบคุมอุปกรณ์ไฟฟ้าผ่านเว็บแอปพลิเคชัน
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                แจ้งเตือนอัตโนมัติผ่านอีเมล
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                เชื่อมต่อ AWS IoT Core และ Weather API
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
