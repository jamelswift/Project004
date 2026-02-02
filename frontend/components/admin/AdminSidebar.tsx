"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const menu = [
  { href: "/admin", label: "แดชบอร์ด", icon: "📊" },
  { href: "/admin/devices", label: "อุปกรณ์", icon: "📡" },
  { href: "/admin/logs", label: "บันทึกระบบ", icon: "📜" },
  { href: "/admin/system", label: "สถานะระบบ", icon: "🛡️" },
  { href: "/admin/settings", label: "ตั้งค่า", icon: "⚙️" },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const cleanPath = pathname.replace(/\/$/, "")

  return (
    <aside className="w-56 glass p-4 shadow-xl rounded-r-3xl sticky top-0 h-screen">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center font-bold">
          IoT
        </div>
        <div>
          <p className="text-sm font-semibold">Admin Panel</p>
          <p className="text-xs text-gray-500">Project004</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="space-y-1 text-sm">
        {menu.map((item) => {
          const active =
            cleanPath === item.href ||
            (item.href !== "/admin" && cleanPath.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
                ${
                  active
                    ? "bg-white shadow-md text-blue-600 font-semibold scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/30"
                }
              `}
            >
              {active && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
              )}

              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
