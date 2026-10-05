import { useEffect, useState } from 'react'
import { ArrowRight, FileCheck2, LoaderCircle } from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import { getScans } from '../lib/api'

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function AnalyzePage({
  file,
  setFile,
  onAnalyze,
  setPage,
  busy = false,
  onOpenScan,
}) {
  const [scans, setScans] = useState([])
  const [loadingScans, setLoadingScans] = useState(true)
  const [historyError, setHistoryError] = useState('')

  useEffect(() => {
    let active = true

    getScans()
      .then((data) => {
        if (active) setScans(data)
      })
      .catch((error) => {
        if (active) setHistoryError(error.message)
      })
      .finally(() => {
        if (active) setLoadingScans(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2 text-sm font-medium text-[#4c7a47]">DATA CHECK</p>
      <h1 className="text-3xl font-semibold tracking-tight">Start a new scan</h1>
      <p className="mt-2 text-[#68756b]">
        Upload a CSV to check its quality before it reaches your reports.
      </p>

      <FileDropzone file={file} setFile={setFile} />
      <p className="mt-3 text-sm text-[#68756b]">CSV files up to 50 MB</p>

      <button
        disabled={!file || busy}
        onClick={onAnalyze}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#173b2b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#24543c] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            Analyze file <ArrowRight size={17} />
          </>
        )}
      </button>

      <section className="mt-12 border-t border-[#e1e7de] pt-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent scans</h2>
          <button
            onClick={() => setPage('history')}
            className="text-sm text-[#4c7a47]"
          >
            View history
          </button>
        </div>

        {historyError && (
          <p role="alert" className="py-3 text-sm text-red-700">
            Could not load recent scans: {historyError}
          </p>
        )}

        {loadingScans && (
          <p className="py-4 text-sm text-[#68756b]">Loading scans…</p>
        )}

        {!loadingScans && !historyError && scans.length === 0 && (
          <p className="py-4 text-sm text-[#68756b]">No scans yet.</p>
        )}

        {scans.slice(0, 5).map((scan) => (
          <button
            key={scan.id}
            onClick={() => onOpenScan?.(scan.id)}
            className="flex w-full items-center justify-between gap-4 border-b border-[#e1e7de] py-4 text-left text-sm hover:bg-white"
          >
            <span className="flex min-w-0 items-center gap-3">
              <FileCheck2 size={18} className="shrink-0 text-[#4c7a47]" />
              <span className="truncate font-medium">{scan.file_name}</span>
            </span>
            <span className="shrink-0 text-right text-[#68756b]">
              {scan.quality_score ?? '—'} score
              <span className="block text-xs">{formatDate(scan.created_at)}</span>
            </span>
          </button>
        ))}
      </section>
    </div>
  )
}