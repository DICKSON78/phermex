import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Eye, ShoppingCart, Clock, CheckCircle, DollarSign,
  ChevronLeft, ChevronRight,
  Hash, Tag, User, Package, CreditCard, Activity, Calendar,
} from 'lucide-react'
import api from '../../services/api'
import { currentBase } from '../../utils/roles'

const PAYMENT_STYLES = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
}

const ORDER_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  dispensed: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const TYPE_STYLES = {
  counter: 'bg-gray-100 text-gray-700',
  online: 'bg-purple-100 text-purple-700',
  phone: 'bg-blue-100 text-blue-700',
}

const STATUS_TABS = ['All', 'Pending', 'Confirmed', 'Dispensed', 'Delivered', 'Cancelled']

export default function OrderListPage() {
  const navigate = useNavigate()
  const base = currentBase()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchOrders()
  }, [currentPage, statusTab])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = { page: currentPage, per_page: pageSize }
      if (statusTab !== 'All') params.status = statusTab.toLowerCase()
      if (search) params.search = search
      const res = await api.get('/orders', { params })
      const data = res.data
      setOrders(data.data || [])
      setLastPage(data.last_page || 1)
      setTotal(data.total || 0)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchOrders()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-TZ', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getOrderCode = (o) => o.order_code || o.code || `#${o.id}`
  const getStatus = (o) => o.order_status || o.status || 'pending'
  const getCustomerName = (o) => o.user?.name || o.customer?.name || 'Walk-in'
  const getItemsCount = (o) => o.items_count ?? o.items?.length ?? 0
  const getTotal = (o) => Number(o.total || 0)

  const filtered = statusTab === 'All' ? orders : orders.filter((o) => getStatus(o) === statusTab.toLowerCase())

  const stats = {
    total,
    pending: orders.filter((o) => getStatus(o) === 'pending').length,
    completedToday: orders.filter((o) =>
      (getStatus(o) === 'dispensed' || getStatus(o) === 'delivered')
    ).length,
    totalRevenue: orders
      .filter((o) => (o.payment_status || 'unpaid') === 'paid')
      .reduce((sum, o) => sum + getTotal(o), 0),
  }

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: ShoppingCart, color: 'bg-[#0FD452]/10 text-[#0FD452]' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Completed', value: stats.completedToday, icon: CheckCircle, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Revenue', value: `TZS ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-purple-100 text-purple-600' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500">View and manage all sales orders.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 px-4 py-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by order code..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatusTab(tab); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  statusTab === tab
                    ? 'bg-[#0FD452] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

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
                    <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Type</span>
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
                    <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Items</span>
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
                    <CreditCard className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Payment</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Date</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-[#0FD452] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No orders found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer" onClick={() => navigate(`${base}/orders/${order.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <ShoppingCart className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="text-sm font-mono font-medium text-gray-900">{getOrderCode(order)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_STYLES[order.order_type] || 'bg-gray-100 text-gray-600'}`}>
                        {order.order_type || 'counter'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{getCustomerName(order)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getItemsCount(order)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">TZS {getTotal(order).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ORDER_STYLES[getStatus(order)] || 'bg-gray-100 text-gray-600'}`}>
                        {getStatus(order)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`${base}/orders/${order.id}`)}
                        className="btn-icon-primary"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {lastPage} ({total} orders)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-ghost"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                let page
                if (lastPage <= 5) page = i + 1
                else if (currentPage <= 3) page = i + 1
                else if (currentPage >= lastPage - 2) page = lastPage - 4 + i
                else page = currentPage - 2 + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded text-xs font-medium transition ${
                      currentPage === page
                        ? 'bg-[#0FD452] text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage === lastPage}
                className="btn-ghost"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
