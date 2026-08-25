import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LifeBuoy,
  Search,
  Plus,
  Loader,
  ArrowLeft,
  Send,
  Clock,
  Calendar,
  Building2,
  MessageSquare,
} from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/Modal'

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

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

const CATEGORIES = ['Account Access', 'Billing & Subscription', 'Orders & Delivery', 'Technical Issue', 'Other']

export default function OwnerSupportPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pharmacyId, setPharmacyId] = useState(null)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ subject: '', category: 'Technical Issue', priority: 'medium', description: '' })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchPharmacy()
    fetchTickets()
  }, [])

  const fetchPharmacy = async () => {
    try {
      const res = await api.get('/pharmacies/current')
      setPharmacyId(res.data?.id || res.data?.data?.id || null)
    } catch {
      // Fall back to no pharmacy id — create still works for user-level tickets
    }
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await api.get('/support/tickets')
      const raw = res.data?.data || res.data || {}
      setTickets(Array.isArray(raw) ? raw : (raw.data || raw.tickets || []))
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const openTicket = async (id) => {
    try {
      const res = await api.get(`/support/tickets/${id}`)
      const raw = res.data?.data || res.data
      setSelected(raw)
      setReplyText('')
    } catch {
      // Ignore — ticket stays unselected
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.subject.trim()) errs.subject = 'Subject is required'
    if (!form.description.trim()) errs.description = 'Describe the issue'
    setFormErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      await api.post('/support/tickets', { ...form, pharmacy_id: pharmacyId })
      setShowCreate(false)
      setForm({ subject: '', category: 'Technical Issue', priority: 'medium', description: '' })
      setToast('Ticket submitted — the admin team will respond shortly.')
      setTimeout(() => setToast(null), 3500)
      fetchTickets()
    } catch (err) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors)
      else setFormErrors({ form: err.response?.data?.message || 'Failed to submit ticket.' })
    } finally {
      setSubmitting(false)
    }
  }

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return
    setSending(true)
    try {
      await api.post(`/support/tickets/${selected.id}/reply`, { message: replyText.trim() })
      setReplyText('')
      openTicket(selected.id)
    } catch {
      // Ignore — user can retry
    } finally {
      setSending(false)
    }
  }

  const filtered = tickets.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (t.subject || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      String(t.id).includes(q)
    )
  })

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#000F14] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-[#0FD452]" />
            Support
          </h1>
          <p className="text-sm text-gray-500 mt-1">Reach the Pharmex admin team for help with your pharmacy account.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {!selected ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No support tickets yet.</p>
              <p className="text-sm">Create a ticket and the admin team will assist you.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTicket(t.id)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-5 h-5 text-[#0FD452]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900 truncate">#{t.id} {t.subject}</p>
                      <span className={`${STATUS_STYLES[t.status] || 'badge badge-gray'} shrink-0`}>
                        {STATUS_LABELS[t.status] || t.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{t.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {t.pharmacy?.pharmacy_name || 'Platform'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {PRIORITY_LABELS[t.priority] || t.priority}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h2 className="font-bold text-gray-900">#{selected.id} {selected.subject}</h2>
                <p className="text-xs text-gray-500">
                  {PRIORITY_LABELS[selected.priority]} priority · {STATUS_LABELS[selected.status] || selected.status}
                </p>
              </div>
            </div>
            <span className={`${STATUS_STYLES[selected.status] || 'badge badge-gray'}`}>
              {STATUS_LABELS[selected.status] || selected.status}
            </span>
          </div>

          <div className="px-5 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
            <p className="text-xs text-gray-400 mt-2">Opened {new Date(selected.created_at).toLocaleString()}</p>
          </div>

          <div className="px-5 py-4 space-y-3 max-h-[40vh] overflow-y-auto">
            {(selected.replies || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No replies yet.</p>
            )}
            {(selected.replies || []).map((r) => (
              <div
                key={r.id}
                className={`rounded-xl px-4 py-3 text-sm ${
                  r.user?.role === 'admin'
                    ? 'bg-[#0FD452]/10 text-gray-900 ml-8'
                    : 'bg-gray-100 text-gray-800 mr-8'
                }`}
              >
                <p className="font-semibold text-xs mb-1">
                  {r.user?.role === 'admin' ? 'Pharmex Admin' : r.user?.name || 'You'}
                  <span className="font-normal text-gray-400 ml-2">{new Date(r.created_at).toLocaleString()}</span>
                </p>
                <p>{r.message}</p>
              </div>
            ))}
          </div>

          {(selected.status === 'open' || selected.status === 'in_progress') && (
            <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendReply() }}
                placeholder="Type your reply..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
              />
              <button onClick={sendReply} disabled={sending || !replyText.trim()} className="btn-primary">
                {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Support Ticket" maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.form && <p className="text-xs text-red-500">{formErrors.form}</p>}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Subject <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] ${formErrors.subject ? '!border-red-400' : 'border-gray-300'}`}
              placeholder="What do you need help with?"
            />
            {formErrors.subject && <p className="text-xs text-red-500 mt-1">{formErrors.subject}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] ${formErrors.description ? '!border-red-400' : 'border-gray-300'}`}
              placeholder="Describe the issue in detail..."
            />
            {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
