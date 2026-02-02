import Section from "./Section"

export default function DeviceStatusSummary() {
  return (
    <Section title="แนวโน้มอุณหภูมิและความชื้น">
      <div className="h-56 glass rounded-2xl flex items-center justify-center text-gray-400">
        📊 กราฟเซ็นเซอร์ (Real-time เมื่อเชื่อม Cloud)
      </div>
    </Section>
  )
}
