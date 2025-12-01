"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticateUser, setCurrentUser } from "@/lib/auth"

export function LoginForm() {
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
      const user = authenticateUser(email, password)

      if (user) {
        setCurrentUser(user)

        // Redirect based on role
        if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">เข้าสู่ระบบ WSN Platform</CardTitle>
        <CardDescription className="text-center">ระบบจัดการเซ็นเซอร์และอุปกรณ์ควบคุมแบบไร้สาย</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@wsn.com"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/30 p-2 rounded">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชีผู้ใช้?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              สมัครสมาชิก
            </Link>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded space-y-1">
            <p className="font-semibold">ข้อมูลทดสอบ:</p>
            <p>ผู้ใช้ทั่วไป: user@wsn.com</p>
            <p>ผู้ดูแลระบบ: admin@wsn.com</p>
            <p>รหัสผ่าน: password123</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
