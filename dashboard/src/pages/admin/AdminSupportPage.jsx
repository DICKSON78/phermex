import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LifeBuoy,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Loader,
  Plus,
  FileText,
  Hash,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Zap,
} from 'lucide-react'
import api from '../../services/api'

const FALLBACK_DATA = {
  stats: {
    openTickets: 14,
    inProgress: 6,
    resolvedToday: 9,
    avgResponse: '2.4h',
  },
  tickets: [
    { id: 'TKT-1042', subject: 'Billing discrepancy on last invoice', pharmacy: 'HealthPlus Pharmacy', priority: 'High', status: 'open', created: '2026-07-20' },
    { id: 'TKT-1041', subject: 'Cannot add new drug to inventory', pharmacy: 'WellCare Drugs', priority: 'Medium', status: 'in_progress', created: '2026-07-19' },
    { id: 'TKT-1040', subject: 'App crashing on mobile devices', pharmacy: 'MedVita Pharmacy', priority: 'Critical', status: 'open', created: '2026-07-19' },
    { id: 'TKT-1039', subject: 'Need help with delivery setup', pharmacy: 'PharmaStar', priority: 'Low', status: 'resolved', created: '2026-07-18' },
    { id: 'TKT-1038', subject: 'Subscription upgrade not reflecting', pharmacy: 'CarePoint Pharmacy', priority: 'High', status: 'in_progress', created: '2026-07-18' },
    { id: 'TKT-1037', subject: 'Password reset not working', pharmacy: 'LifeLine Chemists', priority: 'Medium', status: 'closed', created: '2026-07-17' },
    { id: 'TKT-1036', subject: 'Report export feature broken', pharmacy: 'Sun Pharma Hub', priority: 'High', status: 'open', created: '2026-07-17' },
    { id: 'TKT-1035', subject: 'Request for dark mode', pharmacy: 'PrimeCare Drugs', priority: 'Low', status: 'resolved', created: '2026-07-16' },
    { id: 'TKT-1034', subject: 'Cannot upload pharmacy logo', pharmacy: 'VitalMeds', priority: 'Medium', status: 'closed', created: '2026-07-15' },
    { id: 'TKT-1033', subject: 'Integration with POS system', pharmacy: 'HealthPlus Pharmacy', priority: 'Medium', status: 'open', created: '2026-07-15' },
    { id: 'TKT-1032', subject: 'Inventory count mismatch', pharmacy: 'Neema Pharmacy', priority: 'High', status: 'in_progress', created: '2026-07-14' },
    { id: 'TKT-1031', subject: 'User permission error on reports', pharmacy: 'GreenLeaf Pharmacy', priority: 'Medium', status: 'in_progress', created: '2026-07-14' },
    { id: 'TKT-1030', subject: 'Delivery tracking not updating', pharmacy: 'Apollo Meds', priority: 'High', status: 'open', created: '2026-07-13' },
    { id: 'TKT-1029', subject: 'Custom receipt template request', pharmacy: 'NovaCare Pharmacy', priority: 'Low', status: 'resolved', created: '2026-07-12' },
    { id: 'TKT-1028', subject: 'Cannot generate tax report', pharmacy: 'ZenPharm', priority: 'Critical', status: 'in_progress', created: '2026-07-12' },
    { id: 'TKT-1027', subject: 'Slow page load times', pharmacy: 'Unity Drugs', priority: 'Medium', status: 'open', created: '2026-07-11' },
  ],
}

const PRIORITY_STYLES = {
  Low: 'badge badge-gray',
  Medium: 'badge badge-yellow',
  High: 'badge bg-orange-100 text-orange-700',
  Critical: 'badge badge-red',
}

const STATUS_STYLES = {
  open: 'badge badge-blue',
  in_progress: 'badge badge-yellow',
  resolved: 'badge badge-green',
  closed: 'badge badge-gray',
}

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['open', 'in_progress', 'resolved', 'closed']

export default function AdminSupportPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, priorityFilter, statusFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/support/tickets')
      setData({ ...FALLBACK_DATA, ...(response.data || {}) })
    } catch (err) {
      console.warn('Failed to fetch support tickets:', err.message)
      setError(err.message)
      setData(FALLBACK_DATA)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, ticket) => {
    const previousStatus = ticket.status
    const newStatus = action === 'resolve' ? 'resolved' : 'closed'
    setData((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t)),
      stats: {
        ...prev.stats,
        openTickets: prev.stats.openTickets - (ticket.status === 'open' ? 1 : 0),
        inProgress: prev.stats.inProgress - (ticket.status === 'in_progress' ? 1 : 0),
        resolvedToday: action === 'resolve' ? prev.stats.resolvedToday + 1 : prev.stats.resolvedToday,
      },
    }))
    try {
      await api.post(`/admin/support/tickets/${ticket.id}/${action}`)
    } catch {
      setData((prev) => ({
        ...prev,
        tickets: prev.tickets.map((t) => (t.id === ticket.id ? { ...t, status: previousStatus } : t)),
        stats: {
          ...prev.stats,
          openTickets: prev.stats.openTickets + (ticket.status === 'open' ? 1 : 0),
          inProgress: prev.stats.inProgress + (ticket.status === 'in_progress' ? 1 : 0),
          resolvedToday: action === 'resolve' ? prev.stats.resolvedToday - 1 : prev.stats.resolvedToday,
        },
      }))
    }
  }

  const filtered = (data?.tickets || []).filter((t) => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !t.subject.toLowerCase().includes(q) &&
        !t.pharmacy.toLowerCase().includes(q) &&
        !t.id.toLowerCase().includes(q)
      ) return false
    }
    if (priorityFilter && t.priority !== priorityFilter) return false
    if (statusFilter && t.status !== statusFilter) return false
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
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-sm text-gray-500">View and manage customer support requests.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/support/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Open Tickets" value={data.stats.openTickets} icon={<AlertCircle className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" suffix="Awaiting response" />
        <StatCard label="In Progress" value={data.stats.inProgress} icon={<Loader className="w-5 h-5" />} iconColor="text-yellow-600" bg="bg-yellow-100" suffix="Being handled" />
        <StatCard label="Resolved Today" value={data.stats.resolvedToday} icon={<CheckCircle className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix="Closed today" />
        <StatCard label="Avg Response" value={data.stats.avgResponse} icon={<Clock className="w-5 h-5" />} iconColor="text-purple-600" bg="bg-purple-100" suffix="Last 7 days" />
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
                placeholder="Search tickets..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
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
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <LifeBuoy className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No tickets found</h3>
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
                      <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Ticket ID</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Subject</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Pharmacy</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Priority</span>
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
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Created</span>
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
                {paginated.map((ticket) => (
                  <tr key={ticket.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Hash className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="font-mono text-sm font-medium text-[#000F14]">{ticket.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-sm text-[#000F14] max-w-xs truncate">{ticket.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ticket.pharmacy}</td>
                    <td className="px-6 py-4">
                      <span className={PRIORITY_STYLES[ticket.priority]}>{ticket.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={STATUS_STYLES[ticket.status]}>{STATUS_LABELS[ticket.status]}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ticket.created}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate('/admin/support/' + ticket.id)}
                          className="btn-icon-primary"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <button
                            onClick={() => handleAction('resolve', ticket)}
                            className="btn-icon-primary"
                            title="Resolve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {ticket.status !== 'closed' && (
                          <button
                            onClick={() => handleAction('close', ticket)}
                            className="btn-icon-red"
                            title="Close"
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
