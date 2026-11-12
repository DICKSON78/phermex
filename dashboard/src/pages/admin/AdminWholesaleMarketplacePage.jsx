import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Ban,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Hash,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  Truck,
  User as UserIcon,
  Warehouse,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/Modal'
import useConfirm from '../../hooks/useConfirm'
import { formatMoney } from '../../utils/currency'
import { textValue } from '../../utils/text'

const PAGE_SIZE = 10

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-600',
}

const STATUS_LABELS = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
  suspended: 'Suspended',
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
        STATUS_STYLES[status] || STATUS_STYLES.inactive
      }`}
    >
      {STATUS_LABELS[status] || status || 'Unknown'}
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

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0FD452]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className={`mt-0.5 break-words text-sm text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>
          {textValue(value)}
        </p>
      </div>
    </div>
  )
}

export default function AdminWholesaleMarketplacePage() {
  const navigate = useNavigate()
  const [confirm, confirmDialog] = useConfirm()

  const [suppliers, setSuppliers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 })
  const [orderStats, setOrderStats] = useState({ total: 0, active: 0, delivered: 0, total_value: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true)
    try {
      const [supplierRes, orderRes] = await Promise.all([
        api.get('/admin/wholesalers'),
        api.get('/admin/wholesale-orders', { params: { per_page: 1 } }),
      ])
      const list = supplierRes.data?.data
      setSuppliers(Array.isArray(list) ? list : [])
      setStats(supplierRes.data?.stats || { total: 0, active: 0, pending: 0, suspended: 0 })
      setOrderStats(orderRes.data?.stats || { total: 0, active: 0, delivered: 0, total_value: 0 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load the wholesale marketplace')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, typeFilter])

  const catalogItems = useMemo(
    () => suppliers.reduce((sum, supplier) => sum + Number(supplier.inventory_count || 0), 0),
    [suppliers]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return suppliers.filter((supplier) => {
      if (statusFilter && supplier.status !== statusFilter) return false
      if (typeFilter && supplier.business_type !== typeFilter) return false
      if (!q) return true
      return [
        supplier.name,
        supplier.wholesaler_id,
        supplier.email,
        supplier.phone,
        supplier.contact_person,
        supplier.license_number,
        supplier.city,
        supplier.region,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [suppliers, search, statusFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const changeStatus = async (supplier, status) => {
    const suspending = status === 'suspended'
    const ok = await confirm({
      title: suspending ? 'Suspend supplier?' : 'Activate supplier?',
      message: suspending
        ? `${supplier.name} will no longer appear in the marketplace or receive orders.`
        : `${supplier.name} will be visible to pharmacies in the marketplace.`,
      confirmText: suspending ? 'Suspend' : 'Activate',
      variant: suspending ? 'warning' : 'info',
    })
    if (!ok) return
    setBusyId(supplier.id)
    try {
      await api.patch(`/admin/wholesalers/${supplier.id}/status`, { status })
      toast.success(suspending ? 'Supplier suspended' : 'Supplier activated')
      setSelected((prev) => (prev?.id === supplier.id ? { ...prev, status } : prev))
      await load(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update supplier status')
    } finally {
      setBusyId(null)
    }
  }

  const deleteSupplier = async (supplier) => {
    const ok = await confirm({
      title: 'Delete supplier?',
      message: `${supplier.name} will be removed from the marketplace. Suppliers with existing orders cannot be deleted.`,
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    setBusyId(supplier.id)
    try {
      await api.delete(`/admin/wholesalers/${supplier.id}`)
      toast.success('Supplier deleted')
      setSelected(null)
      await load(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete supplier')
    } finally {
      setBusyId(null)
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
            <h1 className="text-2xl font-bold text-gray-900">Wholesale marketplace</h1>
            <p className="text-sm text-gray-500">
              Oversee every supplier, catalogue and order flowing into the pharmacy network.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => load(true)} className="btn-secondary" disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <Link to="/dashboard/wholesale-orders-admin" className="btn-secondary">
            <Package className="h-4 w-4" />
            Wholesale orders
          </Link>
          <Link to="/dashboard/wholesalers/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            New supplier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Truck}
          label="Suppliers"
          value={stats.total ?? suppliers.length}
          hint={`${stats.active ?? 0} active · ${stats.pending ?? 0} pending`}
        />
        <StatCard
          icon={Boxes}
          label="Catalogue items"
          value={catalogItems}
          hint="Across all suppliers"
          tone="text-blue-600"
        />
        <StatCard
          icon={Package}
          label="Wholesale orders"
          value={orderStats.total ?? 0}
          hint={`${orderStats.active ?? 0} in progress`}
          tone="text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Order value"
          value={formatMoney(orderStats.total_value || 0)}
          hint={`${orderStats.delivered ?? 0} delivered`}
          tone="text-green-600"
        />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search supplier by name, ID, contact or licence..."
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
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={selectClass}>
            <option value="">All supplier types</option>
            <option value="wholesaler">Wholesalers</option>
            <option value="distributor">Distributors</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Warehouse className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">
            {suppliers.length === 0 ? 'No suppliers yet' : 'No suppliers match your filters'}
          </h3>
          <p className="text-sm text-gray-500">
            {suppliers.length === 0
              ? 'Add the first supplier to start building the wholesale marketplace.'
              : 'Try a different search, status or supplier type.'}
          </p>
          {suppliers.length === 0 && (
            <Link to="/dashboard/wholesalers/new" className="btn-primary mt-5">
              <Plus className="h-4 w-4" />
              New supplier
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <ColumnHead icon={Truck} label="Supplier" />
                  <ColumnHead icon={Phone} label="Contact" />
                  <ColumnHead icon={MapPin} label="Location" />
                  <ColumnHead icon={Hash} label="Licence" />
                  <ColumnHead icon={Boxes} label="Catalogue" />
                  <ColumnHead icon={ShieldCheck} label="Status" />
                  <ColumnHead icon={Package} label="Orders" />
                  <ColumnHead icon={Eye} label="Actions" className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="cursor-pointer transition-colors hover:bg-[#0FD452]/5"
                    onClick={() => setSelected(supplier)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Truck className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#000F14]">{supplier.name}</p>
                          <p className="font-mono text-xs text-gray-400">{supplier.wholesaler_id}</p>
                          <p className="mt-0.5 text-[11px] capitalize text-gray-400">
                            {supplier.business_type || 'wholesaler'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{supplier.contact_person || '—'}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        {supplier.contact_phone || supplier.phone || '—'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        {supplier.email || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="flex items-center gap-1 text-sm text-gray-800">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {supplier.city || '—'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {[supplier.region, supplier.country].filter(Boolean).join(', ') || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-gray-700">{supplier.license_number || '—'}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">Reg: {supplier.registration_number || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#000F14]">{supplier.inventory_count || 0} items</p>
                      <p className="text-[11px] text-gray-400">
                        Min {formatMoney(supplier.minimum_order_amount || 0)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={supplier.status} />
                      {Number(supplier.rating) > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {Number(supplier.rating).toFixed(1)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#000F14]">{supplier.orders_count || 0}</p>
                      <p className="text-[11px] text-gray-400">total orders</p>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelected(supplier)} className="btn-icon-primary" title="View details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/wholesalers/${supplier.id}/catalog`)}
                          className="btn-ghost"
                          title="Manage catalogue"
                        >
                          <Boxes className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/wholesalers/${supplier.id}/edit`)}
                          className="btn-icon-blue"
                          title="Edit supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {supplier.status === 'active' ? (
                          <button
                            onClick={() => changeStatus(supplier, 'suspended')}
                            disabled={busyId === supplier.id}
                            className="btn-ghost"
                            title="Suspend supplier"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => changeStatus(supplier, 'active')}
                            disabled={busyId === supplier.id}
                            className="btn-ghost"
                            title="Activate supplier"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteSupplier(supplier)}
                          disabled={busyId === supplier.id}
                          className="btn-ghost hover:!text-red-600"
                          title="Delete supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected?.wholesaler_id}
        maxWidth="max-w-3xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
                {selected.business_type || 'wholesaler'}
              </span>
              {Number(selected.rating) > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {Number(selected.rating).toFixed(1)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow icon={UserIcon} label="Contact person" value={selected.contact_person} />
              <InfoRow icon={Phone} label="Phone" value={selected.contact_phone || selected.phone} />
              <InfoRow icon={Mail} label="Email" value={selected.email} />
              <InfoRow icon={MapPin} label="Location" value={[selected.city, selected.region, selected.country].filter(Boolean).join(', ')} />
              <InfoRow icon={Hash} label="Licence" value={selected.license_number} mono />
              <InfoRow icon={ShieldCheck} label="Registration" value={selected.registration_number} mono />
              <InfoRow icon={Landmark} label="Bank" value={[selected.bank_name, selected.bank_account].filter(Boolean).join(' · ')} />
              <InfoRow icon={Truck} label="Delivery fee" value={formatMoney(selected.delivery_fee || 0)} />
              <InfoRow icon={Truck} label="Express fee" value={formatMoney(selected.express_delivery_fee || 0)} />
              <InfoRow icon={Package} label="Minimum order" value={formatMoney(selected.minimum_order_amount || 0)} />
              <InfoRow icon={Boxes} label="Catalogue" value={`${selected.inventory_count || 0} items`} />
              <InfoRow icon={Package} label="Orders" value={`${selected.orders_count || 0} orders`} />
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
              <button onClick={() => setSelected(null)} className="btn-secondary">
                Close
              </button>
              <Link
                to={`/dashboard/wholesale-orders-admin?wholesaler=${selected.id}`}
                onClick={() => setSelected(null)}
                className="btn-secondary"
              >
                <Package className="h-4 w-4" />
                View orders
              </Link>
              <Link
                to={`/dashboard/wholesalers/${selected.id}/catalog`}
                onClick={() => setSelected(null)}
                className="btn-secondary"
              >
                <Boxes className="h-4 w-4" />
                Catalogue
              </Link>
              <Link
                to={`/dashboard/wholesalers/${selected.id}/edit`}
                onClick={() => setSelected(null)}
                className="btn-primary"
              >
                <Edit className="h-4 w-4" />
                Edit supplier
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {confirmDialog}
    </div>
  )
}
