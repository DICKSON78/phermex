import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Pill,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  PackageOpen,
  Tag,
  Calendar,
} from 'lucide-react'
import api from '../../services/api'

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <PackageOpen className="w-12 h-12 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No drugs found</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">
        Your drug inventory is empty. Add your first drug to get started with inventory management.
      </p>
      <button
        onClick={() => window.location.href = '/owner/drugs/new'}
        className="btn-primary"
      >
        <Plus className="w-5 h-5" />
        Add Your First Drug
      </button>
    </div>
  )
}

export default function DrugListPage() {
  const navigate = useNavigate()
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const [expiryFilter, setExpiryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteModal, setDeleteModal] = useState({ open: false, drug: null })
  const [categories, setCategories] = useState([])
  const pageSize = 10

  const fetchDrugs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      if (stockStatus) params.append('stock_status', stockStatus)
      if (expiryFilter) params.append('expiry', expiryFilter)

      const response = await api.get(`/drugs?${params.toString()}`)
      setDrugs(response.data.data || response.data)
    } catch {
      setDrugs([])
    } finally {
      setLoading(false)
    }
  }, [search, category, stockStatus, expiryFilter])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/drug-categories')
      setCategories(Array.isArray(response.data.data) ? response.data.data : [])
    } catch {
      setCategories([])
    }
  }, [])

  useEffect(() => {
    fetchDrugs()
  }, [fetchDrugs])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, category, stockStatus, expiryFilter])

  const handleDelete = async (drug) => {
    try {
      await api.delete(`/drugs/${drug.id}`)
      setDrugs(prev => prev.filter(d => d.id !== drug.id))
    } catch {
      setDrugs(prev => prev.filter(d => d.id !== drug.id))
    }
    setDeleteModal({ open: false, drug: null })
  }

  const stats = {
    total: drugs.length,
    lowStock: drugs.filter(d => d.quantity > 0 && d.quantity <= d.reorder_level).length,
    expiringSoon: drugs.filter(d => {
      if (!d.expiry_date) return false
      const exp = new Date(d.expiry_date)
      const now = new Date()
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      return exp > now && exp <= thirtyDays
    }).length,
    totalValue: drugs.reduce((sum, d) => sum + (d.buying_price * d.quantity), 0),
  }

  const filteredDrugs = drugs.filter(drug => {
    if (search && !drug.name.toLowerCase().includes(search.toLowerCase()) &&
        !(drug.generic_name && drug.generic_name.toLowerCase().includes(search.toLowerCase()))) {
      return false
    }
    const catName = typeof drug.category === 'object' ? drug.category?.name : drug.category
    if (category && catName !== category) return false
    if (stockStatus === 'in_stock' && drug.quantity <= drug.reorder_level) return false
    if (stockStatus === 'low_stock' && (drug.quantity === 0 || drug.quantity > drug.reorder_level)) return false
    if (stockStatus === 'out_of_stock' && drug.quantity !== 0) return false
    if (expiryFilter === 'expiring_soon') {
      if (!drug.expiry_date) return false
      const exp = new Date(drug.expiry_date)
      const now = new Date()
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      if (!(exp > now && exp <= thirtyDays)) return false
    }
    if (expiryFilter === 'expired') {
      if (!drug.expiry_date) return false
      if (new Date(drug.expiry_date) >= new Date()) return false
    }
    return true
  })

  const totalPages = Math.ceil(filteredDrugs.length / pageSize)
  const paginatedDrugs = filteredDrugs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const getStockBadge = (quantity, reorderLevel) => {
    if (quantity === 0) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>
    if (quantity <= reorderLevel) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Low Stock ({quantity})</span>
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">In Stock ({quantity})</span>
  }

  const getExpiryBadge = (date) => {
    if (!date) return <span className="text-gray-400">—</span>
    const exp = new Date(date)
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    if (exp < now) return <span className="text-red-600 font-medium">Expired</span>
    if (exp <= thirtyDays) return <span className="text-yellow-600 font-medium">{exp.toLocaleDateString()}</span>
    return <span className="text-gray-700">{exp.toLocaleDateString()}</span>
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Pill className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drug Inventory</h1>
            <p className="text-sm text-gray-500">Manage your pharmacy drug stock and pricing.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/owner/drugs/new')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Drug
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pill className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Drugs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">TZS {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drugs..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Expiry</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredDrugs.length === 0 ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <EmptyState />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Drug Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Category</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Buying Price</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Selling Price</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Stock</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Expiry Date</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedDrugs.map((drug) => (
                  <tr key={drug.id} className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Pill className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{drug.name}</p>
                          {drug.generic_name && (
                            <p className="text-xs text-gray-500">{drug.generic_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{typeof drug.category === 'object' ? drug.category?.name : (drug.category || '—')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">TZS {Number(drug.buying_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">TZS {Number(drug.selling_price).toFixed(2)}</td>
                    <td className="px-6 py-4">{getStockBadge(drug.quantity, drug.reorder_level)}</td>
                    <td className="px-6 py-4">{getExpiryBadge(drug.expiry_date)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/owner/drugs/${drug.id}`)}
                          className="btn-icon-primary"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/owner/drugs/${drug.id}/edit`)}
                          className="btn-icon-blue"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, drug })}
                          className="btn-icon-red"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredDrugs.length)} of {filteredDrugs.length} entries
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-gray-900'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-ghost"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteModal({ open: false, drug: null })} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Drug</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteModal.drug?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, drug: null })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal.drug)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
