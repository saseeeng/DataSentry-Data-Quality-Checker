import { useState } from 'react'
import { CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function FileDropzone({ file, setFile }) {
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  function accept(candidate) {
    if (!candidate) return
    if (!candidate.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file.')
      return
    }
    setError('')
    setFile(candidate)
  }

  return (
    <div className="relative">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          accept(e.dataTransfer.files[0])
        }}
        className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10'
            : file
            ? 'border-emerald-300 bg-emerald-50/20'
            : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'
        }`}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => accept(e.target.files[0])}
        />

        {file ? (
          <div className="flex flex-col items-center">
            <span className="grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
              <CheckCircle2 size={24} />
            </span>
            <div className="mt-3 text-center">
              <span className="font-semibold text-slate-900">{file.name}</span>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatBytes(file.size)} • Ready to analyze
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
                setError('')
              }}
              className="mt-3 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50"
            >
              <X size={13} />
              <span>Choose different file</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-200">
              <Upload size={22} className="text-slate-700" />
            </span>
            <span className="mt-3 text-sm font-semibold text-slate-800">
              Drag & drop your CSV file here
            </span>
            <span className="mt-1 text-xs text-slate-500">
              or <span className="text-emerald-600 underline underline-offset-2">browse files</span> from your computer
            </span>
            <span className="mt-3 flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              <FileSpreadsheet size={13} />
              Up to 50 MB supported
            </span>
          </div>
        )}
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}