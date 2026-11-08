import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Boxes, Pencil, PackagePlus, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import {
  PageHeader,
  inputClass,
  Badge,
  EmptyState,
  Spinner,
  formatDate,
  formatMoney,
} from './ManufacturerUI'

export default function ManufacturerInventoryPage() {
  const navigate = useNavigate()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/manufacturer-portal/inventory', {
        params: { search: search || undefined, low_stock: lowStockOnly || undefined },
      })
      setInventory(data.inventory || [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load inventory.')
    } finally {
      setLoading(false)
    }
  }, [search, lowStockOnly])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const openEdit = (product) => navigate(`/dashboard/manufacturer/inventory/${product.id}/edit`)

  const totalUnits = inventory.reduce((sum, p) => sum + Number(p.quantity || 0), 0)
  const totalValue = inventory.reduce((sum, p) => sum + Number(p.quantity || 0) * Number(p.cost_price || 0), 0)
  const lowCount = inventory.filter((p) => Number(p.quantity || 0) <= Number(p.reorder_level || 0)).length

  return (
    <div>
      <PageHeader
        title="Manufacturer inventory"
        subtitle="Track units, batch numbers, expiry dates and stock value across your products."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Summary icon={Boxes} label="Units in stock" value={totalUnits.toLocaleString()} />
        <Summary icon={PackagePlus} label="Inventory value" value={formatMoney(totalValue)} />
        <Summary icon={AlertTriangle} label="Low stock items" value={lowCount} tone={lowCount ? 'text-red-600' : 'text-[#000F14]'} />
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or batch…"
            className={`${inputClass} pl-9`}
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#0FD452] focus:ring-[#0FD452]"
          />
          Low stock only
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : inventory.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nothing in inventory"
          message="Add products from the catalogue first, then update their stock here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/60">
                <tr className="text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Reorder</th>
                  <th className="px-4 py-3 font-semibold">Cost</th>
                  <th className="px-4 py-3 font-semibold">Selling</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inventory.map((product) => {
                  const low = Number(product.quantity || 0) <= Number(product.reorder_level || 0)
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#000F14]">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category || product.generic_name || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.batch_number || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={low ? 'font-semibold text-red-600' : 'font-medium text-gray-700'}>
                          {product.quantity ?? 0}
                        </span>
                        {low && <Badge tone="red">Low</Badge>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.reorder_level ?? 0}</td>
                      <td className="px-4 py-3 text-gray-600">{formatMoney(product.cost_price)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatMoney(product.selling_price)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(product.expiry_date)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Update
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

function Summary({ icon: Icon, label, value, tone = 'text-[#000F14]' }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0a8f3c]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-lg font-bold ${tone}`}>{value}</p>
      </div>
    </div>
  )
}
