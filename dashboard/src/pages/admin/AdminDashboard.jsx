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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Activity,
  Clock,
  FileText,
  Shield,
  Zap,
  LayoutDashboard,
  MessageSquare,
  Globe,
  Heart,
  Trophy,
  Calendar,
  ShieldCheck,
  User,
} from 'lucide-react'
import api from '../../services/api'

const FALLBACK_DATA = {
  totalPharmacies: 24,
  newPharmaciesThisMonth: 5,
  totalUsers: 186,
  activeSubscriptions: 21,
  platformRevenue: 28500000,
  supportTicketsOpen: 7,
  monthlyGrowth: 12.4,
  revenueChart: (() => {
    const data = []
    const base = 800000
    for (let i = 14; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(base + Math.random() * 1200000 + Math.sin(i * 0.3) * 400000),
      })
    }
    return data
  })(),
  revenueBreakdown: (() => {
    const base = 800000
    return [
      { name: 'Week 1', value: Math.floor(base * 3.2 + Math.random() * 500000), color: '#0FD452' },
      { name: 'Week 2', value: Math.floor(base * 2.8 + Math.random() * 400000), color: '#3b82f6' },
      { name: 'Week 3', value: Math.floor(base * 3.5 + Math.random() * 600000), color: '#f59e0b' },
      { name: 'Week 4', value: Math.floor(base * 2.5 + Math.random() * 300000), color: '#8b5cf6' },
    ]
  })(),
  userGrowth: (() => {
    const months = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul']
    let users = 60
    return months.map((month) => {
      users += Math.floor(Math.random() * 18 + 5)
      return { month, users }
    })
  })(),
  regionalDistribution: [
    { region: 'Tanzania', count: 10, percent: 40 },
    { region: 'Kenya', count: 6, percent: 25 },
    { region: 'Nigeria', count: 5, percent: 20 },
    { region: 'Zambia', count: 2, percent: 10 },
    { region: 'Other', count: 1, percent: 5 },
  ],
  systemHealth: {
    apiResponse: 99.8,
    uptime: 99.9,
    errorRate: 0.2,
    activeSessions: 47,
  },
  topPharmaciesByRevenue: [
    { rank: 1, name: 'HealthPlus Pharmacy', revenue: 12400000, status: 'active' },
    { rank: 2, name: 'PharmaStar', revenue: 9800000, status: 'active' },
    { rank: 3, name: 'MedVita Pharmacy', revenue: 8200000, status: 'active' },
    { rank: 4, name: 'WellCare Drugs', revenue: 6500000, status: 'pending' },
    { rank: 5, name: 'LifeLine Chemists', revenue: 5100000, status: 'active' },
  ],
  recentPharmacies: [
    { id: 1, name: 'HealthPlus Pharmacy', owner: 'Alice Mwamba', country: 'Zambia', status: 'active', date: '2026-07-18' },
    { id: 2, name: 'WellCare Drugs', owner: 'Bob Phiri', country: 'Nigeria', status: 'pending', date: '2026-07-17' },
    { id: 3, name: 'MedVita Pharmacy', owner: 'Carol Banda', country: 'Kenya', status: 'active', date: '2026-07-16' },
    { id: 4, name: 'LifeLine Chemists', owner: 'David Lungu', country: 'Tanzania', status: 'pending', date: '2026-07-15' },
    { id: 5, name: 'PharmaStar', owner: 'Eva Tembo', country: 'Uganda', status: 'active', date: '2026-07-14' },
  ],
  subscriptionBreakdown: [
    { name: 'Trial', count: 8, color: '#94a3b8' },
    { name: 'Basic', count: 7, color: '#0FD452' },
    { name: 'Pro', count: 6, color: '#3b82f6' },
    { name: 'Enterprise', count: 3, color: '#f59e0b' },
  ],
  recentActivity: [
    { id: 1, action: 'New pharmacy registered', detail: 'HealthPlus Pharmacy', time: '10 min ago', icon: Building2 },
    { id: 2, action: 'Subscription upgraded', detail: 'WellCare Drugs — Basic to Pro', time: '1 hr ago', icon: CreditCard },
    { id: 3, action: 'New user created', detail: 'pharmacist@medvita.com', time: '2 hrs ago', icon: Users },
    { id: 4, action: 'Pharmacy activated', detail: 'LifeLine Chemists', time: '3 hrs ago', icon: Activity },
    { id: 5, action: 'Payment received', detail: 'TZS 750,000 from PharmaStar', time: '5 hrs ago', icon: DollarSign },
    { id: 6, action: 'Pharmacy pending review', detail: 'CarePoint Pharmacy', time: '6 hrs ago', icon: Clock },
    { id: 7, action: 'Support ticket opened', detail: 'Ticket #1042 — Billing issue', time: '8 hrs ago', icon: FileText },
    { id: 8, action: 'New pharmacy registered', detail: 'Sun Pharma Hub', time: '10 hrs ago', icon: Building2 },
    { id: 9, action: 'User deactivated', detail: 'temp@lifeline.com', time: '12 hrs ago', icon: Shield },
    { id: 10, action: 'Plan changed', detail: 'MedVita — Trial to Basic', time: '1 day ago', icon: TrendingUp },
  ],
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const STATUS_MAP = {
  active: { label: 'Active', className: 'badge badge-green' },
  pending: { label: 'Pending', className: 'badge badge-yellow' },
  suspended: { label: 'Suspended', className: 'badge badge-red' },
  closed: { label: 'Closed', className: 'badge badge-gray' },
}

