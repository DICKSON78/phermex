import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, ShoppingCart, Phone, Mail, Calendar, MapPin,
  AlertTriangle, FileText, ClipboardList, User, Users,
  Package, DollarSign, CreditCard, CheckCircle, Building2,
} from 'lucide-react'
import { toArray } from '../../utils/safeData'
import api from '../../services/api'
import { currentBase } from '../../utils/roles'

const statusColors = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  dispensed: 'bg-green-100 text-green-700',
  active: 'bg-blue-100 text-blue-700',
  expired: 'bg-gray-100 text-gray-500',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-green-100 text-green-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
}

const paymentColors = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-orange-100 text-orange-700',
  refunded: 'bg-purple-100 text-purple-700',
}

function normalizeCustomer(raw) {
  return {
    ...raw,
    name: raw.full_name || raw.name || 'Unknown',
    code: raw.customer_code || raw.code || '',
    gender: raw.gender || 'N/A',
  }
}

function normalizeOrder(raw) {
  return {
    ...raw,
    code: raw.order_code || raw.code || raw.id,
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : (raw.date || '—'),
    items: raw.items_count || raw.items || (raw.items_detail ? raw.items_detail.length : 0),
    total: Number(raw.total_amount || raw.total || 0),
    payment_status: raw.payment_status || 'pending',
    status: raw.order_status || raw.status || 'pending',
  }
}

function normalizeRx(raw) {
  return {
    ...raw,
    code: raw.prescription_code || raw.code || raw.id,
    doctor: raw.doctor_name || raw.doctor || '—',
    hospital: raw.hospital_name || raw.hospital || '—',
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : (raw.date || '—'),
    status: raw.status || 'pending',
    dispensed_date: raw.dispensed_date || null,
  }
}

export default function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const base = currentBase()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('purchases')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const custRes = await api.get(`/customers/${id}`)
      const raw = custRes.data.customer || custRes.data.data?.customer || custRes.data.data || custRes.data
      const normalized = normalizeCustomer(raw)
      setCustomer(normalized)

      const customerOrders = toArray(raw.orders)
      setOrders(customerOrders.map(normalizeOrder))

      try {
        const rxRes = await api.get(`/customers/${id}/prescriptions`)
        const rxData = rxRes.data.prescriptions || rxRes.data.data || rxRes.data
        setPrescriptions(toArray(rxData).map(normalizeRx))
      } catch {
        setPrescriptions([])
      }
    } catch {
      setCustomer(null)
      setOrders([])
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(Number(amount) || 0)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Customer not found</p>
        <button onClick={() => navigate(`${base}/customers`)} className="text-primary mt-2">Go back</button>
      </div>
    )
  }

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`${base}/customers`)}
          className="btn-ghost"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#0FD452]" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
          <p className="text-sm text-gray-500">View customer profile and transaction history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${base}/customers/${id}/edit`)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-dark font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Customer
          </button>
          <button
            onClick={() => navigate(`${base}/pos`, { state: { customerId: customer.id, customerName: customer.name } })}
            className="btn-primary"
          >
            <ShoppingCart className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
              <p className="text-sm font-medium text-dark">{customer.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Phone</p>
              <p className="text-sm font-medium text-dark">{customer.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <p className="text-sm font-medium text-dark">{customer.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Date of Birth</p>
              <p className="text-sm font-medium text-dark">{customer.dob || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-green-600">{(customer.gender || 'N').charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Gender</p>
              <p className="text-sm font-medium text-dark">{customer.gender}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-600">ID</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Customer Code</p>
              <p className="text-sm font-mono font-medium text-dark">{customer.code}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Allergies</p>
              <p className="text-sm font-medium text-dark">{customer.allergies || 'None'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Medical Conditions</p>
              <p className="text-sm font-medium text-dark">{customer.medical_conditions || 'None'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'purchases'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-dark'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Purchase History
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'prescriptions'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-dark'
          }`}
        >
          <FileText className="w-4 h-4" />
          Prescriptions
        </button>
      </div>

      {/* Purchase History Tab */}
      {activeTab === 'purchases' && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-dark">Purchase History</h3>
            <span className="text-sm text-gray-500">Total Spent: <span className="font-bold text-dark">{formatMoney(totalSpent)}</span></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Order Code</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Date</span>
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
                      <span>Payment Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Status</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer" onClick={() => navigate(`${base}/orders/${order.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <ClipboardList className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-mono font-medium text-dark">{order.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.items} items</td>
                      <td className="px-6 py-4 text-sm font-medium text-dark">{formatMoney(order.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentColors[order.payment_status] || 'bg-gray-100 text-gray-500'}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-dark">Prescriptions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>RX Code</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Doctor</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Hospital</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Date</span>
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
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Dispensed Date</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No prescriptions found</td>
                  </tr>
                ) : (
                  prescriptions.map((rx) => (
                    <tr key={rx.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <FileText className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-mono font-medium text-dark">{rx.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rx.doctor}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rx.hospital}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rx.date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[rx.status] || 'bg-gray-100 text-gray-500'}`}>
                          {rx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rx.dispensed_date || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
