import Link from "next/link"
import Section from "./Section"

export default function QuickActions() {
  return (
    <Section title="คำสั่งด่วนสำหรับผู้ดูแลระบบ">
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/admin/devices"
          className="rounded-2xl bg-blue-600 text-white px-4 py-3 text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg transition text-center"
        >
          + ไปหน้า “จัดการอุปกรณ์”
        </Link>

        <Link
          href="/admin/settings"
          className="rounded-2xl bg-white border border-gray-200 text-gray-800 px-4 py-3 text-sm font-semibold hover:shadow-sm transition text-center"
        >
          ไปหน้า “ตั้งค่า Threshold/แจ้งเตือน”
        </Link>

        <Link
          href="/admin/logs"
          className="rounded-2xl bg-white border border-gray-200 text-gray-800 px-4 py-3 text-sm font-semibold hover:shadow-sm transition text-center"
        >
          ไปหน้า “บันทึกระบบ (Logs)”
        </Link>

        <Link
          href="/admin/users"
          className="rounded-2xl bg-white border border-gray-200 text-gray-800 px-4 py-3 text-sm font-semibold hover:shadow-sm transition text-center"
        >
          ไปหน้า “ผู้ใช้งานระบบ”
        </Link>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        หมายเหตุ: คำสั่งควบคุมจริง (เช่น Restart/Toggle) จะอยู่ในหน้า “อุปกรณ์” เมื่อ Backend รองรับ API
      </div>
    </Section>
  )
}
