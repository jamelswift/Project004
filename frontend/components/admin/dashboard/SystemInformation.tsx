import Section from "./Section"

export default function SystemInformation() {
  return (
    <Section title="สุขภาพระบบ (System Health)">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">สถานะโดยรวม</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">ระบบทำงานปกติ</div>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          ปกติ
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4">
        <div className="text-xs text-gray-600">สถานะ Cloud IoT</div>
        <div className="mt-1 text-sm font-semibold text-gray-900">
          พร้อมใช้งาน (รอเซ็นเซอร์จริง)
        </div>

        <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
          <div className="h-full w-[85%] bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">ความพร้อมในการเชื่อมข้อมูล: 85%</div>
      </div>
    </Section>
  )
}
