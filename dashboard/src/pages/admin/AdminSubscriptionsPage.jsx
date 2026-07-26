import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Search,
  Eye,
  Pencil,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  AlertTriangle,
  BarChart3,
  Plus,
  Building2,
  ShieldCheck,
  DollarSign,
  Calendar,
  Zap,
} from 'lucide-react'
import api from '../../services/api'

const FALLBACK_DATA = {
  stats: {
    activeSubscriptions: 21,
    monthlyRevenue: 4850,
    trialUsers: 8,
    churnRate: 3.2,
  },
  subscriptions: [
    { id: 1, pharmacy: 'HealthPlus Pharmacy', plan: 'Pro', status: 'active', amount: 149, startDate: '2026-01-15', expiryDate: '2026-08-15' },
    { id: 2, pharmacy: 'WellCare Drugs', plan: 'Basic', status: 'active', amount: 49, startDate: '2026-02-20', expiryDate: '2026-08-20' },
    { id: 3, pharmacy: 'MedVita Pharmacy', plan: 'Enterprise', status: 'active', amount: 299, startDate: '2025-11-08', expiryDate: '2026-11-08' },
    { id: 4, pharmacy: 'LifeLine Chemists', plan: 'Trial', status: 'active', amount: 0, startDate: '2026-07-15', expiryDate: '2026-08-15' },
    { id: 5, pharmacy: 'PharmaStar', plan: 'Basic', status: 'active', amount: 49, startDate: '2026-03-12', expiryDate: '2026-09-12' },
    { id: 6, pharmacy: 'CarePoint Pharmacy', plan: 'Pro', status: 'suspended', amount: 149, startDate: '2025-12-01', expiryDate: '2026-12-01' },
    { id: 7, pharmacy: 'Sun Pharma Hub', plan: 'Trial', status: 'active', amount: 0, startDate: '2026-07-10', expiryDate: '2026-08-10' },
    { id: 8, pharmacy: 'VitalMeds', plan: 'Basic', status: 'expired', amount: 49, startDate: '2026-04-22', expiryDate: '2026-07-22' },
    { id: 9, pharmacy: 'PrimeCare Drugs', plan: 'Pro', status: 'active', amount: 149, startDate: '2026-01-30', expiryDate: '2026-07-30' },
    { id: 10, pharmacy: 'Neema Pharmacy', plan: 'Basic', status: 'expired', amount: 49, startDate: '2025-09-14', expiryDate: '2026-03-14' },
    { id: 11, pharmacy: 'GreenLeaf Pharmacy', plan: 'Enterprise', status: 'active', amount: 299, startDate: '2026-05-01', expiryDate: '2027-05-01' },
    { id: 12, pharmacy: 'Apollo Meds', plan: 'Trial', status: 'active', amount: 0, startDate: '2026-07-18', expiryDate: '2026-08-18' },
    { id: 13, pharmacy: 'NovaCare Pharmacy', plan: 'Basic', status: 'suspended', amount: 49, startDate: '2025-10-05', expiryDate: '2026-04-05' },
    { id: 14, pharmacy: 'ZenPharm', plan: 'Pro', status: 'active', amount: 149, startDate: '2026-06-10', expiryDate: '2026-12-10' },
    { id: 15, pharmacy: 'Unity Drugs', plan: 'Enterprise', status: 'active', amount: 299, startDate: '2026-03-25', expiryDate: '2027-03-25' },
    { id: 16, pharmacy: 'FirstHealth Pharmacy', plan: 'Trial', status: 'active', amount: 0, startDate: '2026-07-20', expiryDate: '2026-08-20' },
    { id: 17, pharmacy: 'PharmaConnect', plan: 'Basic', status: 'expired', amount: 49, startDate: '2025-11-20', expiryDate: '2026-05-20' },
    { id: 18, pharmacy: 'MedBridge Pharmacy', plan: 'Pro', status: 'active', amount: 149, startDate: '2026-04-14', expiryDate: '2026-10-14' },
    { id: 19, pharmacy: 'TrueCare Meds', plan: 'Trial', status: 'active', amount: 0, startDate: '2026-07-12', expiryDate: '2026-08-12' },
    { id: 20, pharmacy: 'Apex Pharma', plan: 'Enterprise', status: 'suspended', amount: 299, startDate: '2025-08-30', expiryDate: '2026-08-30' },
  ],
}

