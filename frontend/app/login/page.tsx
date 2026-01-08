"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { login, setCurrentUser } from "@/lib/auth"
import { ShieldCheck, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await login(email, password)

      if (result?.user) {
        setCurrentUser(result.user)

        if (result.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT CONTENT */}
        <section className="max-w-xl space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              ยินดีต้อนรับสู่
              <span className="block text-white/95 mt-1">WSN IoT Platform</span>
            </h1>
            <p className="text-lg text-white/80">เข้าสู่ระบบเพื่อจัดการระบบ IoT ของคุณ</p>
          </div>

          <p className="text-white/80">แพลตฟอร์มจัดการระบบเซ็นเซอร์และอุปกรณ์ควบคุมแบบไร้สายบนคลาวด์</p>

          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-white" />
              เข้าถึงแดชบอร์ดข้อมูลแบบเรียลไทม์
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-white" />
              ควบคุมอุปกรณ์ได้จากทุกที่ทุกเวลา
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-white" />
              รับการแจ้งเตือนอัตโนมัติผ่านอีเมล
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-white" />
              รองรับ AWS IoT Core และ Weather API
            </li>
          </ul>

          <div className="rounded-xl bg-white/15 backdrop-blur px-4 py-3 text-sm text-white border border-white/20">
            <span className="font-medium">Tip:</span> ฟอร์มจะปรับเป็นแนวตั้งอัตโนมัติเมื่อเปิดบนมือถือ
          </div>
        </section>

        {/* RIGHT CARD */}
        <section className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md lg:max-w-lg">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 blur-xl -z-10" />

            <div className="rounded-3xl bg-white/95 backdrop-blur border border-white/30 shadow-2xl p-8">
              <div className="text-center space-y-3 pb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold">เข้าสู่ระบบ</h2>

                <p className="text-sm lg:text-base text-muted-foreground">
                  WSN IoT Platform – ระบบจัดการเซ็นเซอร์บนคลาวด์
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label>อีเมล</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@wsn.com"
                    className="h-11 bg-white/50 border-blue-200 focus:border-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>รหัสผ่าน</Label>
                    <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                      ลืมรหัสผ่าน?
                    </Link>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-white/50 border-blue-200 focus:border-blue-600"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 rounded p-3 text-center border border-red-200">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl shadow-lg">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  ยังไม่มีบัญชีผู้ใช้?{" "}
                  <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                    สมัครสมาชิก
                  </Link>
                </div>

                <div className="rounded-xl bg-white/10 backdrop-blur p-4 text-sm text-white border border-white/20">
                  <p className="font-semibold text-white">Demo Account</p>
                  <p className="mt-1">user@wsn.com / admin@wsn.com</p>
                  <p>password: password123</p>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}