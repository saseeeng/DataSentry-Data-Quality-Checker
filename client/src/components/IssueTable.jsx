import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react'

export default function IssueTable({ issues = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('ALL')
  const [selectedColumn, setSelectedColumn] = useState('ALL')

  // Unique columns for dropdown
  const uniqueColumns = useMemo(() => {
    const cols = new Set(issues.map((i) => i.column).filter(Boolean))
    return ['ALL', ...Array.from(cols).sort()]
  }, [issues])

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchSeverity =
        selectedSeverity === 'ALL' ||
        issue.severity.toLowerCase() === selectedSeverity.toLowerCase()

      const matchColumn =
        selectedColumn === 'ALL' || issue.column === selectedColumn

      const term = searchTerm.toLowerCase().trim()
      const matchSearch =
        !term ||
        issue.type.toLowerCase().includes(term) ||
        issue.column.toLowerCase().includes(term) ||
        issue.fix.toLowerCase().includes(term) ||
        (issue.rows && String(issue.rows).toLowerCase().includes(term))

      return matchSeverity && matchColumn && matchSearch
    })
  }, [issues, selectedSeverity, selectedColumn, searchTerm])

  const counts = useMemo(() => {
    const total = issues.length
    const high = issues.filter((i) => i.severity.toLowerCase() === 'high').length
    const medium = issues.filter((i) => i.severity.toLowerCase() === 'medium').length
    const low = issues.filter((i) => i.severity.toLowerCase() === 'low').length
    return { total, high, medium, low }
  }, [issues])

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      {/* Header & Controls */}
      <div className="border-b border-slate-200/80 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Detected Quality Issues</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {filteredIssues.length} of {issues.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Inspect specific cell anomalies and recommended data remediation actions.
            </p>
          </div>

          {/* Severity tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedSeverity('ALL')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedSeverity === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => setSelectedSeverity('HIGH')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedSeverity === 'HIGH'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              High ({counts.high})
            </button>
            <button
              onClick={() => setSelectedSeverity('MEDIUM')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedSeverity === 'MEDIUM'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Medium ({counts.medium})
            </button>
            <button
              onClick={() => setSelectedSeverity('LOW')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedSeverity === 'LOW'
                  ? 'bg-slate-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Low ({counts.low})
            </button>
          </div>
        </div>

        {/* Search & Column Filters */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter findings by keyword, column, rule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-hidden"
            />
          </div>

          {uniqueColumns.length > 2 && (
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-2.5 pr-8 text-xs text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-hidden"
              >
                {uniqueColumns.map((col) => (
                  <option key={col} value={col}>
                    {col === 'ALL' ? 'All Columns' : `Column: ${col}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-slate-800">Clean Dataset!</h3>
          <p className="mt-1 text-xs text-slate-500">
            No data quality violations or anomalies were detected.
          </p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500">
          No issues match the selected filters or search query.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredIssues.map((issue, idx) => {
            const sev = issue.severity.toLowerCase()
            let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200'
            if (sev === 'high') badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200'
            else if (sev === 'medium') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200'

            return (
              <div
                key={issue.id ?? `${issue.type}-${idx}`}
                className="grid gap-3 p-4 transition hover:bg-slate-50/60 sm:grid-cols-[1.3fr_1fr_100px_1.8fr] sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-900 text-xs sm:text-sm">
                    {sev === 'high' ? (
                      <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                    )}
                    <span>{issue.type}</span>
                  </div>
                  <span className="mt-0.5 inline-block text-[11px] text-slate-500">
                    {issue.rows}
                  </span>
                </div>

                <div>
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                    {issue.column === '*' ? 'Entire Row' : issue.column}
                  </span>
                </div>

                <div>
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeStyle}`}
                  >
                    {issue.severity}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-600">
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>{issue.fix}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}