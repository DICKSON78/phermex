import { useState, useEffect } from 'react'
import {
  Megaphone,
  Plus,
  Trash2,
  Loader2,
  X,
  Users,
  Building2,
  Globe,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const AUDIENCE_CONFIG = {
  customer: { label: 'All Customers', color: 'bg-blue-100 text-blue-700', icon: Users },
  pharmacy: { label: 'All Pharmacies', color: 'bg-green-100 text-green-700', icon: Building2 },
  all: { label: 'Everyone', color: 'bg-purple-100 text-purple-700', icon: Globe },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const PAGE_SIZE = 10

export default function AdminBroadcastPage() {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  // create form
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('customer')
  const [creating, setCreating] = useState(false)

  // pagination
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchBroadcasts = async (pageNum = 1) => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/broadcasts?page=${pageNum}&per_page=${PAGE_SIZE}`)
      const d = res.data?.data || res.data
      const list = Array.isArray(d) ? d : (d.data || [])
      setBroadcasts(list)
      setPage(pageNum)
      setLastPage(d.last_page || 1)
      setTotal(d.total || list.length)
    } catch {
      setBroadcasts([])
      setLastPage(1)
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBroadcasts(1)
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      showToast('Title and message are required', 'error')
      return
    }
    setCreating(true)
    try {
      await api.post('/admin/broadcasts', { title: title.trim(), message: message.trim(), audience })
      showToast('Broadcast created successfully')
      setShowCreate(false)
      setTitle('')
      setMessage('')
      setAudience('customer')
      fetchBroadcasts(1)
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to create broadcast', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (b) => {
    const next = !b.is_active
    setBroadcasts((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: next } : x)))
    try {
      await api.patch(`/admin/broadcasts/${b.id}/toggle-active`)
      showToast(next ? 'Broadcast activated' : 'Broadcast deactivated')
    } catch (e) {
      setBroadcasts((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: !next } : x)))
      showToast(e.response?.data?.message || 'Failed to update', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/broadcasts/${deleteTarget.id}`)
      showToast('Broadcast deleted')
      setBroadcasts((prev) => prev.filter((x) => x.id !== deleteTarget.id))
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to delete', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
            <p className="text-sm text-gray-500">Send announcements to customers and pharmacies.</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Broadcast
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Megaphone className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No broadcasts yet</h3>
          <p className="text-sm text-gray-500">Create your first broadcast to reach your audience.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Broadcast</span>
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
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Created</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {broadcasts.map((b) => {
                  const cfg = AUDIENCE_CONFIG[b.audience] || AUDIENCE_CONFIG.all
                  const AudIcon = cfg.icon
                  return (
                    <tr key={b.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10 shrink-0">
                            <Megaphone className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{b.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{b.message}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          <AudIcon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(b.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${b.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {b.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(b)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              b.is_active
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-[#0FD452]/10 text-[#0FD452] hover:bg-[#0FD452]/20'
                            }`}
                            title={b.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {b.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {b.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(b)}
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
          {lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">Total {total} broadcasts</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchBroadcasts(page - 1)}
                  disabled={page === 1}
                  className="btn-ghost"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500 px-2">{page} / {lastPage}</span>
                <button
                  onClick={() => fetchBroadcasts(page + 1)}
                  disabled={page === lastPage}
                  className="btn-ghost"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">New Broadcast</h2>
                  <p className="text-xs text-gray-500">Send an announcement to your audience.</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={255}
                  placeholder="e.g. New feature announcement"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Write your broadcast message..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                >
                  <option value="customer">All Customers</option>
                  <option value="pharmacy">All Pharmacies</option>
                  <option value="all">Everyone</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !message.trim()}
                className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Megaphone className="w-4 h-4" />
                )}
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Broadcast"
        message={`Are you sure you want to delete "${deleteTarget?.title || 'this broadcast'}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#000F14] text-white'}`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
