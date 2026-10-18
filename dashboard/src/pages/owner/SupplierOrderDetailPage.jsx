import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Package, Printer, Pill, Hash, Building2, ShoppingCart, DollarSign } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', submitted: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }

export default function SupplierOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showComplete, setShowComplete] = useState(false)
  const [completeItems, setCompleteItems] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/supplier-orders/${id}`)
        setOrder(res.data.supplier_order || res.data)
      } catch { setOrder(null) } finally { setLoading(false) }
    }
    fetchOrder()
  }, [id])

  const openComplete = () => {
    setCompleteItems(order.items.map((item) => ({
      id: item.id,
      drug_name: item.drug_name || item.drug?.name,
      quantity_ordered: item.quantity_ordered,
      quantity_received: item.quantity_received ?? item.quantity_ordered,
      buying_price: item.buying_price ?? '',
      selling_price: item.selling_price ?? '',
      expiry_date: item.expiry_date || '',
      batch_number: item.batch_number || '',
    })))
    setShowComplete(true)
  }

  const setCompleteItem = (i, field, val) => {
    const items = [...completeItems]
    items[i] = { ...items[i], [field]: val }
    setCompleteItems(items)
  }

  const handleComplete = async () => {
    const missing = completeItems.filter((i) => i.buying_price === '' || i.selling_price === '')
    if (missing.length) { toast.error('Add buying and selling price for every item'); return }
    setSaving(true)
    try {
      await api.post(`/supplier-orders/${id}/complete`, {
        items: completeItems.map((i) => ({
          id: i.id,
          buying_price: parseFloat(i.buying_price),
          selling_price: parseFloat(i.selling_price),
          quantity_received: parseInt(i.quantity_received),
          expiry_date: i.expiry_date || undefined,
          batch_number: i.batch_number || undefined,
        })),
      })
      toast.success('Order completed — stock updated automatically')
      setShowComplete(false)
      const res = await api.get(`/supplier-orders/${id}`)
      setOrder(res.data.supplier_order || res.data)
    } catch { toast.error('Failed to complete order'); setShowComplete(false) } finally { setSaving(false) }
  }

  const handleApprove = async () => {
    try { await api.post(`/supplier-orders/${id}/approve`); toast.success('Order approved') } catch { toast.error('Failed to approve order') }
    const res = await api.get(`/supplier-orders/${id}`).catch(() => ({ data: { supplier_order: { ...order, status: 'approved' } } }))
    setOrder(res.data.supplier_order || res.data)
  }

  const handleCancel = async () => {
    try { await api.post(`/supplier-orders/${id}/cancel`); toast.success('Order cancelled') } catch { toast.error('Failed to cancel order') }
    const res = await api.get(`/supplier-orders/${id}`).catch(() => ({ data: { supplier_order: { ...order, status: 'cancelled' } } }))
    setOrder(res.data.supplier_order || res.data)
  }

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-200 rounded-xl animate-pulse" /></div>
  if (!order) return <div className="p-6 text-center text-gray-500">Supplier order not found</div>

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/supplier-orders')} className="btn-ghost"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-[#0FD452]" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Order Details</h1>
          <p className="text-sm text-gray-500">Approve, then complete with buy/sell prices to land stock automatically.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-dark">{order.order_code}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>{order.status}</span>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4" />{order.supplier?.name || '—'} | Created: {formatDate(order.created_at)}</p>
          </div>
          <div className="flex gap-2">
            {order.status === 'submitted' && <button onClick={handleApprove} className="btn-primary"><CheckCircle className="w-4 h-4" /> Approve</button>}
            {order.status === 'approved' && <button onClick={openComplete} className="btn-primary"><Package className="w-4 h-4" /> Complete & Stock In</button>}
            {!['completed', 'cancelled'].includes(order.status) && <button onClick={handleCancel} className="btn-danger-outline"><XCircle className="w-4 h-4" /> Cancel</button>}
            <button onClick={() => window.print()} className="btn-secondary"><Printer className="w-4 h-4" /> Print</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Supplier<span className="font-medium text-dark">{order.supplier?.name || '—'}</span></span></div>
            <div className="flex justify-between"><span className="text-gray-600">Created By<span className="font-medium text-dark">{order.created_by_user?.name || order.created_by || '—'}</span></span></div>
            <div className="flex justify-between"><span className="text-gray-600">Approved<span className="font-medium text-dark">{order.approved_at ? formatDate(order.approved_at) : '—'}</span></span></div>
            <div className="flex justify-between"><span className="text-gray-600">Completed<span className="font-medium text-dark">{order.completed_at ? formatDate(order.completed_at) : '—'}</span></span></div>
            {order.notes && <p className="text-gray-600 pt-2">{order.notes}</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Workflow</h3>
          <div className="space-y-3">
            {['submitted', 'approved', 'completed'].map((step, i) => {
              const stepOrder = ['submitted', 'approved', 'completed']
              const currentIdx = stepOrder.indexOf(order.status)
              const stepIdx = stepOrder.indexOf(step)
              const isActive = stepIdx <= currentIdx
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-primary text-dark' : 'bg-gray-200 text-gray-400'}`}>{isActive ? '✓' : i + 1}</div>
                  <span className={`text-sm ${isActive ? 'text-dark font-medium' : 'text-gray-400'}`}>{step.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4">Completing auto-creates stock movements and raises quantities for every item.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Items</h3>
          <p className="text-3xl font-bold text-dark">{order.items?.length || 0}<span className="text-base font-normal text-gray-400"> drugs</span></p>
          <p className="text-sm text-gray-500 mt-2">Total ordered: <span className="font-semibold text-dark">{order.items?.reduce((s, it) => s + (it.quantity_ordered || 0), 0) || 0}</span></p>
          <p className="text-sm text-gray-500">Total received: <span className="font-semibold text-green-600">{order.items?.reduce((s, it) => s + (it.quantity_received || 0), 0) || 0}</span></p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-lg font-semibold text-dark">Order Items</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-[#0FD452]" /><span>Drug</span></div></th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>Batch</span></div></th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center justify-end gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Ordered</span></div></th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center justify-end gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>Received</span></div></th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center justify-end gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[#0FD452]" /><span>Buy Price</span></div></th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center justify-end gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[#0FD452]" /><span>Sell Price</span></div></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-[#0FD452]/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Pill className="h-4 w-4 text-[#0FD452]" /></div>
                      <div><p className="text-sm font-medium text-dark">{item.drug_name || item.drug?.name || 'Drug #' + item.drug_id}</p>{item.manufacturer && <p className="text-xs text-gray-400">{item.manufacturer}</p>}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.batch_number || '—'}</td>
                  <td className="px-6 py-4 text-sm text-dark text-right">{item.quantity_ordered}</td>
                  <td className="px-6 py-4 text-sm text-right">{item.quantity_received != null ? <span className="text-green-600 font-medium">{item.quantity_received}</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-6 py-4 text-sm text-dark text-right">{item.buying_price != null ? `TZS ${parseFloat(item.buying_price).toLocaleString()}` : <span className="text-gray-300">—</span>}</td>
                  <td className="px-6 py-4 text-sm text-dark text-right">{item.selling_price != null ? `TZS ${parseFloat(item.selling_price).toLocaleString()}` : <span className="text-gray-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {order.items?.length === 0 && <div className="text-center py-12 text-gray-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No items</p></div>}
      </div>

      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowComplete(false)} />
          <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-dark mb-1">Complete Order — {order.order_code}</h3>
            <p className="text-sm text-gray-500 mb-4">Enter the buying and selling price for each item. Stock is added automatically; quantities received default to what was ordered.</p>
            <div className="space-y-4">
              {completeItems.map((item, i) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-dark">{item.drug_name}</p>
                    <p className="text-xs text-gray-500">Ordered: {item.quantity_ordered}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-xs text-gray-500 mb-1">Buying Price *</label><input type="number" step="0.01" min="0" value={item.buying_price} onChange={(e) => setCompleteItem(i, 'buying_price', e.target.value)} placeholder="TZS" className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Selling Price *</label><input type="number" step="0.01" min="0" value={item.selling_price} onChange={(e) => setCompleteItem(i, 'selling_price', e.target.value)} placeholder="TZS" className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Received</label><input type="number" min="0" value={item.quantity_received} onChange={(e) => setCompleteItem(i, 'quantity_received', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Expiry</label><input type="date" value={item.expiry_date} onChange={(e) => setCompleteItem(i, 'expiry_date', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none" /></div>
                    <div className="col-span-2 md:col-span-4"><label className="block text-xs text-gray-500 mb-1">Batch Number</label><input type="text" value={item.batch_number} onChange={(e) => setCompleteItem(i, 'batch_number', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none" placeholder="Optional" /></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowComplete(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleComplete} disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? 'Completing...' : 'Complete & Add to Stock'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}