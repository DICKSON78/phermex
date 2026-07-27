import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Pill,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Archive,
  AlertTriangle,
  Filter,
  Package,
  AlertCircle,
  Grid3X3,
  Eye,
  Plus,
  FileText,
  Building2,
  Users,
  Zap,
  Tag,
  ShieldCheck,
} from 'lucide-react'
import api from '../../services/api'

const STATUS_STYLES = {
  Active: 'badge badge-green',
  Discontinued: 'badge badge-gray',
  Recalled: 'badge badge-red',
}

const STATUSES = ['Active', 'Discontinued', 'Recalled']

const CATEGORIES = [
  'Antibiotics', 'Antidiabetics', 'Analgesics', 'ACE Inhibitors',
  'Antihistamines', 'PPIs', 'Respiratory', 'Antimalarials',
  'Benzodiazepines', 'NSAIDs', 'Antiretrovirals', 'Antifungals',
  'Antiprotozoals', 'Opioid Analgesics', 'Antitussives', 'Electrolytes',
]

function StatCard({ label, value, icon, iconColor, bg, suffix }) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 truncate">{label}</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {suffix && <p className="text-xs text-gray-500 mt-1.5">{suffix}</p>}
        </div>
        {icon && (
          <div className={`stat-icon group-hover:scale-110 transition-transform duration-300 ${bg || 'bg-gray-100'}`}>
            <span className={iconColor || 'text-gray-600'}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDrugDatabasePage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchDrugs()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter])

  const fetchDrugs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/drug-database')
      setData(response.data || {})
    } catch (err) {
      console.warn('Failed to fetch drug database:', err.message)
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (drug) => {
    setData((prev) => ({
      ...prev,
      drugs: (prev.drugs || []).map((d) => (d.id === drug.id ? { ...d, status: 'Discontinued', usedBy: 0 } : d)),
    }))
    try {
      await api.patch(`/admin/drug-database/${drug.id}`, { status: 'Discontinued' })
    } catch {}
  }

  const handleFlagRecall = async (drug) => {
    setData((prev) => ({
      ...prev,
      drugs: (prev.drugs || []).map((d) => (d.id === drug.id ? { ...d, status: 'Recalled', usedBy: 0 } : d)),
    }))
    try {
      await api.patch(`/admin/drug-database/${drug.id}`, { status: 'Recalled' })
    } catch {}
  }

  const filtered = (data?.drugs || []).filter((d) => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !d.name.toLowerCase().includes(q) &&
        !d.generic.toLowerCase().includes(q) &&
        !d.manufacturer.toLowerCase().includes(q)
      ) {
        return false
      }
    }
    if (categoryFilter && d.category !== categoryFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = data?.stats || { totalDrugs: 0, active: 0, discontinued: 0, categories: 0 }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-16 bg-white rounded-2xl animate-pulse" />
        <div className="h-96 bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Failed to load drug database. Please try again.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Pill className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drug Database</h1>
            <p className="text-sm text-gray-500">Manage the platform-wide drug catalog and recall status.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/drug-database/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          New Drug
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Drugs" value={stats.totalDrugs.toLocaleString()} icon={<Package className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix="In database" />
        <StatCard label="Active" value={stats.active.toLocaleString()} icon={<Pill className="w-5 h-5" />} iconColor="text-green-600" bg="bg-green-100" suffix="Available drugs" />
        <StatCard label="Discontinued" value={stats.discontinued} icon={<Archive className="w-5 h-5" />} iconColor="text-gray-600" bg="bg-gray-100" suffix="No longer supplied" />
        <StatCard label="Categories" value={stats.categories} icon={<Grid3X3 className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" suffix="Drug categories" />
      </div>

      <div className="card">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, generic, or manufacturer..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Pill className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No drugs found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
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
                      <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Generic</span>
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
                      <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Manufacturer</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Used By</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Zap className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((drug) => (
                  <tr key={drug.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Pill className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="text-sm font-medium text-[#000F14]">{drug.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{drug.generic}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{drug.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{drug.manufacturer}</td>
                    <td className="px-6 py-4">
                      <span className={STATUS_STYLES[drug.status] || 'badge badge-gray'}>{drug.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="font-medium">{drug.usedBy}</span>
                      <span className="text-gray-400 ml-1">pharmacies</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate('/admin/drug-database/' + drug.id)}
                          className="btn-icon-primary"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {drug.status !== 'Recalled' && (
                          <button
                            onClick={() => navigate('/admin/drug-database/' + drug.id + '/edit')}
                            className="btn-icon-blue"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {drug.status === 'Active' && (
                          <button
                            onClick={() => handleArchive(drug)}
                            className="btn-icon-primary"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        {drug.status !== 'Recalled' && drug.status !== 'Discontinued' && (
                          <button
                            onClick={() => handleFlagRecall(drug)}
                            className="btn-icon-red"
                            title="Flag for Recall"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost"
                >
                  <ChevronLeft className="h-4 w-4" />
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
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
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
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
