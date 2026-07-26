import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Clock, CheckCircle, Truck, XCircle, Package, Pill,
  CreditCard, User, Calendar, FileText, Loader2, ClipboardList, Phone, Mail, DollarSign,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-cyan-100 text-cyan-700',
  dispensed: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const PAYMENT_STYLES = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
}

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']

export default function OrderDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/orders/${id}`)
      const data = res.data.order || toArray(res.data)
      setOrder(data)
    } catch {
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setUpdating(true)
    try {
      const payload = { order_status: newStatus }
      if (newStatus === 'confirmed') {
        payload.payment_status = 'paid'
        payload.payment_method = 'cash'
      }
      const res = await api.put(`/orders/${id}/status`, payload)
      setOrder(res.data.order || res.data)
      toast.success(`Order ${newStatus}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-gray-500">Order not found</p>
      </div>
    )
  }

  const status = order.order_status || order.status || 'pending'
  const currentStepIndex = STATUS_STEPS.indexOf(status)
  const orderCode = order.order_code || order.code || `#${order.id}`
  const customerName = order.user?.name || order.customer?.name || 'Walk-in'
  const customerPhone = order.user?.phone || order.customer?.phone || null
  const customerEmail = order.user?.email || null
  const processorName = order.processor?.name || '—'

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-TZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount || 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/owner/orders')}
          className="btn-ghost"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-[#0FD452]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
              {status}
            </span>
            {order.order_type && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-purple-100 text-purple-700">
                {order.order_type}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{orderCode}</p>
        </div>
      </div>

      {status !== 'cancelled' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= currentStepIndex
                      ? 'bg-[#0FD452] text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < currentStepIndex ? <CheckCircle className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium capitalize ${i <= currentStepIndex ? 'text-[#000F14]' : 'text-gray-400'}`}>
                    {step === 'out_for_delivery' ? 'On the Way' : step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-[#0FD452]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-[#000F14] mb-4">Order Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Order Code</p>
                <p className="text-sm font-medium text-[#000F14]">{orderCode}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm font-medium text-[#000F14] capitalize">{order.order_type || 'counter'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-[#000F14]">
                  {order.created_at ? new Date(order.created_at).toLocaleString('en-TZ') : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Processed By</p>
                <p className="text-sm font-medium text-[#000F14]">{processorName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-medium text-[#000F14]">{customerName}</p>
                {customerPhone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {customerPhone}
                  </p>
                )}
                {customerEmail && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" /> {customerEmail}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Payment</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#000F14] capitalize">{order.payment_method || '—'}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.payment_status || 'unpaid'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {order.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-[#000F14]">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#000F14] mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-[#000F14]">TZS {formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="font-medium text-[#000F14]">-TZS {formatCurrency(order.discount || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="font-medium text-[#000F14]">TZS {formatCurrency(order.tax || 0)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-[#000F14]">Grand Total</span>
              <span className="text-lg font-bold text-[#0FD452]">TZS {formatCurrency(order.total || order.grand_total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#000F14]">Order Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Drug</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Qty</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Unit Price</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Total</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((item, idx) => (
                <tr key={item.id || idx} className="transition-colors hover:bg-[#0FD452]/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                        <Pill className="h-4 w-4 text-[#0FD452]" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.drug?.name || item.drug_name || 'Drug'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">TZS {formatCurrency(item.unit_price)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">TZS {formatCurrency(item.total_price || item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {status !== 'cancelled' && status !== 'delivered' && (
        <div className="flex flex-wrap gap-3">
          {status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange('confirmed')}
                disabled={updating}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Order
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className="flex items-center gap-2 border border-red-300 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
          {status === 'confirmed' && (
            <>
              <button
                onClick={() => handleStatusChange('preparing')}
                disabled={updating}
                className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
                Start Preparing
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className="flex items-center gap-2 border border-red-300 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
          {status === 'preparing' && (
            <>
              <button
                onClick={() => handleStatusChange('ready')}
                disabled={updating}
                className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                Mark Ready
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className="flex items-center gap-2 border border-red-300 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
          {status === 'ready' && (
            <>
              <button
                onClick={() => handleStatusChange('out_for_delivery')}
                disabled={updating}
                className="flex items-center gap-2 bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Send for Delivery
              </button>
              <button
                onClick={() => handleStatusChange('delivered')}
                disabled={updating}
                className="flex items-center gap-2 bg-[#0FD452] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0CB844] transition-colors disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Mark Dispensed
              </button>
            </>
          )}
          {status === 'out_for_delivery' && (
            <button
              onClick={() => handleStatusChange('delivered')}
              disabled={updating}
              className="flex items-center gap-2 bg-[#0FD452] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0CB844] transition-colors disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark Delivered
            </button>
          )}
        </div>
      )}
    </div>
  )
}
