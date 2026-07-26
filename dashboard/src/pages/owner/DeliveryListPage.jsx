import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import {
  Truck, Clock, MapPin, CheckCircle, XCircle, AlertCircle,
  MoreVertical, Eye, UserPlus, RefreshCw, Navigation, Package,
  Hash, ShoppingCart, User, MapIcon, DollarSign, Activity, UserCheck, Calendar,
} from 'lucide-react'
import api from '../../services/api'


const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
  assigned: { color: 'bg-blue-100 text-blue-700', icon: UserPlus, label: 'Assigned' },
  picked_up: { color: 'bg-indigo-100 text-indigo-700', icon: Package, label: 'Picked Up' },
  in_transit: { color: 'bg-purple-100 text-purple-700', icon: Truck, label: 'In Transit' },
  delivered: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Delivered' },
  failed: { color: 'bg-red-100 text-red-600', icon: XCircle, label: 'Failed' },
}

export default function DeliveryListPage() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(null)
  const [driverName, setDriverName] = useState('')

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/deliveries')
      setDeliveries(toArray(res.data))
    } catch {
      setDeliveries([])
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    pending: deliveries.filter((d) => d.status === 'pending').length,
    in_transit: deliveries.filter((d) => d.status === 'in_transit' || d.status === 'picked_up').length,
    delivered_today: deliveries.filter((d) => d.status === 'delivered').length,
    failed: deliveries.filter((d) => d.status === 'failed').length,
  }

  const handleAssignDriver = async () => {
    if (!driverName.trim() || !showAssignModal) return
    try {
      await api.patch(`/deliveries/${showAssignModal}`, { assigned_to: driverName, status: 'assigned' })
    } catch {}
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === showAssignModal
          ? { ...d, assigned_to: driverName, status: 'assigned' }
          : d
      )
    )
    setShowAssignModal(null)
    setDriverName('')
  }

  const handleUpdateStatus = async (delivery, newStatus) => {
    try {
      await api.patch(`/deliveries/${delivery.id}`, { status: newStatus })
    } catch {}
    setDeliveries((prev) =>
      prev.map((d) => d.id === delivery.id ? { ...d, status: newStatus } : d)
    )
    setActiveMenu(null)
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount / 1000)
  }

  const statCards = [
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'In Transit', value: stats.in_transit, icon: Truck, color: 'bg-purple-100 text-purple-600' },
    { label: 'Delivered', value: stats.delivered_today, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'bg-red-100 text-red-600' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
            <p className="text-sm text-gray-500">Manage pharmacy delivery orders.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-400 border-b border-gray-100">
          <MapPin className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm font-medium">Map integration coming soon</p>
          <p className="text-xs text-gray-400 mt-1">Google Maps will display delivery routes here</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Delivery Code</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-[#0FD452]" />
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
                    <MapPin className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Address</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Fee</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Assigned To</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>ETA</span>
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
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">No deliveries found</td>
                </tr>
              ) : (
                deliveries.map((delivery, index) => {
                  const st = statusConfig[delivery.status] || statusConfig.pending
                  const StatusIcon = st.icon
                  return (
                    <tr key={delivery.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Truck className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-mono font-medium text-gray-900">{delivery.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{delivery.order_code}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{delivery.customer}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{delivery.address}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatMoney(delivery.fee)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{delivery.assigned_to || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{delivery.eta || '—'}</td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                          className="btn-ghost"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === index && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                            <div className="absolute right-6 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                              {delivery.status === 'pending' && (
                                <button
                                  onClick={() => { setShowAssignModal(delivery.id); setActiveMenu(null) }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  Assign Driver
                                </button>
                              )}
                              {delivery.status === 'assigned' && (
                                <button
                                  onClick={() => handleUpdateStatus(delivery, 'picked_up')}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Package className="w-4 h-4" />
                                  Mark Picked Up
                                </button>
                              )}
                              {delivery.status === 'picked_up' && (
                                <button
                                  onClick={() => handleUpdateStatus(delivery, 'in_transit')}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Truck className="w-4 h-4" />
                                  Start Transit
                                </button>
                              )}
                              {delivery.status === 'in_transit' && (
                                <button
                                  onClick={() => handleUpdateStatus(delivery, 'delivered')}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Mark Delivered
                                </button>
                              )}
                              {delivery.status !== 'delivered' && delivery.status !== 'failed' && (
                                <button
                                  onClick={() => handleUpdateStatus(delivery, 'failed')}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Mark Failed
                                </button>
                              )}
                              <button
                                onClick={() => setActiveMenu(null)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Driver Modal */}
      {showAssignModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAssignModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Driver</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-3 mt-6 justify-end">
                <button
                  onClick={() => { setShowAssignModal(null); setDriverName('') }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDriver}
                  disabled={!driverName.trim()}
                  className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-600 disabled:bg-primary/50 text-gray-900 rounded-xl transition-colors"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
