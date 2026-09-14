import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData'
import { Loader2, Plus, X, Pencil, Trash2, ShieldCheck, Phone, Mail, Globe } from 'lucide-react'
import { insurance } from '../../services/api'

const emptyForm = { id: null, name: '', code: '', contact_phone: '', contact_email: '', website: '', is_active: true }

export default function InsuranceProvidersPage() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await insurance.getProviders()
      setProviders(toArray(res.data))
    } catch {
      showToast('Could not load insurance providers', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openForm = (provider = null) => {
    setForm(provider ? {
      id: provider.id,
      name: provider.name || '',
      code: provider.code || '',
      contact_phone: provider.contact_phone || '',
      contact_email: provider.contact_email || '',
      website: provider.website || '',
      is_active: !!provider.is_active,
    } : { ...emptyForm })
    setModal(true)
  }

  const save = async () => {
    if (!form.name.trim()) { showToast('Provider name is required', 'error'); return }
    setSaving(true)
    try {
      if (form.id) {
        const res = await insurance.updateProvider(form.id, form)
        showToast(res.data?.message || 'Provider updated')
      } else {
        const res = await insurance.createProvider(form)
        showToast(res.data?.message || 'Provider created')
      }
      setModal(false); setForm(emptyForm)
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not save provider', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (provider) => {
    if (!window.confirm(`Delete ${provider.name}? Existing patient records will be kept but the provider will be removed.`)) return
    setDeleting(provider.id)
    try {
      const res = await insurance.deleteProvider(provider.id)
      showToast(res.data?.message || 'Provider deleted')
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not delete provider', 'error')
    } finally {
      setDeleting(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Insurance Providers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage NHIF and private insurers your pharmacy works with</p>
        </div>
        <button onClick={() => openForm()} className="px-5 py-2.5 bg-[#000F14] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2015] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {providers.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No insurance providers yet. Add NHIF, AAR, Jubilee, or any other insurer you accept.</p>
          </div>
        ) : providers.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 text-[#0FD452] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.code || 'No code'}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600 flex-1">
              {p.contact_phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {p.contact_phone}</p>}
              {p.contact_email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {p.contact_email}</p>}
              {p.website && <p className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-gray-400" /> {p.website}</p>}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => openForm(p)} className="text-xs font-semibold text-gray-600 hover:text-[#0FD452] flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
              <button
                onClick={() => remove(p)}
                disabled={deleting === p.id}
                className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 ml-auto disabled:opacity-50"
              ><Trash2 className="w-3.5 h-3.5" /> {deleting === p.id ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Provider form modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{form.id ? 'Edit Provider' : 'Add Provider'}</h3>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. NHIF" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. NHIF" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                  <button
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-[#0FD452]' : 'bg-gray-200'} mt-1`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input type="text" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="e.g. +255 6XX XXX XXX" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="e.g. support@nhif.or.tz" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="text" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="e.g. https://nhif.or.tz" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#0a2015] disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Provider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}