import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Loader2,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/Modal'
import OrderFlowProgress, {
  orderStatusLabel,
  orderStatusStyle,
} from '../../components/OrderFlowProgress'
import useConfirm from '../../hooks/useConfirm'
import { formatMoney } from '../../utils/currency'
import { textValue } from '../../utils/text'

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'dispatched',
  dispatched: 'delivered',
}

const NEXT_LABELS = {
  confirmed: 'Confirm order',
  packed: 'Mark packed',
  dispatched: 'Mark dispatched',
  delivered: 'Mark delivered',
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20'

function formatDate(value, withTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function StatCard({ icon: Icon, label, value, hint, tone = 'text-[#000F14]' }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0FD452]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0FD452]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-0.5 break-words text-sm text-gray-800">{textValue(value)}</p>
      </div>
    </div>
  )
}

export default function AdminWholesaleOrderDetailPage() {
  const { id } = useParams()
  const [confirm, confirmDialog] = useConfirm()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({ tracking_number: '', delivery_partner: '', notes: '' })

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ payment_reference: '', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/wholesale-orders/${id}`)
      setOrder(data?.order || null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load order')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const openAdvance = () => {
    if (!order) return
    setAdvanceForm({
      tracking_number: order.tracking_number || '',
      delivery_partner: order.delivery_partner || '',
      notes: '',
    })
    setAdvanceOpen(true)
  }

  const saveAdvance = async (event) => {
    event.preventDefault()
    const target = NEXT_STATUS[order?.status]
    if (!target) return
    setBusy(true)
    try {
      await api.post(`/admin/wholesale-orders/${order.id}/status`, {
        status: target,
        tracking_number: advanceForm.tracking_number || undefined,
        delivery_partner: advanceForm.delivery_partner || undefined,
        notes: advanceForm.notes || undefined,
      })
      toast.success(`Order marked ${target}`)
      setAdvanceOpen(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update order')
    } finally {
      setBusy(false)
    }
  }

  const cancelOrder = async () => {
    if (!order) return
    const ok = await confirm({
      title: 'Cancel order?',
      message: `Order ${order.order_id} will be cancelled and reserved stock returned to the supplier.`,
      confirmText: 'Cancel order',
      variant: 'danger',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.post(`/admin/wholesale-orders/${order.id}/status`, {
        status: 'cancelled',
        cancellation_reason: 'Cancelled by administrator',
      })
      toast.success('Order cancelled and stock restored')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not cancel order')
    } finally {
      setBusy(false)
    }
  }

  const openPayment = () => {
    setPaymentForm({ payment_reference: order?.payment_reference || '', notes: '' })
    setPaymentOpen(true)
  }

  const savePayment = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await api.post(`/admin/wholesale-orders/${order.id}/mark-paid`, {
        payment_reference: paymentForm.payment_reference || undefined,
        notes: paymentForm.notes || undefined,
      })
      toast.success('Payment recorded')
      setPaymentOpen(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not record payment')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-xl bg-white" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-white" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
        <Package className="mb-4 h-12 w-12 text-gray-300" />
        <h3 className="text-lg font-semibold text-[#000F14]">Order not found</h3>
        <Link to="/dashboard/wholesale-orders-admin" className="btn-primary mt-5">
          Back to wholesale orders
        </Link>
      </div>
    )
  }

  const nextStatus = NEXT_STATUS[order.status]
  const timestamps = {
    pending: order.ordered_at || order.created_at,
    confirmed: order.confirmed_at,
    packed: order.packed_at || order.prepared_at,
    dispatched: order.dispatched_at,
    delivered: order.delivered_at,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/wholesale-orders-admin" className="btn-ghost">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Store className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.order_id}</h1>
            <p className="text-sm text-gray-500">
              {textValue(order.pharmacy_name)} · {textValue(order.wholesaler_name)} · {formatDate(order.ordered_at, true)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
            <button onClick={openPayment} disabled={busy} className="btn-secondary">
              <CreditCard className="h-4 w-4" />
              Record payment
            </button>
          )}
          {nextStatus && (
            <button onClick={openAdvance} disabled={busy} className="btn-primary">
              <CheckCircle2 className="h-4 w-4" />
              {NEXT_LABELS[nextStatus]}
            </button>
          )}
          {!['delivered', 'cancelled'].includes(order.status) && (
            <button onClick={cancelOrder} disabled={busy} className="btn-danger-outline">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Package}
          label="Status"
          value={
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusStyle(order.status)}`}
            >
              {orderStatusLabel('wholesale', order.status)}
            </span>
          }
        />
        <StatCard
          icon={CreditCard}
          label="Payment"
          value={order.payment_status || 'unpaid'}
          hint={order.payment_method || 'cash'}
          tone={order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}
        />
        <StatCard icon={Hash} label="Order total" value={formatMoney(order.total_amount || 0)} />
        <StatCard
          icon={Clock}
          label="Expected delivery"
          value={formatDate(order.expected_delivery_date)}
          hint={order.tracking_number ? `Tracking ${order.tracking_number}` : 'No tracking yet'}
        />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#000F14]">Order progress</h2>
          <p className="text-xs text-gray-400">Request → delivery</p>
        </div>
        <OrderFlowProgress
          type="wholesale"
          status={order.status}
          timestamps={timestamps}
          showTimestamps
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-base font-bold text-[#000F14]">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-2 py-2">Medicine</th>
                  <th className="px-2 py-2">Unit</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Unit price</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(order.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2 font-semibold text-[#000F14]">{item.drug_name}</td>
                    <td className="px-2 py-2 capitalize text-gray-600">
                      {item.unit} {item.pack_size > 1 ? `(${item.pack_size})` : ''}
                    </td>
                    <td className="px-2 py-2 text-gray-700">{item.quantity}</td>
                    <td className="px-2 py-2 text-gray-700">{formatMoney(item.unit_price || 0)}</td>
                    <td className="px-2 py-2 font-semibold text-[#000F14]">{formatMoney(item.total_price || 0)}</td>
                    <td className="px-2 py-2 text-gray-700">{item.quantity_received || 0}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={4} className="px-2 py-2 text-right text-sm text-gray-500">
                    Subtotal
                  </td>
                  <td className="px-2 py-2 font-semibold">{formatMoney(order.subtotal || 0)}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={4} className="px-2 py-2 text-right text-sm text-gray-500">
                    Shipping
                  </td>
                  <td className="px-2 py-2 font-semibold">{formatMoney(order.shipment_fee || 0)}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={4} className="px-2 py-2 text-right text-sm font-semibold text-[#000F14]">
                    Total
                  </td>
                  <td className="px-2 py-2 text-base font-bold text-[#0a8f3c]">
                    {formatMoney(order.total_amount || 0)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#000F14]">Delivery & payment</h2>
          <InfoCard icon={Building2} label="Pharmacy">
            {order.pharmacy_profile_id ? (
              <Link
                to={`/dashboard/pharmacies/${order.pharmacy_profile_id}`}
                className="mt-0.5 block break-words text-sm font-semibold text-[#0a8f3c] hover:underline"
              >
                {textValue(order.pharmacy_name, 'View pharmacy')}
              </Link>
            ) : (
              <p className="mt-0.5 break-words text-sm text-gray-800">{textValue(order.pharmacy_name)}</p>
            )}
          </InfoCard>
          <InfoCard icon={Truck} label="Supplier">
            {order.wholesaler_profile_id ? (
              <Link
                to={`/dashboard/wholesalers/${order.wholesaler_profile_id}/edit`}
                className="mt-0.5 block break-words text-sm font-semibold text-[#0a8f3c] hover:underline"
              >
                {textValue(order.wholesaler_name, 'View wholesaler')}
              </Link>
            ) : (
              <p className="mt-0.5 break-words text-sm text-gray-800">{textValue(order.wholesaler_name)}</p>
            )}
          </InfoCard>
          <InfoCard icon={Phone} label="Supplier phone" value={order.wholesaler_phone} />
          <InfoCard icon={MapPin} label="Delivery address" value={order.delivery_address} />
          <InfoCard icon={Truck} label="Shipment" value={order.shipment_method} />
          <InfoCard icon={CreditCard} label="Payment reference" value={order.payment_reference} />
          <InfoCard icon={Hash} label="Account number" value={order.account_number} />
          <InfoCard icon={Truck} label="Delivery partner" value={order.delivery_partner} />
          <InfoCard icon={Hash} label="Tracking number" value={order.tracking_number} />
          {(order.notes || order.cancellation_reason) && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {order.cancellation_reason ? 'Cancellation reason' : 'Notes'}
              </p>
              <p className="mt-1">{order.cancellation_reason || order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {(order.payments || []).length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-[#000F14]">Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Method</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Reference</th>
                  <th className="px-2 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-2 py-2 font-semibold">{formatMoney(payment.amount || 0)}</td>
                    <td className="px-2 py-2 capitalize text-gray-600">{payment.payment_method || '—'}</td>
                    <td className="px-2 py-2 capitalize text-gray-600">{payment.status || '—'}</td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-600">{payment.transaction_reference || '—'}</td>
                    <td className="px-2 py-2 text-gray-600">{formatDate(payment.payment_date, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-[#000F14]">Timeline</h2>
        {(order.events || []).length === 0 ? (
          <p className="text-sm text-gray-500">No events recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {order.events.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#0FD452]" />
                <div>
                  <p className="text-sm font-semibold text-[#000F14]">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.description}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {formatDate(event.created_at, true)}
                    {event.actor_name ? ` · ${event.actor_name}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={advanceOpen}
        onClose={() => setAdvanceOpen(false)}
        title={nextStatus ? NEXT_LABELS[nextStatus] : 'Update order'}
        subtitle={`${order.order_id} · ${textValue(order.pharmacy_name)}`}
      >
        <form onSubmit={saveAdvance} className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            Moving from <span className="font-semibold capitalize">{order.status}</span> to{' '}
            <span className="font-semibold capitalize">{nextStatus}</span>.
          </div>
          {nextStatus === 'dispatched' && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Tracking number</span>
                <input
                  value={advanceForm.tracking_number}
                  onChange={(event) => setAdvanceForm((prev) => ({ ...prev, tracking_number: event.target.value }))}
                  className={inputClass}
                  placeholder="e.g. TZ-4587-0021"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Delivery partner</span>
                <input
                  value={advanceForm.delivery_partner}
                  onChange={(event) => setAdvanceForm((prev) => ({ ...prev, delivery_partner: event.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Supplier delivery"
                />
              </label>
            </>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Internal note (optional)</span>
            <textarea
              value={advanceForm.notes}
              onChange={(event) => setAdvanceForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className={inputClass}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAdvanceOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {nextStatus ? NEXT_LABELS[nextStatus] : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record payment"
        subtitle={`${order.order_id} · ${formatMoney(order.total_amount || 0)}`}
      >
        <form onSubmit={savePayment} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Payment reference</span>
            <input
              value={paymentForm.payment_reference}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, payment_reference: event.target.value }))}
              className={inputClass}
              placeholder="Bank slip, mobile money or receipt number"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Note (optional)</span>
            <textarea
              value={paymentForm.notes}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className={inputClass}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPaymentOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Mark as paid
            </button>
          </div>
        </form>
      </Modal>

      {confirmDialog}
    </div>
  )
}
