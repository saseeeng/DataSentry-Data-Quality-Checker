import { useState } from 'react'
import AppShell from './components/AppShell'
import AnalyzePage from './pages/AnalyzePage'
import ReportPage from './pages/ReportPage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  const [page, setPage] = useState('analyze')
  const [file, setFile] = useState(null)

  function startNewScan() {
    setFile(null)
    setPage('analyze')
  }

  return (
    <AppShell page={page} setPage={setPage}>
      {page === 'analyze' && (
        <AnalyzePage file={file} setFile={setFile} setPage={setPage} onAnalyze={() => setPage('report')} />
      )}
      {page === 'report' && (
        <ReportPage fileName={file?.name ?? 'customers_q3.csv'} onNewScan={startNewScan} />
      )}
      {page === 'history' && <HistoryPage />}
    </AppShell>
  )
}