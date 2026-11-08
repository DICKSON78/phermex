import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, Spinner, EmptyState, formatMoney } from '../wholesaler/WholesalerUI'

export default function WholesalerManufacturerCatalogPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data: payload } = await api.get(`/wholesaler-portal/manufacturers/${id}/catalog`)
        setData(payload)
      } catch (e) { toast.error(e?.response?.data?.message || 'Could not load catalogue.') }
      finally { setLoading(false) }
    })()
  }, [id])

  const placeOrder = async () => {
    const items = (data?.items || [])
      .filter((p) => Number(qty[p.id] || 0) > 0)
      .map((p) => ({ product_id: p.id, quantity: Number(qty[p.id]) }))
    if (items.length === 0) { toast.error('Select at least one product.'); return }
    setSubmitting(true)
    try {
      await api.post('/wholesaler-portal/manufacturer-orders', { manufacturer_user_id: id, items })
      toast.success('Order placed.')
      navigate('/dashboard/wholesaler/purchase-orders')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not place order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />
  return (
    <div>
      <PageHeader title={data?.manufacturer?.name || 'Manufacturer catalogue'} subtitle="Select quantities to order." />
      {(data?.items || []).length === 0 ? <EmptyState icon={Package} title="No products" message="No available products." /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="px-3 py-2.5">Product</th><th className="px-3 py-2.5">SKU</th><th className="px-3 py-2.5">Available</th><th className="px-3 py-2.5">Price</th><th className="px-3 py-2.5">Qty</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.items || []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-3 font-semibold text-[#000F14]">{p.name}</td>
                    <td className="px-3 py-3 text-gray-600">{p.sku}</td>
                    <td className="px-3 py-3">{p.quantity}</td>
                    <td className="px-3 py-3">{formatMoney(p.wholesale_price)}</td>
                    <td className="px-3 py-3">
                      <input type="number" min="0" max={p.quantity} className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                        value={qty[p.id] || ''} onChange={(e) => setQty((q) => ({ ...q, [p.id]: e.target.value }))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={placeOrder} disabled={submitting} className="rounded-xl bg-[#0FD452] px-4 py-2 text-sm font-semibold text-[#000F14] disabled:opacity-60">
              {submitting ? 'Placing…' : 'Place order'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
