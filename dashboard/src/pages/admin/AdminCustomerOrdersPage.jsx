import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
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
              Read-only table of customer orders flowing through pharmacies. Order handling stays with each pharmacy.
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
        <StatCard icon={Store} label="Order value" value={formatMoney(revenue)} hint="Total order GMV, not platform income" />
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
            <div key={item} className="h-16 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <ShoppingCart className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">
            {search || status ? 'No orders match this filter' : 'No customer orders yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {search || status ? 'Try a different search or status tab.' : 'Customer orders will appear here as soon as they are placed.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pharmacy</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Placed</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const customer = order.customer?.full_name || order.user?.name || 'Customer'
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-[#000F14]">{order.order_code}</p>
                          <p className="text-xs text-gray-400">{order.order_type || 'online'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{textValue(customer)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            {textValue(order.pharmacy, 'Pharmacy')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusStyle(order.order_status)}`}>
                            {orderStatusLabel('customer', order.order_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.payment_status || 'unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-[#000F14]">{formatMoney(order.total || 0)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/customer-orders-admin/${order.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#0FD452] hover:text-[#0FD452]"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

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
        </>
      )}
    </div>
  )
}