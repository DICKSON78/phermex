import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toArray } from '../../utils/safeData';
import { Plus, ShoppingCart, CheckCircle, XCircle, Hash, CalendarDays, Building2, Package, Eye } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', submitted: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }

export default function SupplierOrdersPage() {
  const { pharmacyId } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [drugs, setDrugs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ supplier_id: '', notes: '', items: [{ drug_id: '', quantity_ordered: 1, buying_price: '', selling_price: '' }] })
  const [saving, setSaving] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (supplierFilter) params.supplier_id = supplierFilter
      const res = await api.get('/supplier-orders', { params })
      setOrders(toArray(res.data))
    } catch { setOrders([]) } finally { setLoading(false) }
  }, [statusFilter, supplierFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => {
    Promise.all([api.get('/suppliers').catch(() => ({ data: [] })), api.get('/drugs', { params: { per_page: 200 } }).catch(() => ({ data: [] }))]).then(([s, d]) => {
      setSuppliers(s.data.data || s.data || [])
      setDrugs(d.data.data || d.data || [])
    })
  }, [])

  const setItem = (i, field, val) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: val }
    setForm({ ...form, items })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/supplier-orders', {
        supplier_id: form.supplier_id,
        notes: form.notes,
        pharmacy_id: pharmacyId,
        items: form.items.map((i) => ({
          drug_id: i.drug_id,
          quantity_ordered: parseInt(i.quantity_ordered),
          buying_price: i.buying_price !== '' ? parseFloat(i.buying_price) : undefined,
          selling_price: i.selling_price !== '' ? parseFloat(i.selling_price) : undefined,
        })),
      })
      toast.success(t('supply.supplierOrders.createdToast'))
      setShowForm(false)
      setForm({ supplier_id: '', notes: '', items: [{ drug_id: '', quantity_ordered: 1, buying_price: '', selling_price: '' }] })
      fetchOrders()
    } catch { toast.error(t('supply.supplierOrders.createFailed')); setShowForm(false) } finally { setSaving(false) }
  }

  const handleAction = async (id, action) => {
    try { await api.post(`/supplier-orders/${id}/${action}`); toast.success(t(`supply.supplierOrders.done.${action}`)) } catch { toast.error(t('supply.supplierOrders.actionFailed')) }
    fetchOrders()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.items.supplierOrders')}</h1>
            <p className="text-sm text-gray-500">{t('supply.supplierOrders.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">{t('supply.supplierOrders.allStatuses')}</option>
            <option value="draft">{t('supply.supplierOrders.statuses.draft')}</option>
            <option value="submitted">{t('supply.supplierOrders.statuses.submitted')}</option>
            <option value="approved">{t('supply.supplierOrders.statuses.approved')}</option>
            <option value="completed">{t('supply.supplierOrders.statuses.completed')}</option>
            <option value="cancelled">{t('supply.supplierOrders.statuses.cancelled')}</option>
          </select>
          <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> {t('supply.supplierOrders.newOrder')}</button>
        </div>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('supply.supplierOrders.orderHash')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('supply.common.supplier')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.date')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.status')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('pos.items')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.actions')}</span></div></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <button onClick={() => navigate(`/dashboard/supplier-orders/${o.id}`)} className="flex items-center gap-3 text-left">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Hash className="h-4 w-4 text-[#0FD452]" /></div>
                        <span className="text-sm font-medium text-[#000F14]">{o.order_code}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-300" />{o.supplier?.name || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>{t(`supply.supplierOrders.statuses.${o.status}`, o.status)}</span></td>
                    <td className="px-6 py-4 text-sm text-[#000F14] text-right">{o.items?.length || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/dashboard/supplier-orders/${o.id}`)} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"><Eye className="inline w-3 h-3 mr-1" />{t('supply.supplierOrders.open')}</button>
                        {o.status === 'draft' && <button onClick={() => handleAction(o.id, 'submit')} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">{t('supply.supplierOrders.submit')}</button>}
                        {o.status === 'submitted' && <button onClick={() => handleAction(o.id, 'approve')} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">{t('supply.supplierOrders.approve')}</button>}
                        {!['completed', 'cancelled'].includes(o.status) && <button onClick={() => handleAction(o.id, 'cancel')} className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"><XCircle className="inline w-3 h-3 mr-1" />{t('common.cancel')}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <div className="text-center py-12 text-gray-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('supply.supplierOrders.noOrders')}</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">{t('supply.supplierOrders.createTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('supply.supplierOrders.formHelp')}</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('supply.supplierOrders.bigSupplier')} *</label>
                <select required value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="">{t('supply.purchaseOrders.selectSupplier')}</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><h4 className="text-sm font-semibold text-dark">{t('pos.items')}</h4><button type="button" onClick={() => setForm({ ...form, items: [...form.items, { drug_id: '', quantity_ordered: 1, buying_price: '', selling_price: '' }] })} className="text-sm text-primary font-medium">+ {t('common.add')}</button></div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2 p-3 bg-gray-50 rounded-lg items-center">
                    <div className="col-span-5"><select value={item.drug_id} onChange={(e) => setItem(i, 'drug_id', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm">
                      <option value="">{t('supply.common.drug')}</option>
                      {drugs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select></div>
                    <div className="col-span-2"><input type="number" min="1" required value={item.quantity_ordered} onChange={(e) => setItem(i, 'quantity_ordered', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm" placeholder={t('supply.common.qty')} /></div>
                    <div className="col-span-2"><input type="number" step="0.01" min="0" value={item.buying_price} onChange={(e) => setItem(i, 'buying_price', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm" placeholder={t('supply.supplierOrders.buyPlaceholder')} title={t('supply.supplierOrders.buyTitle')} /></div>
                    <div className="col-span-2"><input type="number" step="0.01" min="0" value={item.selling_price} onChange={(e) => setItem(i, 'selling_price', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm" placeholder={t('supply.supplierOrders.sellPlaceholder')} title={t('supply.supplierOrders.sellTitle')} /></div>
                    <div className="col-span-1 flex justify-center">{form.items.length > 1 && <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })} className="text-red-400 text-xs">×</button>}</div>
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('supply.common.notes')}</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button><button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? t('supply.common.creating') : t('supply.supplierOrders.createOrder')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}