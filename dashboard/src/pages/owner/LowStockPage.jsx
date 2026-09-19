import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Search, Eye, ShoppingCart, Package, DollarSign,
  ChevronLeft, ChevronRight, X, Tag, FolderOpen, RefreshCw,
} from 'lucide-react'
import { currentBase } from '../../utils/roles'
import api from '../../services/api'

export default function LowStockPage() {
  const navigate = useNavigate()
  const base = currentBase()
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [reorderModal, setReorderModal] = useState(null)
  const pageSize = 10

  useEffect(() => {
    fetchDrugs()
  }, [])

  const fetchDrugs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/drugs', { params: { stock_status: 'low_stock' } })
      setDrugs(toArray(res.data))
    } catch {
      setDrugs([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = drugs.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.generic_name && d.generic_name.toLowerCase().includes(search.toLowerCase()))
  )

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const outOfStock = drugs.filter((d) => d.quantity === 0).length
  const belowReorder = drugs.filter((d) => d.quantity > 0).length
  const estReorderCost = drugs.reduce((sum, d) => {
    const shortage = Math.max(0, (d.reorder_level || 0) - (d.quantity || 0))
    return sum + shortage * (d.buying_price || 0)
  }, 0)

  const statCards = [
    { label: 'Total Low Stock', value: drugs.length, icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Out of Stock', value: outOfStock, icon: Package, color: 'bg-red-100 text-red-600' },
    { label: 'Below Reorder', value: belowReorder, icon: AlertTriangle, color: 'bg-orange-100 text-orange-600' },
    { label: 'Est. Reorder Cost', value: `TZS ${estReorderCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
            <p className="text-sm text-gray-500">Drugs below minimum stock level requiring reorder.</p>
          </div>
        </div>
      </div>

      <div className="mb-2">
        {drugs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">
              {drugs.length} drug{drugs.length !== 1 ? 's' : ''} below reorder level — restocking recommended
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-[#000F14]">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            placeholder="Search by drug name..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#000F14] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Drug Name</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell"><div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#0FD452]" /><span>Generic</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell"><div className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-[#0FD452]" /><span>Category</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Stock</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-[#0FD452]" /><span>Reorder</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-[#0FD452]" /><span>Shortage</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell"><div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[#0FD452]" /><span>Buying Price</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell"><div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[#0FD452]" /><span>Est. Cost</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Eye className="w-3.5 h-3.5 text-[#0FD452]" /><span>Actions</span></div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-[#0FD452] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>All drugs are well stocked</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((drug) => {
                  const shortage = Math.max(0, (drug.reorder_level || 0) - (drug.quantity || 0))
                  const estCost = shortage * (drug.buying_price || 0)
                  const isOutOfStock = drug.quantity === 0
                  return (
                    <tr
                      key={drug.id}
                      className={`transition-colors hover:bg-[#0FD452]/5 ${isOutOfStock ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Package className="h-4 w-4 text-[#0FD452]" /></div>
                          <p className="text-sm font-medium text-[#000F14]">{drug.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{drug.generic_name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">{typeof drug.category === 'object' ? drug.category?.name : (drug.category || '—')}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {drug.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{drug.reorder_level}</td>
                      <td className="px-6 py-4 text-sm font-medium text-red-600">-{shortage}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">TZS {Number(drug.buying_price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#000F14] hidden lg:table-cell">TZS {Number(estCost).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setReorderModal(drug)}
                            className="btn-icon-primary"
                            title="Reorder"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`${base}/drugs/${drug.id}`)}
                            className="btn-icon-blue"
                            title="View Drug"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-ghost"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page
                if (totalPages <= 5) page = i + 1
                else if (currentPage <= 3) page = i + 1
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                else page = currentPage - 2 + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded text-xs font-medium transition ${
                      currentPage === page
                        ? 'bg-[#0FD452] text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-ghost"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {reorderModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setReorderModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#000F14]">Reorder Drug</h3>
                <button onClick={() => setReorderModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-[#000F14]">{reorderModal.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Current stock: {reorderModal.quantity} | Reorder level: {reorderModal.reorder_level}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity to Order</label>
                  <input
                    type="number"
                    defaultValue={Math.max(0, (reorderModal.reorder_level || 0) - (reorderModal.quantity || 0))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#000F14] focus:outline-none focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452]/30"
                  />
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                  Estimated cost: TZS {((Math.max(0, (reorderModal.reorder_level || 0) - (reorderModal.quantity || 0))) * (reorderModal.buying_price || 0)).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 justify-end">
                <button
                  onClick={() => setReorderModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setReorderModal(null)}
                  className="btn-primary"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Create Reorder
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
