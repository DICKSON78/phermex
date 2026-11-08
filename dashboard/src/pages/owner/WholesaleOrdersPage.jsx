import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ClipboardList,
  Truck,
  Clock,
  CheckCircle2,
  Package,
  ChevronLeft,
  ChevronRight,
  Store,
  Plus,
  Loader2,
  Calendar,
  CreditCard,
  Banknote,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { formatMoney } from '../../utils/currency'
import { currentBase } from '../../utils/roles'
import { useAuth } from '../../contexts/AuthContext'
import WholesaleOrderProgress, {
  WHOLESALE_STATUS_LABELS,
  WHOLESALE_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
} from '../../components/WholesaleOrderProgress'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'dispatched', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatCard({ icon: Icon, label, value, tone = 'text-[#000F14]' }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <Icon className="h-4 w-4 text-[#0FD452]" />
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

export default function WholesaleOrdersPage({ admin = false }) {
  const base = currentBase()
  const { pharmacyId } = useAuth()

  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ active: 0, delivered: 0, total_value: 0, total: 0 })
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const endpoint = admin ? '/admin/wholesale-orders' : '/wholesale-marketplace/orders'

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(endpoint, {
        params: {
          per_page: 10,
          page,
          status: status === 'all' ? undefined : status,
          search: search.trim() || undefined,
          pharmacy_id: !admin && pharmacyId ? pharmacyId : undefined,
        },
      })
      setOrders(Array.isArray(res.data?.data) ? res.data.data : [])
      setStats(res.data?.stats || { active: 0, delivered: 0, total_value: 0, total: 0 })
      setMeta(res.data?.meta || { current_page: 1, last_page: 1, total: 0 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load wholesale orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, status, admin, pharmacyId])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      load()
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [status])

  const title = admin ? 'Wholesale Fulfilment' : 'My Wholesale Orders'
  const subtitle = admin
    ? 'Confirm, prepare, dispatch and settle orders placed by pharmacies.'
    : 'Follow every order from supplier confirmation through preparation to delivery.'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <ClipboardList className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        {!admin ? (
          <Link to={`${base}/wholesale-marketplace`} className="btn-primary">
            <Plus className="h-4 w-4" />
            Order medicines
          </Link>
        ) : (
          <Link to={`${base}/wholesalers`} className="btn-secondary">
            <Store className="h-4 w-4" />
            Manage suppliers
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Package} label="Total orders" value={stats.total || 0} />
        <StatCard icon={Clock} label="Active" value={stats.active || 0} tone="text-blue-600" />
        <StatCard icon={CheckCircle2} label="Delivered" value={stats.delivered || 0} tone="text-green-600" />
        <StatCard icon={Truck} label="Order value" value={formatMoney(stats.total_value || 0)} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order number, supplier or tracking..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === tab.value ? 'bg-[#0FD452] text-[#000F14]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <ClipboardList className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">No wholesale orders yet</h3>
          <p className="text-sm text-gray-500">
            {admin ? 'Orders from pharmacies will appear here.' : 'Browse the marketplace and place your first order.'}
          </p>
          {!admin && (
            <Link to={`${base}/wholesale-marketplace`} className="btn-primary mt-5">
              <Store className="h-4 w-4" />
              Browse suppliers
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`${base}/wholesale-orders/${order.id}`} className="text-sm font-bold text-[#000F14] hover:text-[#0a8f3c]">
                      {order.order_id}
                    </Link>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${WHOLESALE_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {WHOLESALE_STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.payment_method === 'credit' ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                      {order.payment_method === 'credit' ? 'Credit' : 'Cash'} · {order.payment_status || 'pending'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{order.wholesaler_name || 'Supplier'}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Placed {formatDate(order.ordered_at)}</span>
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {order.items?.length || 0} item lines</span>
                    {order.expected_delivery_date && (
                      <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Expected {formatDate(order.expected_delivery_date)}</span>
                    )}
                    {order.tracking_number && <span className="font-mono">{order.tracking_number}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#000F14]">{formatMoney(order.total_amount)}</p>
                  {order.shipment_method && (
                    <p className="text-[11px] capitalize text-gray-500">{order.shipment_method} shipment</p>
                  )}
                  <Link
                    to={`${base}/wholesale-orders/${order.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0a8f3c] hover:underline"
                  >
                    View & track <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <WholesaleOrderProgress status={order.status} compact />
              </div>
            </div>
          ))}

          {meta.last_page > 1 && (
            <div className="flex items-center justify-between rounded-xl bg-white px-5 py-3 shadow-sm">
              <p className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} orders
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="btn-ghost">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((prev) => Math.min(meta.last_page, prev + 1))} disabled={page === meta.last_page} className="btn-ghost">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
