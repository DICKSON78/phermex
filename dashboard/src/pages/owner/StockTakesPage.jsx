import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toArray } from '../../utils/safeData';
import { Plus, ClipboardCheck, CheckCircle, XCircle, Hash, CalendarDays, Package, BarChart3, Eye, ListChecks } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }
const TYPE_COLORS = { full: 'bg-indigo-100 text-indigo-700', cycle: 'bg-purple-100 text-purple-700' }

export default function StockTakesPage() {
  const { pharmacyId } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [takes, setTakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState([])
  const [drugs, setDrugs] = useState([])
  const [form, setForm] = useState({ title: '', count_type: 'full', category_id: '', drug_ids: [], notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchTakes = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await api.get('/stock-takes', { params })
      setTakes(toArray(res.data))
    } catch { setTakes([]) } finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchTakes() }, [fetchTakes])
  useEffect(() => {
    Promise.all([api.get('/drug-categories').catch(() => ({ data: [] })), api.get('/drugs', { params: { per_page: 200 } }).catch(() => ({ data: [] }))]).then(([c, d]) => {
      setCategories(c.data.data || c.data || [])
      setDrugs(d.data.data || d.data || [])
    })
  }, [])

  const toggleDrug = (id) => {
    setForm((f) => {
      const ids = f.drug_ids.includes(id) ? f.drug_ids.filter((x) => x !== id) : [...f.drug_ids, id]
      return { ...f, drug_ids: ids }
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/stock-takes', {
        ...form,
        pharmacy_id: pharmacyId,
        drug_ids: form.drug_ids.length ? form.drug_ids : undefined,
      })
      toast.success(t('inventory.stockTakes.toastStarted'))
      setShowForm(false)
      setForm({ title: '', count_type: 'full', category_id: '', drug_ids: [], notes: '' })
      fetchTakes()
    } catch { toast.error(t('inventory.stockTakes.toastCreateFailed')); setShowForm(false) } finally { setSaving(false) }
  }

  const handleAction = async (id, action) => {
    try {
      await api.post(`/stock-takes/${id}/${action}`)
      if (action === 'approve') toast.success(t('inventory.stockTakes.toastApproved'))
      else if (action === 'cancel') toast.success(t('inventory.stockTakes.toastCancelled'))
      else toast.success(t('inventory.stockTakes.toastApproved'))
    } catch {
      toast.error(t('inventory.stockTakes.toastActionFailed'))
    }
    fetchTakes()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('inventory.stockTakes.pageTitle')}</h1>
            <p className="text-sm text-gray-500">{t('inventory.stockTakes.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">{t('inventory.stockTakes.allStatuses')}</option>
            <option value="draft">{t('inventory.stockTakes.statusDraft')}</option>
            <option value="in_progress">{t('inventory.stockTakes.statusInProgress')}</option>
            <option value="completed">{t('common.completed')}</option>
            <option value="cancelled">{t('inventory.stockTakes.statusCancelled')}</option>
          </select>
          <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> {t('inventory.stockTakes.newCount')}</button>
        </div>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.stockTakes.code')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.stockTakes.title')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.stockTakes.type')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.status')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.stockTakes.items')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><BarChart3 className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.stockTakes.variance')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.date')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.actions')}</span></div></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {takes.map((tk) => (
                  <tr key={tk.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <button onClick={() => navigate(`/dashboard/stock-takes/${tk.id}`)} className="flex items-center gap-3 text-left">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Hash className="h-4 w-4 text-[#0FD452]" /></div>
                        <span className="text-sm font-medium text-[#000F14]">{tk.stock_take_code}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tk.title || '—'}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[tk.count_type] || 'bg-gray-100 text-gray-600'}`}>{tk.count_type === 'cycle' ? t('inventory.stockTakes.cycleCount') : t('inventory.stockTakes.fullCount')}</span></td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tk.status]}`}>{tk.status === 'draft' ? t('inventory.stockTakes.statusDraft') : tk.status === 'in_progress' ? t('inventory.stockTakes.statusInProgress') : tk.status === 'completed' ? t('common.completed') : tk.status === 'cancelled' ? t('inventory.stockTakes.statusCancelled') : tk.status?.replace(/_/g, ' ')}</span></td>
                    <td className="px-6 py-4 text-sm text-[#000F14] text-right">{tk.total_items}</td>
                    <td className="px-6 py-4 text-sm text-right"><span className={tk.variance_total > 0 ? 'text-green-600 font-medium' : tk.variance_total < 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>{tk.variance_total > 0 ? '+' : ''}{tk.variance_total}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tk.created_at ? new Date(tk.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/dashboard/stock-takes/${tk.id}`)} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"><Eye className="inline w-3 h-3 mr-1" />{t('inventory.stockTakes.open')}</button>
                        {tk.status === 'completed' && <button onClick={() => handleAction(tk.id, 'approve')} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"><CheckCircle className="inline w-3 h-3 mr-1" />{t('inventory.stockTakes.approve')}</button>}
                        {(tk.status === 'draft' || tk.status === 'in_progress') && <button onClick={() => handleAction(tk.id, 'cancel')} className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"><XCircle className="inline w-3 h-3 mr-1" />{t('common.cancel')}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {takes.length === 0 && <div className="text-center py-12 text-gray-400"><ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('inventory.stockTakes.noRecords')}</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">{t('inventory.stockTakes.newTitle')}</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.stockTakes.title')}</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder={t('inventory.stockTakes.titlePlaceholder')} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.stockTakes.countType')} *</label>
                  <select value={form.count_type} onChange={(e) => setForm({ ...form, count_type: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                    <option value="full">{t('inventory.stockTakes.fullCountOption')}</option>
                    <option value="cycle">{t('inventory.stockTakes.cycleCountOption')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.stockTakes.categoryCycle')}</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                    <option value="">{t('inventory.stockTakes.allCategories')}</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.labels.notes')}</label><input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder={t('common.optional')} /></div>
              </div>
              {form.count_type === 'full' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-dark">{t('inventory.stockTakes.selectDrugs')}</h4>
                    <button type="button" onClick={() => setForm({ ...form, drug_ids: form.drug_ids.length === drugs.length ? [] : drugs.map((d) => d.id) })} className="text-sm text-primary font-medium">{form.drug_ids.length === drugs.length ? t('common.clear') : t('inventory.stockTakes.selectAll')}</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                    {drugs.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={form.drug_ids.includes(d.id)} onChange={() => toggleDrug(d.id)} className="rounded text-[#0FD452]" />
                        <span className="truncate">{d.name}</span>
                        <span className="ml-auto text-xs text-gray-400 shrink-0">{d.quantity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button><button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? t('inventory.stockTakes.creating') : t('inventory.stockTakes.startCount')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}