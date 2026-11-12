import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Loader2, Package, Truck, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import OrderFlowProgress, {
  PAYMENT_STATUS_STYLES,
  orderStatusLabel,
  orderStatusStyle,
} from '../../components/OrderFlowProgress'
import { PageHeader, Spinner, EmptyState, StatCard, formatMoney, formatDate } from '../wholesaler/WholesalerUI'

const TABS = [
  { value: 'all', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'dispatched', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function WholesalerPurchaseOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/wholesaler-portal/manufacturer-orders', { params: { status } })
      setOrders(data.data || [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async (order) => {
    if (!window.confirm(`Cancel purchase order ${order.order_id}?`)) return
    setBusy(order.id)
    try {
      await api.post(`/wholesaler-portal/manufacturer-orders/${order.id}/cancel`)
      toast.success('Order cancelled.')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not cancel.')
    } finally {
      setBusy(null)
    }
  }

  const receive = async (order) => {
    setBusy(order.id)
    try {
      await api.post(`/wholesaler-portal/manufacturer-orders/${order.id}/receive`)
      toast.success('Order received. Stock was added to your inventory.')
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not receive.')
    } finally {
      setBusy(null)
    }
  }

  const pageValue = useMemo(
    () => orders.reduce((sum, order) => (order.status === 'cancelled' ? sum : sum + Number(order.total_amount || 0)), 0),
    [orders],
  )

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        subtitle="Orders you placed with manufacturers, from confirmation to receiving stock."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Orders on this page" value={orders.length} />
        <StatCard
          icon={Clock}
          label="Awaiting confirmation"
          value={orders.filter((o) => o.status === 'pending').length}
          tone="text-amber-600"
        />
        <StatCard
          icon={Truck}
          label="On the way"
          value={orders.filter((o) => o.status === 'dispatched').length}
          tone="text-blue-700"
        />
        <StatCard
          icon={CheckCircle2}
          label="Delivered"
          value={orders.filter((o) => o.status === 'delivered').length}
          tone="text-[#0F9D58]"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              status === tab.value
                ? 'bg-[#0FD452] text-[#000F14]'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders"
          message={
            status !== 'all'
              ? 'No orders match this filter.'
              : 'Browse a manufacturer catalogue to place your first purchase order.'
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cancelled = order.status === 'cancelled'
            return (
              <div
                key={order.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/wholesaler/purchase-orders/${order.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/dashboard/wholesaler/purchase-orders/${order.id}`)
                  }
                }}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-[#000F14]">{order.order_id}</h2>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusStyle(order.status)}`}>
                        {orderStatusLabel('manufacturer', order.status)}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLES[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.payment_status || 'unpaid'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {order.manufacturer_name || 'Manufacturer'} · placed {formatDate(order.created_at)} · expected{' '}
                      {formatDate(order.expected_delivery_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#000F14]">{formatMoney(order.total_amount)}</p>
                    <p className="text-xs text-gray-400">{order.tracking_number || 'No tracking yet'}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50/80 px-3 py-3">
                  <OrderFlowProgress
                    type="manufacturer"
                    status={order.status}
                    compact
                    timestamps={{
                      pending: order.created_at,
                      confirmed: order.confirmed_at,
                      packed: order.packed_at,
                      dispatched: order.dispatched_at,
                      delivered: order.delivered_at,
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-gray-400">
                    {cancelled
                      ? `Cancelled${order.cancellation_reason ? ` · ${order.cancellation_reason}` : ''}`
                      : order.status === 'dispatched'
                        ? 'Delivered? Receive it to add stock to your inventory.'
                        : order.status === 'delivered'
                          ? 'Order complete · stock received'
                          : `Manufacturer: ${orderStatusLabel('manufacturer', order.status).toLowerCase()}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/wholesaler/purchase-orders/${order.id}`)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      View details
                    </button>
                    {order.status === 'dispatched' && (
                      <button
                        type="button"
                        disabled={busy === order.id}
                        onClick={() => receive(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0FD452] px-3 py-1.5 text-xs font-semibold text-[#000F14] disabled:opacity-60"
                      >
                        {busy === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Receive'}
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button
                        type="button"
                        disabled={busy === order.id}
                        onClick={() => cancel(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <p className="pt-1 text-right text-xs text-gray-400">
            Showing {orders.length} order{orders.length === 1 ? '' : 's'} · value on this page {formatMoney(pageValue)}
          </p>
        </div>
      )}
    </div>
  )
}
