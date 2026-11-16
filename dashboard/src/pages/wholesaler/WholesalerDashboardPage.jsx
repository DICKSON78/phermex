import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Package, Truck, AlertTriangle, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { PageHeader, StatCard, Panel, Spinner, formatMoney, formatNumber } from '../wholesaler/WholesalerUI'

export default function WholesalerDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: payload } = await api.get('/wholesaler-portal/overview')
      setData(payload)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner />
  const s = data?.stats || {}
  const status = data?.wholesaler?.status
  const statusNotice = {
    pending: {
      tone: 'border-amber-200 bg-amber-50 text-amber-800',
      text: 'Your application is pending review. You can prepare your catalogue now; your storefront goes live once a platform admin approves your licence and banking details.',
    },
    inactive: {
      tone: 'border-gray-200 bg-gray-50 text-gray-700',
      text: 'Your supplier account is inactive. Contact platform support to reactivate it before receiving pharmacy orders.',
    },
    suspended: {
      tone: 'border-red-200 bg-red-50 text-red-700',
      text: 'Your supplier account is suspended. Contact platform support to resolve it before receiving pharmacy orders.',
    },
  }[status]
  return (
    <div>
      <PageHeader title="Wholesaler dashboard" subtitle="Manage incoming pharmacy orders, stock and manufacturer purchases." />
      {statusNotice && (
        <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${statusNotice.tone}`}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{statusNotice.text}</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Pharmacy orders" value={formatNumber(s.pharmacy_orders_total)} hint={`${s.pharmacy_orders_active || 0} active`} />
        <StatCard icon={Truck} label="Delivered" value={formatNumber(s.pharmacy_orders_delivered)} hint={formatMoney(s.pharmacy_order_value)} />
        <StatCard icon={ShoppingCart} label="Manufacturer orders" value={formatNumber(s.manufacturer_orders_total)} hint={`${s.manufacturer_orders_active || 0} active`} />
        <StatCard icon={AlertTriangle} label="Low stock items" value={formatNumber(s.low_stock_items)} hint={`${formatNumber(s.total_stock)} units in stock`} tone={s.low_stock_items ? 'text-red-600' : 'text-[#0F9D58]'} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Link to="/dashboard/wholesaler/orders" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm">
          <Package className="mb-2 h-6 w-6 text-[#0FD452]" />
          <p className="font-bold text-[#000F14]">Pharmacy orders</p>
          <p className="text-sm text-gray-500">Confirm, pack, dispatch and deliver.</p>
        </Link>
        <Link to="/dashboard/wholesaler/purchase-orders" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm">
          <ShoppingCart className="mb-2 h-6 w-6 text-[#0FD452]" />
          <p className="font-bold text-[#000F14]">Purchase from manufacturers</p>
          <p className="text-sm text-gray-500">Browse manufacturer catalogues and place orders.</p>
        </Link>
        <Link to="/dashboard/wholesaler/inventory" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm">
          <Store className="mb-2 h-6 w-6 text-[#0FD452]" />
          <p className="font-bold text-[#000F14]">Inventory</p>
          <p className="text-sm text-gray-500">Manage your distribution stock.</p>
        </Link>
        <Link to="/dashboard/wholesaler/manufacturers" className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm">
          <Truck className="mb-2 h-6 w-6 text-[#0FD452]" />
          <p className="font-bold text-[#000F14]">Manufacturers</p>
          <p className="text-sm text-gray-500">View active manufacturers and their catalogues.</p>
        </Link>
      </div>
      <Panel title="Recent pharmacy orders" className="mt-5">
        {(data?.recent_orders || []).length === 0 ? <p className="text-sm text-gray-500">No recent orders.</p> : (
          <div className="space-y-2">
            {(data?.recent_orders || []).map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="font-semibold text-[#000F14]">{o.order_id}</p>
                  <p className="text-xs text-gray-500">{o.pharmacy_name} · {o.status}</p>
                </div>
                <p className="font-semibold">{formatMoney(o.total_amount)}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
