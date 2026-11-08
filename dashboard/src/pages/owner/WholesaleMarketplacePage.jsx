import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Truck,
  Star,
  MapPin,
  Phone,
  CreditCard,
  Banknote,
  Package,
  Clock,
  ShieldCheck,
  ArrowRight,
  ClipboardList,
  Loader2,
  Store,
  Boxes,
  TrendingUp,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { formatMoney } from '../../utils/currency'
import { currentBase } from '../../utils/roles'
import { useAuth } from '../../contexts/AuthContext'

const TYPE_STYLES = {
  wholesaler: 'bg-[#0FD452]/10 text-[#0a8f3c]',
  distributor: 'bg-blue-100 text-blue-700',
}

function StatCard({ icon: Icon, label, value, tone = 'text-[#000F14]' }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <Icon className="h-4 w-4 text-[#0FD452]" />
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

export default function WholesaleMarketplacePage() {
  const navigate = useNavigate()
  const base = currentBase()
  const { pharmacyId } = useAuth()

  const [suppliers, setSuppliers] = useState([])
  const [stats, setStats] = useState({ active: 0, delivered: 0, total_value: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [supplierRes, orderRes] = await Promise.all([
          api.get('/wholesale-marketplace/wholesalers'),
          api.get('/wholesale-marketplace/orders', { params: { per_page: 1, pharmacy_id: pharmacyId || undefined } }),
        ])
        setSuppliers(Array.isArray(supplierRes.data?.data) ? supplierRes.data.data : [])
        setStats(orderRes.data?.stats || { active: 0, delivered: 0, total_value: 0, total: 0 })
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load the wholesale marketplace')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [pharmacyId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return suppliers.filter((supplier) => {
      if (typeFilter && supplier.business_type !== typeFilter) return false
      if (!q) return true
      return [supplier.name, supplier.city, supplier.region, supplier.business_type, supplier.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [suppliers, search, typeFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Store className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wholesale Marketplace</h1>
            <p className="text-sm text-gray-500">
              Order medicines in pieces, packs, boxes or cartons from verified suppliers.
            </p>
          </div>
        </div>
        <Link to={`${base}/wholesale-orders`} className="btn-primary">
          <ClipboardList className="h-4 w-4" />
          My wholesale orders
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Truck} label="Suppliers" value={suppliers.length} />
        <StatCard icon={Clock} label="Active orders" value={stats.active || 0} tone="text-blue-600" />
        <StatCard icon={ShieldCheck} label="Delivered" value={stats.delivered || 0} tone="text-green-600" />
        <StatCard icon={TrendingUp} label="Total value" value={formatMoney(stats.total_value || 0)} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search suppliers by name, city or type..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
          >
            <option value="">All supplier types</option>
            <option value="wholesaler">Wholesalers</option>
            <option value="distributor">Distributors</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Store className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">No suppliers found</h3>
          <p className="text-sm text-gray-500">Try a different search or supplier type.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((supplier) => (
            <div key={supplier.id} className="flex flex-col rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0FD452]/10">
                    <Truck className="h-5 w-5 text-[#0FD452]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[#000F14]">{supplier.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_STYLES[supplier.business_type] || TYPE_STYLES.wholesaler}`}>
                        {supplier.business_type}
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {[supplier.city, supplier.region].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-800">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {Number(supplier.rating || 0).toFixed(1)}
                  </p>
                  <p className="text-[11px] text-gray-400">{Number(supplier.on_time_delivery_rate || 0).toFixed(0)}% on time</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Catalog</p>
                  <p className="mt-0.5 flex items-center gap-1 font-semibold text-gray-800">
                    <Boxes className="h-3.5 w-3.5 text-[#0FD452]" />
                    {supplier.inventory_count || 0} items
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Delivery</p>
                  <p className="mt-0.5 font-semibold text-gray-800">{formatMoney(supplier.delivery_fee || 0)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Min order</p>
                  <p className="mt-0.5 font-semibold text-gray-800">{formatMoney(supplier.minimum_order_amount || 0)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Payment</p>
                  <p className="mt-0.5 flex items-center gap-1 font-semibold text-gray-800">
                    {supplier.accepts_credit ? (
                      <>
                        <CreditCard className="h-3.5 w-3.5 text-blue-500" /> Cash / Credit
                      </>
                    ) : (
                      <>
                        <Banknote className="h-3.5 w-3.5 text-green-600" /> Cash
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {supplier.phone || '—'}</span>
                {supplier.accepts_credit && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> {supplier.payment_terms_days || 0} day credit
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                <button
                  onClick={() => navigate(`${base}/wholesale-marketplace/${supplier.id}`)}
                  className="btn-primary flex-1 justify-center"
                >
                  <Package className="h-4 w-4" />
                  Browse catalog
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href={`tel:${supplier.phone || ''}`}
                  className="btn-secondary"
                  title="Call supplier"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
