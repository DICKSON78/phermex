import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

const POLL_MS = 15000
const ENDED_STATUSES = ['resolved', 'closed']

function buildMessages(ticket, userId) {
  if (!ticket) return []
  const items = [
    {
      id: `ticket-${ticket.id}`,
      mine: ticket.user_id === userId,
      body: ticket.description,
      at: ticket.created_at,
      name: ticket.user?.name,
    },
  ]
  ;(ticket.replies || []).forEach((reply) => {
    items.push({
      id: `reply-${reply.id}`,
      mine: reply.user_id === userId,
      body: reply.message,
      at: reply.created_at,
      name: reply.user?.name,
    })
  })
  return items
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function SupportChatWidget({ open, onClose }) {
  const { user, pharmacyId } = useAuth()
  const { t } = useLanguage()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  const loadConversation = useCallback(async () => {
    try {
      const res = await api.get('/support/tickets')
      const list = res.data?.data || []
      const active = list.find((tk) => !ENDED_STATUSES.includes(tk.status)) || null
      setTicket(active)
      setMessages(buildMessages(active, user?.id))
    } catch {
      // Keep the last loaded conversation on a failed poll.
    }
  }, [user?.id])

  useEffect(() => {
    if (!open) return undefined
    setLoading(true)
    loadConversation().finally(() => setLoading(false))
    const id = setInterval(loadConversation, POLL_MS)
    return () => clearInterval(id)
  }, [open, loadConversation])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const send = async (event) => {
    event.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      if (ticket) {
        await api.post(`/support/tickets/${ticket.id}/reply`, { message: body })
      } else {
        await api.post('/support/tickets', {
          pharmacy_id: pharmacyId,
          subject: t('support.chat.subject', 'Live chat support'),
          description: body,
          category: 'Live Chat',
          priority: 'medium',
        })
      }
      setText('')
      await loadConversation()
    } catch (error) {
      toast.error(error.response?.data?.message || t('support.chat.sendFailed', 'Message could not be sent'))
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[560px] max-h-[calc(100vh-2rem)] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-[#000F14] px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0FD452]/20">
            <MessageCircle className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <p className="text-sm font-bold">{t('support.chat.title', 'Helix Support')}</p>
            <p className="text-xs text-white/60">
              {t('support.chat.subtitle', 'Ask us anything about your pharmacy account')}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={t('common.close', 'Close')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f5f7f5] p-4">
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#0FD452]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">
              {t('support.chat.emptyTitle', 'How can we help?')}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t('support.chat.emptySub', 'Send a message and our team will reply here.')}
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
              {!m.mine && m.name && <span className="mb-1 text-[11px] font-semibold text-gray-500">{m.name}</span>}
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.mine
                    ? 'rounded-br-md bg-[#0FD452] text-[#000F14]'
                    : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                }`}
              >
                {m.body}
              </div>
              <span className="mt-1 text-[10px] text-gray-400">{formatTime(m.at)}</span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('support.chat.placeholder', 'Type your message...')}
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0FD452] text-[#000F14] transition-all hover:bg-[#0cb843] disabled:opacity-50"
          aria-label={t('support.chat.send', 'Send')}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}
