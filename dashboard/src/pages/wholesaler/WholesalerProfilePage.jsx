import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, Spinner } from '../wholesaler/WholesalerUI'

export default function WholesalerProfilePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      try { const { data: payload } = await api.get('/wholesaler-portal/profile'); setData(payload.data) }
      catch (e) { toast.error(e?.response?.data?.message || 'Could not load.') }
      finally { setLoading(false) }
    })()
  }, [])
  if (loading) return <Spinner />
  return (
    <div>
      <PageHeader title="Wholesaler profile" subtitle="Your trading account details." />
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3 text-sm">
        {data && Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-gray-100 pb-2">
            <span className="font-semibold text-gray-600">{k}</span>
            <span className="text-[#000F14]">{String(v ?? '—')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
