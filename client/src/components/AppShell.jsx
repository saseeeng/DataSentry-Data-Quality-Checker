import { CircleHelp, History, LayoutDashboard, ShieldCheck } from 'lucide-react'

const links = [
  { id: 'analyze', label: 'Analyze data', Icon: LayoutDashboard },
  { id: 'history', label: 'Scan history', Icon: History },
]

export default function AppShell({ page, setPage, children }) {
  return (
    <div className="min-h-screen bg-[#f5f7f3] text-[#1e2922] md:flex">
      <aside className="flex w-full flex-col bg-[#173b2b] px-5 py-5 text-white md:min-h-screen md:w-60">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-[#c9f36a] text-[#173b2b]">
            <ShieldCheck size={21} />
          </span>
          <span className="text-lg font-semibold">DataSentry</span>
        </div>
        <p className="mb-3 text-xs font-semibold uppercase text-white/50">Workspace</p>
        <nav className="flex gap-2 md:flex-col">
          {links.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setPage(id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                page === id ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'
              }`}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <p className="mt-auto hidden border-t border-white/15 pt-4 text-xs text-white/50 md:block">
          Local workspace
        </p>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-[#e1e7de] bg-white px-5 md:px-9">
          <span className="text-sm text-[#68756b]">Data quality workspace</span>
          <button title="Help" className="rounded-md p-2 text-[#68756b] hover:bg-[#f1f4ef]">
            <CircleHelp size={19} />
          </button>
        </header>
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-9">{children}</div>
      </main>
    </div>
  )
}