import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Badge, Field, inputClass, formatDate } from './ManufacturerUI'
import { FormPageSpinner } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/help'

const statusTone = { open: 'amber', in_progress: 'blue', resolved: 'green', closed: 'gray' }
const priorityTone = { low: 'gray', medium: 'blue', high: 'amber', urgent: 'red' }

export default function ManufacturerSupportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [reply, setReply] = useState('')
  const [fetching, setFetching] = useState(true)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setFetching(true)
    try {
      const { data } = await api.get('/manufacturer-portal/support')
      const match = (data.tickets || []).find((item) => String(item.id) === String(id))
      if (!match) {
        toast.error('That ticket could not be found.')
        navigate(LIST_PATH, { replace: true })
        return
      }
      setTicket(match)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load the ticket.')
      navigate(LIST_PATH, { replace: true })
    } finally {
      setFetching(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  const sendReply = async (event) => {
    event.preventDefault()
    if (!reply.trim()) {
      toast.error('Write a reply first.')
      return
    }

    setSending(true)
    try {
      await api.post(`/manufacturer-portal/support/${id}/reply`, { message: reply })
      toast.success('Reply sent.')
      setReply('')
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not send the reply.')
    } finally {
      setSending(false)
    }
  }

  if (fetching) return <FormPageSpinner />
  if (!ticket) return null

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link
          to={LIST_PATH}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-[#000F14] sm:text-2xl">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {ticket.category || 'General'} · Opened {formatDate(ticket.created_at)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone[ticket.status] || 'gray'}>{String(ticket.status).replace('_', ' ')}</Badge>
          <Badge tone={priorityTone[ticket.priority] || 'gray'}>{ticket.priority} priority</Badge>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Original message</p>
          <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{ticket.description}</p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-[#000F14]">Conversation</p>
          {(ticket.replies || []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
              No replies yet. Write a message below.
            </p>
          ) : (
            <div className="space-y-2">
              {ticket.replies.map((message) => (
                <div key={message.id} className="rounded-xl border border-gray-100 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#000F14]">{message.user?.name || 'Support'}</p>
                    <p className="text-xs text-gray-400">{formatDate(message.created_at)}</p>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{message.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={sendReply} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#000F14]">
          <MessageCircle className="h-4 w-4 text-[#0a8f3c]" /> Add a reply
        </h2>
        <div className="mt-4">
          <Field label="Message">
            <textarea rows={4} className={inputClass} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0FD452] px-4 py-2.5 text-sm font-semibold text-[#000F14] transition-all hover:bg-[#0cb843] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send reply'}
          </button>
        </div>
      </form>
    </div>
  )
}
