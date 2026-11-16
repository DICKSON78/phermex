import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  DollarSign,
  Factory,
  Grid2X2,
  LineChart,
  MapPin,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'
import ManufacturerRegionMap from '../manufacturer/ManufacturerRegionMap'

const CARD = 'rounded-2xl border border-[#e3e9e4] bg-white shadow-[0_1px_3px_rgba(15,31,23,0.05)]'
const TILE = {
  green: 'bg-[#dcfce7] text-[#15803d]',
  blue: 'bg-[#dbeafe] text-[#1d4ed8]',
  purple: 'bg-[#f3e8ff] text-[#7e22ce]',
  amber: 'bg-[#fef3c7] text-[#b45309]',
  red: 'bg-[#fee2e2] text-[#b91c1c]',
}

function compactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

function shortMonth(label) {
  return String(label || '').split(' ')[0]
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const requests = [
      api.get('/admin/dashboard'),
      api.get('/admin/order-stats'),
      api.get('/admin/manufacturers'),
      api.get('/admin/customers'),
    ]
    try {
      const results = await Promise.allSettled(requests)
      const value = (i) => (results[i].status === 'fulfilled' ? results[i].value.data : null)
      if (results[0].status === 'rejected') throw results[0].reason
      setData({
        dashboard: value(0),
        orderStats: value(1),
        manufacturers: value(2),
        customers: value(3),
      })
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load the HQ dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const d = data.dashboard || {}
  const os = data.orderStats || {}
  const manufacturers = data.manufacturers?.data || []
  const customers = data.customers?.data || []

  const revenueChart = useMemo(() => {
    const rows = Array.isArray(d.revenue_chart) ? d.revenue_chart : []
    return rows.map((r) => ({
      label: shortMonth(r.date),
      revenue: Number(r.revenue || 0),
    }))
  }, [d])

  const regional = useMemo(() => {
    const rows = Array.isArray(d.regional_distribution) ? d.regional_distribution : []
    return rows.map((r) => ({ region: r.region, units: r.count, growth: 0 }))
  }, [d])

  const regionDonut = useMemo(() => {
    const rows = Array.isArray(data.orderStats?.customer?.by_region) ? data.orderStats.customer.by_region : []
    const colors = ['#16a34a', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#be185d', '#4b5563']
    return rows.slice(0, 8).map((r, i) => ({
      name: r.region,
      value: Number(r.value || r.count || 0),
      color: colors[i % colors.length],
    }))
  }, [data.orderStats])

  const totals = useMemo(() => {
    const flows = ['customer', 'wholesale', 'manufacturer']
    let count = 0, value = 0
    flows.forEach((k) => {
      count += Number(os?.[k]?.total || 0)
      value += Number(os?.[k]?.value || 0)
    })
    return { count, value }
  }, [os])

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0FD452] border-t-transparent" /></div>
  }
  if (error) {
    return <div className={CARD}><div className="flex flex-col items-center justify-center px-6 py-16 text-center"><p className="text-sm font-semibold text-[#0f1f17]">Dashboard unavailable</p><p className="mt-1 max-w-md text-sm text-[#5b6b62]">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-[#0FD452] px-4 py-2 text-sm font-semibold text-[#000F14] hover:bg-[#0cb843]">Try again</button></div></div>
  }

  const kpis = [
    { label: 'Total Pharmacies', value: compactNumber(d.total_pharmacies), hint: `${d.new_registrations_this_month ?? 0} new this month`, icon: Building2, tone: 'green' },
    { label: 'Total Users', value: compactNumber(d.total_users), hint: 'All roles', icon: Users, tone: 'blue' },
    { label: 'Active Subscriptions', value: compactNumber(d.active_subscriptions), hint: 'Paying pharmacies', icon: CreditCard, tone: 'purple' },
    { label: 'Platform Revenue', value: formatMoney(d.total_revenue), hint: `${formatMoney(d.monthly_revenue)} this month`, icon: DollarSign, tone: 'green' },
    { label: 'Order Volume (GMV)', value: formatMoney(d.order_volume), hint: `${d.order_count ?? 0} orders`, icon: ShoppingCart, tone: 'amber' },
    { label: 'Monthly Order Volume', value: formatMoney(d.monthly_order_volume), hint: 'This month', icon: TrendingUp, tone: 'blue' },
    { label: 'Manufacturers', value: compactNumber((data.manufacturers?.stats?.total) ?? manufacturers.length), hint: `${data.manufacturers?.stats?.active ?? 0} active`, icon: Factory, tone: 'purple' },
    { label: 'Customers', value: compactNumber((data.customers?.stats?.total) ?? customers.length), hint: 'Registered', icon: Users, tone: 'green' },
  ]

  const recentPharmacies = Array.isArray(d.recent_pharmacies) ? d.recent_pharmacies : []

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#dcfce7] text-[#15803d]">
            <Grid2X2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight text-[#0f1f17]">HQ Dashboard</h1>
            <p className="text-sm text-[#5b6b62]">Platform-wide data and analysis for investors and oversight.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#f1f4f1] px-3 py-2 text-xs font-semibold text-[#5b6b62]">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-[#0FD452] px-3.5 py-2 text-xs font-semibold text-[#000F14] hover:bg-[#0cb843]">
            <Activity className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`${CARD} flex items-start justify-between gap-2 p-4`}>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5b6b62]">{kpi.label}</p>
              <p className="mt-1.5 font-bold text-[#0f1f17] text-[20px] leading-tight">{kpi.value}</p>
              <p className="mt-0.5 text-xs font-medium text-[#15803d]">{kpi.hint}</p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TILE[kpi.tone]}`}>
              <kpi.icon className="h-5 w-5" />
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className={CARD}>
              <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
                <LineChart className="h-4 w-4 text-[#16c15a]" />
                <h2 className="text-base font-semibold text-[#0f1f17]">Platform Revenue — Last 30 Days</h2>
              </div>
              <div className="px-5 pb-5 pt-4">
                {revenueChart.length > 0 ? (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={revenueChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a9491' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#8a9491' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => compactNumber(v)} />
                        <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Area dataKey="revenue" name="Revenue" stroke="#16c15a" strokeWidth={2.5} fill="url(#hq-rev)" />
                        <defs>
                          <linearGradient id="hq-rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16c15a" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#16c15a" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-[#8a9491]">Revenue will appear once subscriptions are recorded.</p>
                )}
              </div>
            </div>

            <div className={CARD}>
              <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
                <MapPin className="h-4 w-4 text-[#16c15a]" />
                <h2 className="text-base font-semibold text-[#0f1f17]">Regional Order & Supply Performance</h2>
              </div>
              <div className="px-5 pb-5 pt-4">
                {regionDonut.length > 0 ? (
                  <>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={regionDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                            {regionDonut.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {regionDonut.map((r) => (
                        <li key={r.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-[#5b6b62]">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                            {r.name}
                          </span>
                          <span className="font-semibold text-[#0f1f17]">{compactNumber(r.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="py-12 text-center text-sm text-[#8a9491]">Regional order data will appear once orders are recorded.</p>
                )}
              </div>
            </div>
          </div>

          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <MapPin className="h-4 w-4 text-[#16c15a]" />
              <h2 className="text-base font-semibold text-[#0f1f17]">Pharmacy Distribution by Region</h2>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <ManufacturerRegionMap regions={regional} />
              <div>
                <table className="w-full min-w-[260px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr>
                      <th className="pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62]">Region</th>
                      <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62]">Pharmacies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regional.length === 0 ? (
                      <tr><td colSpan={2} className="py-8 text-center text-sm text-[#8a9491]">No regional data yet.</td></tr>
                    ) : regional.slice(0, 8).map((r, i) => (
                      <tr key={i} className="border-t border-[#eef2ee]">
                        <td className="py-2.5 text-[#5b6b62]">{r.region}</td>
                        <td className="py-2.5 text-right text-[#0f1f17] font-semibold">{r.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <ShoppingCart className="h-4 w-4 text-[#16c15a]" />
              <h2 className="text-base font-semibold text-[#0f1f17]">Order Flow (read-only oversight)</h2>
              <Link to="/dashboard/order-statistics" className="ml-auto text-xs font-medium text-[#15803d] hover:underline">View all</Link>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {['customer', 'wholesale', 'manufacturer'].map((k) => {
                const labels = { customer: 'Customer orders', wholesale: 'Wholesale orders', manufacturer: 'Manufacturer orders' }
                const icons = { customer: ShoppingCart, wholesale: Store, manufacturer: Factory }
                const Icon = icons[k]
                return (
                  <div key={k} className="rounded-xl border border-[#e3e9e4] p-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[#15803d]" />
                      <p className="text-xs font-semibold text-[#5b6b62]">{labels[k]}</p>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[#0f1f17]">{os?.[k]?.total ?? 0}</p>
                    <p className="text-xs text-[#15803d]">{formatMoney(os?.[k]?.value || 0)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <Building2 className="h-4 w-4 text-[#16c15a]" />
              <h2 className="text-base font-semibold text-[#0f1f17]">Recent Pharmacies</h2>
              <Link to="/dashboard/pharmacies" className="ml-auto text-xs font-medium text-[#15803d] hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-[#eef2ee] px-5 py-1">
              {recentPharmacies.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#8a9491]">No pharmacies registered yet.</p>
              ) : recentPharmacies.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0f1f17]">{p.name}</p>
                    <p className="text-xs text-[#8a9491]">{p.owner || '—'} · {p.country || '—'}</p>
                  </div>
                  <span className="text-xs text-[#5b6b62]">{p.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <Activity className="h-4 w-4 text-[#16c15a]" />
              <h2 className="text-base font-semibold text-[#0f1f17]">System Health</h2>
            </div>
            <div className="space-y-3 p-5">
              {[
                ['API response', `${d.system_health?.api_response ?? 99.9}%`],
                ['Uptime', `${d.system_health?.uptime ?? 99.9}%`],
                ['Error rate', `${d.system_health?.error_rate ?? 0}%`],
                ['Active sessions', d.system_health?.active_sessions ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-[#5b6b62]">{label}</span>
                  <span className="font-semibold text-[#0f1f17]">{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}