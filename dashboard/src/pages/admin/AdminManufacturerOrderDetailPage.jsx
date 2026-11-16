import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Factory,
  Hash,
  MapPin,
  Package,
  Truck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import OrderFlowProgress, {
  PAYMENT_STATUS_STYLES,
  orderStatusLabel,
  orderStatusStyle,
} from '../../components/OrderFlowProgress'
import { formatMoney } from '../../utils/currency'
import { textValue } from '../../utils/text'

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

export default function AdminManufacturerOrderDetailPage() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/manufacturer-orders/${id}`)
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
        <Link to="/dashboard/manufacturer-orders-admin" className="btn-primary mt-5">
          Back to manufacturer orders
        </Link>
      </div>
    )
  }

  const timestamps = {
    pending: order.created_at,
    confirmed: order.confirmed_at,
    packed: order.packed_at,
    dispatched: order.dispatched_at,
    delivered: order.delivered_at,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/manufacturer-orders-admin" className="btn-ghost">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Factory className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.order_id}</h1>
            <p className="text-sm text-gray-500">
              {textValue(order.wholesaler_name)} · {textValue(order.manufacturer_name)} ·{' '}
              {formatDate(order.created_at, true)}
            </p>
          </div>
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
              {orderStatusLabel('manufacturer', order.status)}
            </span>
          }
        />
        <StatCard
          icon={Clock}
          label="Payment"
          value={
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                PAYMENT_STATUS_STYLES[order.payment_status] || PAYMENT_STATUS_STYLES.unpaid
              }`}
            >
              {order.payment_status || 'unpaid'}
            </span>
          }
          hint={order.payment_method || 'cash'}
        />
        <StatCard icon={Hash} label="Order total" value={formatMoney(order.total_amount || 0)} />
        <StatCard
          icon={Calendar}
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
          type="manufacturer"
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
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">SKU</th>
                  <th className="px-2 py-2">Batch</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Unit price</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(order.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2 font-semibold text-[#000F14]">{item.product_name}</td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-600">{item.sku || '—'}</td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-600">{item.batch_number || '—'}</td>
                    <td className="px-2 py-2 text-gray-700">{item.quantity}</td>
                    <td className="px-2 py-2 text-gray-700">{formatMoney(item.unit_price || 0)}</td>
                    <td className="px-2 py-2 font-semibold text-[#000F14]">
                      {formatMoney(item.total_price || 0)}
                    </td>
                    <td className="px-2 py-2 text-gray-700">{item.quantity_received || 0}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={6} className="px-2 py-2 text-right text-sm text-gray-500">
                    Subtotal
                  </td>
                  <td className="px-2 py-2 font-semibold">{formatMoney(order.subtotal || 0)}</td>
                </tr>
                <tr>
                  <td colSpan={6} className="px-2 py-2 text-right text-sm text-gray-500">
                    Shipping
                  </td>
                  <td className="px-2 py-2 font-semibold">{formatMoney(order.shipping_fee || 0)}</td>
                </tr>
                <tr>
                  <td colSpan={6} className="px-2 py-2 text-right text-sm font-semibold text-[#000F14]">
                    Total
                  </td>
                  <td className="px-2 py-2 text-base font-bold text-[#0a8f3c]">
                    {formatMoney(order.total_amount || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#000F14]">Delivery details</h2>
          <InfoCard icon={Truck} label="Wholesaler">
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
          <InfoCard icon={Factory} label="Manufacturer" value={order.manufacturer_name} />
          <InfoCard icon={MapPin} label="Delivery address" value={order.delivery_address} />
          <InfoCard icon={Truck} label="Delivery partner" value={order.delivery_partner} />
          <InfoCard icon={Hash} label="Tracking number" value={order.tracking_number} />
          <InfoCard icon={Calendar} label="Expected delivery" value={formatDate(order.expected_delivery_date)} />
          {order.notes && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notes</p>
              <p className="mt-1">{order.notes}</p>
            </div>
          )}
          {order.cancellation_reason && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                Cancellation reason
              </p>
              <p className="mt-1">{order.cancellation_reason}</p>
            </div>
          )}
        </div>
      </div>

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

    </div>
  )
}
