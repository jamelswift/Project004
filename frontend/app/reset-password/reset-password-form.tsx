"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

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

import { ShieldCheck } from "lucide-react"
import { resetPassword } from "@/lib/auth"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const userId = searchParams.get("userId") || ""

  const hasToken = useMemo(() => Boolean(token && userId), [token, userId])

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!hasToken) {
      setError("ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุ")
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน")
      return
    }

    setLoading(true)
    try {
      const message = await resetPassword({ userId, token, newPassword })
      setSuccess(message || "รีเซ็ตรหัสผ่านสำเร็จแล้ว")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md lg:max-w-lg">
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-200/50 to-cyan-200/50 blur-xl -z-10" />

      <Card className="rounded-3xl bg-white/90 backdrop-blur border border-blue-100 shadow-xl">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <CardTitle className="text-2xl lg:text-3xl font-bold">ตั้งรหัสผ่านใหม่</CardTitle>
          <CardDescription className="text-sm lg:text-base">
            ลิงก์นี้มีอายุ 15 นาทีหลังจากที่ส่งอีเมล
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!hasToken && (
              <div className="text-sm text-red-600 bg-red-50 rounded p-2 text-center">
                ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุ
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-blue-50/60"
                minLength={6}
                disabled={!hasToken}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-blue-50/60"
                minLength={6}
                disabled={!hasToken}
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

            <Button
              className="w-full h-11 bg-blue-600 hover:bg-blue-700"
              type="submit"
              disabled={loading || !hasToken}
            >
              {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              กลับไป <Link href="/" className="text-blue-600 font-medium">เข้าสู่ระบบ</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
