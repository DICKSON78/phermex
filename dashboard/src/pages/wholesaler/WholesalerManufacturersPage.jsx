import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Package, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, Spinner, EmptyState, formatMoney } from '../wholesaler/WholesalerUI'

export default function WholesalerManufacturersPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/wholesaler-portal/manufacturers'); setItems(data.data || []) }
      catch (e) { toast.error(e?.response?.data?.message || 'Could not load.') }
      finally { setLoading(false) }
    })()
  }, [])
  if (loading) return <Spinner />
  return (
    <div>
      <PageHeader title="Manufacturers" subtitle="Active manufacturers and their catalogues." />
      {items.length === 0 ? <EmptyState icon={Store} title="No manufacturers" message="No active manufacturers." /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-bold text-[#000F14]">{m.name}</p>
              <p className="text-xs text-gray-500">{m.product_count} products</p>
              <button onClick={() => navigate(`/dashboard/wholesaler/manufacturers/${m.id}/catalog`)} className="mt-3 rounded-lg bg-[#0FD452] px-3 py-1.5 text-xs font-semibold text-[#000F14]">View catalogue</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
