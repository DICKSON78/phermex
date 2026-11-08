import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, Spinner, Badge, formatMoney, formatDate } from '../wholesaler/WholesalerUI'

export default function WholesalerOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      setLoading(true)
      try { const { data } = await api.get(`/wholesaler-portal/orders/${id}`); setOrder(data.order) }
      catch (e) { toast.error(e?.response?.data?.message || 'Could not load.') }
      finally { setLoading(false) }
    })()
  }, [id])
  if (loading) return <Spinner />
  if (!order) return <div className="p-6">Order not found.</div>
  return (
    <div>
      <PageHeader title={`Order ${order.order_id}`} subtitle={order.pharmacy_name} />
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#0FD452]"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Status</p><p className="mt-1 text-lg font-bold text-[#000F14]">{order.status}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Total</p><p className="mt-1 text-lg font-bold text-[#000F14]">{formatMoney(order.total_amount)}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Ordered</p><p className="mt-1 text-lg font-bold text-[#000F14]">{formatDate(order.ordered_at)}</p></div>
      </div>
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-[#000F14]">Items</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
            <tr><th className="px-2 py-2">Drug</th><th className="px-2 py-2">Qty</th><th className="px-2 py-2">Unit price</th><th className="px-2 py-2">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(order.items || []).map((i) => (
              <tr key={i.id}>
                <td className="px-2 py-2 font-semibold text-[#000F14]">{i.drug_name}</td>
                <td className="px-2 py-2">{i.quantity}</td>
                <td className="px-2 py-2">{formatMoney(i.unit_price)}</td>
                <td className="px-2 py-2 font-semibold">{formatMoney(i.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-[#000F14]">Timeline</h2>
        <div className="space-y-3">
          {(order.events || []).map((e) => (
            <div key={e.id} className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#0FD452]" />
              <div>
                <p className="text-sm font-semibold text-[#000F14]">{e.title}</p>
                <p className="text-xs text-gray-500">{e.description}</p>
                <p className="text-xs text-gray-400">{formatDate(e.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
