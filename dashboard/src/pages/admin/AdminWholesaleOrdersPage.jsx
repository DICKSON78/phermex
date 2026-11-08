import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function AdminWholesaleOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    try { const { data } = await api.get('/admin/wholesale-orders'); setOrders(data.data || []) }
    catch (e) { toast.error(e?.response?.data?.message || 'Could not load.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  if (loading) return <div className="p-6">Loading…</div>
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#000F14]">Wholesale orders (admin)</h1>
      {orders.length === 0 ? <p className="text-gray-500">No orders.</p> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="px-3 py-2.5">Order</th><th className="px-3 py-2.5">Pharmacy</th><th className="px-3 py-2.5">Wholesaler</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-3 py-3 font-semibold">{o.order_id}</td>
                  <td className="px-3 py-3">{o.pharmacy_name}</td>
                  <td className="px-3 py-3">{o.wholesaler_name}</td>
                  <td className="px-3 py-3">{o.status}</td>
                  <td className="px-3 py-3">{o.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}