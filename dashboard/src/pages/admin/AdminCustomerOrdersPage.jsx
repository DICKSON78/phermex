import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  XCircle,
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

const PAGE_SIZE = 15

const TABS = [
  { value: '', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'dispensed', label: 'Dispensed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const NEXT = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
}

const NEXT_LABELS = {
  confirmed: 'Confirm',
  preparing: 'Start preparing',
  ready: 'Mark ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Mark delivered',
}

const ACTIONABLE = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function StatCard({ icon: Icon, label, value, hint, tone = 'text-[#000F14]' }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0FD452]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function timelineFor(order) {
  return {
    pending: order.created_at,
    confirmed: order.confirmed_at,
    preparing: order.preparing_at,
    ready: order.ready_at,
    out_for_delivery: order.out_for_delivery_at,
    delivered: order.delivered_at,
  }
}

export default function AdminCustomerOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [revenue, setRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(null)

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      try {
        const { data } = await api.get('/admin/orders', {
          params: { status: status || undefined, search: search || undefined, page, per_page: PAGE_SIZE },
        })
        setOrders(data.data || [])
        setStatusCounts(data.status_counts || {})
        setRevenue(Number(data.revenue_total || 0))
        setMeta({
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          total: data.total || 0,
          from: data.from,
          to: data.to,
        })
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Could not load customer orders.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [status, search, page],
  )

  useEffect(() => {
    const timer = setTimeout(() => load(), 250)
    return () => clearTimeout(timer)
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [status, search])

  const advance = async (order) => {
    const target = NEXT[order.order_status]
    if (!target) return
    setBusy(order.id)
    try {
      await api.post(`/admin/orders/${order.id}/status`, { order_status: target })
      toast.success(`Order ${order.order_code} moved to ${orderStatusLabel('customer', target).toLowerCase()}.`)
      await load(true)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update order.')
    } finally {
      setBusy(null)
    }
  }

  const cancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.order_code}? Any reserved stock will be returned to the pharmacy.`)) {
      return
    }
    setBusy(order.id)
    try {
      await api.post(`/admin/orders/${order.id}/status`, { order_status: 'cancelled' })
      toast.success('Order cancelled and stock restored.')
      await load(true)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not cancel order.')
    } finally {
      setBusy(null)
    }
  }

  const actionable = useMemo(
    () => ACTIONABLE.reduce((sum, key) => sum + Number(statusCounts[key] || 0), 0),
    [statusCounts],
  )

  const totalCount = useMemo(
    () => Object.values(statusCounts).reduce((sum, value) => sum + Number(value || 0), 0),
    [statusCounts],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <ShoppingCart className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer orders</h1>
            <p className="text-sm text-gray-500">
              Every customer order across the platform, from preparation through delivery.
            </p>
          </div>
        </div>
        <button onClick={() => load(true)} className="btn-secondary" disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Package} label="Total orders" value={totalCount || meta.total} />
        <StatCard
          icon={Clock}
          label="Needs action"
          value={actionable}
          hint="Placed, confirmed, preparing or on the way"
          tone="text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Delivered"
          value={Number(statusCounts.delivered || 0) + Number(statusCounts.dispensed || 0)}
          tone="text-green-600"
        />
        <StatCard icon={Store} label="Paid revenue" value={formatMoney(revenue)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              status === tab.value
                ? 'bg-[#0FD452] text-[#000F14]'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.value && statusCounts[tab.value] ? (
              <span className="ml-1.5 text-xs font-bold text-gray-400">{statusCounts[tab.value]}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order, customer or pharmacy…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <ShoppingCart className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">
            {search || status ? 'No orders match this filter' : 'No customer orders yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {search || status
              ? 'Try a different search or status tab.'
              : 'Customer orders will appear here as soon as they are placed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const next = NEXT[order.order_status]
            const cancelled = order.order_status === 'cancelled'
            const customer = order.customer?.full_name || order.user?.name || 'Customer'
            return (
              <div
                key={order.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/customer-orders-admin/${order.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/dashboard/customer-orders-admin/${order.id}`)
                  }
                }}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-[#000F14]">{order.order_code}</h2>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusStyle(
                          order.order_status,
                        )}`}
                      >
                        {orderStatusLabel('customer', order.order_status)}
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
                      {textValue(customer)} · {textValue(order.pharmacy, 'Pharmacy')} · placed{' '}
                      {formatDate(order.created_at)} · {order.order_type || 'online'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#000F14]">{formatMoney(order.total || 0)}</p>
                    <p className="text-xs text-gray-400">{order.delivery_address || 'No delivery address'}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50/80 px-3 py-3">
                  <OrderFlowProgress
                    type="customer"
                    status={order.order_status}
                    compact
                    timestamps={timelineFor(order)}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-gray-400">
                    {cancelled
                      ? 'Order cancelled'
                      : next
                        ? `Next step: ${orderStatusLabel('customer', next)}`
                        : 'Order complete'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/customer-orders-admin/${order.id}`)}
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
                    {!['delivered', 'dispensed', 'cancelled'].includes(order.order_status) && (
                      <button
                        type="button"
                        disabled={busy === order.id}
                        onClick={() => cancel(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-60"
                      >
                        {busy === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-gray-400">
              {meta.total ? `Showing ${meta.from || 0}–${meta.to || 0} of ${meta.total}` : 'No orders'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="text-xs font-semibold text-gray-500">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(meta.last_page, value + 1))}
                disabled={page >= meta.last_page}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
