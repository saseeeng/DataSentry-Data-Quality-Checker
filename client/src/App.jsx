import { useState } from 'react'
import AppShell from './components/AppShell'
import RulesManager from './components/RulesManager'
import AnalyzePage from './pages/AnalyzePage'
import HistoryPage from './pages/HistoryPage'
import ReportPage from './pages/ReportPage'
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
      const newScan = await createScan(file)
      setScan(newScan)
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
      const scanData = await getScan(id)
      setScan(scanData)
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
    <AppShell page={page} setPage={setPage} onNewScan={startNewScan}>
      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 shadow-2xs">
          {error}
        </div>
      )}
      {page === 'analyze' && (
        <AnalyzePage
          file={file}
          setFile={setFile}
          setPage={setPage}
          onAnalyze={handleAnalyze}
          busy={busy}
          onOpenScan={openScan}
        />
      )}
      {page === 'report' && scan && (
        <ReportPage scan={scan} onNewScan={startNewScan} />
      )}
      {page === 'history' && <HistoryPage onOpenScan={openScan} />}
      {page === 'rules' && <RulesManager />}
    </AppShell>
  )
}