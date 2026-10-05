export default function DatasetPreview() {
  return (
    <section className="mt-7 rounded-xl border border-[#e1e7de] bg-white p-5">
      <h2 className="font-semibold">Data preview</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-[#f5f7f3] text-xs uppercase text-[#68756b]">
            <tr>{['customer_id', 'email', 'country'].map((name) => (
              <th key={name} className="px-3 py-2">{name}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr className="border-t border-[#e1e7de]">
              <td className="px-3 py-3">C-1042</td><td className="px-3 py-3">sam@example.com</td><td className="px-3 py-3">Canada</td>
            </tr>
            <tr className="border-t border-[#e1e7de]">
              <td className="px-3 py-3">C-1043</td><td className="px-3 py-3 text-red-700">Missing</td><td className="px-3 py-3">CAN</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}