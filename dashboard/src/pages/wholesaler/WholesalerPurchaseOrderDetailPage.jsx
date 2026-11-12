import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
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

export default function WholesalerPurchaseOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/wholesaler-portal/manufacturer-orders/${id}`)
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

  const receive = async () => {
    setBusy(true)
    try {
      await api.post(`/wholesaler-portal/manufacturer-orders/${order.id}/receive`)
      toast.success('Order received. Stock was added to your inventory.')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not receive order.')
    } finally {
      setBusy(false)
    }
  }

  const submitCancel = async () => {
    setBusy(true)
    try {
      await api.post(`/wholesaler-portal/manufacturer-orders/${order.id}/cancel`, {
        reason: cancelReason.trim() || 'Cancelled by buyer',
      })
      toast.success('Order cancelled.')
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
    pending: order.created_at,
    confirmed: order.confirmed_at,
    packed: order.packed_at,
    dispatched: order.dispatched_at,
    delivered: order.delivered_at,
  }
  const canCancel = ['pending', 'confirmed'].includes(order.status)

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard/wholesaler/purchase-orders')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0a8f3c]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to purchase orders
      </button>

      <PageHeader
        title={`Order ${order.order_id}`}
        subtitle={`Placed with ${order.manufacturer_name || 'a manufacturer'} on ${formatDateTime(order.created_at)}`}
      />

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${orderStatusStyle(order.status)}`}>
              {orderStatusLabel('manufacturer', order.status)}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
              Payment: {order.payment_status || 'unpaid'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Expected delivery <span className="font-semibold text-[#000F14]">{formatDate(order.expected_delivery_date)}</span>
          </p>
        </div>

        <OrderFlowProgress type="manufacturer" status={order.status} timestamps={timestamps} showTimestamps />

        {order.status === 'cancelled' && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span className="font-semibold">Cancelled.</span> {order.cancellation_reason || 'No reason supplied.'}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          {order.status === 'dispatched' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={receive}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0FD452] px-4 py-2.5 text-sm font-semibold text-[#000F14] hover:bg-[#0cb843] disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" /> {busy ? 'Receiving…' : 'Receive order'}
              </button>
              <p className="text-xs text-gray-500">
                Confirm delivery to add the quantities to your wholesale inventory.
              </p>
            </>
          )}
          {order.status === 'pending' && (
            <p className="text-sm text-gray-500">Waiting for the manufacturer to confirm this order.</p>
          )}
          {order.status === 'confirmed' && (
            <p className="text-sm text-gray-500">The manufacturer is preparing this order.</p>
          )}
          {order.status === 'delivered' && (
            <p className="inline-flex items-center gap-2 rounded-lg bg-[#0FD452]/10 px-3 py-2 text-sm font-semibold text-[#0a8f3c]">
              <CheckCircle2 className="h-4 w-4" /> Received and added to inventory
            </p>
          )}
          {order.manufacturer_user_id && (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/wholesaler/manufacturers/${order.manufacturer_user_id}/catalog`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Open manufacturer catalogue <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
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
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">SKU</th>
                  <th className="px-2 py-2 text-right">Qty</th>
                  <th className="px-2 py-2 text-right">Received</th>
                  <th className="px-2 py-2 text-right">Unit price</th>
                  <th className="px-2 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(order.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2.5 font-semibold text-[#000F14]">
                      {item.product_name}
                      {item.batch_number && (
                        <span className="ml-2 text-xs font-normal text-gray-400">Batch {item.batch_number}</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-gray-600">{item.sku || '—'}</td>
                    <td className="px-2 py-2.5 text-right text-gray-700">{item.quantity}</td>
                    <td className="px-2 py-2.5 text-right text-gray-700">{item.quantity_received || 0}</td>
                    <td className="px-2 py-2.5 text-right text-gray-700">{formatMoney(item.unit_price)}</td>
                    <td className="px-2 py-2.5 text-right font-semibold text-[#000F14]">{formatMoney(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td className="px-2 py-3 text-sm font-semibold text-gray-500" colSpan={5}>
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
          <InfoRow icon={User} label="Manufacturer" value={order.manufacturer_name} />
          <InfoRow icon={Hash} label="Order ID" value={order.order_id} />
          <InfoRow icon={Calendar} label="Placed" value={formatDateTime(order.created_at)} />
          <InfoRow icon={Truck} label="Tracking number" value={order.tracking_number} />
          <InfoRow icon={Truck} label="Delivery partner" value={order.delivery_partner} />
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
        open={cancelOpen}
        onClose={() => !busy && setCancelOpen(false)}
        title="Cancel purchase order"
        subtitle={`Order ${order.order_id} will be cancelled and the manufacturer's stock returned.`}
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
        <Field label="Reason" hint="Shared with the manufacturer in the timeline.">
          <textarea
            rows={3}
            className={inputClass}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="e.g. Changed our order quantity"
          />
        </Field>
      </Modal>
    </div>
  )
}
