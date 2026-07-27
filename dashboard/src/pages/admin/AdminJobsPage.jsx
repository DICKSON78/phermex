import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  Plus, Tag, MapPin, Clock, Users, CheckCircle2, XCircle, Flame, Star,
} from 'lucide-react'
import api from '../../services/api'

const TYPE_STYLES = {
  full_time: 'badge badge-green',
  part_time: 'badge badge-blue',
  contract: 'badge badge-yellow',
  internship: 'badge badge-purple',
  remote: 'badge badge-blue',
}

const STATUS_STYLES = {
  active: 'badge badge-green',
  closed: 'badge badge-red',
  draft: 'badge badge-gray',
}

const TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
}

function StatCard({ label, value, icon, iconColor, bg }) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 truncate">{label}</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{value}</p>
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

export default function AdminJobsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, deptFilter])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/jobs')
      setData(response.data || {})
    } catch (err) {
      console.warn('Failed to fetch jobs:', err.message)
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (job) => {
    try {
      await api.patch(`/admin/jobs/${job.id}/toggle-status`)
      setData((prev) => ({
        ...prev,
        data: (prev.data || []).map((j) =>
          j.id === job.id ? { ...j, status: j.status === 'active' ? 'closed' : 'active' } : j
        ),
      }))
    } catch {}
  }

  const handleDelete = async (job) => {
    try {
      await api.delete(`/admin/jobs/${job.id}`)
    } catch {}
    setData((prev) => ({
      ...prev,
      data: (prev.data || []).filter((j) => j.id !== job.id),
    }))
  }

  const jobs = data?.data || []
  const filtered = jobs.filter((j) => {
    if (search) {
      const q = search.toLowerCase()
      if (!j.title?.toLowerCase().includes(q) && !j.department?.toLowerCase().includes(q)) return false
    }
    if (statusFilter && j.status !== statusFilter) return false
    if (deptFilter && j.department !== deptFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))].sort()

  const activeJobs = jobs.filter((j) => j.status === 'active').length
  const closedJobs = jobs.filter((j) => j.status === 'closed').length
  const totalApps = jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Failed to load job listings. Please try again.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
            <p className="text-sm text-gray-500">Manage job postings and track applications.</p>
          </div>
        </div>
        <button onClick={() => navigate('/admin/jobs/new')} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Job
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Jobs" value={jobs.length} icon={<Briefcase className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" />
        <StatCard label="Active" value={activeJobs} icon={<CheckCircle2 className="w-5 h-5" />} iconColor="text-green-600" bg="bg-green-100" />
        <StatCard label="Closed" value={closedJobs} icon={<XCircle className="w-5 h-5" />} iconColor="text-red-600" bg="bg-red-100" />
        <StatCard label="Applications" value={totalApps} icon={<Users className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" />
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
                placeholder="Search by title or department..."
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
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Briefcase className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No job listings found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters or create a new listing</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Title</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Department</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Location</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Type</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Apps</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((job) => (
                  <tr key={job.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Briefcase className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#000F14]">{job.title}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {job.is_hot && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600">
                                <Flame className="w-3 h-3" /> HOT
                              </span>
                            )}
                            {job.is_new && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600">
                                <Star className="w-3 h-3" /> NEW
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.location}</td>
                    <td className="px-6 py-4">
                      <span className={TYPE_STYLES[job.type] || 'badge badge-gray'}>{TYPE_LABELS[job.type] || job.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.applications_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={STATUS_STYLES[job.status] || 'badge badge-gray'}>{job.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate('/admin/jobs/' + job.id)} className="btn-icon-primary" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => navigate('/admin/jobs/' + job.id + '/edit')} className="btn-icon-blue" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(job)} className="btn-icon-amber" title={job.status === 'active' ? 'Close' : 'Reopen'}>
                          {job.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleDelete(job)} className="btn-icon-red" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-ghost">
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
                        currentPage === page ? 'bg-[#0FD452] text-white' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-ghost">
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
