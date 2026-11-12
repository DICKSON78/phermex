import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Hash,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Store,
  Truck,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/Modal'
import useConfirm from '../../hooks/useConfirm'
import { formatMoney } from '../../utils/currency'
import { textValue } from '../../utils/text'

const PAGE_SIZE = 10

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  dispatched: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const PAYMENT_STYLES = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-600',
  unpaid: 'bg-gray-100 text-gray-600',
}

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'dispatched',
  dispatched: 'delivered',
}

const NEXT_LABELS = {
  confirmed: 'Confirm order',
  packed: 'Mark packed',
  dispatched: 'Mark dispatched',
  delivered: 'Mark delivered',
}

const selectClass =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20'

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20'

const thClass = 'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500'

function ColumnHead({ icon: Icon, label, className = '' }) {
  return (
    <th className={`${thClass} ${className}`}>
      <div className={`flex items-center gap-1.5 ${className.includes('text-right') ? 'justify-end' : ''}`}>
        <Icon className="h-3.5 w-3.5 text-[#0FD452]" />
        <span>{label}</span>
      </div>
    </th>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {STATUS_LABELS[status] || status || 'Unknown'}
    </span>
  )
}

function PaymentBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        PAYMENT_STYLES[status] || PAYMENT_STYLES.unpaid
      }`}
    >
      {status || 'unpaid'}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, hint, tone = 'text-[#000F14]' }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0FD452]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminWholesaleOrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const supplierFilter = searchParams.get('wholesaler') || searchParams.get('wholesaler_id') || ''
  const [confirm, confirmDialog] = useConfirm()

  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0, total_value: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [busyId, setBusyId] = useState(null)

  const [advanceOrder, setAdvanceOrder] = useState(null)
  const [advanceForm, setAdvanceForm] = useState({ tracking_number: '', delivery_partner: '', notes: '' })
  const [advanceSaving, setAdvanceSaving] = useState(false)

  const [paidOrder, setPaidOrder] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ payment_reference: '', notes: '' })
  const [paymentSaving, setPaymentSaving] = useState(false)

  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true)
    try {
      const { data } = await api.get('/admin/wholesale-orders', {
        params: { status: statusFilter || undefined, per_page: 200 },
      })
      const list = data?.data
      setOrders(Array.isArray(list) ? list : [])
      setStats(data?.stats || { total: 0, active: 0, delivered: 0, total_value: 0 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load wholesale orders')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, paymentFilter, supplierFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((order) => {
      if (supplierFilter && String(order.wholesaler_id) !== String(supplierFilter)) return false
      if (paymentFilter && (order.payment_status || 'unpaid') !== paymentFilter) return false
      if (!q) return true
      return [order.order_id, order.pharmacy_name, order.wholesaler_name, order.tracking_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [orders, search, paymentFilter, supplierFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const openAdvance = (order) => {
    setAdvanceOrder(order)
    setAdvanceForm({ tracking_number: order.tracking_number || '', delivery_partner: order.delivery_partner || '', notes: '' })
  }

  const saveAdvance = async (event) => {
    event.preventDefault()
    if (!advanceOrder) return
    const target = NEXT_STATUS[advanceOrder.status]
    if (!target) return
    setAdvanceSaving(true)
    try {
      await api.post(`/admin/wholesale-orders/${advanceOrder.id}/status`, {
        status: target,
        tracking_number: advanceForm.tracking_number || undefined,
        delivery_partner: advanceForm.delivery_partner || undefined,
        notes: advanceForm.notes || undefined,
      })
      toast.success(`Order marked ${STATUS_LABELS[target].toLowerCase()}`)
      setAdvanceOrder(null)
      await load(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update order')
    } finally {
      setAdvanceSaving(false)
    }
  }

  const cancelOrder = async (order) => {
    const ok = await confirm({
      title: 'Cancel order?',
      message: `Order ${order.order_id} will be cancelled and reserved stock will be returned to the supplier.`,
      confirmText: 'Cancel order',
      variant: 'danger',
    })
    if (!ok) return
    setBusyId(order.id)
    try {
      await api.post(`/admin/wholesale-orders/${order.id}/status`, {
        status: 'cancelled',
        cancellation_reason: 'Cancelled by administrator',
      })
      toast.success('Order cancelled and stock restored')
      await load(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not cancel order')
    } finally {
      setBusyId(null)
    }
  }

  const openPayment = (order) => {
    setPaidOrder(order)
    setPaymentForm({ payment_reference: order.payment_reference || '', notes: '' })
  }

  const savePayment = async (event) => {
    event.preventDefault()
    if (!paidOrder) return
    setPaymentSaving(true)
    try {
      await api.post(`/admin/wholesale-orders/${paidOrder.id}/mark-paid`, {
        payment_reference: paymentForm.payment_reference || undefined,
        notes: paymentForm.notes || undefined,
      })
      toast.success('Payment recorded')
      setPaidOrder(null)
      await load(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not record payment')
    } finally {
      setPaymentSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-xl bg-white" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-white" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Store className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wholesale orders</h1>
            <p className="text-sm text-gray-500">
              Oversight of every pharmacy order, from confirmation through delivery.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => load(true)} className="btn-secondary" disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <Link to="/dashboard/wholesale-marketplace" className="btn-primary">
            <Store className="h-4 w-4" />
            Wholesale marketplace
          </Link>
        </div>
      </div>

      {supplierFilter && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#0FD452]/30 bg-[#0FD452]/5 px-4 py-3 text-sm text-[#0a8f3c]">
          <span>Showing orders for supplier {supplierFilter}.</span>
          <Link to="/dashboard/wholesale-orders-admin" className="font-semibold underline">
            Clear filter
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Package} label="Total orders" value={stats.total ?? orders.length} />
        <StatCard
          icon={Clock}
          label="In progress"
          value={stats.active ?? 0}
          hint="Pending, confirmed, packed or dispatched"
          tone="text-amber-600"
        />
        <StatCard icon={Truck} label="Delivered" value={stats.delivered ?? 0} tone="text-green-600" />
        <StatCard icon={CreditCard} label="Order value" value={formatMoney(stats.total_value || 0)} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, pharmacy, supplier or tracking..."
              className={`${inputClass} pl-10`}
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {Object.keys(STATUS_LABELS).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className={selectClass}>
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <ShoppingBagIcon className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">
            {orders.length === 0 ? 'No wholesale orders yet' : 'No orders match your filters'}
          </h3>
          <p className="text-sm text-gray-500">
            {orders.length === 0
              ? 'Orders placed by pharmacies through the marketplace will appear here.'
              : 'Try a different search, status or payment filter.'}
          </p>
          {orders.length === 0 && (
            <Link to="/dashboard/wholesale-marketplace" className="btn-primary mt-5">
              <Store className="h-4 w-4" />
              Open marketplace
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="bg-gray-50">
                  <ColumnHead icon={Hash} label="Order" />
                  <ColumnHead icon={Package} label="Pharmacy" />
                  <ColumnHead icon={Truck} label="Supplier" />
                  <ColumnHead icon={Zap} label="Status" />
                  <ColumnHead icon={CreditCard} label="Payment" />
                  <ColumnHead icon={Package} label="Total" />
                  <ColumnHead icon={Clock} label="Expected" />
                  <ColumnHead icon={Truck} label="Tracking" />
                  <ColumnHead icon={Eye} label="Actions" className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer transition-colors hover:bg-[#0FD452]/5"
                    onClick={() => navigate(`/dashboard/wholesale-orders-admin/${order.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-semibold text-[#000F14]">{order.order_id}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">Placed {formatDate(order.ordered_at || order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{textValue(order.pharmacy_name)}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{order.delivery_address || 'No address'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{textValue(order.wholesaler_name)}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{order.shipment_method || 'standard'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PaymentBadge status={order.payment_status} />
                      <p className="mt-0.5 text-[11px] capitalize text-gray-400">{order.payment_method || 'cash'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#000F14]">
                      {formatMoney(order.total_amount || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.expected_delivery_date)}</td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-gray-600">{order.tracking_number || '—'}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{order.delivery_partner || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/dashboard/wholesale-orders-admin/${order.id}`)}
                          className="btn-icon-primary"
                          title="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {NEXT_STATUS[order.status] && (
                          <button
                            onClick={() => openAdvance(order)}
                            disabled={busyId === order.id}
                            className="btn-icon-green"
                            title={NEXT_LABELS[NEXT_STATUS[order.status]]}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => openPayment(order)}
                            disabled={busyId === order.id}
                            className="btn-ghost"
                            title="Record payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        {!['delivered', 'cancelled'].includes(order.status) && (
                          <button
                            onClick={() => cancelOrder(order)}
                            disabled={busyId === order.id}
                            className="btn-ghost hover:!text-red-600"
                            title="Cancel order"
                          >
                            {busyId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-sm text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-ghost"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={Boolean(advanceOrder)}
        onClose={() => setAdvanceOrder(null)}
        title={advanceOrder ? NEXT_LABELS[NEXT_STATUS[advanceOrder.status]] : 'Update order'}
        subtitle={advanceOrder ? `${advanceOrder.order_id} · ${textValue(advanceOrder.pharmacy_name)}` : ''}
      >
        {advanceOrder && (
          <form onSubmit={saveAdvance} className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Moving from <span className="font-semibold capitalize">{advanceOrder.status}</span> to{' '}
              <span className="font-semibold capitalize">{NEXT_STATUS[advanceOrder.status]}</span>.
            </div>
            {NEXT_STATUS[advanceOrder.status] === 'dispatched' && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Tracking number</span>
                  <input
                    value={advanceForm.tracking_number}
                    onChange={(event) => setAdvanceForm((prev) => ({ ...prev, tracking_number: event.target.value }))}
                    placeholder="e.g. TZ-4587-0021"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-600">Delivery partner</span>
                  <input
                    value={advanceForm.delivery_partner}
                    onChange={(event) => setAdvanceForm((prev) => ({ ...prev, delivery_partner: event.target.value }))}
                    placeholder="e.g. Supplier delivery"
                    className={inputClass}
                  />
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Internal note (optional)</span>
              <textarea
                value={advanceForm.notes}
                onChange={(event) => setAdvanceForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className={inputClass}
                placeholder="Add a note for the audit timeline"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAdvanceOrder(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={advanceSaving} className="btn-primary">
                {advanceSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {NEXT_LABELS[NEXT_STATUS[advanceOrder.status]]}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(paidOrder)}
        onClose={() => setPaidOrder(null)}
        title="Record payment"
        subtitle={paidOrder ? `${paidOrder.order_id} · ${formatMoney(paidOrder.total_amount || 0)}` : ''}
      >
        {paidOrder && (
          <form onSubmit={savePayment} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Payment reference</span>
              <input
                value={paymentForm.payment_reference}
                onChange={(event) => setPaymentForm((prev) => ({ ...prev, payment_reference: event.target.value }))}
                placeholder="Bank slip, mobile money or receipt number"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Note (optional)</span>
              <textarea
                value={paymentForm.notes}
                onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className={inputClass}
                placeholder="Anything the finance team should know"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setPaidOrder(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={paymentSaving} className="btn-primary">
                {paymentSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Mark as paid
              </button>
            </div>
          </form>
        )}
      </Modal>

      {confirmDialog}
    </div>
  )
}

function ShoppingBagIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
