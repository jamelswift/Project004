"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { KeyRound } from "lucide-react"
import { requestPasswordReset } from "@/lib/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const message = await requestPasswordReset(email)
      setSuccess(message || "หากอีเมลถูกต้อง ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว")
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-200/40 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-cyan-200/40 rounded-full blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 text-center space-y-2">
          <p className="text-sm text-blue-600 font-semibold">บัญชีของคุณปลอดภัย</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">ลืมรหัสผ่าน</h1>
          <p className="text-slate-600">กรอกอีเมลที่ใช้สมัคร ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>
        </div>

        <div className="relative w-full max-w-md lg:max-w-lg">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-200/50 to-cyan-200/50 blur-xl -z-10" />

          <Card className="rounded-3xl bg-white/90 backdrop-blur border border-blue-100 shadow-xl">
            <CardHeader className="text-center space-y-3 pb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <KeyRound className="h-6 w-6" />
              </div>

              <CardTitle className="text-2xl lg:text-3xl font-bold">รีเซ็ตรหัสผ่าน</CardTitle>
              <CardDescription className="text-sm lg:text-base">
                เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลที่ระบุ มีอายุ 15 นาที
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-11 bg-blue-50/60"
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 rounded p-2 text-center">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-sm text-green-700 bg-green-50 rounded p-2 text-center">
                    {success}
                  </div>
                )}

                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? "กำลังส่งลิงก์..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  นึกออกแล้ว? กลับไป <Link href="/" className="text-blue-600 font-medium">เข้าสู่ระบบ</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
