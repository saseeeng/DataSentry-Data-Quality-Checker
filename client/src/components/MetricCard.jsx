export default function MetricCard({ label, value, Icon }) {
  return (
    <div className="rounded-xl border border-[#e1e7de] bg-white p-4">
      <div className="flex items-center justify-between text-sm text-[#68756b]">
        <span>{label}</span><Icon size={17} />
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}