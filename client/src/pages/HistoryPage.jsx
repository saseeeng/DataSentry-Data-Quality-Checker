import { useState } from 'react'
import { Check } from 'lucide-react'

const scans = [
  ['customers_q3.csv', '82', '25 issues', 'Today, 10:42 AM'],
  ['orders_may.csv', '92', '6 issues', 'Yesterday, 3:18 PM'],
  ['inventory.csv', '76', '41 issues', 'Oct 2, 11:06 AM'],
]
const initialRules = ['Required values', 'Unique customer ID', 'Allowed country names']

export default function HistoryPage() {
  const [tab, setTab] = useState('Scans')
  const [rules, setRules] = useState(initialRules.map((name) => ({ name, active: true })))

  return (
    <div>
      <p className="text-sm text-[#4c7a47]">WORKSPACE</p>
      <h1 className="mt-1 text-3xl font-semibold">History & rules</h1>
      <div className="mt-7 flex gap-5 border-b border-[#dfe6dc]">
        {['Scans', 'Validation rules'].map((item) => (
          <button key={item} onClick={() => setTab(item)}
            className={`pb-3 text-sm ${tab === item ? 'border-b-2 border-[#4c7a47] font-semibold' : 'text-[#68756b]'}`}>
            {item}
          </button>
        ))}
      </div>
      {tab === 'Scans' ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#e1e7de] bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="text-xs uppercase text-[#68756b]">
              <tr>{['File', 'Score', 'Findings', 'Scanned'].map((name) => <th key={name} className="px-5 py-3">{name}</th>)}</tr>
            </thead>
            <tbody>{scans.map(([name, score, findings, date]) => (
              <tr key={name} className="border-t border-[#e1e7de]">
                <td className="px-5 py-4 font-medium">{name}</td><td className="px-5 py-4">{score}/100</td><td className="px-5 py-4">{findings}</td><td className="px-5 py-4 text-[#68756b]">{date}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-[#e1e7de] rounded-xl border border-[#e1e7de] bg-white px-5">
          {rules.map((rule, index) => (
            <div key={rule.name} className="flex items-center justify-between py-4">
              <span className="font-medium">{rule.name}</span>
              <button onClick={() => setRules((current) => current.map((item, i) =>
                i === index ? { ...item, active: !item.active } : item
              ))} className={`inline-flex items-center gap-1 text-sm ${rule.active ? 'text-[#4c7a47]' : 'text-[#68756b]'}`}>
                {rule.active && <Check size={15} />}{rule.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}