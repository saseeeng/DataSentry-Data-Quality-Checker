const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${response.status})`)
  }
  return response.status === 204 ? null : response.json()
}

export function createScan(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/api/scans', { method: 'POST', body: form })
}

export const getScans = () => request('/api/scans')
export const getScan = (id) => request(`/api/scans/${id}`)
export const getPreview = (id) => request(`/api/scans/${id}/preview`)
export const getRules = () => request('/api/rules')

export const createRule = (rule) => request('/api/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(rule),
})

export const updateRule = (id, rule) => request(`/api/rules/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(rule),
})

export const deleteRule = (id) =>
  request(`/api/rules/${id}`, { method: 'DELETE' })

export async function downloadCleanedCsv(id, fileName) {
  const response = await fetch(`${API_URL}/api/scans/${id}/export`)
  if (!response.ok) throw new Error('Could not download cleaned CSV')

  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = `cleaned_${fileName}`
  link.click()
  URL.revokeObjectURL(url)
}