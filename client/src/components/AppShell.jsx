import { useState } from 'react'
import {
  CircleHelp,
  Database,
  History,
  Info,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'

const navLinks = [
  { id: 'analyze', label: 'Dashboard', Icon: LayoutDashboard, desc: 'Overview & Scanner' },
  { id: 'history', label: 'Scan History', Icon: History, desc: 'Audit records' },
  { id: 'rules', label: 'Validation Rules', Icon: SlidersHorizontal, desc: 'Quality policies' },
]

export default function AppShell({ page, setPage, onNewScan, children }) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 md:flex">
      {/* Sidebar */}
      <aside className="flex w-full flex-col border-b border-slate-200/80 bg-white px-5 py-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        {/* Brand */}
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10">
              <ShieldCheck size={20} className="text-emerald-400" />
            </span>
            <div>
              <span className="text-base font-semibold tracking-tight text-slate-900">DataSentry</span>
              <span className="block text-[11px] font-medium text-slate-400">Data Quality Platform</span>
            </div>
          </div>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            v0.2
          </span>
        </div>

        {/* Quick Action */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (onNewScan) onNewScan()
              else setPage('analyze')
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
          >
            <PlusCircle size={15} />
            <span>New Quality Scan</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        <nav className="flex flex-col gap-1">
          {navLinks.map(({ id, label, Icon }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  active
                    ? 'bg-slate-100/90 text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={17}
                    className={`transition ${
                      active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{label}</span>
                </div>
                {active && (
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Database & Environment Status Footer */}
        <div className="mt-auto hidden border-t border-slate-100 pt-4 md:block">
          <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-medium text-slate-700">SQLite Engine</span>
            </div>
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
              <Database size={12} /> Local
            </span>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Zero-config pure SQLite backend
          </p>
        </div>
      </aside>

      {/* Main Area */}
      <main className="min-w-0 flex-1">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-xs md:px-9">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-slate-800">
              {page === 'analyze' && 'Quality Scanner & Overview'}
              {page === 'report' && 'Audit Results & Profiling'}
              {page === 'history' && 'Scan History Archive'}
              {page === 'rules' && 'Validation Rule Policies'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Ready for CSV Analysis</span>
            </div>

            <button
              onClick={() => setShowHelp(!showHelp)}
              title="About DataSentry"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 p-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <CircleHelp size={16} />
              <span className="hidden sm:inline">Help</span>
            </button>
          </div>
        </header>

        {/* Optional Help Banner */}
        {showHelp && (
          <div className="border-b border-emerald-100 bg-emerald-50/60 px-5 py-3.5 text-xs text-emerald-900 md:px-9">
            <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <Info size={16} className="mt-0.5 shrink-0 text-emerald-700" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-950">Welcome to DataSentry</p>
                  <p className="text-emerald-800">
                    DataSentry automatically detects missing values, duplicates, invalid email formats, and inconsistent text casing in CSV files. You can configure custom validation rules, profile columns, and export cleaned CSVs with 1 click. Powered by SQLite and FastAPI.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-emerald-700 hover:text-emerald-950"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Content View */}
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-9">{children}</div>
      </main>
    </div>
  )
}