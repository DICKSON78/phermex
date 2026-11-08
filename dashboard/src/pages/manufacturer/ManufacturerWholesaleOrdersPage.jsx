import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Loader2, Clock, Truck, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, Spinner, EmptyState, Badge, StatCard, formatMoney, formatDate } from './ManufacturerUI'

const TABS = ['all', 'pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled']
const NEXT = { pending: 'confirmed', confirmed: 'packed', packed: 'dispatched', dispatched: 'delivered' }

export default function ManufacturerWholesaleOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/manufacturer-orders', { params: { status, search: search || undefined } })
      setAllOrders(data.data || [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }, [status, search])

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  const advance = async (order) => {
    const target = NEXT[order.status]
    if (!target) return
    setBusy(order.id)
    try {
      await api.post(`/manufacturer-orders/${order.id}/status`, { status: target })
      toast.success('Order updated.')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update order.')
    } finally {
      setBusy(null)
    }
  }

  const cancel = async (order) => {
    setBusy(order.id)
    try {
      await api.post(`/manufacturer-orders/${order.id}/cancel`, { reason: 'Cancelled by manufacturer' })
      toast.success('Order cancelled.')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not cancel.')
    } finally {
      setBusy(null)
    }
  }

  const filtered = allOrders.filter((o) => !search || (o.order_id || '').toLowerCase().includes(search.toLowerCase()) || (o.wholesaler_name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="Wholesale orders" subtitle="Incoming purchase orders from wholesalers." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Total orders" value={allOrders.length} />
        <StatCard icon={Clock} label="Pending requests" value={allOrders.filter((o) => o.status === 'pending').length} tone="text-amber-600" />
        <StatCard icon={Truck} label="In progress" value={allOrders.filter((o) => ['confirmed','packed','dispatched'].includes(o.status)).length} tone="text-blue-700" />
        <StatCard icon={CheckCircle2} label="Delivered" value={allOrders.filter((o) => o.status === 'delivered').length} tone="text-[#0F9D58]" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setStatus(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${status === t ? 'bg-[#0FD452] text-[#000F14]' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order or wholesaler…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
      </div>
      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order or wholesaler…" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState icon={Package} title="No orders" message="No wholesale orders yet." /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Order</th><th className="px-3 py-2.5">Wholesaler</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Payment</th><th className="px-3 py-2.5">Total</th><th className="px-3 py-2.5">Expected delivery</th><th className="px-3 py-2.5">Tracking</th><th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => navigate(`/dashboard/manufacturer/wholesale-orders/${o.id}`)}>
                  <td className="px-3 py-3 font-semibold text-[#000F14]">{o.order_id}</td>
                  <td className="px-3 py-3 text-gray-600">{o.wholesaler_name}</td>
                  <td className="px-3 py-3"><Badge tone="blue">{o.status}</Badge></td>
                  <td className="px-3 py-3 font-semibold">{formatMoney(o.total_amount)}</td>
                  <td className="px-3 py-3 text-gray-600">{o.payment_status || '—'}</td>
                  <td className="px-3 py-3 text-gray-600">{formatDate(o.expected_delivery_date)}</td>
                  <td className="px-3 py-3 text-gray-600">{o.tracking_number || '—'}</td>
                  <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/dashboard/manufacturer/wholesale-orders/${o.id}`)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">View</button>
                      {NEXT[o.status] && (
                        <button disabled={busy === o.id} onClick={() => advance(o)} className="rounded-lg bg-[#0FD452] px-2.5 py-1.5 text-xs font-semibold text-[#000F14] disabled:opacity-60">
                          {busy === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Mark ${NEXT[o.status]}`}
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(o.status) && (
                        <button disabled={busy === o.id} onClick={() => cancel(o)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-60">
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
