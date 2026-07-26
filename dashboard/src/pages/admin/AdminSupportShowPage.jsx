import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Trash2,
  Loader2,
  LifeBuoy,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Clock,
  Tag,
  Building2,
  User,
  Timer,
  BarChart3,
  Reply,
  Send,
  FileText,
  Hash,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../services/api'

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

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function AdminSupportShowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showResolve, setShowResolve] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/admin/support/tickets/${id}`)
      setTicket(res.data.data || res.data)
    } catch {
      toast.error('Failed to load ticket')
      navigate('/admin/support')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    setActionLoading(true)
    try {
      await api.post(`/admin/support/tickets/${id}/resolve`)
      setTicket(prev => ({ ...prev, status: 'resolved' }))
      toast.success('Ticket resolved')
    } catch {
      toast.error('Failed to resolve ticket')
    } finally {
      setActionLoading(false)
      setShowResolve(false)
    }
  }

  const handleClose = async () => {
    setActionLoading(true)
    try {
      await api.post(`/admin/support/tickets/${id}/close`)
      setTicket(prev => ({ ...prev, status: 'closed' }))
      toast.success('Ticket closed')
    } catch {
      toast.error('Failed to close ticket')
    } finally {
      setActionLoading(false)
      setShowClose(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await api.delete(`/admin/support/tickets/${id}`)
      toast.success('Ticket deleted')
      navigate('/admin/support')
    } catch {
      toast.error('Failed to delete ticket')
    } finally {
      setActionLoading(false)
      setShowDelete(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setActionLoading(true)
    try {
      await api.post(`/admin/support/tickets/${id}/reply`, { message: replyText })
      toast.success('Reply sent')
      setReplyText('')
      setShowReply(false)
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-200 animate-pulse" />
        <div className="px-4 md:px-6 lg:px-8 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm h-96 animate-pulse" />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-96 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <LifeBuoy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Ticket not found</p>
          <button
            onClick={() => navigate('/admin/support')}
            className="text-[#0FD452] mt-2 text-sm font-medium hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/support" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">Ticket {ticket.id} — {ticket.pharmacy} <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[ticket.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[ticket.status] || ticket.status}</span></p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 pb-10">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Priority</p>
                <p className="mt-1"><span className={PRIORITY_STYLES[ticket.priority]}>{ticket.priority}</span></p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <LifeBuoy className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Status</p>
                <p className="mt-1">
                  <span className={STATUS_STYLES[ticket.status]}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                  
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Category</p>
                <p className="text-sm font-bold text-[#000F14] truncate">{ticket.category || 'General'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Created</p>
                <p className="text-sm font-bold text-[#000F14]">{formatDate(ticket.created)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Last Updated</p>
                <p className="text-sm font-bold text-[#000F14]">{formatDate(ticket.updated || ticket.created)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">Ticket Information</h3>
                  <p className="text-xs text-gray-500">Support ticket details</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Ticket ID</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14] font-mono">{ticket.id}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Subject</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{ticket.subject}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Category</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{ticket.category || 'General'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Priority</span>
                  </div>
                  <span className={PRIORITY_STYLES[ticket.priority]}>{ticket.priority}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Status</span>
                  </div>
                  <span className={STATUS_STYLES[ticket.status]}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                  
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Created</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{formatDate(ticket.created)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Updated</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{formatDate(ticket.updated || ticket.created)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Description</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14] leading-relaxed">{ticket.description || ticket.message || 'No description provided.'}</p>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">Message Thread</h3>
                  <p className="text-xs text-gray-500">Conversation history</p>
                </div>
              </div>
              <div className="p-6">
                {ticket.messages && ticket.messages.length > 0 ? (
                  <div className="space-y-4">
                    {ticket.messages.map((msg, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0FD452]/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-[#0FD452]" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#000F14]">{msg.sender || 'User'}</span>
                            <span className="text-xs text-gray-400">{formatDate(msg.created || msg.date)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{msg.message || msg.content || msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click Reply to start a conversation</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">Quick Stats</h3>
                  <p className="text-xs text-gray-500">Ticket metrics</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Pharmacy</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14] truncate max-w-[120px]">{ticket.pharmacy || '—'}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Submitter</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{ticket.submitter || ticket.user || '—'}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Response Time</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{ticket.response_time || '—'}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Resolution Time</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{ticket.resolution_time || '—'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">Actions</h3>
                  <p className="text-xs text-gray-500">Manage ticket</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <>
                    <button
                      onClick={() => setShowResolve(true)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full"
                    >
                      <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#000F14]">Resolve</p>
                        <p className="text-xs text-gray-500">Mark as resolved</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowClose(true)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full"
                    >
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                        <XCircle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#000F14]">Close</p>
                        <p className="text-xs text-gray-500">Mark as closed</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowReply(true)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Reply className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#000F14]">Reply</p>
                        <p className="text-xs text-gray-500">Send a response</p>
                      </div>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">Delete</p>
                    <p className="text-xs text-gray-500">Permanently delete</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResolve}
        title="Resolve Ticket"
        message={`Are you sure you want to resolve ticket "${ticket.id}"? This will mark it as resolved.`}
        confirmText="Resolve"
        cancelText="Cancel"
        variant="info"
        onConfirm={handleResolve}
        onCancel={() => setShowResolve(false)}
      />

      <ConfirmDialog
        isOpen={showClose}
        title="Close Ticket"
        message={`Are you sure you want to close ticket "${ticket.id}"? This will mark it as closed.`}
        confirmText="Close Ticket"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleClose}
        onCancel={() => setShowClose(false)}
      />

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Ticket"
        message={`Are you sure you want to delete ticket "${ticket.id}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <Modal
        isOpen={showReply}
        onClose={() => {
          setShowReply(false)
          setReplyText('')
        }}
        title="Reply to Ticket"
        subtitle={ticket.id}
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
            <p className="text-xs text-gray-500 mt-1">{ticket.pharmacy}</p>
          </div>
          <div>
            <label className="form-label">Your Response</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={5}
              placeholder="Type your response..."
              className="form-input w-full resize-y min-h-[120px]"
            />
          </div>
          <button
            onClick={handleReply}
            disabled={!replyText.trim() || actionLoading}
            className="btn-primary w-full justify-center"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Send Reply
          </button>
        </div>
      </Modal>
    </div>
  )
}
