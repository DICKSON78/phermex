import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  FileText,
  Clock,
  Receipt,
  ArrowRight,
  Pill,
  TrendingUp,
  CheckCircle,
  Hash,
  User,
  PackageOpen,
} from 'lucide-react'
import api from '../../services/api'

const DEFAULT_DATA = {
  todaySales: 0,
  ordersToday: 0,
  pendingPrescriptions: 0,
  lowStockAlerts: 0,
  expiringDrugs: 0,
  recentOrders: [],
  lowStockDrugs: [],
}

const STATUS_MAP = {
  pending: { label: 'Pending', className: 'badge badge-yellow' },
  confirmed: { label: 'Confirmed', className: 'badge badge-blue' },
  preparing: { label: 'Preparing', className: 'badge badge-blue' },
  ready: { label: 'Ready', className: 'badge badge-indigo' },
  out_for_delivery: { label: 'Out for Delivery', className: 'badge badge-orange' },
  delivered: { label: 'Delivered', className: 'badge badge-green' },
  dispensed: { label: 'Dispensed', className: 'badge badge-green' },
  cancelled: { label: 'Cancelled', className: 'badge badge-red' },
  failed: { label: 'Failed', className: 'badge badge-red' },
}

function formatCurrency(amount) {
  if (amount == null) return 'TZS 0'
  return 'TZS ' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function SellerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/staff')
        const apiData = response.data || {}
        const recentOrders = (apiData.recent_orders || []).map((order) => ({
          id: order.id,
          code: order.order_code || order.code,
          customer: order.customer || 'Walk-in',
          total: order.total ?? 0,
          status: order.status || order.order_status || 'pending',
          time: order.time || '',
        }))
        const lowStockDrugs = (apiData.low_stock_drugs || []).map((drug) => ({
          name: drug.name || 'Unknown',
          reorderLevel: drug.reorder_level,
          currentStock: drug.quantity ?? drug.current_stock ?? 0,
        }))
        setData({
          todaySales: apiData.today_sales ?? 0,
          ordersToday: apiData.orders_today ?? 0,
          pendingPrescriptions: apiData.active_prescriptions ?? 0,
          lowStockAlerts: apiData.low_stock_alerts ?? 0,
          expiringDrugs: apiData.expiring_drugs ?? 0,
          recentOrders,
          lowStockDrugs,
        })
      } catch (err) {
        console.warn('Failed to fetch staff dashboard:', err.message)
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
      </div>
    )
  }

  if (!data) return null

  const firstName = (user?.name || '').split(' ')[0]

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
            <ShoppingCart className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName || 'Seller'}</h1>
            <p className="text-sm text-gray-500">Your pharmacy operations overview.</p>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(data.todaySales)}
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="text-primary"
          bg="bg-primary-light"
        />
        <StatCard
          label="Orders Today"
          value={data.ordersToday}
          icon={<Receipt className="w-5 h-5" />}
          iconColor="text-emerald-600"
          bg="bg-emerald-100"
        />
        <StatCard
          label="Pending Prescriptions"
          value={data.pendingPrescriptions}
          icon={<FileText className="w-5 h-5" />}
          iconColor="text-yellow-600"
          bg="bg-yellow-100"
          suffix={data.pendingPrescriptions > 0 ? 'Awaiting review' : 'All clear'}
        />
        <StatCard
          label="Low Stock Alerts"
          value={data.lowStockAlerts}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor={data.lowStockAlerts > 0 ? 'text-red-600' : 'text-primary'}
          bg={data.lowStockAlerts > 0 ? 'bg-red-100' : 'bg-primary-light'}
          suffix={data.lowStockAlerts > 0 ? 'Restock needed' : 'All stocked up'}
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'New Sale', desc: 'Open POS', to: '/seller/pos', bg: 'bg-primary-light', color: 'text-primary', icon: <ShoppingCart className="w-5 h-5" /> },
              { label: 'Add Drug', desc: 'New inventory item', to: '/seller/drugs/new', bg: 'bg-blue-100', color: 'text-blue-600', icon: <Pill className="w-5 h-5" /> },
              { label: 'Prescriptions', desc: 'Manage rx', to: '/seller/prescriptions', bg: 'bg-purple-100', color: 'text-purple-600', icon: <FileText className="w-5 h-5" /> },
              { label: 'Low Stock', desc: 'View alerts', to: '/seller/low-stock', bg: 'bg-amber-100', color: 'text-amber-600', icon: <AlertTriangle className="w-5 h-5" /> },
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="card lg:col-span-2 p-0">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              Recent Orders
            </h3>
            <Link
              to="/dashboard/orders"
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
                  }) : (
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
          {/* Expiring Soon */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Expiring Soon
              </h3>
            </div>
            <div className="p-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">Drugs expiring within 30 days</p>
              <span className="badge badge-yellow">{data.expiringDrugs}</span>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Low Stock Alerts
              </h3>
            </div>
            <div className="p-6">
              {data.lowStockDrugs?.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <PackageOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">All items are well-stocked.</p>
                </div>
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

/* ─── Stat Card ─── */
function StatCard({ label, value, icon, iconColor, bg, suffix }) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 truncate">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
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
