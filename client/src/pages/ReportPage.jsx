import { ArrowDownToLine, Check, FileCheck2, Gauge, TriangleAlert } from 'lucide-react'
import DatasetPreview from '../components/DatasetPreview'
import IssueTable from '../components/IssueTable'
import MetricCard from '../components/MetricCard'

const issues = [
  { type: 'Missing values', column: 'email', rows: '12 rows', severity: 'High', fix: 'Fill or remove empty values' },
  { type: 'Duplicate records', column: 'customer_id', rows: '8 rows', severity: 'Medium', fix: 'Keep the first matching record' },
  { type: 'Inconsistent values', column: 'country', rows: '5 rows', severity: 'Low', fix: 'Standardize country names' },
]

export default function ReportPage({ fileName, onNewScan }) {
  function exportCsv() {
    const content = 'issue_type,column,severity,suggestion\n' +
      issues.map((item) => `${item.type},${item.column},${item.severity},${item.fix}`).join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'datasentry-issues.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <button onClick={onNewScan} className="mb-5 text-sm text-[#4c7a47]">← New scan</button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm text-[#68756b]">SCAN REPORT</p><h1 className="mt-1 text-3xl font-semibold">{fileName}</h1></div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-[#d5ded2] bg-white px-4 py-2.5 text-sm font-medium">
          <ArrowDownToLine size={17} />Export issues
        </button>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Quality score" value="82 / 100" Icon={Gauge} />
        <MetricCard label="Rows scanned" value="1,248" Icon={FileCheck2} />
        <MetricCard label="Issues found" value="25" Icon={TriangleAlert} />
        <MetricCard label="Scan status" value="Complete" Icon={Check} />
      </div>
      <IssueTable issues={issues} />
      <DatasetPreview />
    </div>
  )
}