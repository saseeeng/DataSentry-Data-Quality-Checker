import { ListFilter } from 'lucide-react'

export default function IssueTable({ issues }) {
  return (
    <section className="mt-8 rounded-xl border border-[#e1e7de] bg-white">
      <div className="flex items-center justify-between border-b border-[#e1e7de] px-5 py-4">
        <div>
          <h2 className="font-semibold">Detected issues</h2>
          <p className="mt-1 text-sm text-[#68756b]">Review findings and suggested fixes.</p>
        </div>
        <button title="Filter issues" className="rounded-md p-2 hover:bg-[#f1f4ef]">
          <ListFilter size={18} />
        </button>
      </div>
      <div className="divide-y divide-[#e1e7de]">
        {issues.map((issue) => (
          <div key={issue.type} className="grid gap-2 px-5 py-4 sm:grid-cols-[1.2fr_1fr_100px_1.8fr] sm:items-center">
            <div className="font-medium">
              {issue.type}<p className="text-xs font-normal text-[#68756b]">{issue.rows}</p>
            </div>
            <span className="text-sm">{issue.column}</span>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs ${
              issue.severity === 'High' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'
            }`}>{issue.severity}</span>
            <span className="text-sm text-[#68756b]">{issue.fix}</span>
          </div>
        ))}
      </div>
    </section>
  )
}