import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  Check,
  Columns,
  Eye,
  FileCheck2,
  Gauge,
  ListChecks,
} from 'lucide-react'
import ColumnProfileTable from '../components/ColumnProfileTable'
import DatasetPreview from '../components/DatasetPreview'
import IssueTable from '../components/IssueTable'
import MetricCard from '../components/MetricCard'
import { downloadCleanedCsv, getPreview, getScanProfile } from '../lib/api'

function titleCase(value = '') {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function ReportPage({ scan, onNewScan }) {
  const [activeTab, setActiveTab] = useState('issues') // 'issues', 'profile', 'preview'
  const [preview, setPreview] = useState({ columns: [], rows: [], total_rows: 0 })
  const [columnProfiles, setColumnProfiles] = useState([])
  const [previewError, setPreviewError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [exportError, setExportError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [cleaningMode, setCleaningMode] = useState('standard')

  useEffect(() => {
    let active = true

    getPreview(scan.id, 50)
      .then((data) => {
        if (active) setPreview(data)
      })
      .catch((error) => {
        if (active) setPreviewError(error.message)
      })

    getScanProfile(scan.id)
      .then((data) => {
        if (active) setColumnProfiles(data.columns || [])
      })
      .catch((error) => {
        if (active) setProfileError(error.message)
      })

    return () => {
      active = false
    }
  }, [scan.id])

  const issues = (scan.issues ?? []).map((issue) => ({
    id: issue.id,
    type: titleCase(issue.issue_type),
    column: issue.column_name,
    rows: issue.row_number == null ? 'Dataset' : `Row ${issue.row_number}`,
    severity: issue.severity ? titleCase(issue.severity) : 'Medium',
    fix: issue.suggestion,
  }))

  async function handleExport() {
    setDownloading(true)
    setExportError('')
    try {
      await downloadCleanedCsv(scan.id, scan.file_name, cleaningMode)
    } catch (error) {
      setExportError(error.message)
    } finally {
      setDownloading(false)
    }
  }

  const score = scan.quality_score ?? 0
  let scoreTone = 'emerald'
  let scoreGrade = 'High Quality'
  if (score < 50) {
    scoreTone = 'rose'
    scoreGrade = 'Critical Attention Needed'
  } else if (score < 75) {
    scoreTone = 'amber'
    scoreGrade = 'Moderate Quality'
  } else if (score < 90) {
    scoreTone = 'blue'
    scoreGrade = 'Good Quality'
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back button */}
      <div>
        <button
          onClick={onNewScan}
          className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Report Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quality Audit Report
          </span>
          <h1 className="mt-1 break-all text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {scan.file_name}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Scan ID #{scan.id} • Processed on{' '}
            {new Date(scan.created_at).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>

        {/* Clean & Export Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cleaningMode}
            onChange={(e) => setCleaningMode(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-slate-400 focus:outline-hidden"
          >
            <option value="standard">Standard: Deduplicate & Trim</option>
            <option value="drop_missing">Strict: Drop Incomplete Rows</option>
            <option value="fill_defaults">Impute: Fill Missing Defaults</option>
          </select>

          <button
            onClick={handleExport}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <ArrowDownToLine size={15} />
            <span>{downloading ? 'Preparing File…' : 'Export Cleaned CSV'}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {exportError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Quality Score"
          value={`${scan.quality_score ?? '—'} / 100`}
          Icon={Gauge}
          tone={scoreTone}
          badge={scoreGrade}
        />
        <MetricCard
          label="Total Rows"
          value={scan.row_count?.toLocaleString()}
          Icon={FileCheck2}
          subtitle={`${scan.column_count} columns evaluated`}
        />
        <MetricCard
          label="Quality Issues"
          value={issues.length}
          Icon={AlertTriangle}
          tone={issues.length > 0 ? 'amber' : 'emerald'}
          subtitle={issues.length === 0 ? 'Zero defects found' : 'Remediation needed'}
        />
        <MetricCard
          label="Audit Status"
          value={titleCase(scan.status)}
          Icon={Check}
          tone="emerald"
          subtitle="Analysis complete"
        />
      </div>

      {/* Categorical Breakdown Bar */}
      {scan.metrics && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-5 py-3 text-xs text-slate-600 shadow-2xs">
          <span className="font-semibold text-slate-700">Findings Breakdown:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-300" />
            <span>Missing Cells: {scan.metrics.missing_count}</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400" />
            <span>Duplicates: {scan.metrics.duplicate_count}</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-purple-400" />
            <span>Invalid Format: {scan.metrics.invalid_count}</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-400" />
            <span>Inconsistent: {scan.metrics.inconsistent_count}</span>
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200/80">
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'issues'
              ? 'border-emerald-600 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListChecks size={15} />
          <span>Issues & Fixes ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Columns size={15} />
          <span>Column Profiling ({columnProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'preview'
              ? 'border-emerald-600 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye size={15} />
          <span>Raw Data Preview</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'issues' && <IssueTable issues={issues} />}

      {activeTab === 'profile' && (
        <>
          {profileError && (
            <p className="text-xs text-rose-600">{profileError}</p>
          )}
          <ColumnProfileTable columns={columnProfiles} />
        </>
      )}

      {activeTab === 'preview' && (
        <>
          {previewError && (
            <p className="text-xs text-rose-600">Preview error: {previewError}</p>
          )}
          <DatasetPreview
            columns={preview.columns}
            rows={preview.rows}
            totalRows={preview.total_rows || scan.row_count}
          />
        </>
      )}
    </div>
  )
}