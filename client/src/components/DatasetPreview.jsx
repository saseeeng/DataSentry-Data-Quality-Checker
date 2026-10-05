export default function DatasetPreview({ columns = [], rows = [] }) {
  return (
    <section className="mt-7 rounded-xl border border-[#e1e7de] bg-white p-5">
      <h2 className="font-semibold">Data preview</h2>
      <div className="mt-4 overflow-x-auto">
        {!columns.length ? <p className="text-sm text-[#68756b]">No preview available.</p> : (
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-[#f5f7f3] text-xs uppercase text-[#68756b]">
              <tr>{columns.map((col) => <th key={col} className="px-3 py-2">{col}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-[#e1e7de]">
                  {columns.map((col) => <td key={col} className="px-3 py-3">{row[col] ?? ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}