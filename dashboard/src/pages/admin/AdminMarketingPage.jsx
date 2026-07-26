import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  BarChart3,
  Send,
  MousePointerClick,
  Mail,
  MessageSquare,
  Smartphone,
  Monitor,
  Plus,
  FileText,
  Tag,
  Users,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import api from '../../services/api'

const FALLBACK_DATA = {
  stats: {
    activeCampaigns: 8,
    totalSent: 24560,
    openRate: 34.7,
    clickRate: 12.3,
  },
  campaigns: [
    { id: 1, name: 'Q3 Platform Update Newsletter', type: 'Email', audience: 'All Owners', status: 'Active', startDate: '2026-07-10', endDate: '2026-07-25', conversions: 89 },
    { id: 2, name: 'Welcome Series — New Pharmacies', type: 'Email', audience: 'New Owners', status: 'Active', startDate: '2026-06-01', endDate: '2026-12-31', conversions: 156 },
    { id: 3, name: 'Controlled Substance Reminder', type: 'SMS', audience: 'Pharmacists', status: 'Active', startDate: '2026-07-05', endDate: '2026-07-12', conversions: 203 },
    { id: 4, name: 'Monthly Feature Spotlight', type: 'Push', audience: 'All Users', status: 'Completed', startDate: '2026-06-15', endDate: '2026-06-30', conversions: 342 },
    { id: 5, name: 'Annual Subscription Discount', type: 'Email', audience: 'Trial Users', status: 'Active', startDate: '2026-07-01', endDate: '2026-07-31', conversions: 47 },
    { id: 6, name: 'Inventory Alert Campaign', type: 'In-App', audience: 'Owners', status: 'Paused', startDate: '2026-06-20', endDate: '2026-07-20', conversions: 118 },
    { id: 7, name: 'Staff Training Webinar Invite', type: 'Email', audience: 'All Users', status: 'Completed', startDate: '2026-06-01', endDate: '2026-06-14', conversions: 87 },
    { id: 8, name: 'Regulatory Update Broadcast', type: 'SMS', audience: 'Pharmacists', status: 'Active', startDate: '2026-07-14', endDate: '2026-07-21', conversions: 312 },
    { id: 9, name: 'New POS Feature Rollout', type: 'Push', audience: 'Owners', status: 'Draft', startDate: '2026-07-20', endDate: '2026-08-05', conversions: 0 },
    { id: 10, name: 'Feedback Survey Campaign', type: 'In-App', audience: 'All Users', status: 'Paused', startDate: '2026-06-10', endDate: '2026-06-30', conversions: 64 },
    { id: 11, name: 'Referral Program Launch', type: 'Email', audience: 'All Owners', status: 'Active', startDate: '2026-07-08', endDate: '2026-08-08', conversions: 210 },
    { id: 12, name: 'Drug Recall Alert Blast', type: 'SMS', audience: 'Pharmacists', status: 'Completed', startDate: '2026-05-20', endDate: '2026-05-22', conversions: 502 },
  ],
}

const TYPE_STYLES = {
  Email: 'badge badge-blue',
  SMS: 'badge badge-yellow',
  Push: 'badge badge-green',
  'In-App': 'badge badge-purple',
}

const STATUS_STYLES = {
  Draft: 'badge badge-gray',
  Active: 'badge badge-green',
  Paused: 'badge badge-yellow',
  Completed: 'badge badge-blue',
}

const TYPE_ICONS = {
  Email: Mail,
  SMS: MessageSquare,
  Push: Smartphone,
  'In-App': Monitor,
}

const TYPES = ['Email', 'SMS', 'Push', 'In-App']
const STATUSES = ['Draft', 'Active', 'Paused', 'Completed']
const AUDIENCES = ['All Users', 'All Owners', 'New Owners', 'Owners', 'Pharmacists', 'Trial Users']

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
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

export default function AdminMarketingPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, typeFilter, statusFilter])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/marketing')
      setData({ ...FALLBACK_DATA, ...(response.data || {}) })
    } catch (err) {
      console.warn('Failed to fetch marketing data:', err.message)
      setError(err.message)
      setData(FALLBACK_DATA)
    } finally {
      setLoading(false)
    }
  }

  const handlePauseResume = async (campaign) => {
    const newStatus = campaign.status === 'Active' ? 'Paused' : 'Active'
    try {
      await api.patch(`/admin/marketing/${campaign.id}`, { status: newStatus })
    } catch {}
    setData((prev) => ({
      ...prev,
      campaigns: prev.campaigns.map((c) => (c.id === campaign.id ? { ...c, status: newStatus } : c)),
    }))
  }

  const handleDelete = async (campaign) => {
    try {
      await api.delete(`/admin/marketing/${campaign.id}`)
    } catch {}
    setData((prev) => ({
      ...prev,
      campaigns: prev.campaigns.filter((c) => c.id !== campaign.id),
    }))
  }

  const filtered = (data?.campaigns || []).filter((c) => {
    if (search) {
      const q = search.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && !c.audience.toLowerCase().includes(q)) return false
    }
    if (typeFilter && c.type !== typeFilter) return false
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = data?.stats || FALLBACK_DATA.stats

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
            <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
            <p className="text-sm text-gray-500">Manage marketing campaigns and promotions.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/marketing/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Active Campaigns" value={stats.activeCampaigns} icon={<Megaphone className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix="Currently running" />
        <StatCard label="Total Sent" value={formatNumber(stats.totalSent)} icon={<Send className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" suffix="Messages delivered" />
        <StatCard label="Open Rate" value={`${stats.openRate}%`} icon={<Eye className="w-5 h-5" />} iconColor="text-purple-600" bg="bg-purple-100" suffix="Average across campaigns" />
        <StatCard label="Click Rate" value={`${stats.clickRate}%`} icon={<MousePointerClick className="w-5 h-5" />} iconColor="text-amber-600" bg="bg-amber-100" suffix="Average CTR" />
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
                placeholder="Search by name or audience..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">All Types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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
          <Megaphone className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No campaigns found</h3>
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
                      <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Campaign</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Type</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Audience</span>
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
                      <span>Start</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>End</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Conversions</span>
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
                {paginated.map((campaign) => {
                  const TypeIcon = TYPE_ICONS[campaign.type] || Megaphone
                  return (
                    <tr key={campaign.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <TypeIcon className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-medium text-[#000F14]">{campaign.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={TYPE_STYLES[campaign.type] || 'badge badge-gray'}>{campaign.type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{campaign.audience}</td>
                      <td className="px-6 py-4">
                        <span className={STATUS_STYLES[campaign.status] || 'badge badge-gray'}>{campaign.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{campaign.startDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{campaign.endDate}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#000F14]">{campaign.conversions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate('/admin/marketing/' + campaign.id)}
                            className="btn-icon-primary"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate('/admin/marketing/' + campaign.id + '/edit')}
                            className="btn-icon-blue"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {campaign.status !== 'Draft' && campaign.status !== 'Completed' && (
                              <button
                                onClick={() => handlePauseResume(campaign)}
                                className="btn-ghost"
                                title={campaign.status === 'Active' ? 'Pause' : 'Resume'}
                            >
                              {campaign.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => navigate('/admin/marketing/' + campaign.id)}
                            className="btn-icon-blue"
                            title="View Results"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(campaign)}
                            className="btn-icon-red"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
