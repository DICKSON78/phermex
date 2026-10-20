import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { Plus, RotateCcw, CheckCircle, Truck, CreditCard, Hash, CalendarDays, User, Package } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', shipped: 'bg-indigo-100 text-indigo-700', refunded: 'bg-green-100 text-green-700' }
const REASON_COLORS = { damaged: 'text-red-600', expired: 'text-orange-600', wrong_item: 'text-purple-600', quality_issue: 'text-yellow-600', overstock: 'text-blue-600' }

export default function StockReturnsPage() {
  const { pharmacyId } = useAuth()
  const { t } = useLanguage()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [drugs, setDrugs] = useState([])
  const [form, setForm] = useState({ supplier_id: '', return_date: new Date().toISOString().split('T')[0], reason: 'damaged', notes: '', items: [{ drug_id: '', quantity: 1, unit_cost: 0, batch_number: '', expiry_date: '', reason_notes: '' }] })
  const [saving, setSaving] = useState(false)

  const fetchReturns = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/stock-returns'); setReturns(toArray(res.data)) } catch { setReturns([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchReturns() }, [fetchReturns])
  useEffect(() => {
    Promise.all([api.get('/suppliers').catch(() => ({ data: [] })), api.get('/drugs').catch(() => ({ data: [] }))]).then(([s, d]) => {
      setSuppliers(s.data.data || s.data || [])
      setDrugs(d.data.data || d.data || [])
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/stock-returns', { ...form, pharmacy_id: pharmacyId, items: form.items.map(i => ({ ...i, quantity: parseInt(i.quantity), unit_cost: parseFloat(i.unit_cost) })) })
      toast.success(t('inventory.returns.toastCreated')); setShowForm(false); fetchReturns()
    } catch { toast.error(t('inventory.returns.toastCreateFailed')); setShowForm(false) } finally { setSaving(false) }
  }

  const handleAction = async (id, action) => {
    try {
      await api.post(`/stock-returns/${id}/${action}`)
      if (action === 'approve') toast.success(t('inventory.returns.toastApproved'))
      else if (action === 'ship') toast.success(t('inventory.returns.toastShipped'))
      else if (action === 'refund') toast.success(t('inventory.returns.toastRefunded'))
      else toast.success(t('inventory.returns.toastCreated'))
    } catch {
      toast.error(t('inventory.returns.toastActionFailed'))
    }
    fetchReturns()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('inventory.returns.title')}</h1>
            <p className="text-sm text-gray-500">{t('inventory.returns.subtitle')}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> {t('inventory.returns.newReturn')}</button>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.returns.returnNo')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.returns.supplier')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.date')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.returns.reason')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.status')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.returns.items')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><CreditCard className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.returns.value')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.actions')}</span></div></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {returns.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Hash className="h-4 w-4 text-[#0FD452]" /></div>
                        <span className="text-sm font-medium text-[#000F14]">{r.return_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.supplier?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.return_date ? new Date(r.return_date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-sm capitalize"><span className={REASON_COLORS[r.reason] || ''}>{r.reason === 'damaged' ? t('inventory.returns.reasonDamaged') : r.reason === 'expired' ? t('inventory.returns.reasonExpired') : r.reason === 'wrong_item' ? t('inventory.returns.reasonWrongItem') : r.reason === 'quality_issue' ? t('inventory.returns.reasonQualityIssue') : r.reason === 'overstock' ? t('inventory.returns.reasonOverstock') : r.reason?.replace(/_/g, ' ')}</span></td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status === 'pending' ? t('inventory.returns.statusPending') : r.status === 'approved' ? t('inventory.returns.statusApproved') : r.status === 'shipped' ? t('inventory.returns.statusShipped') : r.status === 'refunded' ? t('inventory.returns.statusRefunded') : r.status}</span></td>
                    <td className="px-6 py-4 text-sm text-[#000F14] text-right">{r.total_items}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#000F14] text-right">TZS {parseFloat(r.total_value).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === 'pending' && <button onClick={() => handleAction(r.id, 'approve')} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">{t('inventory.returns.actionApprove')}</button>}
                        {r.status === 'approved' && <button onClick={() => handleAction(r.id, 'ship')} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">{t('inventory.returns.actionShip')}</button>}
                        {r.status === 'shipped' && <button onClick={() => handleAction(r.id, 'refund')} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">{t('inventory.returns.actionRefund')}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {returns.length === 0 && <div className="text-center py-12 text-gray-400"><RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('inventory.returns.noRecords')}</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">{t('inventory.returns.newTitle')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.returns.supplier')} *</label><select required value={form.supplier_id} onChange={(e) => setForm({...form, supplier_id: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"><option value="">{t('inventory.returns.select')}</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.returns.returnDate')} *</label><input type="date" required value={form.return_date} onChange={(e) => setForm({...form, return_date: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.returns.reason')} *</label>
                <select value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="damaged">{t('inventory.returns.reasonDamaged')}</option><option value="expired">{t('inventory.returns.reasonExpired')}</option><option value="wrong_item">{t('inventory.returns.reasonWrongItem')}</option><option value="quality_issue">{t('inventory.returns.reasonQualityIssue')}</option><option value="overstock">{t('inventory.returns.reasonOverstock')}</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><h4 className="text-sm font-semibold text-dark">{t('inventory.returns.items')}</h4><button type="button" onClick={() => setForm({...form, items: [...form.items, { drug_id: '', quantity: 1, unit_cost: 0, batch_number: '', expiry_date: '', reason_notes: '' }]})} className="text-sm text-primary font-medium">+ {t('common.add')}</button></div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-2"><select value={item.drug_id} onChange={(e) => { const items = [...form.items]; items[i].drug_id = e.target.value; setForm({...form, items}) }} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm"><option value="">{t('inventory.returns.drug')}</option>{drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div><input type="number" min="1" value={item.quantity} onChange={(e) => { const items = [...form.items]; items[i].quantity = e.target.value; setForm({...form, items}) }} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm" placeholder={t('inventory.returns.qty')} /></div>
                    <div><input type="number" step="0.01" value={item.unit_cost} onChange={(e) => { const items = [...form.items]; items[i].unit_cost = e.target.value; setForm({...form, items}) }} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm" placeholder={t('inventory.returns.cost')} /></div>
                    <div><input type="text" value={item.batch_number} onChange={(e) => { const items = [...form.items]; items[i].batch_number = e.target.value; setForm({...form, items}) }} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm" placeholder={t('inventory.returns.batch')} /></div>
                    <div className="flex items-center justify-center">{form.items.length > 1 && <button type="button" onClick={() => setForm({...form, items: form.items.filter((_, idx) => idx !== i)})} className="text-red-400 text-xs">×</button>}</div>
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.labels.notes')}</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button><button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? t('inventory.returns.creating') : t('inventory.returns.createReturn')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
