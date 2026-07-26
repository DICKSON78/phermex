import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowRight,
  Building2,
  FileText,
  Download,
  Activity,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import api from '../../services/api'

const REPORT_LINKS = [
  { label: 'Revenue Report', desc: 'Detailed revenue breakdown', to: '/admin/revenue', bg: 'bg-primary-light', color: 'text-primary', icon: DollarSign },
  { label: 'Order Analytics', desc: 'Orders and transactions', to: '/admin/orders', bg: 'bg-blue-100', color: 'text-blue-600', icon: ShoppingCart },
  { label: 'User Analytics', desc: 'User engagement metrics', to: '/admin/users', bg: 'bg-purple-100', color: 'text-purple-600', icon: Users },
  { label: 'Pharmacy Analytics', desc: 'Pharmacy performance data', to: '/admin/pharmacies', bg: 'bg-amber-100', color: 'text-amber-600', icon: Building2 },
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/reports')
      setData(response.data || {})
    } catch (err) {
      console.warn('Failed to fetch reports:', err.message)
      setError(err.message)
      setData({})
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-16 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-2xl animate-pulse" />
          <div className="h-80 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Failed to load reports. Please try again.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">View platform analytics and generate reports.</p>
          </div>
        </div>
        <button className="btn-primary">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Revenue" value={formatCurrency(data.stats.totalRevenue)} icon={<DollarSign className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix="All time" />
        <StatCard label="Total Orders" value={data.stats.totalOrders.toLocaleString()} icon={<ShoppingCart className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" suffix="All time" />
        <StatCard label="Active Users" value={data.stats.activeUsers} icon={<Users className="w-5 h-5" />} iconColor="text-purple-600" bg="bg-purple-100" suffix="Platform-wide" />
        <StatCard label="Growth Rate" value={`${data.stats.growthRate}%`} icon={<TrendingUp className="w-5 h-5" />} iconColor="text-amber-600" bg="bg-amber-100" suffix="Month over month" />
      </div>

      {/* Quick Report Links */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Detailed Reports
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORT_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="quick-action">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 ${link.bg} rounded-xl flex items-center justify-center`}>
                      <span className={link.color}><link.icon className="w-5 h-5" /></span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{link.label}</h4>
                      <p className="text-xs text-gray-500">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Revenue Trend
            </h3>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueChart}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0FD452" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0FD452" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0FD452" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Orders by Status
            </h3>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.ordersByStatus.map((entry, index) => (
                      <rect key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Summary Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Orders Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Activity className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Count</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5 justify-end">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Percentage</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-48">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Distribution</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.ordersByStatus.map((item) => {
                const pct = ((item.count / data.stats.totalOrders) * 100).toFixed(1)
                return (
                  <tr key={item.status} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        </div>
                        <span className="text-sm font-medium text-[#000F14]">{item.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#000F14]">{item.count.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{pct}%</td>
                    <td className="px-6 py-4">
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${pct}%`, backgroundColor: item.fill }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, iconColor, bg, suffix }) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 truncate">{label}</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {suffix && <p className="text-xs text-gray-500 mt-1.5">{suffix}</p>}
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
