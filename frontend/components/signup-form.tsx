"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus } from "lucide-react"

export function SignupForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validatePassword = () => {
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (password.length < 6) {
      return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    }
    if (!hasLetter || !hasNumber) {
      return "รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลข"
    }
    if (password !== confirmPassword) {
      return "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน"
    }
    return ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validationError = validatePassword()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    // 🔹 ตรงนี้ในอนาคตค่อยต่อ API สมัครสมาชิก
    setTimeout(() => {
      setLoading(false)
      alert("สมัครสมาชิกสำเร็จ (ตัวอย่าง)")
    }, 800)
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border-blue-100 shadow-xl shadow-blue-100/40">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <UserPlus className="h-6 w-6" />
        </div>

        <CardTitle className="text-2xl font-bold">
          สมัครสมาชิก
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          WSN IoT Platform – ระบบจัดการเซ็นเซอร์บนคลาวด์
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อ–นามสกุล</Label>
            <Input placeholder="กรอกชื่อ–นามสกุล" />
          </div>

          <div className="space-y-2">
            <Label>อีเมล</Label>
            <Input type="email" placeholder="user@wsn.com" />
          </div>

          <div className="space-y-2">
            <Label>รหัสผ่าน</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground">
              รหัสผ่านอย่างน้อย 6 ตัวอักษร และต้องมีตัวอักษรกับตัวเลข
            </p>
          </div>

          <div className="space-y-2">
            <Label>ยืนยันรหัสผ่าน</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/" className="text-blue-600 hover:underline font-medium">
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
