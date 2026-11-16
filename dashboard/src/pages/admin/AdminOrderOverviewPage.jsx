import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Factory,
  Grid2X2,
  MapPin,
  Package,
  RefreshCw,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'
import ManufacturerRegionMap from '../manufacturer/ManufacturerRegionMap'

const CARD = 'rounded-2xl border border-[#e3e9e4] bg-white shadow-[0_1px_3px_rgba(15,31,23,0.05)]'
const TILE = { green: 'bg-[#dcfce7] text-[#15803d]', blue: 'bg-[#dbeafe] text-[#1d4ed8]', purple: 'bg-[#f3e8ff] text-[#7e22ce]', amber: 'bg-[#fef3c7] text-[#b45309]' }

const FLOWS = [
  { key: 'customer', title: 'Customer orders', subtitle: 'Patients ordering from pharmacies', icon: ShoppingCart, link: '/dashboard/customer-orders-admin', tone: 'green' },
  { key: 'wholesale', title: 'Wholesale orders', subtitle: 'Pharmacies ordering from wholesalers', icon: Store, link: '/dashboard/wholesale-orders-admin', tone: 'blue' },
  { key: 'manufacturer', title: 'Manufacturer orders', subtitle: 'Wholesalers ordering from manufacturers', icon: Factory, link: '/dashboard/manufacturer-orders-admin', tone: 'purple' },
]

function compactNumber(v) { return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v || 0)) }

export default function AdminOrderOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState(null)
  const [flowFilter, setFlowFilter] = useState('all')

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    try {
      const { data } = await api.get('/admin/order-stats')
      setStats(data)
    } catch (e) {
      // toast not imported? use console
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const totals = useMemo(() => {
    const flows = ['customer', 'wholesale', 'manufacturer']
    let count = 0, value = 0
    flows.forEach((k) => { count += Number(stats?.[k]?.total || 0); value += Number(stats?.[k]?.value || 0) })
    return { count, value }
  }, [stats])

  const flowData = useMemo(() => FLOWS.map((f) => ({
    name: f.title.replace(' orders', ''),
    orders: Number(stats?.[f.key]?.total || 0),
    value: Number(stats?.[f.key]?.value || 0),
  })), [stats])

  const statusData = useMemo(() => {
    const flow = flowFilter === 'all' ? 'customer' : flowFilter
    const rows = stats?.[flow]?.by_status || []
    return rows.map((r) => ({ status: r.status, count: r.count, value: r.value }))
  }, [stats, flowFilter])

  const regions = useMemo(() => {
    const rows = stats?.customer?.by_region || []
    return rows.map((r) => ({ region: r.region, units: r.count, growth: 0, value: r.value }))
  }, [stats])

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0FD452] border-t-transparent" /></div>
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#dcfce7] text-[#15803d]">
            <Grid2X2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight text-[#0f1f17]">Order Statistics</h1>
            <p className="text-sm text-[#5b6b62]">Read-only oversight of the order flow across the platform — for investors and oversight.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#f1f4f1] px-3 py-2 text-xs font-semibold text-[#5b6b62]">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg bg-[#0FD452] px-3.5 py-2 text-xs font-semibold text-[#000F14] hover:bg-[#0cb843] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${CARD} p-4`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5b6b62]">Total orders</p>
          <p className="mt-1.5 text-[26px] font-bold text-[#0f1f17]">{compactNumber(totals.count)}</p>
          <p className="mt-0.5 text-xs font-medium text-[#15803d]">{formatMoney(totals.value)} GMV</p>
        </div>
        {FLOWS.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.key} className={`${CARD} p-4`}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#15803d]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5b6b62]">{f.title}</p>
              </div>
              <p className="mt-1.5 text-[26px] font-bold text-[#0f1f17]">{compactNumber(stats?.[f.key]?.total || 0)}</p>
              <p className="mt-0.5 text-xs font-medium text-[#15803d]">{formatMoney(stats?.[f.key]?.value || 0)}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className={CARD}>
          <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
            <BarChart3 className="h-4 w-4 text-[#16c15a]" />
            <h2 className="text-base font-semibold text-[#0f1f17]">Orders by Flow</h2>
          </div>
          <div className="px-5 pb-5 pt-4">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a9491' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a9491' }} axisLine={false} tickLine={false} width={46} />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="orders" name="Orders" fill="#16c15a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={CARD}>
          <div className="flex flex-wrap items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
            <Activity className="h-4 w-4 text-[#16c15a]" />
            <h2 className="text-base font-semibold text-[#0f1f17]">Status Breakdown</h2>
            <select
              value={flowFilter}
              onChange={(e) => setFlowFilter(e.target.value)}
              className="ml-auto rounded-lg border border-[#e3e9e4] bg-white px-3 py-1.5 text-xs font-semibold text-[#5b6b62] outline-none"
            >
              <option value="all">Customer</option>
              <option value="wholesale">Wholesale</option>
              <option value="manufacturer">Manufacturer</option>
            </select>
          </div>
          <div className="px-5 pb-4 pt-2">
            {statusData.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#8a9491]">No status data yet.</p>
            ) : (
              <table className="w-full min-w-[260px] border-collapse text-left text-[13px]">
                <thead>
                  <tr>
                    <th className="pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62]">Status</th>
                    <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62]">Orders</th>
                    <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62]">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {statusData.map((s, i) => (
                    <tr key={i} className="border-t border-[#eef2ee]">
                      <td className="py-2.5 text-[#5b6b62] capitalize">{String(s.status).replace(/_/g, ' ')}</td>
                      <td className="py-2.5 text-right font-semibold text-[#0f1f17]">{s.count}</td>
                      <td className="py-2.5 text-right text-[#5b6b62]">{formatMoney(s.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className={CARD}>
        <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
          <MapPin className="h-4 w-4 text-[#16c15a]" />
          <h2 className="text-base font-semibold text-[#0f1f17]">Customer Orders by Region</h2>
          <Link to="/dashboard/customer-orders-admin" className="ml-auto text-xs font-medium text-[#15803d] hover:underline">View customer orders</Link>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <ManufacturerRegionMap regions={regions} />
          <div>
            {regions.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8a9491]">No regional order data yet.</p>
            ) : (
              <table className="w-full min-w-[260px] border-collapse text-left text-[13px]">
                <thead>
                  <tr>
                    <th className="pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62]">Region</th>
                    <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62]">Orders</th>
                    <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62]">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t border-[#eef2ee]">
                      <td className="py-2.5 text-[#5b6b62]">{r.region}</td>
                      <td className="py-2.5 text-right font-semibold text-[#0f1f17]">{r.units}</td>
                      <td className="py-2.5 text-right text-[#5b6b62]">{formatMoney(r.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {FLOWS.map((f) => {
          const Icon = f.icon
          return (
            <Link key={f.key} to={f.link} className="flex items-center gap-3 rounded-xl border border-[#e3e9e4] px-4 py-3 text-sm font-semibold text-[#0f1f17] transition-colors hover:border-[#16c15a]/40 hover:bg-[#f8fbf9]">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TILE[f.tone]}`}><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">{f.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#8a9491]" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}