import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Banknote,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Loader2,
  User,
  Hash,
  AlertTriangle,
  Check,
  Boxes,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'
import { currentBase } from '../../utils/roles'
import { useAuth } from '../../contexts/AuthContext'
import WholesaleOrderProgress, {
  WHOLESALE_STATUS_LABELS,
  WHOLESALE_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
} from '../../components/WholesaleOrderProgress'

const NEXT_ACTION_LABELS = {
  confirmed: 'Confirm order',
  packed: 'Mark prepared & packed',
  dispatched: 'Dispatch order',
  delivered: 'Mark delivered',
}

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  credit: 'Credit account',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0FD452]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className={`mt-0.5 break-words text-sm text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  )
}

export default function WholesaleOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const base = currentBase()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionModal, setActionModal] = useState(null)
  const [actionForm, setActionForm] = useState({ tracking_number: '', delivery_partner: '', reason: '', payment_reference: '', notes: '' })
  const [actionError, setActionError] = useState('')

  const endpoint = isAdmin ? `/admin/wholesale-orders/${id}` : `/wholesale-marketplace/orders/${id}`

  const load = async () => {
    try {
      const res = await api.get(endpoint)
      setOrder(res.data?.order || null)
      setLoadError('')
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Could not load this order.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    load()
  }, [id, isAdmin])

  const events = useMemo(() => {
    const list = Array.isArray(order?.events) ? [...order.events] : []
    return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }, [order])

  const openAction = (type, nextStatus) => {
    setActionError('')
    setActionForm({
      tracking_number: order?.tracking_number || '',
      delivery_partner: order?.delivery_partner || 'Supplier delivery',
      reason: '',
      payment_reference: order?.payment_reference || '',
      notes: '',
    })
    setActionModal({ type, nextStatus })
  }

  const closeAction = () => {
    if (busy) return
    setActionModal(null)
    setActionError('')
  }

  const updateField = (key, value) => setActionForm((prev) => ({ ...prev, [key]: value }))

  const runStatus = async (nextStatus, payload = {}) => {
    setBusy(true)
    try {
      const res = await api.post(`/admin/wholesale-orders/${id}/status`, { status: nextStatus, ...payload })
      setOrder(res.data?.order || order)
      toast.success(res.data?.message || 'Order updated')
      setActionModal(null)
    } catch (error) {
      setActionError(error.response?.data?.message || 'Could not update the order.')
    } finally {
      setBusy(false)
    }
  }

  const runCancel = async () => {
    setBusy(true)
    setActionError('')
    try {
      if (isAdmin) {
        const res = await api.post(`/admin/wholesale-orders/${id}/status`, {
          status: 'cancelled',
          cancellation_reason: actionForm.reason || 'Cancelled by supplier',
        })
        setOrder(res.data?.order || order)
      } else {
        const res = await api.post(`/wholesale-marketplace/orders/${id}/cancel`, { reason: actionForm.reason })
        setOrder(res.data?.order || order)
      }
      toast.success('Order cancelled')
      setActionModal(null)
    } catch (error) {
      setActionError(error.response?.data?.message || 'Could not cancel the order.')
    } finally {
      setBusy(false)
    }
  }

  const receiveOrder = async () => {
    setBusy(true)
    try {
      const res = await api.post(`/wholesale-marketplace/orders/${id}/receive`)
      setOrder(res.data?.order || order)
      toast.success('Order marked as received')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not receive the order.')
    } finally {
      setBusy(false)
    }
  }

  const markPaid = async () => {
    setBusy(true)
    setActionError('')
    try {
      const res = await api.post(`/admin/wholesale-orders/${id}/payment`, {
        payment_reference: actionForm.payment_reference,
        notes: actionForm.notes,
      })
      setOrder(res.data?.order || order)
      toast.success('Payment recorded')
      setActionModal(null)
    } catch (error) {
      setActionError(error.response?.data?.message || 'Could not record the payment.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="h-24 animate-pulse rounded-xl bg-white" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-xl bg-white lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    )
  }

  if (loadError || !order) {
    return (
      <div className="space-y-5">
        <Link to={`${base}/wholesale-orders`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to wholesale orders
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Package className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">Order unavailable</h3>
          <p className="text-sm text-gray-500">{loadError || 'This order could not be found.'}</p>
        </div>
      </div>
    )
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const canReceive = order.status === 'dispatched'
  const nextStatus = order.next_status
  const canAdvance = isAdmin && nextStatus && ['confirmed', 'packed', 'dispatched', 'delivered'].includes(nextStatus)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to={`${base}/wholesale-orders`} className="rounded-xl p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{order.order_id}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${WHOLESALE_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                {WHOLESALE_STATUS_LABELS[order.status] || order.status}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                {order.payment_method === 'credit' ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method} · {order.payment_status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {order.wholesaler_name} · placed {formatDateTime(order.ordered_at)}
              {isAdmin && order.pharmacy_name ? ` · ${order.pharmacy_name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} disabled={busy} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {!isAdmin && (
            <Link to={`${base}/wholesale-marketplace/${order.wholesaler_id}`} className="btn-secondary">
              <Boxes className="h-4 w-4" />
              Order again
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <WholesaleOrderProgress status={order.status} />
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Placed</p>
            <p className="mt-0.5 font-medium text-gray-700">{formatDateTime(order.ordered_at)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Confirmed</p>
            <p className="mt-0.5 font-medium text-gray-700">{formatDateTime(order.confirmed_at)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Dispatched</p>
            <p className="mt-0.5 font-medium text-gray-700">{formatDateTime(order.dispatched_at)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Delivered</p>
            <p className="mt-0.5 font-medium text-gray-700">{formatDateTime(order.delivered_at)}</p>
          </div>
        </div>
        {order.status === 'cancelled' && order.cancellation_reason && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {order.cancellation_reason}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#000F14]">
                <Package className="h-4 w-4 text-[#0FD452]" />
                Items ordered
              </h2>
              <span className="text-xs text-gray-500">{order.items?.length || 0} lines</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-2.5">Medicine</th>
                    <th className="px-5 py-2.5">Unit</th>
                    <th className="px-5 py-2.5 text-right">Qty</th>
                    <th className="px-5 py-2.5 text-right">Unit price</th>
                    <th className="px-5 py-2.5 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(order.items || []).map((item) => (
                    <tr key={item.id} className="hover:bg-[#0FD452]/5">
                      <td className="px-5 py-3 text-sm font-medium text-[#000F14]">{item.drug_name}</td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-700">{item.unit}</p>
                        <p className="text-[11px] text-gray-400">{item.pack_size > 1 ? `${item.pack_size} pcs / unit` : 'single piece'}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-5 py-3 text-right text-sm text-gray-700">{formatMoney(item.unit_price)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-[#000F14]">{formatMoney(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-5 py-3 text-sm">
              <div className="ml-auto max-w-xs space-y-1.5">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipment fee</span><span>{Number(order.shipment_fee) === 0 ? 'Free' : formatMoney(order.shipment_fee)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-[#000F14]"><span>Total</span><span>{formatMoney(order.total_amount)}</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#000F14]">
              <Clock className="h-4 w-4 text-[#0FD452]" />
              Fulfilment timeline
            </h2>
            {events.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No events recorded yet.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {events.map((event, index) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${event.status === 'cancelled' ? 'bg-red-100 text-red-600' : event.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-[#0FD452]/15 text-[#0a8f3c]'}`}>
                        {event.status === 'cancelled' ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </div>
                      {index < events.length - 1 && <div className="mt-1 h-full w-px flex-1 bg-gray-200" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold text-[#000F14]">{event.title}</p>
                      {event.description && <p className="text-xs text-gray-500">{event.description}</p>}
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {formatDateTime(event.created_at)}
                        {event.actor_name ? ` · ${event.actor_name}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {order.notes && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#000F14]">
                <FileText className="h-4 w-4 text-[#0FD452]" />
                Order notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {isAdmin && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#000F14]">Supplier actions</h2>
              <p className="mt-1 text-xs text-gray-500">Move the order through preparation and delivery.</p>
              <div className="mt-3 space-y-2">
                {canAdvance && (
                  <button
                    onClick={() => (nextStatus === 'dispatched' ? openAction('dispatch', nextStatus) : runStatus(nextStatus))}
                    disabled={busy}
                    className="btn-primary w-full justify-center"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {NEXT_ACTION_LABELS[nextStatus] || 'Advance order'}
                  </button>
                )}
                {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                  <button onClick={() => openAction('payment')} disabled={busy} className="btn-secondary w-full justify-center">
                    <Banknote className="h-4 w-4 text-green-600" />
                    Record payment
                  </button>
                )}
                {canCancel && (
                  <button onClick={() => openAction('cancel')} disabled={busy} className="btn-danger-outline w-full justify-center">
                    <XCircle className="h-4 w-4" />
                    Cancel order
                  </button>
                )}
                {!canAdvance && order.status === 'delivered' && (
                  <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">This order was delivered successfully.</p>
                )}
                {order.status === 'cancelled' && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">This order was cancelled.</p>
                )}
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#000F14]">Order actions</h2>
              <p className="mt-1 text-xs text-gray-500">
                {canReceive
                  ? 'The supplier dispatched this order. Confirm when it reaches your pharmacy.'
                  : canCancel
                    ? 'You can cancel before the supplier dispatches the order.'
                    : 'This order is being handled by the supplier.'}
              </p>
              <div className="mt-3 space-y-2">
                {canReceive && (
                  <button onClick={receiveOrder} disabled={busy} className="btn-primary w-full justify-center">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm receipt
                  </button>
                )}
                {canCancel && (
                  <button onClick={() => openAction('cancel')} disabled={busy} className="btn-danger-outline w-full justify-center">
                    <XCircle className="h-4 w-4" />
                    Cancel order
                  </button>
                )}
                <Link to={`${base}/wholesale-marketplace/${order.wholesaler_id}`} className="btn-secondary w-full justify-center">
                  <ArrowRight className="h-4 w-4" />
                  Order again
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#000F14]">Payment</h2>
            <div className="mt-3 space-y-2">
              <InfoRow icon={order.payment_method === 'credit' ? CreditCard : Banknote} label="Method" value={PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method} />
              <InfoRow icon={CheckCircle2} label="Status" value={order.payment_status} />
              {order.account_number && <InfoRow icon={Hash} label="Account number" value={order.account_number} mono />}
              {order.payment_reference && <InfoRow icon={FileText} label="Payment reference" value={order.payment_reference} mono />}
            </div>
            {Array.isArray(order.payments) && order.payments.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{payment.status} · {formatDate(payment.payment_date)}</span>
                    <span className="font-semibold text-gray-700">{formatMoney(payment.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#000F14]">Shipment</h2>
            <div className="mt-3 space-y-2">
              <InfoRow icon={Truck} label="Method" value={`${String(order.shipment_method || '').replace(/^./, (c) => c.toUpperCase())}`} />
              {order.shipment_method !== 'pickup' && <InfoRow icon={MapPin} label="Delivery address" value={order.delivery_address} />}
              <InfoRow icon={Calendar} label="Expected delivery" value={formatDate(order.expected_delivery_date)} />
              {order.delivery_partner && <InfoRow icon={User} label="Delivery partner" value={order.delivery_partner} />}
              {order.tracking_number && <InfoRow icon={Hash} label="Tracking number" value={order.tracking_number} mono />}
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#000F14]">Supplier</h2>
            <div className="mt-3 space-y-2">
              <InfoRow icon={Package} label="Name" value={order.wholesaler_name} />
              <InfoRow icon={Phone} label="Phone" value={order.wholesaler_phone} />
              <InfoRow icon={MapPin} label="Address" value={order.wholesaler_address} />
            </div>
          </div>
        </div>
      </div>

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeAction} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={closeAction} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>

            {actionModal.type === 'dispatch' && (
              <>
                <h3 className="text-lg font-bold text-[#000F14]">Dispatch order</h3>
                <p className="mt-1 text-sm text-gray-500">Add tracking details so the pharmacy can follow the delivery.</p>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">Delivery partner</span>
                    <input value={actionForm.delivery_partner} onChange={(event) => updateField('delivery_partner', event.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452]" placeholder="e.g. Supplier van" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">Tracking number</span>
                    <input value={actionForm.tracking_number} onChange={(event) => updateField('tracking_number', event.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452]" placeholder="e.g. TRK-9001" />
                  </label>
                </div>
                {actionError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{actionError}</p>}
                <button onClick={() => runStatus('dispatched', { tracking_number: actionForm.tracking_number, delivery_partner: actionForm.delivery_partner })} disabled={busy} className="btn-primary mt-4 w-full justify-center">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                  Dispatch order
                </button>
              </>
            )}

            {actionModal.type === 'cancel' && (
              <>
                <h3 className="text-lg font-bold text-[#000F14]">Cancel order</h3>
                <p className="mt-1 text-sm text-gray-500">Stock will be returned to the supplier catalog.</p>
                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-semibold text-gray-600">Reason</span>
                  <textarea rows={3} value={actionForm.reason} onChange={(event) => updateField('reason', event.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452]" placeholder="Why is this order being cancelled?" />
                </label>
                {actionError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{actionError}</p>}
                <button onClick={runCancel} disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancel order
                </button>
              </>
            )}

            {actionModal.type === 'payment' && (
              <>
                <h3 className="text-lg font-bold text-[#000F14]">Record payment</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Confirm {formatMoney(order.total_amount)} received for {order.order_id}.
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">Payment reference</span>
                    <input value={actionForm.payment_reference} onChange={(event) => updateField('payment_reference', event.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452]" placeholder="e.g. CRDB-REF-771" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">Notes</span>
                    <textarea rows={2} value={actionForm.notes} onChange={(event) => updateField('notes', event.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452]" placeholder="Optional" />
                  </label>
                </div>
                {actionError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{actionError}</p>}
                <button onClick={markPaid} disabled={busy} className="btn-primary mt-4 w-full justify-center">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                  Mark as paid
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
