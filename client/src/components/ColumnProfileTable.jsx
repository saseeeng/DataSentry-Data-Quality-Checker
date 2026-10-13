import { useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Hash,
  Mail,
  Search,
  Type,
} from 'lucide-react'

function getTypeIcon(type = '') {
  switch (type.toLowerCase()) {
    case 'integer':
    case 'float':
    case 'numeric':
      return <Hash size={13} className="text-blue-500" />
    case 'email':
      return <Mail size={13} className="text-purple-500" />
    case 'datetime':
    case 'date':
      return <Calendar size={13} className="text-amber-500" />
    default:
      return <Type size={13} className="text-slate-500" />
  }
}

export default function ColumnProfileTable({ columns = [] }) {
  const [search, setSearch] = useState('')

  const filteredColumns = columns.filter((col) =>
    col.column_name.toLowerCase().includes(search.toLowerCase().trim())
  )

  if (!columns.length) {
    return (
      <div className="mt-7 rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-xs text-slate-500">
        Column profiling data is loading or unavailable.
      </div>
    )
  }

  return (
    <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="border-b border-slate-200/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Column Schema & Quality Profile
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {columns.length} columns profiled
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Inferred data types, null counts, uniqueness, and column health metrics.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search column..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Column</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Missing / Nulls</th>
              <th className="px-5 py-3">Distinct Values</th>
              <th className="px-5 py-3">Sample Values</th>
              <th className="px-5 py-3 text-right">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredColumns.map((col) => {
              const nullPct = col.null_percentage ?? 0
              let healthBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200'
              let HealthIcon = CheckCircle2
              let healthText = 'Healthy'

              if (col.health_status === 'critical') {
                healthBadge = 'bg-rose-50 text-rose-700 border-rose-200'
                HealthIcon = AlertCircle
                healthText = 'Critical'
              } else if (col.health_status === 'warning') {
                healthBadge = 'bg-amber-50 text-amber-700 border-amber-200'
                HealthIcon = AlertCircle
                healthText = 'Warning'
              }

              return (
                <tr key={col.column_name} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-900 font-mono">
                      {col.column_name}
                    </span>
                    {col.issue_count > 0 && (
                      <span className="ml-2 inline-block rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-700 border border-amber-200">
                        {col.issue_count} {col.issue_count === 1 ? 'issue' : 'issues'}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {getTypeIcon(col.inferred_type)}
                      <span>{col.inferred_type}</span>
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="w-36">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-700">{nullPct}%</span>
                        <span className="text-slate-400">({col.null_count} rows)</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            nullPct > 20
                              ? 'bg-rose-500'
                              : nullPct > 5
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(nullPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-600">
                    <span className="font-semibold text-slate-800">{col.unique_count}</span>
                    <span className="text-slate-400"> ({col.unique_percentage}%)</span>
                    {col.min_val !== null && col.min_val !== undefined && (
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        range: {col.min_val} to {col.max_val}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {col.sample_values && col.sample_values.length > 0 ? (
                        col.sample_values.map((v, i) => (
                          <span
                            key={i}
                            className="inline-block max-w-[120px] truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600"
                            title={v}
                          >
                            {v}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">none</span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${healthBadge}`}
                    >
                      <HealthIcon size={12} />
                      <span>{healthText}</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
