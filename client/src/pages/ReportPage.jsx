import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  Check,
  FileCheck2,
  Gauge,
  TriangleAlert,
} from 'lucide-react'
import DatasetPreview from '../components/DatasetPreview'
import IssueTable from '../components/IssueTable'
import MetricCard from '../components/MetricCard'
import { downloadCleanedCsv, getPreview } from '../lib/api.js'

function titleCase(value = '') {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function ReportPage({ scan, onNewScan }) {
  const [preview, setPreview] = useState({ columns: [], rows: [] })
  const [previewError, setPreviewError] = useState('')
  const [exportError, setExportError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let active = true

    getPreview(scan.id)
      .then((data) => {
        if (active) setPreview(data)
      })
      .catch((error) => {
        if (active) setPreviewError(error.message)
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
    severity: titleCase(issue.severity),
    fix: issue.suggestion,
  }))

  async function handleExport() {
    setDownloading(true)
    setExportError('')
    try {
      await downloadCleanedCsv(scan.id, scan.file_name)
    } catch (error) {
      setExportError(error.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <button onClick={onNewScan} className="mb-5 text-sm text-[#4c7a47]">
        ← New scan
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#68756b]">SCAN REPORT</p>
          <h1 className="mt-1 break-all text-3xl font-semibold">{scan.file_name}</h1>
        </div>
        <button
          onClick={handleExport}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#d5ded2] bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          <ArrowDownToLine size={17} />
          {downloading ? 'Preparing…' : 'Export cleaned CSV'}
        </button>
      </div>

      {exportError && (
        <p role="alert" className="mt-3 text-sm text-red-700">{exportError}</p>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Quality score"
          value={`${scan.quality_score ?? '—'} / 100`}
          Icon={Gauge}
        />
        <MetricCard label="Rows scanned" value={scan.row_count} Icon={FileCheck2} />
        <MetricCard label="Issues found" value={issues.length} Icon={TriangleAlert} />
        <MetricCard label="Scan status" value={titleCase(scan.status)} Icon={Check} />
      </div>

      {scan.metrics && (
        <p className="mt-5 text-sm text-[#68756b]">
          Missing: {scan.metrics.missing_count}
          {' · '}Duplicates: {scan.metrics.duplicate_count}
          {' · '}Invalid: {scan.metrics.invalid_count}
          {' · '}Inconsistent: {scan.metrics.inconsistent_count}
        </p>
      )}

      <IssueTable issues={issues} />

      {previewError && (
        <p className="mt-4 text-sm text-[#68756b]">
          Preview unavailable: {previewError}
        </p>
      )}
      <DatasetPreview columns={preview.columns} rows={preview.rows} />
    </div>
  )
}