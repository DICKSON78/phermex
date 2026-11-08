import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  LineChart,
  Clock,
  Download,
  FileText,
  Grid2X2,
  MapPin,
  Megaphone,
  Package,
  Pill,
  Plug,
  Sparkles,
  Store,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Spinner, formatMoney, formatNumber, formatPercent } from './ManufacturerUI'
import { defaultRange } from './usePortalData'
import ManufacturerRegionMap from './ManufacturerRegionMap'

const CARD = 'rounded-2xl border border-[#e3e9e4] bg-white shadow-[0_1px_3px_rgba(15,31,23,0.05)]'
const TILE = {
  green: 'bg-[#dcfce7] text-[#15803d]',
  blue: 'bg-[#dbeafe] text-[#1d4ed8]',
  purple: 'bg-[#f3e8ff] text-[#7e22ce]',
  amber: 'bg-[#fef3c7] text-[#b45309]',
  red: 'bg-[#fee2e2] text-[#b91c1c]',
}

function compactNumber(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0))
}

function shortMonth(label) {
  return String(label || '').split(' ')[0]
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function ManufacturerDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [range] = useState(defaultRange)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({})
  const [perfTab, setPerfTab] = useState('fast')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const requests = [
      api.get('/manufacturer-portal/overview'),
      api.get('/manufacturer-portal/analytics/product-performance', { params: range }),
      api.get('/manufacturer-portal/intelligence/market-demand', { params: range }),
      api.get('/manufacturer-portal/intelligence/demand-forecast', { params: { horizon: 6 } }),
      api.get('/manufacturer-portal/intelligence/geography', { params: range }),
      api.get('/manufacturer-portal/intelligence/penetration', { params: range }),
      api.get('/manufacturer-portal/analytics/supply-chain', { params: range }),
      api.get('/manufacturer-portal/analytics/competitors', { params: range }),
    ]

    try {
      const results = await Promise.allSettled(requests)
      const value = (index) => (results[index].status === 'fulfilled' ? results[index].value.data : null)

      if (results[0].status === 'rejected') {
        throw results[0].reason
      }

      setData({
        overview: value(0),
        performance: value(1),
        market: value(2),
        forecast: value(3),
        geography: value(4),
        penetration: value(5),
        supply: value(6),
        competitors: value(7),
      })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Could not load the manufacturer dashboard. Check that the API is running and try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    load()
  }, [load])

  const { overview, performance, market, forecast, geography, penetration, supply, competitors } = data

  const stats = overview?.stats || {}
  const perfSummary = performance?.summary || {}
  const monthly = useMemo(() => performance?.monthly || [], [performance])
  const products = useMemo(() => performance?.products || [], [performance])
  const marketSummary = market?.summary || {}
  const geoRegions = useMemo(() => geography?.regions || market?.by_region || [], [geography, market])
  const penetrationSummary = penetration?.summary || {}
  const supplySummary = supply?.summary || {}
  const competitorSummary = competitors?.summary || {}
  const forecastSummary = forecast?.summary || {}

  const latestMonth = monthly[monthly.length - 1]
  const previousMonth = monthly[monthly.length - 2]
  const monthlyUnits = Number(latestMonth?.units || marketSummary.units_sold || 0)
  const monthlyGrowth = latestMonth && previousMonth
    ? Number(previousMonth.units) > 0
      ? ((Number(latestMonth.units) - Number(previousMonth.units)) / Number(previousMonth.units)) * 100
      : Number(latestMonth.units) > 0
        ? 100
        : 0
    : Number(marketSummary.growth || perfSummary.growth || 0)

  const topProducts = useMemo(() => [...products].sort((a, b) => b.units - a.units), [products])
  const topProduct = topProducts[0]
  const fastestRegion = useMemo(() => {
    if (!geoRegions.length) return null
    return [...geoRegions].sort((a, b) => Number(b.growth || 0) - Number(a.growth || 0))[0]
  }, [geoRegions])

  const trendData = useMemo(() => {
    const history = monthly.map((month) => ({
      label: shortMonth(month.month),
      units: Number(month.units || 0),
      forecast: null,
    }))
    const projections = (forecast?.forecast || []).map((month) => ({
      label: shortMonth(month.month),
      units: null,
      forecast: Number(month.forecast || 0),
    }))

    if (history.length > 0) {
      history[history.length - 1].forecast = history[history.length - 1].units
    }

    return [...history, ...projections]
  }, [monthly, forecast])

  const performanceRows = useMemo(() => {
    const rows = [...products]
    if (perfTab === 'slow') return rows.sort((a, b) => a.units - b.units).slice(0, 5)
    if (perfTab === 'declining') {
      return rows
        .filter((product) => Number(product.growth || 0) < 0)
        .sort((a, b) => Number(a.growth) - Number(b.growth))
        .slice(0, 5)
    }
    return rows.sort((a, b) => b.units - a.units).slice(0, 5)
  }, [products, perfTab])

  const stockOutRisks = useMemo(() => {
    const grouped = new Map()
    ;(supply?.risk_items || [])
      .filter((item) => item.risk === 'low_stock')
      .forEach((item) => {
        const entry = grouped.get(item.name) || { name: item.name, pharmacies: 0, quantity: 0 }
        entry.pharmacies += 1
        entry.quantity += Number(item.quantity || 0)
        grouped.set(item.name, entry)
      })
    return [...grouped.values()].sort((a, b) => b.pharmacies - a.pharmacies).slice(0, 4)
  }, [supply])

  const expiryRisks = useMemo(() => {
    const grouped = new Map()
    ;(supply?.risk_items || [])
      .filter((item) => item.risk === 'expiring' || item.risk === 'expired')
      .forEach((item) => {
        const entry = grouped.get(item.name) || {
          name: item.name,
          days: item.days_to_expiry,
          quantity: 0,
        }
        entry.days = item.days_to_expiry != null ? Math.min(entry.days ?? 9999, item.days_to_expiry) : entry.days
        entry.quantity += Number(item.quantity || 0)
        grouped.set(item.name, entry)
      })
    return [...grouped.values()].sort((a, b) => Number(a.days) - Number(b.days)).slice(0, 4)
  }, [supply])

  const regionalForecast = useMemo(
    () =>
      [...geoRegions]
        .sort((a, b) => Number(b.units) - Number(a.units))
        .slice(0, 5)
        .map((region) => {
          const growth = Number(region.growth || 0)
          const projected = Math.round(Number(region.units || 0) * (1 + Math.max(-50, growth) / 100))
          return { ...region, projected }
        }),
    [geoRegions]
  )

  const insights = useMemo(() => {
    const list = []
    const topForecast = forecast?.products?.find(
      (product) => String(product.name).toLowerCase() === String(topProduct?.name || '').toLowerCase()
    ) || forecast?.products?.[0]

    if (topForecast) {
      list.push({
        tone: Number(topForecast.trend === 'down') ? 'red' : 'green',
        icon: topForecast.trend === 'down' ? TrendingDown : TrendingUp,
        text: `${topForecast.name} is projected at ${formatNumber(topForecast.next_month)} units next month, with a ${topForecast.confidence}% model confidence.`,
      })
    }
    if (fastestRegion) {
      list.push({
        tone: 'green',
        icon: TrendingUp,
        text: `${fastestRegion.region} is the fastest-moving region, up ${formatPercent(fastestRegion.growth)} versus the previous period.`,
      })
    }
    if (Number(supplySummary.low_stock || 0) > 0) {
      list.push({
        tone: 'red',
        icon: AlertTriangle,
        text: `${supplySummary.low_stock} products are below reorder level across ${supplySummary.pharmacies || 0} pharmacies. Prioritise replenishment.`,
      })
    }
    if (Number(competitorSummary.our_share || 0) > 0) {
      list.push({
        tone: 'amber',
        icon: Sparkles,
        text: `You hold ${formatPercent(competitorSummary.our_share)} of category revenue and rank #${competitorSummary.our_rank || '—'} of ${competitorSummary.total_manufacturers || 0} manufacturers.`,
      })
    }
    if (Number(forecastSummary.expected_growth || 0) !== 0) {
      list.push({
        tone: 'green',
        icon: Activity,
        text: `Overall demand is expected to ${Number(forecastSummary.expected_growth) >= 0 ? 'grow' : 'soften'} by ${formatPercent(forecastSummary.expected_growth)} next month across your portfolio.`,
      })
    }
    return list.slice(0, 4)
  }, [forecast, topProduct, fastestRegion, supplySummary, competitorSummary, forecastSummary])

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className={CARD}>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold text-[#0f1f17]">Dashboard unavailable</p>
          <p className="mt-1 max-w-md text-sm text-[#5b6b62]">{error}</p>
          <button
            onClick={load}
            className="mt-4 rounded-lg bg-[#0FD452] px-4 py-2 text-sm font-semibold text-[#000F14] hover:bg-[#0cb843]"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const manufacturerName = overview?.manufacturer?.manufacturer_name || user?.manufacturer_name || user?.name || 'Manufacturer'
  const firstName = String(manufacturerName).split(' ')[0]
  const kpis = [
    {
      label: 'Total Products Tracked',
      value: formatNumber(stats.total_products),
      hint: `${stats.active_products ?? 0} active in catalogue`,
      icon: Boxes,
      tone: 'green',
    },
    {
      label: 'Pharmacies Reached',
      value: formatNumber(penetrationSummary.penetrated),
      hint: `${penetrationSummary.penetration_rate ?? 0}% of active pharmacies`,
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Monthly Demand (Units)',
      value: compactNumber(monthlyUnits),
      hint: `${formatPercent(monthlyGrowth)} vs last month`,
      icon: LineChart,
      tone: 'purple',
    },
    {
      label: 'Demand Growth',
      value: formatPercent(marketSummary.growth ?? monthlyGrowth),
      hint: 'Current versus previous period',
      icon: TrendingUp,
      tone: 'green',
    },
    {
      label: 'Top Product',
      value: topProduct?.name || '—',
      compact: true,
      hint: 'By demand volume',
      icon: Sparkles,
      tone: 'amber',
    },
    {
      label: 'Fastest Growing Region',
      value: fastestRegion?.region || '—',
      compact: true,
      hint: fastestRegion ? `${formatPercent(fastestRegion.growth)} demand growth` : 'No regional data yet',
      icon: MapPin,
      tone: 'blue',
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#dcfce7] text-[#15803d]">
            <Grid2X2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight text-[#0f1f17]">
              {greeting()}, {firstName}
            </h1>
            <p className="text-sm text-[#5b6b62]">
              Manufacturer view — here is your market performance and intelligence at a glance.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#f1f4f1] px-3 py-2 text-xs font-semibold text-[#5b6b62]">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigate('/dashboard/manufacturer/drugs/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0FD452] px-3.5 py-2 text-xs font-semibold text-[#000F14] transition-colors hover:bg-[#0cb843]"
          >
            <Pill className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`${CARD} flex items-start justify-between gap-2 p-4`}>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5b6b62]">{kpi.label}</p>
              <p className={`mt-1.5 font-bold text-[#0f1f17] ${kpi.compact ? 'text-base leading-snug' : 'text-[26px] leading-tight'}`}>
                {kpi.value}
              </p>
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
          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <Zap className="h-4 w-4 text-[#16c15a]" />
              <h2 className="text-base font-semibold text-[#0f1f17]">Quick Actions</h2>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction icon={Boxes} tone="green" label="View Product Catalog" to="/dashboard/manufacturer/drugs" />
              <QuickAction icon={TrendingUp} tone="blue" label="Check Demand Forecast" to="/dashboard/manufacturer/intelligence/forecast" />
              <QuickAction icon={MapPin} tone="purple" label="Explore Geographic Insights" to="/dashboard/manufacturer/intelligence/geography" />
              <QuickAction icon={FileText} tone="amber" label="Generate Report" to="/dashboard/manufacturer/analytics/reports" />
            </div>
          </div>

          <div className={CARD}>
            <div className="flex flex-wrap items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <LineChart className="h-4 w-4 text-[#16c15a]" />
              <h2 className="text-base font-semibold text-[#0f1f17]">Demand Trend — Last 6 Months</h2>
              <span className="ml-auto text-xs font-medium text-[#15803d]">All products</span>
            </div>
            <div className="px-5 pb-5 pt-4">
              <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-[#5b6b62]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#16c15a]" /> Total demand
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-t-2 border-dashed border-[#16c15a]" /> Forecast
                </span>
              </div>
              {trendData.length > 0 ? (
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="manufacturer-demand-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16c15a" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#16c15a" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a9491' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#8a9491' }}
                        axisLine={false}
                        tickLine={false}
                        width={46}
                        tickFormatter={(value) => compactNumber(value)}
                      />
                      <RechartsTooltip
                        formatter={(value, name) => [formatNumber(value), name === 'forecast' ? 'Forecast' : 'Units']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="units"
                        name="units"
                        stroke="#16c15a"
                        strokeWidth={2.5}
                        fill="url(#manufacturer-demand-fill)"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        name="forecast"
                        stroke="#16c15a"
                        strokeWidth={2.5}
                        strokeDasharray="6 5"
                        dot={false}
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-[#8a9491]">Demand will appear once pharmacies order your products.</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className={CARD}>
              <div className="flex items-center gap-2 border-b border-[#eef2ee] px-5 py-4">
                <h2 className="text-base font-semibold text-[#0f1f17]">Top 5 Products by Demand</h2>
                <Link to="/dashboard/manufacturer/analytics/performance" className="ml-auto text-xs font-medium text-[#15803d] hover:underline">
                  View all
                </Link>
              </div>
              <div className="px-5 pb-4 pt-2">
                <SimpleTable
                  columns={['Product', 'Monthly Demand', 'Growth']}
                  rows={topProducts.slice(0, 5).map((product, index) => [
                    <span key="name" className="text-[#0f1f17]">
                      <span className="mr-1 text-[#8a9491]">{index + 1}.</span>
                      {product.name}
                    </span>,
                    formatNumber(product.units),
                    <GrowthCell key="growth" value={product.growth} />,
                  ])}
                  empty="No product demand in this period yet."
                />
              </div>
            </div>

            <div className={CARD}>
              <div className="flex items-center gap-2 border-b border-[#eef2ee] px-5 py-4">
                <h2 className="text-base font-semibold text-[#0f1f17]">Product Performance</h2>
                <Link to="/dashboard/manufacturer/analytics/performance" className="ml-auto text-xs font-medium text-[#15803d] hover:underline">
                  View all
                </Link>
              </div>
              <div className="px-5 pb-4 pt-3">
                <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  {[
                    ['fast', 'Fast-Moving'],
                    ['slow', 'Slow-Moving'],
                    ['declining', 'Declining'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setPerfTab(key)}
                      className={`rounded-md px-2.5 py-1 transition-colors ${
                        perfTab === key ? 'bg-[#dcfce7] text-[#15803d]' : 'text-[#5b6b62] hover:bg-[#f1f4f1]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <SimpleTable
                  columns={['Product', 'Monthly Units', 'Trend']}
                  rows={performanceRows.map((product, index) => [
                    <span key="name" className="text-[#0f1f17]">
                      <span className="mr-1 text-[#8a9491]">{index + 1}.</span>
                      {product.name}
                    </span>,
                    formatNumber(product.units),
                    <GrowthCell key="trend" value={product.growth} iconOnly />,
                  ])}
                  empty={perfTab === 'declining' ? 'No declining products — good news.' : 'No product performance data yet.'}
                />
              </div>
            </div>
          </div>

          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <MapPin className="h-4 w-4 text-[#16c15a]" />
              <h2 className="text-base font-semibold text-[#0f1f17]">Geographic Demand</h2>
              <Link to="/dashboard/manufacturer/intelligence/geography" className="ml-auto text-xs font-medium text-[#15803d] hover:underline">
                View full map
              </Link>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <ManufacturerRegionMap regions={geoRegions} />
              <div>
                <SimpleTable
                  columns={['Region', 'Units', 'Growth']}
                  rows={[...geoRegions]
                    .sort((a, b) => Number(b.units) - Number(a.units))
                    .slice(0, 6)
                    .map((region) => [
                      region.region,
                      formatNumber(region.units),
                      <GrowthCell key="growth" value={region.growth} />,
                    ])}
                  empty="No regional demand yet. Orders with a pharmacy region will appear here."
                />
              </div>
            </div>
          </div>

          <div className={CARD}>
            <div className="flex items-center gap-2 border-b border-[#eef2ee] px-5 py-4">
              <h2 className="text-base font-semibold text-[#0f1f17]">Regional Outlook (Next 30 Days)</h2>
              <Link to="/dashboard/manufacturer/intelligence/forecast" className="ml-auto text-xs font-medium text-[#15803d] hover:underline">
                View details
              </Link>
            </div>
            <div className="px-5 pb-4 pt-2">
              <SimpleTable
                columns={['Region', 'Total Demand', 'Projected', 'Growth']}
                rows={regionalForecast.map((region) => [
                  region.region,
                  formatNumber(region.units),
                  formatNumber(region.projected),
                  <GrowthCell key="growth" value={region.growth} />,
                ])}
                empty="Regional projections will appear once orders are recorded."
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dcfce7] text-[#15803d]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-[#0f1f17]">AI Market Insights</h2>
              <Link to="/dashboard/manufacturer/intelligence/product" className="ml-auto text-xs font-medium text-[#15803d] hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-[#eef2ee] px-5 py-1">
              {insights.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#8a9491]">Insights will appear as sales data builds up.</p>
              ) : (
                insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 py-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TILE[insight.tone]}`}>
                      <insight.icon className="h-4 w-4" />
                    </span>
                    <p className="text-[13px] leading-snug text-[#3a4a41]">{insight.text}</p>
                  </div>
                ))
              )}
              <div className="flex items-center gap-2 rounded-lg bg-[#f1f4f1] px-3 py-2.5 text-xs text-[#5b6b62]">
                <Sparkles className="h-4 w-4 shrink-0" /> Ask Helix anything about your market…
              </div>
            </div>
          </div>

          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fee2e2] text-[#b91c1c]">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-[#0f1f17]">Stock-Out Risk Alerts</h2>
              <span className="ml-auto rounded-md bg-[#fee2e2] px-2 py-0.5 text-[11px] font-semibold text-[#b91c1c]">
                {supplySummary.low_stock ?? 0}
              </span>
            </div>
            <div className="divide-y divide-[#eef2ee] px-5 py-1">
              {stockOutRisks.length === 0 ? (
                <p className="py-5 text-center text-sm text-[#8a9491]">No low-stock risks recorded.</p>
              ) : (
                stockOutRisks.map((risk) => (
                  <div key={risk.name} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0f1f17]">{risk.name}</p>
                      <p className="text-xs text-[#8a9491]">{risk.pharmacies} pharmacies at risk</p>
                    </div>
                    <span className="rounded-md bg-[#fee2e2] px-2 py-0.5 text-[11px] font-semibold text-[#b91c1c]">High</span>
                  </div>
                ))
              )}
              <Link to="/dashboard/manufacturer/analytics/supply-chain" className="block py-3 text-xs font-semibold text-[#15803d] hover:underline">
                View all alerts →
              </Link>
            </div>
          </div>

          <div className={CARD}>
            <div className="flex items-center gap-2.5 border-b border-[#eef2ee] px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fef3c7] text-[#b45309]">
                <Clock className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-[#0f1f17]">Expiry Alerts</h2>
              <span className="ml-auto rounded-md bg-[#fef3c7] px-2 py-0.5 text-[11px] font-semibold text-[#b45309]">
                {supplySummary.expiring_soon ?? 0}
              </span>
            </div>
            <div className="divide-y divide-[#eef2ee] px-5 py-1">
              {expiryRisks.length === 0 ? (
                <p className="py-5 text-center text-sm text-[#8a9491]">No products nearing expiry.</p>
              ) : (
                expiryRisks.map((risk) => (
                  <div key={risk.name} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0f1f17]">{risk.name}</p>
                      <p className="text-xs text-[#8a9491]">
                        {risk.days != null && Number(risk.days) >= 0
                          ? `Expiring in ${risk.days} days`
                          : 'Expired — quarantine stock'}
                      </p>
                    </div>
                    <span className="text-xs text-[#5b6b62]">{formatNumber(risk.quantity)} units</span>
                  </div>
                ))
              )}
              <Link to="/dashboard/manufacturer/analytics/supply-chain" className="block py-3 text-xs font-semibold text-[#15803d] hover:underline">
                View all expiry alerts →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#0b2a1a] to-[#14532d] p-5 text-white">
            <p className="text-lg font-bold">HELIX</p>
            <p className="mt-1.5 text-base">Data intelligence for a healthier tomorrow.</p>
            <Link
              to="/dashboard/manufacturer/intelligence/product"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#16c15a] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12a94e]"
            >
              Discover more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, tone, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-[#e3e9e4] px-3.5 py-3 text-[13px] font-semibold text-[#0f1f17] transition-colors hover:border-[#16c15a]/40 hover:bg-[#f8fbf9]"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TILE[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#8a9491]" />
    </Link>
  )
}

function GrowthCell({ value, iconOnly = false }) {
  const number = Number(value || 0)
  const Icon = number < 0 ? TrendingDown : TrendingUp
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${number < 0 ? 'text-[#b45309]' : 'text-[#15803d]'}`}>
      <Icon className="h-3.5 w-3.5" />
      {!iconOnly && formatPercent(number)}
    </span>
  )
}

function SimpleTable({ columns, rows, empty = 'No data yet.' }) {
  if (!rows || rows.length === 0) {
    return <p className="py-8 text-center text-sm text-[#8a9491]">{empty}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[340px] border-collapse text-left text-[13px]">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                className={`pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b6b62] ${
                  index === columns.length - 1 ? 'text-right' : ''
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[#eef2ee]">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`py-2.5 align-middle text-[#5b6b62] ${
                    cellIndex === row.length - 1 ? 'text-right' : ''
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
