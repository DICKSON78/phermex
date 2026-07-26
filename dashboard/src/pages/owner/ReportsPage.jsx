import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Clock,
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  Hash,
  CreditCard,
  Receipt,
  Percent,
  User,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import api from '../../services/api'

const DATE_RANGES = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
]

const TABS = [
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'customers', label: 'Customers', icon: Users },
]

const PIE_COLORS = ['#0FD452', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']


function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 2,
  }).format(amount)
}

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')
  const [dateRange, setDateRange] = useState('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchReportData()
  }, [dateRange, customDateFrom, customDateTo])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = { range: dateRange }
      if (dateRange === 'custom') {
        params.from = customDateFrom
        params.to = customDateTo
      }
      const [salesRes, inventoryRes, financialRes, customersRes] = await Promise.allSettled([
        api.get('/reports/sales', { params }),
        api.get('/reports/inventory', { params }),
        api.get('/reports/financial', { params }),
        api.get('/reports/customers', { params }),
      ])
      setData({
        sales: salesRes.status === 'fulfilled' ? salesRes.value.data : null,
        inventory: inventoryRes.status === 'fulfilled' ? inventoryRes.value.data : null,
        financial: financialRes.status === 'fulfilled' ? financialRes.value.data : null,
        customers: customersRes.status === 'fulfilled' ? customersRes.value.data : null,
      })
    } catch {
      setData({
        sales: null,
        inventory: null,
        financial: null,
        customers: null,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex gap-4 mb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
              <SkeletonBlock className="h-4 w-24 mb-3" />
              <SkeletonBlock className="h-8 w-32" />
            </div>
          ))}
        </div>
        <SkeletonBlock className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">View sales reports and business analytics.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#000F14] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Date Range + Export */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                dateRange === range.value
                  ? 'bg-[#0FD452] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {dateRange === 'custom' && (
          <>
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#000F14] focus:border-[#0FD452] outline-none"
            />
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#000F14] focus:border-[#0FD452] outline-none"
            />
          </>
        )}

        <div className="ml-auto">
          <div className="relative group">
            <button className="btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-10">
              <div className="bg-[#000F14] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                Coming soon
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' && data && <SalesReport data={data.sales} />}
      {activeTab === 'inventory' && data && <InventoryReport data={data.inventory} />}
      {activeTab === 'financial' && data && <FinancialReport data={data.financial} />}
      {activeTab === 'customers' && data && <CustomersReport data={data.customers} />}
    </div>
  )
}

