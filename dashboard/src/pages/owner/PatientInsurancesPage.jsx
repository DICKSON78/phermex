import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData'
import { Loader2, Plus, X, Pencil, Trash2, Search, ShieldCheck, UserPlus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { insurance } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'

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
  const { t } = useLanguage()
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
      showToast(t('sales.insurance.loadRecordsError'), 'error')
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
    if (!form.customer_user_id) { showToast(t('sales.insurance.selectPatientError'), 'error'); return }
    if (!form.insurance_provider_id) { showToast(t('sales.insurance.selectProviderError'), 'error'); return }
    if (!form.policy_number.trim()) { showToast(t('sales.insurance.policyRequired'), 'error'); return }
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
        showToast(res.data?.message || t('sales.insurance.recordUpdated'))
      } else {
        const res = await insurance.createPatient(payload)
        showToast(res.data?.message || t('sales.insurance.recordAdded'))
      }
      setModal(false); setForm(emptyForm)
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || t('sales.insurance.recordSaveError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (record) => {
    if (!window.confirm(`${t('sales.insurance.removeConfirm')} ${record.customer_user?.name || t('sales.prescriptions.patientLower')}?`)) return
    try {
      const res = await insurance.deletePatient(record.id)
      showToast(res.data?.message || t('sales.insurance.recordRemoved'))
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || t('sales.insurance.recordRemoveError'), 'error')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-[#0FD452]" /></div>
  }

  return (
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{toast.msg}</div>
      )}

      <PageHeader
        icon={ShieldCheck}
        title={t('sales.insurance.recordsTitle')}
        subtitle={t('sales.insurance.recordsSubtitle')}
        actions={
          <button onClick={() => openForm()} className="btn-primary">
            <Plus className="w-4 h-4" /> {t('sales.insurance.addRecord')}
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('sales.insurance.records')} ({filtered.length})</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('sales.insurance.searchPlaceholder')}
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
                <th className="text-left px-5 py-3 font-medium text-gray-500">{t('sales.insurance.patient')}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">{t('sales.insurance.provider')}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">{t('sales.insurance.policyNo')}</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">{t('sales.insurance.coverage')}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">{t('sales.insurance.expiry')}</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">{t('sales.insurance.primary')}</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">{t('sales.insurance.noRecords')}</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{p.customer_user?.name || t('dashboard.unknown')}</p>
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
              <h3 className="text-lg font-bold text-gray-900">{form.id ? t('sales.insurance.editRecord') : t('sales.insurance.addRecordModal')}</h3>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.patient')} *</label>
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
                        placeholder={form.customer_user_id ? form.customer_label : t('sales.insurance.searchCustomerPlaceholder')}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.insuranceProvider')} *</label>
                <select value={form.insurance_provider_id} onChange={(e) => setForm({ ...form, insurance_provider_id: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white">
                  <option value="">{t('sales.insurance.selectProvider')}</option>
                  {providers.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.policyNumber')} *</label>
                  <input type="text" value={form.policy_number} onChange={(e) => setForm({ ...form, policy_number: e.target.value })} placeholder={t('sales.insurance.policyPlaceholder')} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.memberId')}</label>
                  <input type="text" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} placeholder={t('common.optional')} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.groupNumber')}</label>
                  <input type="text" value={form.group_number} onChange={(e) => setForm({ ...form, group_number: e.target.value })} placeholder={t('common.optional')} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.relationship')}</label>
                  <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white">
                    <option value="self">{t('sales.insurance.relSelf')}</option>
                    <option value="spouse">{t('sales.insurance.relSpouse')}</option>
                    <option value="child">{t('sales.insurance.relChild')}</option>
                    <option value="dependent">{t('sales.insurance.relDependent')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.holderName')}</label>
                <input type="text" value={form.holder_name} onChange={(e) => setForm({ ...form, holder_name: e.target.value })} placeholder={t('sales.insurance.holderPlaceholder')} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.coveragePercent')} *</label>
                  <input type="number" min="0" max="100" value={form.coverage_percent} onChange={(e) => setForm({ ...form, coverage_percent: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.expiryDate')}</label>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('sales.insurance.primaryInsurance')}</p>
                  <p className="text-xs text-gray-400">{t('sales.insurance.primaryHint')}</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, is_primary: !form.is_primary })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_primary ? 'bg-[#0FD452]' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_primary ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#0a2015] disabled:opacity-50">
                  {saving ? t('common.saving') : t('sales.insurance.saveRecord')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}