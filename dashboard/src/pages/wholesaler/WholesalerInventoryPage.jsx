import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Boxes, Pencil, PackagePlus, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, inputClass, Badge, EmptyState, Spinner, formatMoney } from '../wholesaler/WholesalerUI'

export default function WholesalerInventoryPage() {
  const navigate = useNavigate()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/wholesaler-portal/inventory')
      setInventory(data.items || [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load inventory.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = inventory.filter((i) => !search || (i.drug_name || '').toLowerCase().includes(search.toLowerCase()))
  const totalUnits = filtered.reduce((s, p) => s + Number(p.quantity_in_stock || 0), 0)

  return (
    <div>
      <PageHeader title="Wholesale inventory" subtitle="Track stock across your distribution catalogue." action={
        <button onClick={() => navigate('/dashboard/wholesaler/inventory/new')} className="rounded-xl bg-[#0FD452] px-4 py-2 text-sm font-semibold text-[#000F14]">Add item</button>
      } />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-gray-500">Items</p><p className="text-xl font-bold">{filtered.length}</p></div>
        <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-gray-500">Units in stock</p><p className="text-xl font-bold">{totalUnits.toLocaleString()}</p></div>
        <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-gray-500">Low stock</p><p className="text-xl font-bold">{filtered.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length}</p></div>
      </div>
      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className={`${inputClass} pl-9`} />
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState icon={Boxes} title="No inventory" message="Add your first inventory item." /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Drug</th><th className="px-3 py-2.5">Batch</th><th className="px-3 py-2.5">Qty</th><th className="px-3 py-2.5">Unit price</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50/60">
                  <td className="px-3 py-3 font-semibold text-[#000F14]">{i.drug_name}</td>
                  <td className="px-3 py-3 text-gray-600">{i.batch_number}</td>
                  <td className="px-3 py-3">{i.quantity_in_stock}</td>
                  <td className="px-3 py-3">{formatMoney(i.unit_price)}</td>
                  <td className="px-3 py-3"><Badge tone={i.status === 'available' ? 'green' : 'amber'}>{i.status}</Badge></td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => navigate(`/dashboard/wholesaler/inventory/${i.id}/edit`)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
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
