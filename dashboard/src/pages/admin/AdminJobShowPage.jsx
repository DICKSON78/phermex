import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, Briefcase, Loader2, MapPin, Tag, Users, Calendar,
  CheckCircle2, XCircle, Clock, DollarSign, FileText, ChevronLeft, ChevronRight,
  Flame, Star, Eye, Send, Mail, Phone, ExternalLink,
} from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
}

const STATUS_STYLES = {
  active: 'badge badge-green',
  closed: 'badge badge-red',
  draft: 'badge badge-gray',
}

const APP_STATUS_STYLES = {
  pending: 'badge badge-yellow',
  reviewed: 'badge badge-blue',
  shortlisted: 'badge badge-green',
  interviewed: 'badge badge-purple',
  hired: 'badge badge-green',
  rejected: 'badge badge-red',
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminJobShowPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [appPage, setAppPage] = useState(1)
  const pageSize = 10

  const fetchJob = useCallback(async () => {
    try {
      const response = await api.get(`/admin/jobs/${id}`)
      setJob(response.data.data || response.data)
    } catch {
      setJob(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchJob() }, [fetchJob])

  const handleDelete = async () => {
    try { await api.delete(`/admin/jobs/${id}`) } catch {}
    navigate('/admin/jobs')
  }

  const handleToggleStatus = async () => {
    if (!job) return
    try {
      const res = await api.patch(`/admin/jobs/${job.id}/toggle-status`)
      setJob({ ...job, status: res.data.data.status })
    } catch {}
  }

  const handleAppStatusChange = async (appId, newStatus) => {
    try {
      await api.patch(`/admin/job-applications/${appId}`, { status: newStatus })
      setJob((prev) => ({
        ...prev,
        applications: (prev.applications || []).map((a) =>
          a.id === appId ? { ...a, status: newStatus } : a
        ),
      }))
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (!job) {
    return <div className="p-6 text-center text-gray-500">Job listing not found</div>
  }

  const apps = job.applications || []
  const appTotalPages = Math.ceil(apps.length / pageSize)
  const paginatedApps = apps.slice((appPage - 1) * pageSize, appPage * pageSize)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/jobs" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              {job.is_hot && <span className="inline-flex items-center gap-0.5 text-xs font-bold text-orange-600"><Flame className="w-3.5 h-3.5" /> HOT</span>}
              {job.is_new && <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600"><Star className="w-3.5 h-3.5" /> NEW</span>}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              {job.department} &middot; {job.location} &middot; <span className={STATUS_STYLES[job.status] || 'badge badge-gray'}>{job.status}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/admin/jobs/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleToggleStatus} className="btn-secondary">
            {job.status === 'active' ? <><XCircle className="w-4 h-4" /> Close</> : <><CheckCircle2 className="w-4 h-4" /> Reopen</>}
          </button>
          <button onClick={() => setDeleteDialog(true)} className="btn-danger-outline">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</p>
              <p className="text-sm font-bold text-gray-900">{TYPE_LABELS[job.type] || job.type}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Salary</p>
              <p className="text-sm font-bold text-gray-900">{job.salary_range || '\u2014'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Closes</p>
              <p className="text-sm font-bold text-gray-900">{job.closes_at ? formatDate(job.closes_at) : '\u2014'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Applications</p>
              <p className="text-sm font-bold text-gray-900">{apps.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Job Description</h3>
                <p className="text-xs text-gray-500">Full job description and details</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>
          </div>

          {/* Requirements & Responsibilities */}
          {(job.requirements || job.responsibilities) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {job.requirements && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Requirements</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
                  </div>
                </div>
              )}
              {job.responsibilities && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Responsibilities</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{job.responsibilities}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Applications */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Applications ({apps.length})</h3>
                  <p className="text-xs text-gray-500">Candidates who applied for this role</p>
                </div>
              </div>
            </div>
            {paginatedApps.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No applications yet</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {paginatedApps.map((app) => (
                    <div key={app.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center text-sm font-bold text-[#0FD452]">
                            {app.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{app.full_name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {app.email}</span>
                              {app.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {app.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={app.status}
                            onChange={(e) => handleAppStatusChange(app.id, e.target.value)}
                            className="text-xs rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-gray-700 outline-none focus:border-[#0FD452]"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interviewed">Interviewed</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <span className={APP_STATUS_STYLES[app.status] || 'badge badge-gray'}>{app.status}</span>
                        </div>
                      </div>
                      {app.cover_letter && (
                        <p className="text-xs text-gray-600 mt-2 ml-13 line-clamp-2">{app.cover_letter}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 ml-13">
                        {app.portfolio_url && (
                          <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                            <ExternalLink className="w-3 h-3" /> Portfolio
                          </a>
                        )}
                        {app.linkedin_url && (
                          <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                            <ExternalLink className="w-3 h-3" /> LinkedIn
                          </a>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(app.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {appTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                    <p className="text-sm text-gray-500">
                      Page {appPage} of {appTotalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAppPage((p) => Math.max(1, p - 1))} disabled={appPage === 1} className="btn-ghost">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={() => setAppPage((p) => Math.min(appTotalPages, p + 1))} disabled={appPage === appTotalPages} className="btn-ghost">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Job Details</h3>
                <p className="text-xs text-gray-500">Quick overview</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Department</span>
                <span className="text-sm font-semibold text-gray-900">{job.department}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Location</span>
                <span className="text-sm font-semibold text-gray-900">{job.location}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-semibold text-gray-900">{TYPE_LABELS[job.type] || job.type}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Salary</span>
                <span className="text-sm font-semibold text-gray-900">{job.salary_range || '\u2014'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Status</span>
                <span className={STATUS_STYLES[job.status] || 'badge badge-gray'}>{job.status}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Posted</span>
                <span className="text-sm font-semibold text-gray-900">{formatDate(job.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog}
        onCancel={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Job Listing"
        message={`Are you sure you want to delete "${job.title}"? This will also remove all applications. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
