import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Package, Truck, Printer, Pill, Hash, DollarSign, ShoppingCart } from 'lucide-react'
import api from '../../services/api'
import { currentBase } from '../../utils/roles'
import toast from 'react-hot-toast'

const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', pending_approval: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', ordered: 'bg-indigo-100 text-indigo-700', partially_received: 'bg-orange-100 text-orange-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }

export default function PurchaseOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReceive, setShowReceive] = useState(false)
  const [receiveItems, setReceiveItems] = useState([])
  const [receiving, setReceiving] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/purchase-orders/${id}`)
        setOrder(res.data.order || res.data)
      } catch { setOrder(null) } finally { setLoading(false) }
    }
    fetchOrder()
  }, [id])

  const openReceive = () => {
    setReceiveItems(order.items.map(item => ({ ...item, qty_to_receive: item.quantity_ordered - item.quantity_received })))
    setShowReceive(true)
  }

  const handleReceive = async () => {
    setReceiving(true)
    try {
      await api.post(`/purchase-orders/${id}/receive`, {
        items: receiveItems.map(i => ({ id: i.id, quantity_received: parseInt(i.qty_to_receive), batch_number: i.batch_number, expiry_date: i.expiry_date }))
      })
      toast.success('Goods received successfully')
      setShowReceive(false)
      const res = await api.get(`/purchase-orders/${id}`)
      setOrder(res.data.order || res.data)
    } catch { toast.error('Failed to update'); setShowReceive(false) } finally { setReceiving(false) }
  }

  const handleApprove = async () => {
    try { await api.post(`/purchase-orders/${id}/approve`); toast.success('Order approved') } catch { toast.error('Failed to update') }
    const res = await api.get(`/purchase-orders/${id}`).catch(() => ({ data: { order: { ...order, status: 'approved' } } }))
    setOrder(res.data.order)
  }

  const handleCancel = async () => {
    try { await api.post(`/purchase-orders/${id}/cancel`); toast.success('Order cancelled') } catch { toast.error('Failed to update') }
    setOrder({ ...order, status: 'cancelled' })
  }

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-200 rounded-xl animate-pulse" /></div>
  if (!order) return <div className="p-6 text-center text-gray-500">Order not found</div>

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(currentBase() + '/purchase-orders')} className="btn-ghost">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-[#0FD452]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order Details</h1>
          <p className="text-sm text-gray-500">View complete purchase order information.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold text-dark">{order.order_number}</h1><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>{order.status?.replace(/_/g, ' ')}</span></div>
            <p className="text-sm text-gray-500">Supplier: {order.supplier?.name || '—'} | Order Date: {formatDate(order.order_date)}</p>
          </div>
          <div className="flex gap-2">
            {order.status === 'pending_approval' && <button onClick={handleApprove} className="btn-primary"><CheckCircle className="w-4 h-4" /> Approve</button>}
            {['ordered', 'approved'].includes(order.status) && <button onClick={openReceive} className="btn-primary"><Package className="w-4 h-4" /> Receive Goods</button>}
            {!['received', 'cancelled'].includes(order.status) && <button onClick={handleCancel} className="btn-danger-outline"><XCircle className="w-4 h-4" /> Cancel</button>}
            <button onClick={() => window.print()} className="btn-secondary"><Printer className="w-4 h-4" /> Print</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Expected Delivery<span className="font-medium text-dark">{formatDate(order.expected_delivery_date)}</span></span></div>
            <div className="flex justify-between"><span className="text-gray-600">Payment Status<span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>{order.payment_status}</span></span></div>
            <div className="flex justify-between"><span className="text-gray-600">Amount Paid<span className="font-medium text-dark">TZS {parseFloat(order.amount_paid || 0).toFixed(2)}</span></span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Financial Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal<span className="font-medium text-dark">TZS {parseFloat(order.subtotal || 0).toFixed(2)}</span></span></div>
            <div className="flex justify-between"><span className="text-gray-600">Tax<span className="font-medium text-dark">TZS {parseFloat(order.tax_amount || 0).toFixed(2)}</span></span></div>
            <div className="flex justify-between"><span className="text-gray-600">Discount<span className="font-medium text-dark">-TZS {parseFloat(order.discount_amount || 0).toFixed(2)}</span></span></div>
            <div className="flex justify-between border-t border-gray-100 pt-2"><span className="font-semibold text-dark">Total<span className="font-bold text-lg text-primary">TZS {parseFloat(order.total || 0).toFixed(2)}</span></span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Workflow</h3>
          <div className="space-y-3">
            {['draft', 'pending_approval', 'approved', 'ordered', 'received'].map((step, i) => {
              const statusOrder = ['draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received']
              const currentIdx = statusOrder.indexOf(order.status)
              const stepIdx = statusOrder.indexOf(step)
              const isActive = stepIdx <= currentIdx
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-primary text-dark' : 'bg-gray-200 text-gray-400'}`}>{isActive ? '✓' : i + 1}</div>
                  <span className={`text-sm ${isActive ? 'text-dark font-medium' : 'text-gray-400'}`}>{step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-lg font-semibold text-dark">Order Items</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-[#0FD452]" />
                  <span>Drug</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                  <span>Batch</span>
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                <div className="flex items-center justify-end gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                  <span>Qty Ordered</span>
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                <div className="flex items-center justify-end gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                  <span>Qty Received</span>
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                <div className="flex items-center justify-end gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                  <span>Unit Cost</span>
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                <div className="flex items-center justify-end gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                  <span>Total</span>
                </div>
              </th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map(item => (
                <tr key={item.id} className="transition-colors hover:bg-[#0FD452]/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                        <Pill className="h-4 w-4 text-[#0FD452]" />
                      </div>
                      <span className="text-sm font-medium text-dark">{item.drug?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.batch_number || '—'}</td>
                  <td className="px-6 py-4 text-sm text-dark text-right">{item.quantity_ordered}</td>
                  <td className="px-6 py-4 text-sm text-right"><span className={item.quantity_received >= item.quantity_ordered ? 'text-green-600 font-medium' : 'text-orange-600'}>{item.quantity_received}</span></td>
                  <td className="px-6 py-4 text-sm text-dark text-right">TZS {parseFloat(item.unit_cost).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-dark text-right">TZS {parseFloat(item.total_cost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReceive(false)} />
          <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">Receive Goods - {order.order_number}</h3>
            <div className="space-y-4">
              {receiveItems.map((item, i) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-dark mb-3">{item.drug?.name} — Max: {item.quantity_ordered - item.quantity_received}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-xs text-gray-500 mb-1">Receiving</label><input type="number" min="0" max={item.quantity_ordered - item.quantity_received} value={item.qty_to_receive} onChange={(e) => { const items = [...receiveItems]; items[i].qty_to_receive = parseInt(e.target.value) || 0; setReceiveItems(items) }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Batch Number</label><input type="text" value={item.batch_number || ''} onChange={(e) => { const items = [...receiveItems]; items[i].batch_number = e.target.value; setReceiveItems(items) }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Expiry Date</label><input type="date" value={item.expiry_date || ''} onChange={(e) => { const items = [...receiveItems]; items[i].expiry_date = e.target.value; setReceiveItems(items) }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm outline-none" /></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowReceive(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleReceive} disabled={receiving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{receiving ? 'Receiving...' : 'Confirm Receive'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
