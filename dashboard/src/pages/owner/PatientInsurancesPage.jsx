import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData'
import { Loader2, Plus, X, Pencil, Trash2, Search, ShieldCheck, UserPlus } from 'lucide-react'
import { insurance } from '../../services/api'

const emptyForm = {
  id: null,
  customer_user_id: '',
  customer_label: '',
  insurance_provider_id: '',
  policy_number: '',
  group_number: '',
  member_id: '',
  holder_name: '',
  relationship: 'self',
  expiry_date: '',
  coverage_percent: 100,
  is_primary: true,
}

export default function PatientInsurancesPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [providers, setProviders] = useState([])
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [patientsRes, providersRes] = await Promise.all([insurance.patients(), insurance.getProviders()])
      setPatients(toArray(patientsRes.data))
      setProviders(toArray(providersRes.data))
    } catch {
      showToast('Could not load insurance records', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = patients.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (p.customer_user?.name || '').toLowerCase().includes(q) ||
      (p.customer_user?.phone || '').includes(search) ||
      (p.policy_number || '').toLowerCase().includes(q) ||
      (p.provider?.name || '').toLowerCase().includes(q)
  })

  const openForm = (record = null) => {
    setForm(record ? {
      id: record.id,
      customer_user_id: record.customer_user_id,
      customer_label: record.customer_user ? `${record.customer_user.name}${record.customer_user.phone ? ` (${record.customer_user.phone})` : ''}` : '',
      insurance_provider_id: record.insurance_provider_id || '',
      policy_number: record.policy_number || '',
      group_number: record.group_number || '',
      member_id: record.member_id || '',
      holder_name: record.holder_name || '',
      relationship: record.relationship || 'self',
      expiry_date: record.expiry_date || '',
      coverage_percent: Number(record.coverage_percent ?? 100),
      is_primary: !!record.is_primary,
    } : { ...emptyForm })
    setModal(true)
  }

  const searchUsers = async (q) => {
    setUserQuery(q)
    if (q.trim().length < 2) { setUserResults([]); return }
    setSearchingUsers(true)
    try {
      const res = await insurance.searchUsers(q)
      setUserResults(toArray(res.data))
    } catch {
      setUserResults([])
    } finally {
      setSearchingUsers(false)
    }
  }

  const pickUser = (user) => {
    setForm({ ...form, customer_user_id: user.id, customer_label: `${user.name}${user.phone ? ` (${user.phone})` : ''}` })
    setUserQuery('')
    setUserResults([])
  }

  const save = async () => {
    if (!form.customer_user_id) { showToast('Please select a patient', 'error'); return }
    if (!form.insurance_provider_id) { showToast('Please select an insurance provider', 'error'); return }
    if (!form.policy_number.trim()) { showToast('Policy number is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        customer_user_id: form.customer_user_id,
        insurance_provider_id: form.insurance_provider_id,
        policy_number: form.policy_number,
        group_number: form.group_number || null,
        member_id: form.member_id || null,
        holder_name: form.holder_name || null,
        relationship: form.relationship,
        expiry_date: form.expiry_date || null,
        coverage_percent: Number(form.coverage_percent) || 0,
        is_primary: !!form.is_primary,
      }
      if (form.id) {
        const res = await insurance.updatePatient(form.id, payload)
        showToast(res.data?.message || 'Record updated')
      } else {
        const res = await insurance.createPatient(payload)
        showToast(res.data?.message || 'Insurance record added')
      }
      setModal(false); setForm(emptyForm)
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not save record', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (record) => {
    if (!window.confirm(`Remove insurance record for ${record.customer_user?.name || 'patient'}?`)) return
    try {
      const res = await insurance.deletePatient(record.id)
      showToast(res.data?.message || 'Record removed')
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not remove record', 'error')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-[#0FD452]" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Insurance</h1>
          <p className="text-gray-500 text-sm mt-1">Insurance records for your customers</p>
        </div>
        <button onClick={() => openForm()} className="px-5 py-2.5 bg-[#000F14] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2015] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Records ({filtered.length})</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, policy, provider…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 w-72"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Patient</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Provider</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Policy No.</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Coverage</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Expiry</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Primary</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No insurance records found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{p.customer_user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{p.customer_user?.phone || ''}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">{p.provider?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-700 font-mono text-xs">{p.policy_number}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-[#0FD452]">{Number(p.coverage_percent || 0)}%</td>
                  <td className="px-5 py-3.5 text-gray-600">{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.is_primary ? 'bg-[#0FD452]' : 'bg-gray-300'}`} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openForm(p)} className="text-sm text-gray-600 hover:text-[#0FD452] font-medium"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(p)} className="text-sm text-red-500 hover:text-red-600 font-medium"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{form.id ? 'Edit Insurance Record' : 'Add Insurance Record'}</h3>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                {form.id ? (
                  <input type="text" value={form.customer_label} disabled className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 text-gray-500" />
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                      <UserPlus className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.customer_label || userQuery}
                        onChange={(e) => { setForm({ ...form, customer_label: '', customer_user_id: '' }); searchUsers(e.target.value) }}
                        placeholder={form.customer_user_id ? form.customer_label : 'Search customer by name, phone, or email…'}
                        className="w-full text-sm bg-transparent outline-none"
                      />
                      {searchingUsers && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </div>
                    {userResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                        {userResults.map((u) => (
                          <button key={u.id} onClick={() => pickUser(u)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm">
                            <p className="font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.phone || u.email || ''}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider *</label>
                <select value={form.insurance_provider_id} onChange={(e) => setForm({ ...form, insurance_provider_id: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white">
                  <option value="">Select provider…</option>
                  {providers.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number *</label>
                  <input type="text" value={form.policy_number} onChange={(e) => setForm({ ...form, policy_number: e.target.value })} placeholder="e.g. 0100-1234567" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member ID</label>
                  <input type="text" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} placeholder="Optional" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Number</label>
                  <input type="text" value={form.group_number} onChange={(e) => setForm({ ...form, group_number: e.target.value })} placeholder="Optional" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white">
                    <option value="self">Self</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="dependent">Dependent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Holder Name</label>
                <input type="text" value={form.holder_name} onChange={(e) => setForm({ ...form, holder_name: e.target.value })} placeholder="Policy holder name" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coverage % *</label>
                  <input type="number" min="0" max="100" value={form.coverage_percent} onChange={(e) => setForm({ ...form, coverage_percent: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Primary Insurance</p>
                  <p className="text-xs text-gray-400">Mark this as the customer's main policy</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, is_primary: !form.is_primary })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_primary ? 'bg-[#0FD452]' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_primary ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#0a2015] disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}