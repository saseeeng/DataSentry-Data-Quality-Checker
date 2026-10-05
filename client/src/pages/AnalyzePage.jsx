import { ArrowRight, FileCheck2 } from 'lucide-react'
import FileDropzone from '../components/FileDropzone'

export default function AnalyzePage({ file, setFile, onAnalyze, setPage }) {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2 text-sm font-medium text-[#4c7a47]">DATA CHECK</p>
      <h1 className="text-3xl font-semibold tracking-tight">Start a new scan</h1>
      <p className="mt-2 text-[#68756b]">
        Upload a CSV to check its quality before it reaches your reports.
      </p>
      <FileDropzone file={file} setFile={setFile} />
      <p className="mt-3 text-sm text-[#68756b]">CSV files up to 50 MB</p>
      <button disabled={!file} onClick={onAnalyze}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#173b2b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#24543c] disabled:cursor-not-allowed disabled:opacity-40">
        Analyze file <ArrowRight size={17} />
      </button>

      <section className="mt-12 border-t border-[#e1e7de] pt-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent scans</h2>
          <button onClick={() => setPage('history')} className="text-sm text-[#4c7a47]">
            View history
          </button>
        </div>
        <div className="flex items-center justify-between border-b border-[#e1e7de] py-4 text-sm">
          <span className="flex items-center gap-3">
            <FileCheck2 size={18} className="text-[#4c7a47]" />orders_may.csv
          </span>
          <span className="text-[#68756b]">92 score · Today</span>
        </div>
      </section>
    </div>
  )
}