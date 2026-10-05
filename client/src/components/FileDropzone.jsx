import { useState } from 'react'
import { FileUp } from 'lucide-react'

export default function FileDropzone({ file, setFile }) {
  const [error, setError] = useState('')

  function accept(candidate) {
    if (!candidate) return
    if (!candidate.name.toLowerCase().endsWith('.csv')) {
      setError('Choose a CSV file.')
      return
    }
    setError('')
    setFile(candidate)
  }

  return (
    <label
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        accept(event.dataTransfer.files[0])
      }}
      className="mt-8 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#b8c9b4] bg-white px-5 text-center hover:border-[#4c7a47]"
    >
      <input type="file" accept=".csv,text/csv" className="sr-only"
        onChange={(event) => accept(event.target.files[0])} />
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-[#edf4e9] text-[#4c7a47]">
        <FileUp size={23} />
      </span>
      <span className="font-semibold">{file?.name ?? 'Drop your CSV file here'}</span>
      <span className="mt-1 text-sm text-[#68756b]">
        {file ? 'Ready to analyze' : 'or click to browse your files'}
      </span>
      {error && <span className="mt-3 text-sm text-red-700">{error}</span>}
    </label>
  )
}