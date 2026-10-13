import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  FileCheck2,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import { clearAllScans, deleteScan, downloadCleanedCsv, getScans } from '../lib/api'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function getScoreBadge(score) {
  if (score === null || score === undefined) return { label: '—', style: 'bg-slate-100 text-slate-600 border-slate-200' }
  if (score >= 90) return { label: `${score}%`, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (score >= 75) return { label: `${score}%`, style: 'bg-blue-50 text-blue-700 border-blue-200' }
  if (score >= 50) return { label: `${score}%`, style: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: `${score}%`, style: 'bg-rose-50 text-rose-700 border-rose-200' }
}

export default function HistoryPage({ onOpenScan }) {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let active = true
    getScans()
      .then((data) => {
        if (active) setScans(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!window.confirm('Delete this scan record?')) return
    try {
      await deleteScan(id)
      setScans((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleExport(e, scan) {
    e.stopPropagation()
    try {
      await downloadCleanedCsv(scan.id, scan.file_name)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Clear all historical scans from SQLite?')) return
    try {
      await clearAllScans()
      setScans([])
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredScans = scans.filter((scan) => {
    const matchStatus = statusFilter === 'all' || scan.status === statusFilter
    const matchSearch =
      !search.trim() ||
      scan.file_name.toLowerCase().includes(search.toLowerCase().trim())
    return matchStatus && matchSearch
  })

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-emerald-700">
            Archive & Audits
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Scan History
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Review, inspect, or download results from past CSV quality audits.
          </p>
        </div>

        {scans.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-rose-600"
          >
            <RotateCcw size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-slate-400 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading audit history…</div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <FileSpreadsheet size={22} />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-slate-800">No Audits Conducted Yet</h3>
            <p className="mt-1 text-xs text-slate-500">
              Upload a CSV file from the Dashboard to start your first data quality check.
            </p>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No scans match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Dataset File</th>
                  <th className="px-5 py-3.5">Records / Columns</th>
                  <th className="px-5 py-3.5">Quality Score</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.map((scan) => {
                  const badge = getScoreBadge(scan.quality_score)
                  return (
                    <tr
                      key={scan.id}
                      onClick={() => onOpenScan?.(scan.id)}
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-600">
                            <FileCheck2 size={15} />
                          </span>
                          <span className="font-semibold text-slate-900 hover:text-emerald-700">
                            {scan.file_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <span>{scan.row_count.toLocaleString()} rows</span>
                        <span className="text-slate-400"> × {scan.column_count} cols</span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium capitalize">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          {scan.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {formatDate(scan.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleExport(e, scan)}
                            title="Export Cleaned CSV"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
                          >
                            <ArrowDownToLine size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, scan.id)}
                            title="Delete scan"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}