const PLAN_STYLES = {
  Trial: 'badge badge-gray',
  Basic: 'badge badge-green',
  Pro: 'badge badge-blue',
  Enterprise: 'badge badge-yellow',
}

const STATUS_STYLES = {
  active: 'badge badge-green',
  expired: 'badge badge-gray',
  suspended: 'badge badge-red',
}

const PLANS = ['Trial', 'Basic', 'Pro', 'Enterprise']
const STATUSES = ['active', 'expired', 'suspended']

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminSubscriptionsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, planFilter, statusFilter])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/subscriptions/plans')
      const rawData = response.data.data || response.data || {}
      const subscriptions = Array.isArray(rawData) ? rawData : (rawData.subscriptions || [])
      setData({ ...FALLBACK_DATA, ...(typeof rawData === 'object' && !Array.isArray(rawData) ? rawData : {}), subscriptions })
    } catch (err) {
      console.warn('Failed to fetch subscriptions:', err.message)
      setError(err.message)
      setData(FALLBACK_DATA)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, subscription) => {
    const newStatus = action === 'cancel' ? 'expired' : subscription.status
    setData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.id === subscription.id ? { ...s, status: newStatus } : s
      ),
    }))
    try {
      await api.post(`/admin/subscriptions/${subscription.id}/${action}`)
    } catch {
      setData((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.map((s) =>
          s.id === subscription.id ? { ...s, status: subscription.status } : s
        ),
      }))
    }
  }

  const filtered = (data?.subscriptions || []).filter((s) => {
    if (search) {
      const q = search.toLowerCase()
      if (!s.pharmacy.toLowerCase().includes(q)) return false
    }
    if (planFilter && s.plan !== planFilter) return false
    if (statusFilter && s.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
          Using offline data — could not reach server.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-sm text-gray-500">Manage pharmacy subscription plans and billing cycles.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/subscriptions/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          New Subscription
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Active Subscriptions" value={data.stats.activeSubscriptions} icon={<Users className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix="Currently active" />
        <StatCard label="Monthly Revenue" value={formatCurrency(data.stats.monthlyRevenue)} icon={<TrendingUp className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" suffix="Recurring revenue" />
        <StatCard label="Trial Users" value={data.stats.trialUsers} icon={<BarChart3 className="w-5 h-5" />} iconColor="text-purple-600" bg="bg-purple-100" suffix="On free trial" />
        <StatCard label="Churn Rate" value={`${data.stats.churnRate}%`} icon={<AlertTriangle className="w-5 h-5" />} iconColor="text-red-600" bg="bg-red-100" suffix="Monthly churn" />
      </div>

      <div className="card">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by pharmacy name..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">All Plans</option>
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <CreditCard className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No subscriptions found</h3>
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
                      <span>Pharmacy</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Plan</span>
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
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Amount/mo</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Start Date</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Expiry Date</span>
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
                {paginated.map((sub) => (
                  <tr key={sub.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Building2 className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="text-sm font-medium text-[#000F14]">{sub.pharmacy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={PLAN_STYLES[sub.plan] || 'badge badge-gray'}>{sub.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={STATUS_STYLES[sub.status] || 'badge badge-gray'}>{sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#000F14]">{sub.amount === 0 ? 'Free' : formatCurrency(sub.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{sub.startDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{sub.expiryDate}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate('/admin/subscriptions/' + sub.id)}
                          className="btn-icon-primary"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate('/admin/subscriptions/' + sub.id + '/edit')}
                          className="btn-icon-blue"
                          title="Edit Subscription"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {sub.plan !== 'Enterprise' && (
                          <button
                            onClick={() => handleAction('upgrade', sub)}
                            className="btn-icon-blue"
                            title="Upgrade Plan"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </button>
                        )}
                        {sub.plan !== 'Trial' && (
                          <button
                            onClick={() => handleAction('downgrade', sub)}
                            className="btn-icon-blue"
                            title="Downgrade Plan"
                          >
                            <ArrowDownCircle className="h-4 w-4" />
                          </button>
                        )}
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleAction('cancel', sub)}
                            className="btn-icon-red"
                            title="Cancel Subscription"
                          >
                            <XCircle className="h-4 w-4" />
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
