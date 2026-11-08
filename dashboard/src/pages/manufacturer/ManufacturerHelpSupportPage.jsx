import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LifeBuoy, Plus, MessageCircle, ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import {
  PageHeader,
  StatCard,
  Panel,
  Badge,
  Spinner,
  EmptyState,
  PrimaryButton,
  formatDate,
} from './ManufacturerUI'
import { usePortalData } from './usePortalData'

const statusTone = { open: 'amber', in_progress: 'blue', resolved: 'green', closed: 'gray' }
const priorityTone = { low: 'gray', medium: 'blue', high: 'amber', urgent: 'red' }

export default function ManufacturerHelpSupportPage() {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const { data, loading, error } = usePortalData('/manufacturer-portal/support', { refresh })
  const [openFaq, setOpenFaq] = useState(0)

  const tickets = data?.tickets || []
  const summary = data?.summary || {}
  const faqs = data?.faqs || []

  const openNew = () => navigate('/dashboard/manufacturer/help/new')
  const openTicket = (ticket) => navigate(`/dashboard/manufacturer/help/${ticket.id}`)

  return (
    <div>
      <PageHeader
        title="Help & support"
        subtitle="Find answers to common questions or open a ticket with the Helix team."
        action={
          <PrimaryButton onClick={openNew}>
            <Plus className="h-4 w-4" /> New ticket
          </PrimaryButton>
        }
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={LifeBuoy} label="Total tickets" value={summary.total ?? 0} hint="All time" />
            <StatCard icon={Clock} label="Open tickets" value={summary.open ?? 0} hint="Awaiting a response" tone="text-amber-600" />
            <StatCard icon={CheckCircle2} label="Resolved" value={summary.resolved ?? 0} hint="Closed or resolved" tone="text-[#0a8f3c]" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Common questions" subtitle="Quick answers before opening a ticket">
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div key={faq.question} className="rounded-xl border border-gray-100">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-[#000F14]"
                    >
                      {faq.question}
                      {openFaq === index ? <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
                    </button>
                    {openFaq === index && (
                      <p className="border-t border-gray-50 px-4 py-3 text-sm text-gray-600">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Your tickets"
              subtitle="Track conversations with the support team"
              action={<button onClick={openNew} className="text-sm font-semibold text-[#0a8f3c] hover:text-[#0FD452]">New ticket</button>}
            >
              {tickets.length === 0 ? (
                <EmptyState
                  icon={MessageCircle}
                  title="No tickets yet"
                  message="When you need help, open a ticket and our team will respond."
                  action={<PrimaryButton onClick={openNew}><Plus className="h-4 w-4" /> New ticket</PrimaryButton>}
                />
              ) : (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => openTicket(ticket)}
                      className="w-full rounded-xl border border-gray-100 p-3.5 text-left transition-colors hover:border-[#0FD452]/40 hover:bg-gray-50/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#000F14]">{ticket.subject}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{ticket.description}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {ticket.category || 'General'} · {formatDate(ticket.created_at)} · {ticket.replies?.length || 0} replies
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge tone={statusTone[ticket.status] || 'gray'}>{String(ticket.status).replace('_', ' ')}</Badge>
                          <Badge tone={priorityTone[ticket.priority] || 'gray'}>{ticket.priority}</Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

    </div>
  )
}
