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
import toast from 'react-hot-toast'
import Tabs from '../../components/Tabs'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'
import { useLanguage } from '../../contexts/LanguageContext'

const DATE_RANGES = [
  { labelKey: 'reports.analytics.ranges.week', value: 'week' },
  { labelKey: 'reports.analytics.ranges.month', value: 'month' },
  { labelKey: 'reports.analytics.ranges.quarter', value: 'quarter' },
  { labelKey: 'reports.analytics.ranges.year', value: 'year' },
  { labelKey: 'reports.analytics.ranges.custom', value: 'custom' },
]

const TABS = [
  { id: 'sales', label: 'reports.analytics.tabs.sales', icon: ShoppingCart },
  { id: 'inventory', label: 'reports.analytics.tabs.inventory', icon: Package },
  { id: 'financial', label: 'reports.analytics.tabs.financial', icon: DollarSign },
  { id: 'customers', label: 'reports.analytics.tabs.customers', icon: Users },
]

const PIE_COLORS = ['#0FD452', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']


function formatCurrency(amount) {
  return formatMoney(amount, { decimals: 2 })
}

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

export default function ReportsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('sales')
  const [dateRange, setDateRange] = useState('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  const handleExport = () => {
    if (!data) return
    const activeData = data[activeTab]
    if (!activeData) { toast.error(t('reports.analytics.noDataExport')); return }

    let headers, rows
    if (activeTab === 'financial' && activeData.monthlyPL) {
      headers = [t('reports.analytics.month'), t('reports.analytics.revenueWord'), t('reports.financial.expenses'), t('reports.analytics.netProfit')]
      rows = activeData.monthlyPL.map(r => [r.month, r.revenue, r.expenses, r.profit])
    } else if (activeTab === 'sales' && activeData.revenueChart) {
      headers = [t('common.date'), t('reports.analytics.revenueWord')]
      rows = activeData.revenueChart.map(r => [r.date, r.revenue])
    } else if (activeTab === 'inventory') {
      headers = [t('nav.items.drugs'), t('products.stock'), t('products.reorderLevel'), t('common.status')]
      rows = activeData.lowStockItems.map(r => [r.name, r.currentStock, r.reorderLevel, r.currentStock === 0 ? t('dashboard.outOfStock') : t('reports.analytics.low')])
    } else if (activeTab === 'customers' && activeData.topCustomers) {
      headers = [t('reports.analytics.customer'), t('reports.analytics.ordersWord'), t('reports.analytics.totalSpent')]
      rows = activeData.topCustomers.map(r => [r.name, r.orders, r.totalSpent])
    } else {
      toast.error(t('reports.analytics.noTabularExport')); return
    }

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${activeTab}-${dateRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('reports.analytics.exported'))
  }

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
            <h1 className="text-2xl font-bold text-gray-900">{t('reports.analytics.title')}</h1>
            <p className="text-sm text-gray-500">{t('reports.analytics.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS.map((tab) => ({ ...tab, label: t(tab.label) }))} active={activeTab} onChange={setActiveTab} />

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
              {t(range.labelKey)}
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
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" />
            {t('common.export')}
          </button>
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
  const { t } = useLanguage()
  if (!data) return <div className="bg-white rounded-2xl p-12 text-center text-gray-400"><BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>{t('reports.analytics.salesEmpty')}</p></div>
  const stats = [
    { label: t('reports.analytics.totalRevenue'), value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'bg-[#0FD452]/10 text-[#0FD452]', trend: data.revenueTrend },
    { label: t('reports.analytics.totalOrders'), value: (data.totalOrders ?? 0).toLocaleString(), icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-500', trend: 8.2 },
    { label: t('reports.analytics.avgOrderValue'), value: formatCurrency(data.avgOrderValue), icon: TrendingUp, color: 'bg-purple-500/10 text-purple-500', trend: 3.1 },
    { label: t('reports.analytics.itemsSold'), value: (data.itemsSold ?? 0).toLocaleString(), icon: Package, color: 'bg-orange-500/10 text-orange-500', trend: -1.2 },
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
        <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.revenueTrend')}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenueChart ?? []}>
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
                formatter={(value) => [formatCurrency(value), t('reports.analytics.revenueWord')]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0FD452" strokeWidth={2.5} fill="url(#reportRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Drugs */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.topSelling')}</h3>
          <div className="space-y-4">
            {(data.topSellingDrugs ?? []).length > 0 ? (data.topSellingDrugs ?? []).map((drug, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#000F14]">{drug.name}</span>
                  <span className="text-xs text-gray-400">{drug.quantitySold} {t('dashboard.sold')}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-[#0FD452]"
                    style={{ width: `${(drug.quantitySold / ((data.topSellingDrugs ?? [])[0]?.quantitySold || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(drug.revenue)} {t('reports.analytics.revenueWord')}</p>
              </div>
            )) : <p className="text-sm text-gray-400 py-4 text-center">{t('reports.analytics.noRecords')}</p>}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.paymentMethods')}</h3>
          <div className="space-y-3">
            {(data.paymentMethods ?? []).length > 0 ? (data.paymentMethods ?? []).map((pm, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <div>
                    <p className="text-sm font-medium text-[#000F14]">{pm.method}</p>
                    <p className="text-xs text-gray-400">{pm.count} {t('reports.analytics.ordersWord')}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#000F14]">{formatCurrency(pm.amount)}</span>
              </div>
            )) : <p className="text-sm text-gray-400 py-4 text-center">{t('reports.analytics.noRecords')}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function InventoryReport({ data }) {
  const { t } = useLanguage()
  if (!data) return <div className="bg-white rounded-2xl p-12 text-center text-gray-400"><Package className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>{t('reports.analytics.inventoryEmpty')}</p></div>
  const stats = [
    { label: t('reports.analytics.totalDrugs'), value: (data.totalDrugs ?? 0).toLocaleString(), icon: Package, color: 'bg-[#0FD452]/10 text-[#0FD452]' },
    { label: t('reports.analytics.stockValue'), value: formatCurrency(data.totalStockValue), icon: DollarSign, color: 'bg-blue-500/10 text-blue-500' },
    { label: t('reports.analytics.lowStockItems'), value: (data.lowStockItems ?? []).length, icon: AlertTriangle, color: 'bg-red-500/10 text-red-500' },
    { label: t('reports.analytics.expiringSoon'), value: (data.expiringSoon ?? []).length, icon: Clock, color: 'bg-orange-500/10 text-orange-500' },
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
        <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.stockDistribution')}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.categoryDistribution ?? []}>
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
          <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.lowStockItems')}</h3>
          <div className="space-y-3">
            {(data.lowStockItems ?? []).length > 0 ? (data.lowStockItems ?? []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-[#000F14]">{item.name}</p>
                  <p className="text-xs text-gray-400">{t('dashboard.reorderAt')}: {item.reorderLevel}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.currentStock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.currentStock === 0 ? t('dashboard.outOfStock') : `${item.currentStock} ${t('dashboard.left')}`}
                </span>
              </div>
            )) : <p className="text-sm text-gray-400 py-4 text-center">{t('reports.analytics.noRecords')}</p>}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.expiringSoon')}</h3>
          <div className="space-y-3">
            {(data.expiringSoon ?? []).length > 0 ? (data.expiringSoon ?? []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-[#000F14]">{item.name}</p>
                  <p className="text-xs text-gray-400">{t('reports.analytics.quantity')}: {item.quantity}</p>
                </div>
                <span className="text-xs font-medium text-orange-600">
                  {t('reports.analytics.expires')} {new Date(item.expiryDate).toLocaleDateString()}
                </span>
              </div>
            )) : <p className="text-sm text-gray-400 py-4 text-center">{t('reports.analytics.noRecords')}</p>}
          </div>
        </div>
      </div>

      {/* Stock Movement Summary */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.stockMovementSummary')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('reports.analytics.received'), value: data.stockMovements?.received ?? 0, color: 'text-[#0FD452]' },
            { label: t('reports.analytics.dispensed'), value: data.stockMovements?.dispensed ?? 0, color: 'text-blue-500' },
            { label: t('reports.analytics.returned'), value: data.stockMovements?.returned ?? 0, color: 'text-orange-500' },
            { label: t('reports.analytics.expired'), value: data.stockMovements?.expired ?? 0, color: 'text-red-500' },
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
  const { t } = useLanguage()
  if (!data) return <div className="bg-white rounded-2xl p-12 text-center text-gray-400"><DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>{t('reports.analytics.financialEmpty')}</p></div>
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('reports.analytics.totalRevenue'), value: formatCurrency(data.revenue), color: 'bg-[#0FD452]/10 text-[#0FD452]', icon: DollarSign },
          { label: t('reports.financial.totalExpenses'), value: formatCurrency(data.expenses), color: 'bg-red-500/10 text-red-500', icon: TrendingDown },
          { label: t('reports.analytics.netProfit'), value: formatCurrency(data.profit), color: 'bg-blue-500/10 text-blue-500', icon: TrendingUp },
          { label: t('reports.analytics.profitMargin'), value: `${data.profitMargin ?? 0}%`, color: 'bg-purple-500/10 text-purple-500', icon: BarChart3 },
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
          <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.revenueVsExpenses')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyPL ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `TZS ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value)]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#0FD452" radius={[4, 4, 0, 0]} name={t('reports.analytics.revenueWord')} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name={t('reports.financial.expenses')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.expenseBreakdown')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expenseBreakdown ?? []}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {(data.expenseBreakdown ?? []).map((_, idx) => (
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
            {(data.expenseBreakdown ?? []).length > 0 ? (data.expenseBreakdown ?? []).map((exp, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-gray-600">{exp.category}</span>
                </div>
                <span className="font-medium text-[#000F14]">{formatCurrency(exp.amount)}</span>
              </div>
            )) : <p className="text-sm text-gray-400 py-4 text-center">{t('reports.analytics.noRecords')}</p>}
          </div>
        </div>
      </div>

      {/* Monthly P&L Table */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.monthlyPL')}</h3>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('reports.analytics.month')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('reports.analytics.revenueWord')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <TrendingDown className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('reports.financial.expenses')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('reports.analytics.profit')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Percent className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('reports.analytics.margin')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.monthlyPL ?? []).length > 0 ? (data.monthlyPL ?? []).map((row, idx) => {
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
                }) : <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400"><p className="text-sm font-medium">{t('reports.analytics.noRecordsFound')}</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomersReport({ data }) {
  const { t } = useLanguage()
  if (!data) return <div className="bg-white rounded-2xl p-12 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>{t('reports.analytics.customersEmpty')}</p></div>
  const stats = [
    { label: t('reports.analytics.totalCustomers'), value: (data.totalCustomers ?? 0).toLocaleString(), icon: Users, color: 'bg-[#0FD452]/10 text-[#0FD452]' },
    { label: t('reports.analytics.newThisMonth'), value: data.newCustomersThisMonth ?? 0, icon: TrendingUp, color: 'bg-blue-500/10 text-blue-500' },
    { label: t('reports.analytics.retentionRate'), value: `${data.retentionRate ?? 0}%`, icon: TrendingUp, color: 'bg-purple-500/10 text-purple-500' },
    { label: t('reports.analytics.avgOrdersCustomer'), value: (data.avgOrdersPerCustomer ?? 0).toFixed(1), icon: ShoppingCart, color: 'bg-orange-500/10 text-orange-500' },
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
        <h3 className="text-lg font-bold text-[#000F14] mb-4">{t('reports.analytics.topCustomers')}</h3>
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
                      <span>{t('reports.analytics.customer')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <ShoppingCart className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('reports.analytics.ordersWord')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('reports.analytics.totalSpent')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('reports.analytics.spending')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.topCustomers ?? []).length > 0 ? (data.topCustomers ?? []).map((customer, idx) => (
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
                            style={{ width: `${(customer.totalSpent / ((data.topCustomers ?? [])[0]?.totalSpent || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400"><p className="text-sm font-medium">{t('reports.analytics.noRecordsFound')}</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
