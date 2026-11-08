import { useCallback, useEffect, useState } from 'react'
import { Search, Package, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, Spinner, EmptyState, Badge, formatMoney, formatDate } from '../wholesaler/WholesalerUI'

const TABS = ['all', 'pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled']

export default function WholesalerPurchaseOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/wholesaler-portal/manufacturer-orders', { params: { status } })
      setOrders(data.data || [])
    } catch (e) { toast.error(e?.response?.data?.message || 'Could not load.') }
    finally { setLoading(false) }
  }, [status])

  useEffect(() => { load() }, [load])

  const cancel = async (id) => {
    setBusy(id)
    try { await api.post(`/wholesaler-portal/manufacturer-orders/${id}/cancel`); toast.success('Cancelled.'); load() }
    catch (e) { toast.error(e?.response?.data?.message || 'Could not cancel.') }
    finally { setBusy(null) }
  }
  const receive = async (id) => {
    setBusy(id)
    try { await api.post(`/wholesaler-portal/manufacturer-orders/${id}/receive`); toast.success('Received.'); load() }
    catch (e) { toast.error(e?.response?.data?.message || 'Could not receive.') }
    finally { setBusy(null) }
  }

  return (
    <div>
      <PageHeader title="Purchase orders" subtitle="Orders placed with manufacturers." />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setStatus(t)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${status === t ? 'bg-[#0FD452] text-[#000F14]' : 'bg-white text-gray-600 border border-gray-200'}`}>{t}</button>
        ))}
      </div>
      {loading ? <Spinner /> : orders.length === 0 ? <EmptyState icon={Package} title="No orders" message="No manufacturer orders yet." /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="px-3 py-2.5">Order</th><th className="px-3 py-2.5">Manufacturer</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Total</th><th className="px-3 py-2.5">Placed</th><th className="px-3 py-2.5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-3 py-3 font-semibold text-[#000F14]">{o.order_id}</td>
                  <td className="px-3 py-3 text-gray-600">{o.manufacturer_name}</td>
                  <td className="px-3 py-3"><Badge tone="blue">{o.status}</Badge></td>
                  <td className="px-3 py-3 font-semibold">{formatMoney(o.total_amount)}</td>
                  <td className="px-3 py-3 text-gray-600">{formatDate(o.created_at)}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {o.status === 'dispatched' && (
                        <button disabled={busy === o.id} onClick={() => receive(o.id)} className="rounded-lg bg-[#0FD452] px-2.5 py-1.5 text-xs font-semibold text-[#000F14] disabled:opacity-60">{busy === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Receive'}</button>
                      )}
                      {['pending', 'confirmed'].includes(o.status) && (
                        <button disabled={busy === o.id} onClick={() => cancel(o.id)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-60">Cancel</button>
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
