import { useState } from 'react'
import AppShell from './components/AppShell'
import AnalyzePage from './pages/AnalyzePage'
import ReportPage from './pages/ReportPage'
import HistoryPage from './pages/HistoryPage'
import { createScan, getScan } from './lib/api'

export default function App() {
  const [page, setPage] = useState('analyze')
  const [file, setFile] = useState(null)
  const [scan, setScan] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!file || busy) return
    setBusy(true)
    setError('')
    try {
      setScan(await createScan(file))
      setPage('report')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function openScan(id) {
    setError('')
    try {
      setScan(await getScan(id))
      setPage('report')
    } catch (err) {
      setError(err.message)
    }
  }

  function startNewScan() {
    setFile(null)
    setScan(null)
    setError('')
    setPage('analyze')
  }

  return (
    <AppShell page={page} setPage={setPage}>
      {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {page === 'analyze' && (
        <AnalyzePage file={file} setFile={setFile} setPage={setPage}
          onAnalyze={handleAnalyze} busy={busy} onOpenScan={openScan} />
      )}
      {page === 'report' && scan && (
        <ReportPage scan={scan} onNewScan={startNewScan} />
      )}
      {page === 'history' && <HistoryPage onOpenScan={openScan} />}
    </AppShell>
  )
}