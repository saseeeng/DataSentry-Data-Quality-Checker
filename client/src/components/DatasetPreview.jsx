import { useState } from 'react'
import { Search } from 'lucide-react'

export default function DatasetPreview({ columns = [], rows = [], totalRows }) {
  const [search, setSearch] = useState('')

  const filteredRows = rows.filter((row) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return Object.values(row).some((val) =>
      String(val ?? '').toLowerCase().includes(term)
    )
  })

  return (
    <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="border-b border-slate-200/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Dataset Preview</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                Showing {filteredRows.length} {totalRows ? `of ${totalRows}` : 'rows'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Raw record inspection with instant text filtering.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search in preview..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {!columns.length ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No preview records available.
          </div>
        ) : (
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-12 px-4 py-3 text-center text-slate-400">#</th>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 font-mono font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row, index) => (
                <tr key={index} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-400">
                    {index + 1}
                  </td>
                  {columns.map((col) => {
                    const value = row[col]
                    const isEmpty =
                      value === null ||
                      value === undefined ||
                      String(value).trim() === ''

                    return (
                      <td key={col} className="px-4 py-3 font-mono text-slate-800">
                        {isEmpty ? (
                          <span className="italic text-slate-300">null</span>
                        ) : (
                          String(value)
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}