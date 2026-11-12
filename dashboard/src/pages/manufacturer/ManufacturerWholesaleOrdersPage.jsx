import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Search,
  Truck,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import OrderFlowProgress, {
  PAYMENT_STATUS_STYLES,
  orderStatusLabel,
  orderStatusStyle,
} from '../../components/OrderFlowProgress'
import { PageHeader, Spinner, EmptyState, StatCard, formatMoney, formatDate } from './ManufacturerUI'

const NEXT = { pending: 'confirmed', confirmed: 'packed', packed: 'dispatched', dispatched: 'delivered' }

const NEXT_LABELS = {
  confirmed: 'Confirm',
  packed: 'Mark packed',
  dispatched: 'Dispatch',
  delivered: 'Mark delivered',
}

const TABS = [
  { value: 'all', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'dispatched', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function ManufacturerWholesaleOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/manufacturer-orders', { params: { status, search: search || undefined } })
      setOrders(data.data || [])
      setStats(data.stats || {})
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }, [status, search])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const advance = async (order) => {
    const target = NEXT[order.status]
    if (!target) return
    setBusy(order.id)
    try {
      await api.post(`/manufacturer-orders/${order.id}/status`, { status: target })
      toast.success(`Order ${order.order_id} moved to ${orderStatusLabel('manufacturer', target).toLowerCase()}.`)
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update order.')
    } finally {
      setBusy(null)
    }
  }

  const cancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.order_id}? The stock will be returned to your catalogue.`)) return
    setBusy(order.id)
    try {
      await api.post(`/manufacturer-orders/${order.id}/cancel`, { reason: 'Cancelled by manufacturer' })
      toast.success('Order cancelled.')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not cancel.')
    } finally {
      setBusy(null)
    }
  }

  const totalValue = useMemo(
    () => orders.reduce((sum, order) => (order.status === 'cancelled' ? sum : sum + Number(order.total_amount || 0)), 0),
    [orders],
  )

  return (
    <div>
      <PageHeader
        title="Wholesale orders"
        subtitle="Incoming purchase orders from wholesalers, tracked from request to delivery."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Total orders" value={stats.total ?? orders.length} />
        <StatCard
          icon={Clock}
          label="Pending requests"
          value={orders.filter((o) => o.status === 'pending').length}
          tone="text-amber-600"
        />
        <StatCard
          icon={Truck}
          label="In progress"
          value={orders.filter((o) => ['confirmed', 'packed', 'dispatched'].includes(o.status)).length}
          tone="text-blue-700"
        />
        <StatCard
          icon={CheckCircle2}
          label="Delivered"
          value={stats.delivered ?? orders.filter((o) => o.status === 'delivered').length}
          tone="text-[#0F9D58]"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              status === tab.value
                ? 'bg-[#0FD452] text-[#000F14]'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order, wholesaler or tracking…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders"
          message={
            search || status !== 'all'
              ? 'No orders match this filter.'
              : 'Wholesaler purchase orders will appear here as soon as they are placed.'
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const next = NEXT[order.status]
            const cancelled = order.status === 'cancelled'
            return (
              <div
                key={order.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/manufacturer/wholesale-orders/${order.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/dashboard/manufacturer/wholesale-orders/${order.id}`)
                  }
                }}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-[#000F14]">{order.order_id}</h2>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusStyle(order.status)}`}
                      >
                        {orderStatusLabel('manufacturer', order.status)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.payment_status || 'unpaid'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {order.wholesaler_name || 'Wholesaler'} · placed {formatDate(order.created_at)} · expected{' '}
                      {formatDate(order.expected_delivery_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#000F14]">{formatMoney(order.total_amount)}</p>
                    <p className="text-xs text-gray-400">{order.tracking_number || 'No tracking yet'}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50/80 px-3 py-3">
                  <OrderFlowProgress
                    type="manufacturer"
                    status={order.status}
                    compact
                    timestamps={{
                      pending: order.created_at,
                      confirmed: order.confirmed_at,
                      packed: order.packed_at,
                      dispatched: order.dispatched_at,
                      delivered: order.delivered_at,
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-gray-400">
                    {cancelled
                      ? `Cancelled${order.cancellation_reason ? ` · ${order.cancellation_reason}` : ''}`
                      : next
                        ? `Next step: ${orderStatusLabel('manufacturer', next)}`
                        : 'Order complete'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/manufacturer/wholesale-orders/${order.id}`)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      View details
                    </button>
                    {next && (
                      <button
                        type="button"
                        disabled={busy === order.id}
                        onClick={() => advance(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0FD452] px-3 py-1.5 text-xs font-semibold text-[#000F14] disabled:opacity-60"
                      >
                        {busy === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          NEXT_LABELS[next]
                        )}
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button
                        type="button"
                        disabled={busy === order.id}
                        onClick={() => cancel(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <p className="pt-1 text-right text-xs text-gray-400">
            Showing {orders.length} order{orders.length === 1 ? '' : 's'} · value on this page {formatMoney(totalValue)}
          </p>
        </div>
      )}
    </div>
  )
}