function ChartIcon({ className }) { return <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/admin')
        const raw = response.data || {}

        const WEEK_COLORS = ['#0FD452', '#3b82f6', '#f59e0b', '#8b5cf6']

        const revenueChart = (raw.revenue_chart || []).map((item) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: item.revenue,
        }))

        const chunkSize = Math.ceil(revenueChart.length / 4) || 1
        const revenueBreakdown = Array.from({ length: 4 }, (_, i) => {
          const chunk = revenueChart.slice(i * chunkSize, (i + 1) * chunkSize)
          return {
            name: `Week ${i + 1}`,
            value: chunk.reduce((sum, item) => sum + item.revenue, 0),
            color: WEEK_COLORS[i],
          }
        }).filter((w) => w.value > 0)

        setData({
          ...FALLBACK_DATA,
          totalPharmacies: raw.total_pharmacies ?? FALLBACK_DATA.totalPharmacies,
          totalUsers: raw.total_users ?? FALLBACK_DATA.totalUsers,
          activeSubscriptions: raw.active_subscriptions ?? FALLBACK_DATA.activeSubscriptions,
          newPharmaciesThisMonth: raw.new_registrations_this_month ?? FALLBACK_DATA.newPharmaciesThisMonth,
          platformRevenue: raw.monthly_revenue ?? FALLBACK_DATA.platformRevenue,
          revenueChart: revenueChart.length > 0 ? revenueChart : FALLBACK_DATA.revenueChart,
          revenueBreakdown: revenueBreakdown.length > 0 ? revenueBreakdown : FALLBACK_DATA.revenueBreakdown,
          pharmaciesByStatus: raw.pharmacies_by_status ?? FALLBACK_DATA.pharmaciesByStatus,
        })
      } catch (err) {
        console.warn('Failed to fetch admin dashboard, using fallback:', err.message)
        setError(err.message)
        setData(FALLBACK_DATA)
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-80 bg-white rounded-2xl animate-pulse" />
        <div className="h-80 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-white rounded-2xl animate-pulse lg:col-span-2" />
          <div className="h-96 bg-white rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-white rounded-2xl animate-pulse" />
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
          Using offline data — could not reach server.
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center text-[#0FD452]">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Pharmex Platform — Overview of all pharmacies, users, and subscriptions.</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        <StatCard label="Total Pharmacies" value={data.totalPharmacies} icon={<Building2 className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix={`+${data.newPharmaciesThisMonth} new this month`} />
        <StatCard label="Total Users" value={data.totalUsers} icon={<Users className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" suffix="Across all pharmacies" />
        <StatCard label="Active Subscriptions" value={data.activeSubscriptions} icon={<CreditCard className="w-5 h-5" />} iconColor="text-purple-600" bg="bg-purple-100" suffix={`of ${data.totalPharmacies} pharmacies`} />
        <StatCard label="Platform Revenue" value={formatCurrency(data.platformRevenue)} icon={<DollarSign className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix="Total to date" />
        <StatCard label="Support Tickets Open" value={data.supportTicketsOpen} icon={<MessageSquare className="w-5 h-5" />} iconColor="text-amber-600" bg="bg-amber-100" suffix="Awaiting response" />
        <StatCard label="Monthly Growth" value={`${data.monthlyGrowth}%`} icon={<TrendingUp className="w-5 h-5" />} iconColor="text-emerald-600" bg="bg-emerald-100" suffix="vs last month" />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'All Pharmacies', desc: 'Manage businesses', to: '/admin/pharmacies', bg: 'bg-primary-light', color: 'text-primary', icon: <Building2 className="w-5 h-5" /> },
              { label: 'All Users', desc: 'Manage users', to: '/admin/users', bg: 'bg-blue-100', color: 'text-blue-600', icon: <Users className="w-5 h-5" /> },
              { label: 'Audit Logs', desc: 'System logs', to: '/admin/audit-logs', bg: 'bg-purple-100', color: 'text-purple-600', icon: <FileText className="w-5 h-5" /> },
              { label: 'Settings', desc: 'Platform config', to: '/admin/settings', bg: 'bg-amber-100', color: 'text-amber-600', icon: <Shield className="w-5 h-5" /> },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="quick-action">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 ${link.bg} rounded-xl flex items-center justify-center`}>
                    <span className={link.color}>{link.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{link.label}</h4>
                    <p className="text-xs text-gray-500">{link.desc}</p>
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

      {/* User Growth Chart + Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <div className="card lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              User Growth — Last 12 Months
            </h3>
          </div>
          <div className="p-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.userGrowth}>
                  <defs>
                    <linearGradient id="adminUserGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0FD452" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#0FD452" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [value, 'Users']}
                    cursor={{ fill: 'rgba(15,212,82,0.08)' }}
                  />
                  <Bar
                    dataKey="users"
                    fill="url(#adminUserGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Regional Distribution
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {data.regionalDistribution?.map((region) => (
              <div key={region.region}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{region.region}</span>
                  <span className="text-sm font-semibold text-gray-900">{region.count} <span className="text-gray-400 font-normal">({region.percent}%)</span></span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${region.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout — Registrations + Subscription + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Pharmacy Registrations */}
        <div className="card lg:col-span-2 p-0">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Recent Pharmacy Registrations
            </h3>
            <Link
              to="/admin/pharmacies"
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
                        <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Pharmacy Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Owner</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Country</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Date</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentPharmacies?.map((pharmacy) => {
                    const statusCfg = STATUS_MAP[pharmacy.status] || STATUS_MAP.pending
                    return (
                      <tr key={pharmacy.id} className="transition-colors hover:bg-[#0FD452]/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                              <Building2 className="h-4 w-4 text-[#0FD452]" />
                            </div>
                            <span className="font-medium text-gray-900">{pharmacy.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{pharmacy.owner}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{pharmacy.country}</td>
                        <td className="px-6 py-4">
                          <span className={statusCfg.className}>{statusCfg.label}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{pharmacy.date}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Subscription Breakdown */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Subscriptions
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.subscriptionBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {data.subscriptionBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {data.subscriptionBreakdown.map((plan) => (
                  <div key={plan.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="text-xs text-gray-600">
                      {plan.name}: <span className="font-semibold text-gray-900">{plan.count}</span>
                    </span>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Recent Activity
              </h3>
            </div>
            <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
              {data.recentActivity?.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{item.time}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* System Health + Top Pharmacies by Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600" />
              System Health
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {[
              { label: 'API Response', value: `${data.systemHealth?.apiResponse ?? 99.8}%`, percent: data.systemHealth?.apiResponse ?? 99.8, color: '#0FD452' },
              { label: 'Uptime', value: `${data.systemHealth?.uptime ?? 99.9}%`, percent: data.systemHealth?.uptime ?? 99.9, color: '#3b82f6' },
              { label: 'Error Rate', value: `${data.systemHealth?.errorRate ?? 0.2}%`, percent: Math.min((data.systemHealth?.errorRate ?? 0.2) * 50, 100), color: '#f59e0b' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className="text-sm font-bold text-gray-900">{metric.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${metric.percent}%`, backgroundColor: metric.color }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Active Sessions</span>
              <span className="text-2xl font-bold text-gray-900">{data.systemHealth?.activeSessions ?? 47}</span>
            </div>
          </div>
        </div>

        {/* Top Pharmacies by Revenue */}
        <div className="card lg:col-span-2 p-0">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Pharmacies by Revenue
            </h3>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="w-16 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Rank</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Pharmacy Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Revenue</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.topPharmaciesByRevenue?.map((pharmacy) => {
                    const statusCfg = STATUS_MAP[pharmacy.status] || STATUS_MAP.pending
                    return (
                      <tr key={pharmacy.rank} className="transition-colors hover:bg-[#0FD452]/5">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            pharmacy.rank === 1 ? 'bg-amber-100 text-amber-700' :
                            pharmacy.rank === 2 ? 'bg-gray-200 text-gray-600' :
                            pharmacy.rank === 3 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {pharmacy.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                              <Building2 className="h-4 w-4 text-[#0FD452]" />
                            </div>
                            <span className="font-medium text-gray-900">{pharmacy.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(pharmacy.revenue)}</td>
                        <td className="px-6 py-4">
                          <span className={statusCfg.className}>{statusCfg.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Stat Card (m_tai pattern) ─── */
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
