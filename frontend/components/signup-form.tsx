"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser, setCurrentUser } from "@/lib/auth"

export function SignupForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // ตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
      if (password !== confirmPassword) {
        setError("รหัสผ่านไม่ตรงกัน")
        setLoading(false)
        return
      }

      // ลงทะเบียนผู้ใช้
      const result = registerUser(email, password, name)

      if (result.success && result.user) {
        // บันทึกข้อมูลผู้ใช้และเข้าสู่ระบบทันที
        setCurrentUser(result.user)

        // ไปยังหน้า dashboard
        router.push("/dashboard")
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการสมัครสมาชิก")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">สมัครสมาชิก WSN Platform</CardTitle>
        <CardDescription className="text-center">สร้างบัญชีผู้ใช้งานใหม่สำหรับระบบ IoT</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อ-นามสกุล</Label>
            <Input
              id="name"
              type="text"
              placeholder="กรอกชื่อ-นามสกุล"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/30 p-3 rounded">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            มีบัญชีผู้ใช้แล้ว?{" "}
            <Link href="/" className="text-primary hover:underline font-medium">
              เข้าสู่ระบบ
            </Link>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded space-y-1">
            <p className="font-semibold">หมายเหตุ:</p>
            <p>• รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
            <p>• บัญชีใหม่จะได้รับสิทธิ์ผู้ใช้งานทั่วไป (User)</p>
            <p>• หลังสมัครสำเร็จจะเข้าสู่ระบบอัตโนมัติ</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
