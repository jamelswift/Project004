import { Suspense } from "react"
import { ResetPasswordForm } from "./reset-password-form"

function ResetPasswordSkeleton() {
  return (
    <div className="relative w-full max-w-md lg:max-w-lg">
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-200/50 to-cyan-200/50 blur-xl -z-10" />
      <div className="rounded-3xl bg-white/90 backdrop-blur border border-blue-100 shadow-xl p-8 space-y-4">
        <div className="h-12 w-12 bg-blue-100 rounded-full mx-auto" />
        <div className="h-8 bg-slate-200 rounded mx-auto w-3/4" />
        <div className="h-4 bg-slate-100 rounded mx-auto w-1/2" />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-200/40 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-cyan-200/40 rounded-full blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 text-center space-y-2">
          <p className="text-sm text-blue-600 font-semibold">ตั้งรหัสผ่านใหม่</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">รีเซ็ตรหัสผ่าน</h1>
          <p className="text-slate-600">กำหนดรหัสผ่านใหม่เพื่อเข้าสู่ระบบอีกครั้ง</p>
        </div>

        <Suspense fallback={<ResetPasswordSkeleton />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
