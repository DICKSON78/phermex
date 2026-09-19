import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle,
  Ban,
  Clock,
  AlertTriangle,
  TrendingUp,
  Wallet,
  FileWarning,
  Calendar,
  Eye,
  Pencil,
  Plus,
  Hash,
  Building2,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '../../services/api'

const STATUS_STYLES = {
  Paid: 'badge badge-green',
  Pending: 'badge badge-yellow',
  Overdue: 'badge badge-red',
  Void: 'badge badge-gray',
}

const STATUSES = ['Paid', 'Pending', 'Overdue', 'Void']

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
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

export default function AdminRevenuePage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchRevenue()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const fetchRevenue = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/revenue')
      setData(response.data || {})
    } catch (err) {
      console.warn('Failed to fetch revenue:', err.message)
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (invoice) => {
    setData((prev) => ({
      ...prev,
      invoices: (prev.invoices || []).map((inv) =>
        inv.id === invoice.id ? { ...inv, status: 'Paid', paidDate: new Date().toISOString().slice(0, 10) } : inv
      ),
      stats: {
        ...(prev.stats || {}),
        pending: (prev.stats?.pending || 0) - (invoice.status === 'Pending' ? invoice.amount : 0),
        overdue: (prev.stats?.overdue || 0) - (invoice.status === 'Overdue' ? invoice.amount : 0),
        totalRevenue: (prev.stats?.totalRevenue || 0) + invoice.amount,
      },
    }))
    try {
      await api.patch(`/admin/revenue/${invoice.id}`, { status: 'Paid' })
    } catch {}
  }

  const handleVoid = async (invoice) => {
    setData((prev) => ({
      ...prev,
      invoices: (prev.invoices || []).map((inv) =>
        inv.id === invoice.id ? { ...inv, status: 'Void' } : inv
      ),
    }))
    try {
      await api.patch(`/admin/revenue/${invoice.id}`, { status: 'Void' })
    } catch {}
  }

  const handleSendReminder = async (invoice) => {
    try {
      await api.post(`/admin/revenue/${invoice.id}/reminder`)
    } catch {}
  }

  const filtered = (data?.invoices || []).filter((inv) => {
    if (search) {
      const q = search.toLowerCase()
      if (!inv.pharmacy.toLowerCase().includes(q) && !inv.invoiceNumber.toLowerCase().includes(q)) return false
    }
    if (statusFilter && inv.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = data?.stats || { totalRevenue: 0, pending: 0, overdue: 0, thisMonth: 0 }
  const revenueTrend = data?.revenueTrend || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-white rounded-2xl animate-pulse" />
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
          Failed to load revenue data. Please try again.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue & Billing</h1>
            <p className="text-sm text-gray-500">Track invoices, payments, and platform revenue.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/revenue/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix="All time" />
        <StatCard label="Pending" value={formatCurrency(stats.pending)} icon={<Clock className="w-5 h-5" />} iconColor="text-yellow-600" bg="bg-yellow-100" suffix="Awaiting payment" />
        <StatCard label="Overdue" value={formatCurrency(stats.overdue)} icon={<AlertTriangle className="w-5 h-5" />} iconColor="text-red-600" bg="bg-red-100" suffix="Past due date" />
        <StatCard label="This Month" value={formatCurrency(stats.thisMonth)} icon={<Calendar className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" suffix="July 2026" />
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Revenue Trend
          </h3>
        </div>
        <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0FD452" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0FD452" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0FD452" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
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
                placeholder="Search by pharmacy or invoice #..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <DollarSign className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No invoices found</h3>
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
                      <span>Invoice #</span>
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
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Amount</span>
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
                      <span>Due Date</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Paid Date</span>
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
                {paginated.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Hash className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="font-mono text-sm font-medium text-[#000F14]">{invoice.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#000F14]">{invoice.pharmacy}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#000F14]">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={STATUS_STYLES[invoice.status] || 'badge badge-gray'}>{invoice.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{invoice.dueDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{invoice.paidDate || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate('/dashboard/revenue/' + invoice.id)}
                          className="btn-icon-primary"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {invoice.status === 'Pending' && (
                          <button
                            onClick={() => navigate('/dashboard/revenue/' + invoice.id + '/edit')}
                            className="btn-icon-blue"
                            title="Edit Invoice"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {(invoice.status === 'Pending' || invoice.status === 'Overdue') && (
                          <>
                            <button
                              onClick={() => handleSendReminder(invoice)}
                              className="btn-icon-blue"
                              title="Send Reminder"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMarkPaid(invoice)}
                              className="btn-icon-primary"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {invoice.status !== 'Void' && invoice.status !== 'Paid' && (
                          <button
                            onClick={() => handleVoid(invoice)}
                            className="btn-icon-red"
                            title="Void Invoice"
                          >
                            <Ban className="h-4 w-4" />
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
