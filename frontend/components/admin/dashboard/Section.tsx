export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-5 rounded-3xl shadow-sm">
      <h2 className="text-md font-semibold mb-3">{title}</h2>
      {children}
    </div>
  )
}
