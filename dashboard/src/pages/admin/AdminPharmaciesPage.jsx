import { useState, useEffect, useCallback, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Search,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldOff,
  User,
  MapPin,
  Pill,
  DollarSign,
  Calendar,
  Loader2,
  Plus,
  Tag,
  Hash,
  CreditCard,
  Zap,
} from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const COUNTRIES = ['Zambia', 'Nigeria', 'Kenya', 'Tanzania', 'Uganda', 'Zimbabwe', 'Malawi']

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-600',
  closed: 'bg-gray-100 text-gray-500',
}

const SUBSCRIPTION_STYLES = {
  Trial: 'bg-gray-100 text-gray-600',
  Basic: 'bg-green-100 text-green-700',
  Pro: 'bg-blue-100 text-blue-700',
  Enterprise: 'bg-amber-100 text-amber-700',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminPharmaciesPage() {
  const navigate = useNavigate()
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmStatus, setConfirmStatus] = useState(null)
  const pageSize = 10

  useEffect(() => {
    fetchPharmacies()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, countryFilter])

  const fetchPharmacies = async () => {
    try {
      const response = await api.get('/admin/pharmacies')
      const rawData = response.data.data || response.data
      const list = Array.isArray(rawData) ? rawData : []
      setPharmacies(list.map(p => ({
        ...p,
        name: p.name || p.pharmacy_name || 'Unknown',
        code: p.code || p.pharmacy_code || '',
        owner: typeof p.owner === 'object' ? (p.owner?.name || 'Unknown') : (p.owner || 'Unknown'),
      })))
    } catch {
      setPharmacies([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (pharmacy) => {
    const newStatus = pharmacy.status === 'suspended' ? 'active' : 'suspended'
    try {
      await api.patch(`/admin/pharmacies/${pharmacy.id}/status`, { status: newStatus })
    } catch {}
    setPharmacies((prev) =>
      prev.map((p) => (p.id === pharmacy.id ? { ...p, status: newStatus } : p))
    )
    setConfirmStatus(null)
  }

  const filtered = pharmacies.filter((p) => {
    if (search) {
      const q = search.toLowerCase()
      const ownerName = typeof p.owner === 'object' ? p.owner?.name || '' : p.owner || ''
      if (
        !p.name.toLowerCase().includes(q) &&
        !ownerName.toLowerCase().includes(q) &&
        !(p.code || '').toLowerCase().includes(q)
      ) {
        return false
      }
    }
    if (statusFilter && p.status !== statusFilter) return false
    if (countryFilter && p.country !== countryFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = {
    total: pharmacies.length,
    active: pharmacies.filter((p) => p.status === 'active').length,
    pending: pharmacies.filter((p) => p.status === 'pending').length,
    suspended: pharmacies.filter((p) => p.status === 'suspended').length,
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl h-16 border border-gray-200 animate-pulse" />
        <div className="bg-white rounded-xl h-96 border border-gray-200 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pharmacies</h1>
            <p className="text-sm text-gray-500">Manage all registered pharmacies across the platform.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/pharmacies/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          New Pharmacy
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-[#000F14]">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Suspended</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, owner, or code..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
          >
            <option value="">All Countries</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Building2 className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">No pharmacies found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Pharmacy Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Owner</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Code</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Country</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Drugs</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Revenue</span>
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
                      <CreditCard className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Subscription</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Joined</span>
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
                {paginated.map((pharmacy) => (
                  <Fragment key={pharmacy.id}>
                    <tr
                      className="cursor-pointer transition-colors hover:bg-[#0FD452]/5"
                      onClick={() => setExpandedRow(expandedRow === pharmacy.id ? null : pharmacy.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Building2 className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-medium text-[#000F14]">{pharmacy.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{typeof pharmacy.owner === 'object' ? pharmacy.owner?.name : pharmacy.owner}</td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">{pharmacy.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{pharmacy.country}</td>
                      <td className="px-6 py-4 text-sm text-[#000F14]">{pharmacy.drugs_count}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#000F14]">{formatCurrency(pharmacy.revenue)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[pharmacy.status] || 'bg-gray-100 text-gray-600'}`}>
                          {pharmacy.status}
                        </span>
                        
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SUBSCRIPTION_STYLES[pharmacy.subscription_type] || 'bg-gray-100 text-gray-600'}`}>
                           {pharmacy.subscription_type}
                         </span>
                        
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(pharmacy.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate('/dashboard/pharmacies/' + pharmacy.id)}
                            className="btn-icon-primary"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate('/dashboard/pharmacies/' + pharmacy.id + '/edit')}
                            className="btn-icon-blue"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmStatus(pharmacy)}
                            className="btn-ghost"
                            title={pharmacy.status === 'suspended' ? 'Activate' : 'Suspend'}
                          >
                            {pharmacy.status === 'suspended' ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              <ShieldOff className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => navigate('/dashboard/pharmacies/' + pharmacy.id)}
                            className="btn-icon-blue"
                            title="View Owner"
                          >
                            <User className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === pharmacy.id && (
                      <tr key={`${pharmacy.id}-detail`}>
                        <td colSpan={10} className="bg-gray-50 px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">City</p>
                                <p className="text-sm font-medium text-[#000F14]">{pharmacy.district}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Drugs Count</p>
                                <p className="text-sm font-medium text-[#000F14]">{pharmacy.drugs_count}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Revenue</p>
                                <p className="text-sm font-medium text-[#000F14]">{formatCurrency(pharmacy.revenue)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Joined</p>
                                <p className="text-sm font-medium text-[#000F14]">{new Date(pharmacy.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

      {confirmStatus && (
        <ConfirmDialog
          isOpen={true}
          title={confirmStatus.status === 'suspended' ? 'Activate Pharmacy' : 'Suspend Pharmacy'}
          message={
            confirmStatus.status === 'suspended'
              ? `Are you sure you want to activate "${confirmStatus.name}"? They will regain full access to the platform.`
              : `Are you sure you want to suspend "${confirmStatus.name}"? They will lose access to the platform until reactivated.`
          }
          confirmText={confirmStatus.status === 'suspended' ? 'Activate' : 'Suspend'}
          onCancel={() => setConfirmStatus(null)}
          onConfirm={() => handleToggleStatus(confirmStatus)}
          variant={confirmStatus.status === 'suspended' ? 'info' : 'danger'}
        />
      )}
    </div>
  )
}
