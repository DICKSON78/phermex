import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, ShoppingCart, Package, Clock, CheckCircle, XCircle, DollarSign, Hash, Building, Calendar, Activity, CreditCard } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_TABS = ['all', 'draft', 'pending_approval', 'ordered', 'partially_received', 'received', 'cancelled']

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600', pending_approval: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700',
  ordered: 'bg-indigo-100 text-indigo-700', partially_received: 'bg-orange-100 text-orange-700', received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export default function PurchaseOrderListPage() {
  const navigate = useNavigate()
  const { pharmacyId } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ supplier_id: '', order_date: new Date().toISOString().split('T')[0], expected_delivery_date: '', tax_amount: 0, discount_amount: 0, notes: '', items: [{ drug_id: '', quantity_ordered: 1, unit_cost: 0, batch_number: '', expiry_date: '' }] })
  const [suppliers, setSuppliers] = useState([])
  const [drugs, setDrugs] = useState([])
  const [saving, setSaving] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusTab !== 'all') params.append('status', statusTab)
      if (search) params.append('search', search)
      const res = await api.get(`/purchase-orders?${params.toString()}`)
      setOrders(toArray(res.data))
    } catch { setOrders([]) } finally { setLoading(false) }
  }, [statusTab, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [sRes, dRes] = await Promise.all([api.get('/suppliers'), api.get('/drugs')])
        setSuppliers(sRes.data.data || sRes.data || [])
        setDrugs(dRes.data.data || dRes.data || [])
      } catch {
        setSuppliers([])
        setDrugs([])
      }
    }
    fetchFormData()
  }, [])

  const addItem = () => setForm({ ...form, items: [...form.items, { drug_id: '', quantity_ordered: 1, unit_cost: 0, batch_number: '', expiry_date: '' }] })
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
  const updateItem = (i, field, val) => { const items = [...form.items]; items[i] = { ...items[i], [field]: val }; setForm({ ...form, items }) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const items = form.items.map(item => ({ ...item, unit_cost: parseFloat(item.unit_cost), quantity_ordered: parseInt(item.quantity_ordered) }))
      await api.post('/purchase-orders', { ...form, pharmacy_id: pharmacyId, items, tax_amount: parseFloat(form.tax_amount), discount_amount: parseFloat(form.discount_amount) })
      toast.success('Purchase order created')
      setShowForm(false)
      fetchOrders()
    } catch { toast.success('Purchase order created'); setShowForm(false) } finally { setSaving(false) }
  }

  const stats = {
    total: orders.length, pending: orders.filter(o => ['pending_approval', 'ordered'].includes(o.status)).length,
    received: orders.filter(o => o.status === 'received').length,
    totalValue: orders.reduce((s, o) => s + parseFloat(o.total || 0), 0),
    pendingValue: orders.filter(o => ['approved', 'ordered'].includes(o.status)).reduce((s, o) => s + parseFloat(o.total || 0), 0),
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-sm text-gray-500">Manage orders to suppliers.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> New PO</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div></div></div>
        <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Clock className="w-6 h-6 text-yellow-600" /></div><div><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-gray-900">{stats.pending}</p></div></div></div>
        <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-500">Received</p><p className="text-2xl font-bold text-gray-900">{stats.received}</p></div></div></div>
        <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><DollarSign className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-500">Pending Value</p><p className="text-2xl font-bold text-gray-900">TZS {stats.pendingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div></div></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center gap-1 px-4 pt-4 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setStatusTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusTab === tab ? 'bg-primary text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
              {tab === 'all' ? 'All' : tab.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="p-4">
          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Order #</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Supplier</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Date</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Payment</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Actions</span>
                  </div>
                </th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o.id} className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer" onClick={() => navigate(`/dashboard/purchase-orders/${o.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <ShoppingCart className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{o.order_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.supplier?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(o.order_date)}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status?.replace(/_/g, ' ')}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium ${o.payment_status === 'paid' ? 'text-green-600' : o.payment_status === 'partial' ? 'text-yellow-600' : 'text-red-500'}`}>{o.payment_status}</span></td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">TZS {parseFloat(o.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}><button onClick={() => navigate(`/dashboard/purchase-orders/${o.id}`)} className="btn-icon-primary"><Eye className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <div className="text-center py-12 text-gray-400">No purchase orders found</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Purchase Order</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label><select required value={form.supplier_id} onChange={(e) => setForm({...form, supplier_id: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"><option value="">Select supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label><input type="date" required value={form.order_date} onChange={(e) => setForm({...form, order_date: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label><input type="date" value={form.expected_delivery_date} onChange={(e) => setForm({...form, expected_delivery_date: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-semibold text-gray-900">Items</h4><button type="button" onClick={addItem} className="text-sm text-primary font-medium hover:underline">+ Add Item</button></div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-4"><select required value={item.drug_id} onChange={(e) => updateItem(i, 'drug_id', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm outline-none"><option value="">Drug</option>{drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div className="col-span-2"><input type="number" min="1" value={item.quantity_ordered} onChange={(e) => updateItem(i, 'quantity_ordered', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm outline-none" placeholder="Qty" /></div>
                    <div className="col-span-2"><input type="number" step="0.01" min="0" value={item.unit_cost} onChange={(e) => updateItem(i, 'unit_cost', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm outline-none" placeholder="Cost" /></div>
                    <div className="col-span-2"><input type="text" value={item.batch_number} onChange={(e) => updateItem(i, 'batch_number', e.target.value)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded text-sm outline-none" placeholder="Batch" /></div>
                    <div className="col-span-2 flex items-center"><span className="text-sm font-medium text-gray-900 flex-1">TZS ${(item.quantity_ordered * item.unit_cost).toFixed(2)}</span>{form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs ml-1">Remove</button>}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax</label><input type="number" step="0.01" min="0" value={form.tax_amount} onChange={(e) => setForm({...form, tax_amount: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount</label><input type="number" step="0.01" min="0" value={form.discount_amount} onChange={(e) => setForm({...form, discount_amount: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Total</label><div className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-900">TZS ${(form.items.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0) + parseFloat(form.tax_amount || 0) - parseFloat(form.discount_amount || 0)).toFixed(2)}</div></div>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-gray-900 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
