"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

import { authenticateUser, setCurrentUser } from "@/lib/auth"
import { ShieldCheck } from "lucide-react"

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
        router.push(user.role === "admin" ? "/admin" : "/dashboard")
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md lg:max-w-lg">

      {/* glow */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-200/50 to-cyan-200/50 blur-xl -z-10" />

      <Card className="rounded-3xl bg-white/90 backdrop-blur border border-blue-100 shadow-xl">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <CardTitle className="text-2xl lg:text-3xl font-bold">
            เข้าสู่ระบบ
          </CardTitle>

          <CardDescription className="text-sm lg:text-base">
            WSN IoT Platform – ระบบจัดการเซ็นเซอร์บนคลาวด์
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">

            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@wsn.com"
                className="h-11 bg-blue-50/60"
              />
            </div>

            <div className="space-y-2">
              <Label>รหัสผ่าน</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-blue-50/60"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded p-2 text-center">
                {error}
              </div>
            )}

            <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ยังไม่มีบัญชีผู้ใช้?{" "}
              <Link href="/signup" className="text-blue-600 font-medium">
                สมัครสมาชิก
              </Link>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Demo Account</p>
              <p>user@wsn.com / admin@wsn.com</p>
              <p>password: password123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
