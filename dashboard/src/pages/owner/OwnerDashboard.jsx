import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  Package,
  FileText,
  Plus,
  Pill,
  ArrowRight,
  Clock,
  CheckCircle,
  Hash,
  User,
  CreditCard,
  Receipt,
} from 'lucide-react'
import api from '../../services/api'

const DEFAULT_DATA = {
  todaySales: 0,
  monthlyRevenue: 0,
  ordersToday: 0,
  pendingPrescriptions: 0,
  lowStockAlerts: 0,
  expiringDrugs: 0,
  revenueChart: [],
  revenueBreakdown: [],
  topSellingDrugs: [],
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatCurrency(amount) {
  if (amount == null) return 'TZS 0'
  return 'TZS ' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const STATUS_MAP = {
  pending: { label: 'Pending', className: 'badge badge-yellow' },
  confirmed: { label: 'Confirmed', className: 'badge badge-blue' },
  dispensed: { label: 'Dispensed', className: 'badge badge-green' },
  cancelled: { label: 'Cancelled', className: 'badge badge-red' },
}

function OwnerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/owner')
        const apiData = response.data || {}

        const revenueChart = (apiData.revenue_chart || []).map((item) => ({
          day: item.day || (item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''),
          revenue: item.revenue,
        }))

        const revenueBreakdown = (() => {
          const chunkSize = Math.ceil(revenueChart.length / 4) || 1
          const colors = ['#0FD452', '#3b82f6', '#f59e0b', '#8b5cf6']
          return Array.from({ length: 4 }, (_, i) => ({
            name: `Week ${i + 1}`,
            value: revenueChart.slice(i * chunkSize, (i + 1) * chunkSize).reduce((sum, d) => sum + (d.revenue || 0), 0),
            color: colors[i],
          }))
        })()

        const topSellingDrugs = (apiData.top_selling_drugs || []).map((item) => ({
          name: item.name || item.drug?.name || 'Unknown',
          quantitySold: item.quantitySold ?? item.total_sold ?? 0,
          revenue: item.revenue ?? 0,
        }))

        setData({
          todaySales: apiData.today_sales ?? 0,
          monthlyRevenue: apiData.monthly_revenue ?? 0,
          ordersToday: apiData.orders_today ?? 0,
          pendingPrescriptions: apiData.active_prescriptions ?? 0,
          lowStockAlerts: apiData.low_stock_alerts ?? 0,
          expiringDrugs: apiData.expiring_drugs ?? 0,
          revenueChart,
          revenueBreakdown,
          topSellingDrugs,
        })
      } catch (err) {
        console.warn('Failed to fetch dashboard data:', err.message)
        setError(err.message)
        setData(DEFAULT_DATA)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-80 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-white rounded-2xl animate-pulse lg:col-span-2" />
          <div className="h-96 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const greeting = getGreeting()
  const { subscription } = useAuth()

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Using offline data — could not reach server.
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <LayoutDashboardIcon className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Your pharmacy overview and quick actions.</p>
          </div>
        </div>
        {subscription && subscription.subscription_type === 'trial' && subscription.days_remaining > 0 && (
          <div className="flex items-center gap-3 bg-[#0FD452]/10 border border-[#0FD452]/20 rounded-2xl px-5 py-3">
            <div className="w-9 h-9 rounded-xl bg-[#0FD452]/20 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-[#0FD452]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-wider">Free Trial</p>
              <p className="text-sm font-bold text-gray-900">{subscription.days_remaining} day{subscription.days_remaining === 1 ? '' : 's'} remaining</p>
            </div>
            <button onClick={() => window.location.href = '/subscribe'} className="ml-2 px-3.5 py-1.5 bg-[#0FD452] text-[#000F14] rounded-xl text-xs font-bold hover:bg-[#0cb843] transition-all active:scale-95">
              Subscribe
            </button>
          </div>
        )}
        {subscription && subscription.subscription_type === 'subscription' && subscription.days_remaining > 0 && (
          <div className="flex items-center gap-3 bg-[#0FD452]/10 border border-[#0FD452]/20 rounded-2xl px-5 py-3">
            <div className="w-9 h-9 rounded-xl bg-[#0FD452]/20 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5 text-[#0FD452]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-wider">Subscription</p>
              <p className="text-sm font-bold text-gray-900">{subscription.days_remaining} day{subscription.days_remaining === 1 ? '' : 's'} remaining</p>
            </div>
          </div>
        )}
        {subscription && subscription.subscription_type === 'expired' && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Expired</p>
              <p className="text-sm font-bold text-gray-900">Renew to continue</p>
            </div>
            <button onClick={() => window.location.href = '/subscribe'} className="ml-2 px-3.5 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all active:scale-95">
              Renew
            </button>
          </div>
        )}
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(data.todaySales)}
          icon={<DollarIcon />}
          iconColor="text-primary"
          bg="bg-primary-light"
          trend={data.salesTrend >= 0 ? `+${data.salesTrend}%` : `${data.salesTrend}%`}
          up={data.salesTrend >= 0}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(data.monthlyRevenue)}
          icon={<TrendingUpIcon />}
          iconColor="text-emerald-600"
          bg="bg-emerald-100"
          suffix="This month"
        />
        <StatCard
          label="Pending Prescriptions"
          value={data.pendingPrescriptions}
          icon={<FileTextIcon />}
          iconColor="text-yellow-600"
          bg="bg-yellow-100"
          suffix={data.pendingPrescriptions > 5 ? 'Needs attention' : 'Awaiting review'}
        />
        <StatCard
          label="Low Stock Alerts"
          value={data.lowStockAlerts}
          icon={<AlertIcon />}
          iconColor={data.lowStockAlerts > 0 ? 'text-red-600' : 'text-primary'}
          bg={data.lowStockAlerts > 0 ? 'bg-red-100' : 'bg-primary-light'}
          suffix={data.lowStockAlerts > 0 ? 'Restock needed' : 'All stocked up'}
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ZapIcon className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'New Sale', desc: 'Open POS', to: '/owner/pos', bg: 'bg-primary-light', color: 'text-primary', icon: <CartIcon /> },
              { label: 'Add Drug', desc: 'New inventory item', to: '/owner/drugs/new', bg: 'bg-blue-100', color: 'text-blue-600', icon: <PlusIcon /> },
              { label: 'Prescriptions', desc: 'Manage rx', to: '/owner/prescriptions', bg: 'bg-purple-100', color: 'text-purple-600', icon: <RxIcon /> },
              { label: 'Reports', desc: 'View analytics', to: '/owner/reports', bg: 'bg-amber-100', color: 'text-amber-600', icon: <ChartIcon /> },
            ].map((action) => (
              <Link key={action.to} to={action.to} className="quick-action">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 ${action.bg} rounded-xl flex items-center justify-center`}>
                    <span className={action.color}>{action.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{action.label}</h4>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Donut */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-primary" />
            Revenue — Last 30 Days
          </h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={240} height={240}>
                <PieChart>
                  <Pie
                    data={data.revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.revenueBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(data.revenueBreakdown.reduce((s, w) => s + w.value, 0))}</p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {data.revenueBreakdown.map((week) => (
                <div key={week.name} className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: week.color + '15' }}>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: week.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{week.name}</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(week.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="card lg:col-span-2 p-0">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CartIcon className="w-5 h-5 text-blue-600" />
              Recent Orders
            </h3>
            <Link
              to="/owner/orders"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Order Code</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Customer</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Total</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Time</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentOrders?.length > 0 ? data.recentOrders.map((order) => {
                    const statusCfg = STATUS_MAP[order.status] || STATUS_MAP.pending
                    return (
                      <tr key={order.id} className="transition-colors hover:bg-[#0FD452]/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                              <Receipt className="h-4 w-4 text-[#0FD452]" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{order.code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.customer}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-4">
                          <span className={statusCfg.className}>{statusCfg.label}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {order.time}
                          </span>
                        </td>
                      </tr>
                    )
                  }                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-medium">No recent orders</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Selling Drugs */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PillIcon className="w-5 h-5 text-primary" />
                Top Selling Drugs
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {data.topSellingDrugs?.length > 0 ? data.topSellingDrugs.map((drug, idx) => (
                <div key={idx}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{drug.name}</span>
                    <span className="text-xs text-gray-500">{drug.quantitySold} sold</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill bg-primary"
                      style={{
                        width: `${(drug.quantitySold / (data.topSellingDrugs[0]?.quantitySold || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatCurrency(drug.revenue)} revenue
                  </p>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-400">
                  <PillIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No sales data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertIcon className="w-5 h-5 text-red-500" />
                Low Stock Alerts
              </h3>
            </div>
            <div className="p-6">
              {data.lowStockDrugs?.length === 0 ? (
                <p className="text-sm text-gray-500">All items are well-stocked.</p>
              ) : (
                <div className="space-y-3">
                  {data.lowStockDrugs?.map((drug, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{drug.name}</p>
                        <p className="text-xs text-gray-500">Reorder at {drug.reorderLevel}</p>
                      </div>
                      {drug.currentStock === 0 ? (
                        <span className="badge badge-red">Out of stock</span>
                      ) : (
                        <span className="badge badge-yellow">{drug.currentStock} left</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Stat Card (m_tai pattern) ─── */
function StatCard({ label, value, icon, iconColor, bg, trend, up, suffix }) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 truncate">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
              {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend}</span>
            </div>
          )}
          {suffix && <p className="text-xs text-gray-500 mt-1">{suffix}</p>}
        </div>
        {icon && (
          <div className={`stat-icon group-hover:scale-110 transition-transform duration-300 ${bg || 'bg-gray-100'}`}>
            <span className={iconColor || 'text-gray-600'}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Inline SVG Icons ─── */
function LayoutDashboardIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function DollarIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function TrendingUpIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>; }
function FileTextIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
function AlertIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>; }
function ZapIcon({ className }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>; }
function CartIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>; }
function PlusIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>; }
function RxIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>; }
function ChartIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function PillIcon({ className }) { return <svg className={className || 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>; }

export default OwnerDashboard
