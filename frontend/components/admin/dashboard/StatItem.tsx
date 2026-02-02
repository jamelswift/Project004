export default function StatItem({
  title,
  value,
  icon,
  gradient,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <div className="glass p-5 rounded-3xl shadow-sm flex justify-between items-center">
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <h3 className="text-2xl font-semibold">{value}</h3>
      </div>

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl ${gradient}`}>
        {icon}
      </div>
    </div>
  )
}
