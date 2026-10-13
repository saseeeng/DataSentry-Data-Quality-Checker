import { useEffect, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { createRule, deleteRule, getRules, seedRules, updateRule } from '../lib/api'

export default function RulesManager() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  // New rule form state
  const [name, setName] = useState('')
  const [columnName, setColumnName] = useState('')
  const [ruleType, setRuleType] = useState('required')
  const [severity, setSeverity] = useState('medium')
  const [allowedValuesInput, setAllowedValuesInput] = useState('')
  const [regexPattern, setRegexPattern] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getRules()
      .then((data) => {
        if (active) setRules(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleToggleRule(rule) {
    try {
      const updated = await updateRule(rule.id, { is_active: !rule.is_active })
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteRule(id) {
    if (!window.confirm('Are you sure you want to delete this validation rule?')) return
    try {
      await deleteRule(id)
      setRules((prev) => prev.filter((r) => r.id !== id))
      setSuccess('Rule deleted.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSeedRules() {
    setError('')
    try {
      const data = await seedRules()
      setRules(data)
      setSuccess('Standard rules seeded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreateRule(e) {
    e.preventDefault()
    if (!name.trim() || !columnName.trim()) {
      setError('Please provide rule name and column name.')
      return
    }

    const rule_config = {}
    if (ruleType === 'allowed_values') {
      rule_config.values = allowedValuesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (ruleType === 'regex') {
      rule_config.pattern = regexPattern.trim()
    }

    setSaving(true)
    setError('')
    try {
      const created = await createRule({
        name: name.trim(),
        column_name: columnName.trim(),
        rule_type: ruleType,
        rule_config,
        severity,
        is_active: true,
      })
      setRules((prev) => [created, ...prev])
      setShowAddModal(false)
      setName('')
      setColumnName('')
      setRuleType('required')
      setSeverity('medium')
      setAllowedValuesInput('')
      setRegexPattern('')
      setSuccess('Validation rule created.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-emerald-700">
            Quality Policies
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Validation Rules
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Define custom field expectations to automatically enforce during CSV quality scans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSeedRules}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Load Standard Presets</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            <Plus size={14} />
            <span>Create Rule</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700 border border-rose-200">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800 border border-emerald-200">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={14} /> {success}
          </span>
          <button onClick={() => setSuccess('')}><X size={14} /></button>
        </div>
      )}

      {/* Rules list */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Active Quality Rules ({rules.filter((r) => r.is_active).length} of {rules.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading rules…</div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <ShieldCheck size={24} />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-slate-800">No Custom Rules Defined</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              DataSentry already checks for missing cells, duplicate records, and invalid emails by default. Add custom rules or load standard presets above.
            </p>
            <button
              onClick={handleSeedRules}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Sparkles size={14} />
              <span>Load 5 Standard Presets</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map((rule) => {
              const sev = rule.severity?.toLowerCase() || 'medium'
              let badge = 'bg-slate-100 text-slate-700 border-slate-200'
              if (sev === 'high') badge = 'bg-rose-50 text-rose-700 border-rose-200'
              else if (sev === 'medium') badge = 'bg-amber-50 text-amber-700 border-amber-200'

              return (
                <div
                  key={rule.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      title={rule.is_active ? 'Click to disable' : 'Click to enable'}
                      className={`mt-0.5 grid size-5 place-items-center rounded-md border transition ${
                        rule.is_active
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-transparent hover:border-slate-400'
                      }`}
                    >
                      <Check size={13} strokeWidth={3} />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${rule.is_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                          {rule.name}
                        </span>
                        <span className={`rounded-md border px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider ${badge}`}>
                          {rule.severity}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          Target Column: <span className="font-mono font-medium text-slate-800">{rule.column_name}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Rule Type: <span className="font-medium text-slate-700">{rule.rule_type}</span>
                        </span>
                        {rule.rule_config?.values && (
                          <>
                            <span>•</span>
                            <span>Allowed: [{rule.rule_config.values.join(', ')}]</span>
                          </>
                        )}
                        {rule.rule_config?.pattern && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px]">Pattern: /{rule.rule_config.pattern}/</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <span className={`text-xs font-medium ${rule.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {rule.is_active ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Delete rule"
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">Create Validation Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700">Rule Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Valid Customer Email"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-hidden"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-slate-700">Target Column Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. email or customer_id"
                    value={columnName}
                    onChange={(e) => setColumnName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-slate-800 focus:border-slate-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700">Rule Type</label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-hidden"
                  >
                    <option value="required">Required (Non-empty)</option>
                    <option value="unique">Unique (No duplicates)</option>
                    <option value="email">Email Format</option>
                    <option value="allowed_values">Allowed Values (Whitelist)</option>
                    <option value="regex">Regular Expression (Regex)</option>
                  </select>
                </div>
              </div>

              {ruleType === 'allowed_values' && (
                <div>
                  <label className="block font-medium text-slate-700">
                    Allowed Values (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Basic, Standard, Premium, Enterprise"
                    value={allowedValuesInput}
                    onChange={(e) => setAllowedValuesInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-hidden"
                  />
                </div>
              )}

              {ruleType === 'regex' && (
                <div>
                  <label className="block font-medium text-slate-700">Regex Pattern</label>
                  <input
                    type="text"
                    placeholder="e.g. ^[A-Z]{3}-\d{4}$"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-slate-800 focus:border-slate-400 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700">Issue Severity</label>
                <div className="mt-1 flex gap-2">
                  {['low', 'medium', 'high'].map((sev) => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`flex-1 rounded-lg border py-2 text-center font-semibold uppercase tracking-wider capitalize ${
                        severity === sev
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Creating…' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
