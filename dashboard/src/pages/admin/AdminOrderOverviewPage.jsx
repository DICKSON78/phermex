import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Factory,
  RefreshCw,
  ShoppingCart,
  Store,
  Truck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'

const FLOWS = [
  {
    key: 'customer',
    title: 'Customer orders',
    subtitle: 'Patients ordering from pharmacies',
    icon: ShoppingCart,
    link: '/dashboard/customer-orders-admin',
    tone: 'bg-[#0FD452]/10 text-[#0FD452]',
  },
  {
    key: 'wholesale',
    title: 'Wholesale orders',
    subtitle: 'Pharmacies ordering from wholesalers',
    icon: Store,
    link: '/dashboard/wholesale-orders-admin',
    tone: 'bg-blue-100 text-blue-600',
  },
  {
    key: 'manufacturer',
    title: 'Manufacturer orders',
    subtitle: 'Wholesalers ordering from manufacturers',
    icon: Factory,
    link: '/dashboard/manufacturer-orders-admin',
    tone: 'bg-purple-100 text-purple-600',
  },
]

function StatCard({ label, value, hint, icon: Icon, tone = 'bg-[#0FD452]/10 text-[#0FD452]' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
      </div>
    </div>
  )
}

function statusLabel(status) {
  return String(status || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function AdminOrderOverviewPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    try {
      const { data } = await api.get('/admin/order-stats')
      setStats(data)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load order statistics.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totals = FLOWS.reduce(
    (acc, flow) => {
      const flowStats = stats?.[flow.key] || {}
      acc.count += Number(flowStats.total || 0)
      acc.value += Number(flowStats.value || 0)
      return acc
    },
    { count: 0, value: 0 },
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Activity className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order statistics</h1>
            <p className="text-sm text-gray-500">
              Read-only oversight of the order flow between customers, pharmacies, wholesalers and manufacturers.
            </p>
          </div>
        </div>
        <button onClick={() => load(true)} className="btn-secondary" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Orders in system" value={totals.count} icon={BarChart3} />
        <StatCard
          label="Order value"
          value={formatMoney(totals.value)}
          hint="GMV across all flows, not platform income"
          icon={Truck}
          tone="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Flows monitored"
          value={FLOWS.length}
          hint="Customer, wholesale and manufacturer"
          icon={Activity}
          tone="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="rounded-xl border border-[#0FD452]/30 bg-[#0FD452]/5 px-4 py-3 text-sm text-[#0a8f3c]">
        Admin does not advance, cancel or mark orders paid here. Pharmacies, wholesalers and manufacturers
        operate their own order workflows; this page only reports the movement.
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {FLOWS.map((flow) => {
            const flowStats = stats?.[flow.key] || {}
            const byStatus = flowStats.by_status || []
            const Icon = flow.icon
            return (
              <div key={flow.key} className="flex flex-col rounded-xl bg-white shadow-sm">
                <div className="flex items-start gap-3 border-b border-gray-100 p-5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${flow.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{flow.title}</h2>
                    <p className="text-xs text-gray-500">{flow.subtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-5">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="text-xl font-bold text-gray-900">{flowStats.total || 0}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Value</p>
                    <p className="text-lg font-bold text-gray-900">{formatMoney(flowStats.value || 0)}</p>
                  </div>
                </div>

                <div className="flex-1 px-5 pb-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">By status</p>
                  {byStatus.length === 0 ? (
                    <p className="text-sm text-gray-400">No orders recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {byStatus.map((row) => (
                        <div key={row.status} className="flex items-center justify-between gap-3 text-sm">
                          <span className="capitalize text-gray-600">{statusLabel(row.status)}</span>
                          <span className="font-semibold text-gray-900">
                            {row.count}
                            <span className="ml-2 text-xs font-normal text-gray-400">
                              {formatMoney(row.value || 0)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 p-4">
                  <Link
                    to={flow.link}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a8f3c] hover:underline"
                  >
                    View order list <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
