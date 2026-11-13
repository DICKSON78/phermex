import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Loader2,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  Store,
  Truck,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import OrderFlowProgress, {
  CUSTOMER_FLOW,
  PAYMENT_STATUS_STYLES,
  orderStatusLabel,
  orderStatusStyle,
} from '../../components/OrderFlowProgress'
import { formatMoney } from '../../utils/currency'
import { textValue } from '../../utils/text'

const NEXT = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
}

const NEXT_LABELS = {
  confirmed: 'Confirm order',
  preparing: 'Start preparing',
  ready: 'Mark ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Mark delivered',
}

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

function InfoCard({ icon: Icon, label, value, children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0FD452]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        {children || <p className="mt-0.5 break-words text-sm text-gray-800">{textValue(value)}</p>}
      </div>
    </div>
  )
}

export default function AdminCustomerOrderDetailPage() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/orders/${id}`)
      setOrder(data?.order || null)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load order.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const advance = async () => {
    const target = NEXT[order?.order_status]
    if (!target) return
    setBusy(true)
    try {
      await api.post(`/admin/orders/${order.id}/status`, { order_status: target })
      toast.success(`Order moved to ${orderStatusLabel('customer', target).toLowerCase()}.`)
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update order.')
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    if (!order) return
    if (!window.confirm(`Cancel order ${order.order_code}? Any reserved stock will be returned to the pharmacy.`)) {
      return
    }
    setBusy(true)
    try {
      await api.post(`/admin/orders/${order.id}/status`, { order_status: 'cancelled' })
      toast.success('Order cancelled and stock restored.')
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not cancel order.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-xl bg-white" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-white" />
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
        <Link to="/dashboard/customer-orders-admin" className="btn-primary mt-5">
          Back to customer orders
        </Link>
      </div>
    )
  }

  const next = NEXT[order.order_status]
  const customer = order.customer?.full_name || order.user?.name || 'Customer'
  const progress = order.progress || {}
  const timestamps = progress.timestamps || {
    pending: order.created_at,
    confirmed: order.confirmed_at,
    preparing: order.preparing_at,
    ready: order.ready_at,
    out_for_delivery: order.out_for_delivery_at,
    delivered: order.delivered_at,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/customer-orders-admin" className="btn-ghost">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <ShoppingCart className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.order_code}</h1>
            <p className="text-sm text-gray-500">
              {textValue(customer)} · {textValue(order.pharmacy, 'Pharmacy')} ·{' '}
              {formatDate(order.created_at, true)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {next && (
            <button onClick={advance} disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {NEXT_LABELS[next]}
            </button>
          )}
          {!['delivered', 'dispensed', 'cancelled'].includes(order.order_status) && (
            <button onClick={cancel} disabled={busy} className="btn-danger-outline">
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
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusStyle(order.order_status)}`}
            >
              {orderStatusLabel('customer', order.order_status)}
            </span>
          }
        />
        <StatCard
          icon={CreditCard}
          label="Payment"
          value={
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {order.payment_status || 'unpaid'}
            </span>
          }
          hint={order.payment_method || 'cash'}
        />
        <StatCard icon={Hash} label="Order total" value={formatMoney(order.total || 0)} />
        <StatCard
          icon={Calendar}
          label="Placed"
          value={formatDate(order.created_at)}
          hint={order.order_type ? `${order.order_type} order` : null}
        />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#000F14]">Order progress</h2>
          <p className="text-xs text-gray-400">Preparation → delivery</p>
        </div>
        <OrderFlowProgress
          type="customer"
          status={order.order_status}
          timestamps={timestamps}
          showTimestamps
        />
        {order.order_status === 'cancelled' && order.cancelled_at && (
          <p className="mt-3 text-xs text-red-500">Cancelled {formatDate(order.cancelled_at, true)}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-base font-bold text-[#000F14]">Items</h2>
          {(order.items || []).length === 0 ? (
            <p className="text-sm text-gray-500">No items recorded on this order.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-2 py-2">Medicine</th>
                    <th className="px-2 py-2">Qty</th>
                    <th className="px-2 py-2">Unit price</th>
                    <th className="px-2 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(order.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2 font-semibold text-[#000F14]">
                        {textValue(item.drug?.name, item.drug_name || 'Item')}
                      </td>
                      <td className="px-2 py-2 text-gray-700">{item.quantity}</td>
                      <td className="px-2 py-2 text-gray-700">{formatMoney(item.unit_price || 0)}</td>
                      <td className="px-2 py-2 font-semibold text-[#000F14]">
                        {formatMoney(item.total_price || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100">
                    <td colSpan={3} className="px-2 py-2 text-right text-sm text-gray-500">
                      Subtotal
                    </td>
                    <td className="px-2 py-2 font-semibold">{formatMoney(order.subtotal || 0)}</td>
                  </tr>
                  {Number(order.discount || 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="px-2 py-2 text-right text-sm text-gray-500">
                        Discount
                      </td>
                      <td className="px-2 py-2 font-semibold text-green-600">
                        −{formatMoney(order.discount || 0)}
                      </td>
                    </tr>
                  )}
                  {Number(order.tax || 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="px-2 py-2 text-right text-sm text-gray-500">
                        Tax
                      </td>
                      <td className="px-2 py-2 font-semibold">{formatMoney(order.tax || 0)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-2 py-2 text-right text-sm font-semibold text-[#000F14]">
                      Total
                    </td>
                    <td className="px-2 py-2 text-base font-bold text-[#0a8f3c]">
                      {formatMoney(order.total || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#000F14]">Customer & delivery</h2>
          <InfoCard icon={User} label="Customer" value={customer} />
          <InfoCard icon={Phone} label="Delivery phone" value={order.delivery_phone || order.customer?.phone} />
          <InfoCard icon={MapPin} label="Delivery address" value={order.delivery_address} />
          <InfoCard icon={Store} label="Pharmacy">
            {order.pharmacy?.id ? (
              <Link
                to={`/dashboard/pharmacies/${order.pharmacy.id}`}
                className="mt-0.5 block break-words text-sm font-semibold text-[#0a8f3c] hover:underline"
              >
                {textValue(order.pharmacy, 'View pharmacy')}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-gray-800">{textValue(order.pharmacy)}</p>
            )}
          </InfoCard>
          <InfoCard icon={Truck} label="Fulfilled by" value={order.processor?.name || order.user?.name} />
          <InfoCard icon={CreditCard} label="Payment reference" value={order.payment_reference} />
          {order.notes && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notes</p>
              <p className="mt-1">{order.notes}</p>
            </div>
          )}
          {order.cancelled_at && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Cancelled</p>
              <p className="mt-1">{formatDate(order.cancelled_at, true)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-[#000F14]">Timeline</h2>
        {(() => {
          const events = CUSTOMER_FLOW.map((stage) => ({
            key: stage.key,
            label: stage.label,
            at: timestamps[stage.key] || null,
          })).filter((event) => event.at)

          if (!events.length) {
            return <p className="text-sm text-gray-500">No progress recorded yet.</p>
          }

          return (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.key} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#0FD452]" />
                  <div>
                    <p className="text-sm font-semibold text-[#000F14]">{event.label}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{formatDate(event.at, true)}</p>
                  </div>
                </div>
              ))}
              {order.cancelled_at && (
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-600">Cancelled</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{formatDate(order.cancelled_at, true)}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <Link
          to={`/dashboard/pharmacies/${order.pharmacy_id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Building2 className="h-4 w-4" /> Open pharmacy
        </Link>
        <Link
          to="/dashboard/customer-orders-admin"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Clock className="h-4 w-4" /> All customer orders
        </Link>
      </div>
    </div>
  )
}
