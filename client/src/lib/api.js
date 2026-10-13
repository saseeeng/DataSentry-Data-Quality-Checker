const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${response.status})`)
  }
  return response.status === 204 ? null : response.json()
}

// Scans
export function createScan(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/api/scans', { method: 'POST', body: form })
}

export const getScans = (params = {}) => {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return request(`/api/scans${qs}`)
}

export const getScan = (id) => request(`/api/scans/${id}`)

export const deleteScan = (id) => request(`/api/scans/${id}`, { method: 'DELETE' })

export const clearAllScans = () => request('/api/scans', { method: 'DELETE' })

export const getDashboardStats = () => request('/api/scans/stats')

export const getSamples = () => request('/api/scans/samples')

export const analyzeSample = (sampleKey) => request(`/api/scans/sample/${sampleKey}`, { method: 'POST' })

export const getScanProfile = (id) => request(`/api/scans/${id}/profile`)

export const getPreview = (id, limit = 25, offset = 0, search = '') => {
  const query = new URLSearchParams({ limit, offset })
  if (search) query.set('search', search)
  return request(`/api/scans/${id}/preview?${query.toString()}`)
}

// Validation Rules
export const getRules = () => request('/api/rules')

export const createRule = (rule) =>
  request('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  })

export const updateRule = (id, rule) =>
  request(`/api/rules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  })

export const deleteRule = (id) => request(`/api/rules/${id}`, { method: 'DELETE' })

export const seedRules = () => request('/api/rules/seed', { method: 'POST' })

// Export cleaned CSV
export async function downloadCleanedCsv(id, fileName, mode = 'standard') {
  const response = await fetch(`${API_URL}/api/scans/${id}/export?mode=${encodeURIComponent(mode)}`)
  if (!response.ok) throw new Error('Could not download cleaned CSV')

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cleaned_${fileName || 'dataset.csv'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}