import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Hash,
  MapPin,
  Package,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import OrderFlowProgress, {
  PAYMENT_STATUS_STYLES,
  orderStatusLabel,
  orderStatusStyle,
} from '../../components/OrderFlowProgress'
import {
  PageHeader,
  Spinner,
  Modal,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  Field,
  inputClass,
  formatMoney,
  formatDate,
} from '../wholesaler/WholesalerUI'

const NEXT = { pending: 'confirmed', confirmed: 'packed', packed: 'dispatched', dispatched: 'delivered' }

const NEXT_LABELS = {
  confirmed: 'Confirm order',
  packed: 'Mark prepared & packed',
  dispatched: 'Dispatch order',
  delivered: 'Mark delivered',
}

const NEXT_HINTS = {
  confirmed: 'Accept the pharmacy order and start preparing it from your inventory.',
  packed: 'All items are packed and ready for dispatch.',
  dispatched: 'Hand the shipment to a delivery partner and share the tracking number.',
  delivered: 'The pharmacy has received the order and stock has been added to their inventory.',
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0FD452]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-[#000F14]">{value || '——'}</p>
      </div>
    </div>
  )
}

export default function WholesalerOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({ tracking_number: '', delivery_partner: '', notes: '' })
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/wholesaler-portal/orders/${id}`)
      setOrder(data.order)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load order.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const next = order ? NEXT[order.status] : null
  const canCancel = order && ['pending', 'confirmed'].includes(order.status)

  const openAdvance = () => {
    if (!next) return
    const dispatched = next === 'dispatched'
    setAdvanceForm({
      tracking_number: dispatched ? order?.tracking_number || '' : '',
      delivery_partner: dispatched ? order?.delivery_partner || 'Wholesaler delivery' : '',
      notes: '',
    })
    setAdvanceOpen(true)
  }

  const submitAdvance = async () => {
    if (!next) return
    if (next === 'dispatched' && !advanceForm.tracking_number.trim()) {
      toast.error('Add a tracking number so the pharmacy can follow the shipment.')
      return
    }
    setBusy(true)
    try {
      await api.post(`/wholesaler-portal/orders/${order.id}/status`, {
        status: next,
        notes: advanceForm.notes || undefined,
        tracking_number: advanceForm.tracking_number || undefined,
        delivery_partner: advanceForm.delivery_partner || undefined,
      })
      toast.success(`Order moved to ${orderStatusLabel('wholesale', next).toLowerCase()}.`)
      setAdvanceOpen(false)
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update order.')
    } finally {
      setBusy(false)
    }
  }

  const submitCancel = async () => {
    setBusy(true)
    try {
      await api.post(`/wholesaler-portal/orders/${order.id}/status`, {
        status: 'cancelled',
        cancellation_reason: cancelReason.trim() || 'Cancelled by supplier',
      })
      toast.success('Order cancelled. Stock was returned to your inventory.')
      setCancelOpen(false)
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not cancel order.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner />
  if (!order) return <div className="p-6">Order not found.</div>

  const timestamps = {
    pending: order.ordered_at,
    confirmed: order.confirmed_at,
    packed: order.packed_at,
    dispatched: order.dispatched_at,
    delivered: order.delivered_at,
  }

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard/wholesaler/orders')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0a8f3c]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to pharmacy orders
      </button>

      <PageHeader
        title={`Order ${order.order_id}`}
        subtitle={`From ${order.pharmacy_name || 'a pharmacy'} · ordered ${formatDateTime(order.ordered_at)}`}
      />

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${orderStatusStyle(order.status)}`}>
              {orderStatusLabel('wholesale', order.status)}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
              Payment: {order.payment_status || 'unpaid'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Expected delivery <span className="font-semibold text-[#000F14]">{formatDate(order.expected_delivery_date)}</span>
          </p>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
          <h2 className="text-base font-bold text-[#000F14]">Order progress</h2>
          <p className="text-xs text-gray-400">Request → delivery</p>
        </div>
        <OrderFlowProgress type="wholesale" status={order.status} timestamps={timestamps} showTimestamps />

        {order.status === 'cancelled' && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span className="font-semibold">Cancelled.</span> {order.cancellation_reason || 'No reason supplied.'}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          {next ? (
            <>
              <button
                type="button"
                onClick={openAdvance}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0FD452] px-4 py-2.5 text-sm font-semibold text-[#000F14] transition-colors hover:bg-[#0cb843]"
              >
                {NEXT_LABELS[next]} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs text-gray-500">{NEXT_HINTS[next]}</p>
            </>
          ) : order.status === 'delivered' ? (
            <p className="inline-flex items-center gap-2 rounded-lg bg-[#0FD452]/10 px-3 py-2 text-sm font-semibold text-[#0a8f3c]">
              <CheckCircle2 className="h-4 w-4" /> This order is complete
            </p>
          ) : null}
          {canCancel && (
            <button
              type="button"
              onClick={() => {
                setCancelReason('')
                setCancelOpen(true)
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel order
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#000F14]">
            <Package className="h-4 w-4 text-[#0FD452]" /> Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-2 py-2">Drug</th>
                  <th className="px-2 py-2 text-right">Qty</th>
                  <th className="px-2 py-2 text-right">Unit price</th>
                  <th className="px-2 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(order.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2.5 font-semibold text-[#000F14]">
                      {item.drug_name}
                      {item.unit && <span className="ml-2 text-xs font-normal text-gray-400">{item.unit}</span>}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-700">{item.quantity}</td>
                    <td className="px-2 py-2.5 text-right text-gray-700">{formatMoney(item.unit_price)}</td>
                    <td className="px-2 py-2.5 text-right font-semibold text-[#000F14]">{formatMoney(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td className="px-2 py-3 text-sm font-semibold text-gray-500" colSpan={3}>
                    Order total
                  </td>
                  <td className="px-2 py-3 text-right text-base font-bold text-[#000F14]">
                    {formatMoney(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-base font-bold text-[#000F14]">Order information</h2>
          <InfoRow icon={User} label="Pharmacy" value={order.pharmacy_name} />
          <InfoRow icon={Hash} label="Order ID" value={order.order_id} />
          <InfoRow icon={Calendar} label="Ordered" value={formatDateTime(order.ordered_at)} />
          <InfoRow icon={Truck} label="Delivery partner" value={order.delivery_partner} />
          <InfoRow icon={Truck} label="Tracking number" value={order.tracking_number} />
          <InfoRow icon={CreditCard} label="Payment method" value={order.payment_method} />
          <InfoRow icon={MapPin} label="Delivery address" value={order.delivery_address} />
          <InfoRow icon={FileText} label="Notes" value={order.notes} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#000F14]">
          <Clock className="h-4 w-4 text-[#0FD452]" /> Order timeline
        </h2>
        {(order.events || []).length === 0 ? (
          <p className="text-sm text-gray-400">No activity recorded yet.</p>
        ) : (
          <ol className="space-y-4">
            {order.events.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0FD452]/10 text-[#0a8f3c]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#000F14]">{event.title}</p>
                  <p className="text-sm text-gray-500">{event.description}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDateTime(event.created_at)}
                    {event.actor_name ? ` · ${event.actor_name}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Modal
        open={advanceOpen}
        onClose={() => !busy && setAdvanceOpen(false)}
        title={NEXT_LABELS[next] || 'Advance order'}
        subtitle={`Order ${order.order_id} · ${order.pharmacy_name || 'Pharmacy'}`}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setAdvanceOpen(false)} disabled={busy}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={submitAdvance} loading={busy}>
              {next === 'dispatched' ? 'Dispatch order' : NEXT_LABELS[next]}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-[#0FD452]/5 px-3 py-2.5 text-sm text-gray-600">{NEXT_HINTS[next]}</div>
          {next === 'dispatched' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tracking number" required>
                <input
                  className={inputClass}
                  value={advanceForm.tracking_number}
                  onChange={(event) => setAdvanceForm((form) => ({ ...form, tracking_number: event.target.value }))}
                  placeholder="e.g. WHL-2026-00124"
                />
              </Field>
              <Field label="Delivery partner">
                <input
                  className={inputClass}
                  value={advanceForm.delivery_partner}
                  onChange={(event) => setAdvanceForm((form) => ({ ...form, delivery_partner: event.target.value }))}
                  placeholder="e.g. Wholesaler delivery"
                />
              </Field>
            </div>
          )}
          <Field label="Note for the pharmacy" hint="Optional; shown in the order timeline.">
            <textarea
              rows={3}
              className={inputClass}
              value={advanceForm.notes}
              onChange={(event) => setAdvanceForm((form) => ({ ...form, notes: event.target.value }))}
              placeholder="Add a short update…"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => !busy && setCancelOpen(false)}
        title="Cancel order"
        subtitle={`Order ${order.order_id} will be cancelled and the stock returned to your inventory.`}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setCancelOpen(false)} disabled={busy}>
              Keep order
            </SecondaryButton>
            <DangerButton type="button" onClick={submitCancel} loading={busy}>
              Cancel order
            </DangerButton>
          </>
        }
      >
        <Field label="Reason" hint="Shared with the pharmacy in the timeline.">
          <textarea
            rows={3}
            className={inputClass}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="e.g. Out of stock"
          />
        </Field>
      </Modal>
    </div>
  )
}
