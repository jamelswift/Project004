import AdminSidebar from "@/components/admin/AdminSidebar"

export const metadata = {
  title: "Admin Panel | Project004",
  description: "IoT Admin Dashboard",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]">

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">

        {/* Top Bar (Apple Style) */}
        <header className="glass px-6 py-3 flex justify-between items-center border-b rounded-bl-3xl sticky top-0 z-50">
          
          {/* Search */}
          <input
            className="px-4 py-2 rounded-full bg-white/60 text-sm outline-none w-64 shadow-sm"
            placeholder="ค้นหาอุปกรณ์ / Logs..."
          />

          {/* User */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">ผู้ดูแลระบบ</span>

            <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
              A
            </div>
          </div>

        </header>

        {/* Page Content */}
        <div className="p-6 flex-1">
          {children}
        </div>

      </main>

    </div>
  )
}