function SalesReport({ data }) {
  const stats = [
    { label: 'Total Revenue', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'bg-[#0FD452]/10 text-[#0FD452]', trend: data.revenueTrend },
    { label: 'Total Orders', value: data.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-500', trend: 8.2 },
    { label: 'Avg Order Value', value: formatCurrency(data.avgOrderValue), icon: TrendingUp, color: 'bg-purple-500/10 text-purple-500', trend: 3.1 },
    { label: 'Items Sold', value: data.itemsSold.toLocaleString(), icon: Package, color: 'bg-orange-500/10 text-orange-500', trend: -1.2 },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#000F14]">{stat.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {stat.trend >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-[#0FD452]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${stat.trend >= 0 ? 'text-[#0FD452]' : 'text-red-500'}`}></span>
                {stat.trend >= 0 ? '+' : ''}{stat.trend}%
              
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#000F14] mb-4">Revenue Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenueChart}>
              <defs>
                <linearGradient id="reportRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0FD452" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0FD452" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} tickFormatter={(v) => `TZS ${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0FD452" strokeWidth={2.5} fill="url(#reportRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Drugs */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">Top Selling Drugs</h3>
          <div className="space-y-4">
            {data.topSellingDrugs.map((drug, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#000F14]">{drug.name}</span>
                  <span className="text-xs text-gray-400">{drug.quantitySold} sold</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-[#0FD452]"
                    style={{ width: `${(drug.quantitySold / (data.topSellingDrugs[0]?.quantitySold || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(drug.revenue)} revenue</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">Sales by Payment Method</h3>
          <div className="space-y-3">
            {data.paymentMethods.map((pm, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <div>
                    <p className="text-sm font-medium text-[#000F14]">{pm.method}</p>
                    <p className="text-xs text-gray-400">{pm.count} orders</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#000F14]">{formatCurrency(pm.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InventoryReport({ data }) {
  const stats = [
    { label: 'Total Drugs', value: data.totalDrugs.toLocaleString(), icon: Package, color: 'bg-[#0FD452]/10 text-[#0FD452]' },
    { label: 'Stock Value', value: formatCurrency(data.totalStockValue), icon: DollarSign, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Low Stock Items', value: data.lowStockItems.length, icon: AlertTriangle, color: 'bg-red-500/10 text-red-500' },
    { label: 'Expiring Soon', value: data.expiringSoon.length, icon: Clock, color: 'bg-orange-500/10 text-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#000F14]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Category Distribution Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#000F14] mb-4">Stock Distribution by Category</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.categoryDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" fill="#0FD452" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">Low Stock Items</h3>
          <div className="space-y-3">
            {data.lowStockItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-[#000F14]">{item.name}</p>
                  <p className="text-xs text-gray-400">Reorder level: {item.reorderLevel}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.currentStock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.currentStock === 0 ? 'Out of stock' : `${item.currentStock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">Expiring Soon</h3>
          <div className="space-y-3">
            {data.expiringSoon.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-[#000F14]">{item.name}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <span className="text-xs font-medium text-orange-600">
                  Expires {new Date(item.expiryDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Movement Summary */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#000F14] mb-4">Stock Movement Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Received', value: data.stockMovements.received, color: 'text-[#0FD452]' },
            { label: 'Dispensed', value: data.stockMovements.dispensed, color: 'text-blue-500' },
            { label: 'Returned', value: data.stockMovements.returned, color: 'text-orange-500' },
            { label: 'Expired', value: data.stockMovements.expired, color: 'text-red-500' },
          ].map((item, idx) => (
            <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-sm text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FinancialReport({ data }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(data.revenue), color: 'bg-[#0FD452]/10 text-[#0FD452]', icon: DollarSign },
          { label: 'Total Expenses', value: formatCurrency(data.expenses), color: 'bg-red-500/10 text-red-500', icon: TrendingDown },
          { label: 'Net Profit', value: formatCurrency(data.profit), color: 'bg-blue-500/10 text-blue-500', icon: TrendingUp },
          { label: 'Profit Margin', value: `${data.profitMargin}%`, color: 'bg-purple-500/10 text-purple-500', icon: BarChart3 },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#000F14]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">Revenue vs Expenses</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyPL}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `TZS ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value)]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#0FD452" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">Expense Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expenseBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {data.expenseBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value)]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {data.expenseBreakdown.map((exp, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-gray-600">{exp.category}</span>
                </div>
                <span className="font-medium text-[#000F14]">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly P&L Table */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#000F14] mb-4">Monthly Profit & Loss Summary</h3>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Month</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Revenue</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <TrendingDown className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Expenses</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Profit</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Percent className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Margin</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.monthlyPL.map((row, idx) => {
                  const margin = ((row.profit / row.revenue) * 100).toFixed(1)
                  return (
                    <tr key={idx} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Receipt className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-medium text-[#000F14]">{row.month}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[#000F14]">{formatCurrency(row.revenue)}</td>
                      <td className="px-6 py-4 text-right text-sm text-red-600">{formatCurrency(row.expenses)}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-[#0FD452]">{formatCurrency(row.profit)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">{margin}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomersReport({ data }) {
  const stats = [
    { label: 'Total Customers', value: data.totalCustomers.toLocaleString(), icon: Users, color: 'bg-[#0FD452]/10 text-[#0FD452]' },
    { label: 'New This Month', value: data.newCustomersThisMonth, icon: TrendingUp, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Retention Rate', value: `${data.retentionRate}%`, icon: TrendingUp, color: 'bg-purple-500/10 text-purple-500' },
    { label: 'Avg Orders/Customer', value: data.avgOrdersPerCustomer.toFixed(1), icon: ShoppingCart, color: 'bg-orange-500/10 text-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#000F14]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#000F14] mb-4">Top Customers by Spending</h3>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>#</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Customer</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <ShoppingCart className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Orders</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Total Spent</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Spending</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topCustomers.map((customer, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <span className="text-xs font-bold text-[#0FD452]">{idx + 1}</span>
                        </div>
                        <span className="text-sm text-gray-500">{idx + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#000F14]">{customer.name}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{customer.orders}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-[#000F14]">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[120px]">
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-[#0FD452]"
                            style={{ width: `${(customer.totalSpent / (data.topCustomers[0]?.totalSpent || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
