import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Loader2, Clock, Truck, CheckCircle2, Factory } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import PageHeader from '../../components/PageHeader'

const TABS = ['all', 'pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled']

export default function AdminManufacturerOrdersPage() {
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
      const { data } = await api.get('/admin/manufacturer-orders', { params: { status: status !== 'all' ? status : undefined } })
      setAllOrders(data.data || data || [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  const advance = async (order) => {
    const NEXT = { pending: 'confirmed', confirmed: 'packed', packed: 'dispatched', dispatched: 'delivered' }
    const target = NEXT[order.status]
    if (!target) return
    setBusy(order.id)
    try {
      await api.post(`/admin/manufacturer-orders/${order.id}/status`, { status: target })
      toast.success('Order updated.')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update order.')
    } finally {
      setBusy(null)
    }
  }

  const filtered = allOrders.filter((o) => !search || (o.order_id || '').toLowerCase().includes(search.toLowerCase()) || (o.wholesaler_name || '').toLowerCase().includes(search.toLowerCase()) || (o.manufacturer_name || '').toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="p-6"><div className="animate-spin h-8 w-8 border-4 border-[#0FD452] border-t-transparent rounded-full mx-auto mt-10" /></div>

  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Manufacturer orders (admin)" subtitle="Oversight of all wholesaler ↔ manufacturer orders." icon={Factory} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0FD452]/10 flex items-center justify-center"><Package className="w-5 h-5 text-[#0FD452]" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{allOrders.length}</p><p className="text-xs text-gray-500">Total orders</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{allOrders.filter((o) => o.status === 'pending').length}</p><p className="text-xs text-gray-500">Pending</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Truck className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{allOrders.filter((o) => ['confirmed','packed','dispatched'].includes(o.status)).length}</p><p className="text-xs text-gray-500">In progress</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{allOrders.filter((o) => o.status === 'delivered').length}</p><p className="text-xs text-gray-500">Delivered</p></div>
        </div>
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
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, wholesaler or manufacturer…" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">No orders found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Order</th>
                <th className="px-3 py-2.5">Wholesaler</th>
                <th className="px-3 py-2.5">Manufacturer</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Payment</th>
                <th className="px-3 py-2.5">Total</th>
                <th className="px-3 py-2.5">Expected delivery</th>
                <th className="px-3 py-2.5">Tracking</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/dashboard/manufacturer-orders-admin/${o.id}`)}>
                  <td className="px-3 py-3 font-semibold">{o.order_id}</td>
                  <td className="px-3 py-3">{o.wholesaler_name}</td>
                  <td className="px-3 py-3">{o.manufacturer_name}</td>
                  <td className="px-3 py-3">{o.status}</td>
                  <td className="px-3 py-3">{o.payment_status || '—'}</td>
                  <td className="px-3 py-3 font-semibold">{o.total_amount}</td>
                  <td className="px-3 py-3 text-gray-600">{o.expected_delivery_date || '—'}</td>
                  <td className="px-3 py-3 text-gray-600">{o.tracking_number || '—'}</td>
                  <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/dashboard/manufacturer-orders-admin/${o.id}`)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">View</button>
                      {o.status !== 'delivered' && o.status !== 'cancelled' && (
                        <button onClick={() => advance(o)} disabled={busy === o.id} className="rounded-lg bg-[#0FD452] px-2.5 py-1.5 text-xs font-semibold text-[#000F14] hover:bg-[#0cb843] disabled:opacity-60">
                          {busy === o.id ? '…' : 'Advance'}
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