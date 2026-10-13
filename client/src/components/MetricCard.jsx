export default function MetricCard({ label, value, Icon, badge, subtitle, tone = 'default' }) {
  const toneClasses = {
    default: 'text-slate-500 bg-slate-50 ring-slate-100',
    emerald: 'text-emerald-600 bg-emerald-50 ring-emerald-100',
    amber: 'text-amber-600 bg-amber-50 ring-amber-100',
    rose: 'text-rose-600 bg-rose-50 ring-rose-100',
    blue: 'text-blue-600 bg-blue-50 ring-blue-100',
  }

  const currentTone = toneClasses[tone] || toneClasses.default

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {Icon && (
          <span className={`grid size-8 place-items-center rounded-lg ring-1 ${currentTone}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        {badge && (
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}