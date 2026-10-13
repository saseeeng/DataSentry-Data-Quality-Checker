import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  FileCheck2,
  FileSpreadsheet,
  Gauge,
  Layers,
  LoaderCircle,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import MetricCard from '../components/MetricCard'
import {
  analyzeSample,
  clearAllScans,
  deleteScan,
  downloadCleanedCsv,
  getDashboardStats,
  getSamples,
  getScans,
} from '../lib/api'

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

export default function AnalyzePage({
  file,
  setFile,
  onAnalyze,
  busy = false,
  onOpenScan,
}) {
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState(null)
  const [samples, setSamples] = useState([])
  const [loadingScans, setLoadingScans] = useState(true)
  const [loadingSampleId, setLoadingSampleId] = useState('')
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let active = true

    Promise.all([
      getScans(),
      getDashboardStats().catch(() => null),
      getSamples().catch(() => []),
    ])
      .then(([scansData, statsData, samplesData]) => {
        if (!active) return
        setScans(scansData)
        setStats(statsData)
        setSamples(samplesData)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoadingScans(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSampleScan(sampleKey) {
    setLoadingSampleId(sampleKey)
    setError('')
    try {
      const result = await analyzeSample(sampleKey)
      if (onOpenScan) onOpenScan(result.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingSampleId('')
    }
  }

  async function handleDeleteScan(e, id) {
    e.stopPropagation()
    if (!window.confirm('Delete this scan record?')) return
    try {
      await deleteScan(id)
      setScans((prev) => prev.filter((s) => s.id !== id))
      getDashboardStats().then(setStats).catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleExportCleaned(e, scan) {
    e.stopPropagation()
    try {
      await downloadCleanedCsv(scan.id, scan.file_name)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Clear all historical scans? This will reset the dashboard.')) return
    try {
      await clearAllScans()
      setScans([])
      getDashboardStats().then(setStats).catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredScans = scans.filter((scan) => {
    const matchStatus = statusFilter === 'all' || scan.status === statusFilter
    const matchSearch =
      !searchTerm.trim() ||
      scan.file_name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <p className="text-xs font-semibold tracking-wider uppercase text-emerald-700">
          Automated Quality Engine
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Data Quality Dashboard
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Run automated quality checks, identify data anomalies, and export cleaned CSVs in seconds.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Avg Quality Score"
          value={stats ? `${stats.average_quality_score}%` : '—'}
          Icon={Gauge}
          tone="emerald"
          subtitle={stats?.quality_tiers ? `${stats.quality_tiers.excellent} high quality datasets` : 'Across completed audits'}
        />
        <MetricCard
          label="Total Rows Audited"
          value={stats ? stats.total_rows_scanned.toLocaleString() : '—'}
          Icon={Layers}
          tone="blue"
          subtitle={stats ? `From ${stats.total_scans} total scans` : ''}
        />
        <MetricCard
          label="Issues Flagged"
          value={stats ? stats.total_issues_found.toLocaleString() : '—'}
          Icon={AlertTriangle}
          tone="amber"
          subtitle={stats ? `${stats.issue_by_severity.high} high severity issues` : ''}
        />
        <MetricCard
          label="Active Policies"
          value={stats ? stats.active_rules_count : '—'}
          Icon={FileCheck2}
          tone="default"
          subtitle="Custom validation rules"
        />
      </div>

      {/* Instant Demo Datasets Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Try Ready-to-Test Sample Datasets
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Instantly run quality checks on pre-configured test data with intentional real-world flaws.
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-400">1-click audit</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {samples.map((sample) => {
            const isLoading = loadingSampleId === sample.id
            return (
              <div
                key={sample.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">
                      {sample.title}
                    </span>
                    <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                      {sample.category}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3">
                  <span className="font-mono text-[11px] text-slate-400">
                    {sample.file}
                  </span>
                  <button
                    disabled={isLoading || busy}
                    onClick={() => handleSampleScan(sample.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle size={13} className="animate-spin" />
                        Scanning…
                      </>
                    ) : (
                      <>
                        <Play size={13} className="fill-current" />
                        Run Audit
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main CSV Upload Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900">Upload & Scan Custom CSV</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Upload any CSV file to inspect nulls, duplicates, emails, formatting anomalies, and validation rules.
        </p>

        <div className="mt-4">
          <FileDropzone file={file} setFile={setFile} />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {file ? `Selected: ${file.name}` : 'Supported: .csv files up to 50 MB'}
          </p>
          <button
            disabled={!file || busy}
            onClick={onAnalyze}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                Auditing Data Quality…
              </>
            ) : (
              <>
                <span>Start Quality Scan</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Scans Table Section */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-200/80 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Recent Quality Scans</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {filteredScans.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                View previous scan audit results, quality scores, and export cleaned files.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {scans.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  title="Clear all scans"
                >
                  <RotateCcw size={12} />
                  <span>Reset All</span>
                </button>
              )}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search file name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {loadingScans ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading audit history…</div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <FileSpreadsheet size={22} />
            </span>
            <p className="mt-3 text-xs font-medium text-slate-700">No scans conducted yet.</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Upload a CSV file or run one of the instant sample audits above.
            </p>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No scans match your search query.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredScans.slice(0, 10).map((scan) => {
              const badge = getScoreBadge(scan.quality_score)
              return (
                <div
                  key={scan.id}
                  onClick={() => onOpenScan?.(scan.id)}
                  className="group flex cursor-pointer flex-col gap-3 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 transition group-hover:bg-white group-hover:text-emerald-700">
                      <FileCheck2 size={18} />
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-800">
                        {scan.file_name}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{scan.row_count} rows</span>
                        <span>•</span>
                        <span>{scan.column_count} columns</span>
                        <span>•</span>
                        <span>{formatDate(scan.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${badge.style}`}
                    >
                      {badge.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleExportCleaned(e, scan)}
                        title="Export Cleaned CSV"
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-2xs transition hover:bg-slate-50 hover:text-slate-800"
                      >
                        <ArrowDownToLine size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteScan(e, scan.id)}
                        title="Delete scan"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}