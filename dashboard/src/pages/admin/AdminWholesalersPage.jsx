import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ban,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Hash,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Truck,
  User,
  Warehouse,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'
import Modal from '../../components/Modal'
import useConfirm from '../../hooks/useConfirm'

const PAGE_SIZE = 10

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-600',
}

const STATUS_FALLBACK = {
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
        <Icon className="w-3.5 h-3.5 text-[#0FD452]" />
        <span>{label}</span>
      </div>
    </th>
  )
}

function StatusBadge({ status, label }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STATUS_STYLES[status] || STATUS_STYLES.inactive
      }`}
    >
      {label}
    </span>
  )
}

function Field({ label, required, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0FD452]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className={`mt-0.5 break-words text-sm text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</p>
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

export default function AdminWholesalersPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [confirm, confirmDialog] = useConfirm()

  const [wholesalers, setWholesalers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [selected, setSelected] = useState(null)

  const statusLabel = (status) => t(`wholesalers.status.${status}`, STATUS_FALLBACK[status] || status)

  const fetchWholesalers = async () => {
    try {
      const response = await api.get('/admin/wholesalers')
      const list = response.data?.data || []
      setWholesalers(Array.isArray(list) ? list : [])
      if (response.data?.stats) setStats(response.data.stats)
    } catch {
      setWholesalers([])
      toast.error(t('wholesalers.loadError', 'Could not load wholesalers'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWholesalers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, cityFilter])

  const cities = useMemo(() => [...new Set(wholesalers.map((w) => w.city).filter(Boolean))].sort(), [wholesalers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return wholesalers.filter((w) => {
      if (statusFilter && w.status !== statusFilter) return false
      if (cityFilter && w.city !== cityFilter) return false
      if (q) {
        const haystack = [w.name, w.wholesaler_id, w.email, w.phone, w.contact_person, w.license_number, w.city, w.region]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [wholesalers, statusFilter, cityFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const openCreate = () => navigate('/dashboard/wholesalers/new')
  const openEdit = (wholesaler) => navigate(`/dashboard/wholesalers/${wholesaler.id}/edit`)
  const openCatalog = (wholesaler) => navigate(`/dashboard/wholesalers/${wholesaler.id}/catalog`)

  const changeStatus = async (wholesaler, status) => {
    const suspending = status === 'suspended'
    const ok = await confirm({
      title: suspending ? t('wholesalers.suspendTitle', 'Suspend wholesaler?') : t('wholesalers.activateTitle', 'Activate wholesaler?'),
      message: suspending
        ? `${wholesaler.name} ${t('wholesalers.suspendMessage', 'will no longer be able to receive orders.')}`
        : `${wholesaler.name} ${t('wholesalers.activateMessage', 'will be marked active.')}`,
      confirmText: suspending ? t('wholesalers.suspend', 'Suspend') : t('wholesalers.activate', 'Activate'),
      variant: suspending ? 'warning' : 'info',
    })
    if (!ok) return
    try {
      await api.patch(`/admin/wholesalers/${wholesaler.id}/status`, { status })
      toast.success(
        suspending
          ? t('wholesalers.suspendedToast', 'Wholesaler suspended')
          : t('wholesalers.activatedToast', 'Wholesaler activated')
      )
      setSelected((prev) => (prev?.id === wholesaler.id ? { ...prev, status } : prev))
      await fetchWholesalers()
    } catch (error) {
      toast.error(error.response?.data?.message || t('wholesalers.statusError', 'Could not update status'))
    }
  }

  const deleteWholesaler = async (wholesaler) => {
    const ok = await confirm({
      title: t('wholesalers.deleteTitle', 'Delete wholesaler?'),
      message: `${wholesaler.name} ${t(
        'wholesalers.deleteMessage',
        'will be removed. Wholesalers with existing orders cannot be deleted.'
      )}`,
      confirmText: t('common.delete', 'Delete'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/admin/wholesalers/${wholesaler.id}`)
      toast.success(t('wholesalers.deleted', 'Wholesaler deleted'))
      setSelected(null)
      await fetchWholesalers()
    } catch (error) {
      toast.error(error.response?.data?.message || t('wholesalers.deleteError', 'Could not delete wholesaler'))
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.items.wholesalers', 'Wholesalers')}</h1>
            <p className="text-sm text-gray-500">
              {t('wholesalers.subtitle', 'Review, approve and manage wholesalers supplying the pharmacy network.')}
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          {t('wholesalers.new', 'New Wholesaler')}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{t('wholesalers.stats.total', 'Total')}</p>
          <p className="mt-1 text-2xl font-bold text-[#000F14]">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{t('wholesalers.stats.active', 'Active')}</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{t('wholesalers.stats.pending', 'Pending')}</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{t('wholesalers.stats.suspended', 'Suspended')}</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('wholesalers.searchPlaceholder', 'Search by name, ID, contact or licence...')}
              className={`${inputClass} pl-10`}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">{t('wholesalers.allStatuses', 'All Statuses')}</option>
            {Object.keys(STATUS_STYLES).map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={selectClass}>
            <option value="">{t('wholesalers.allCities', 'All Cities')}</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Warehouse className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">
            {wholesalers.length === 0
              ? t('wholesalers.emptyTitle', 'No wholesalers yet')
              : t('wholesalers.noMatches', 'No wholesalers found')}
          </h3>
          <p className="text-sm text-gray-500">
            {wholesalers.length === 0
              ? t('wholesalers.emptySub', 'Add the first wholesaler to start managing your supply network.')
              : t('wholesalers.emptyFilterSub', 'Try adjusting your filters')}
          </p>
          {wholesalers.length === 0 && (
            <button onClick={openCreate} className="btn-primary mt-5">
              <Plus className="h-4 w-4" />
              {t('wholesalers.new', 'New Wholesaler')}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <ColumnHead icon={Truck} label={t('wholesalers.col.wholesaler', 'Wholesaler')} />
                  <ColumnHead icon={User} label={t('wholesalers.col.contact', 'Contact')} />
                  <ColumnHead icon={MapPin} label={t('wholesalers.col.location', 'Location')} />
                  <ColumnHead icon={Hash} label={t('wholesalers.col.licence', 'Licence')} />
                  <ColumnHead icon={Building2} label={t('wholesalers.col.orders', 'Orders')} />
                  <ColumnHead icon={ShieldCheck} label={t('wholesalers.col.status', 'Status')} />
                  <ColumnHead icon={Zap} label={t('common.actions', 'Actions')} className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((w) => (
                  <tr
                    key={w.id}
                    className="cursor-pointer transition-colors hover:bg-[#0FD452]/5"
                    onClick={() => setSelected(w)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Truck className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#000F14]">{w.name}</p>
                          <p className="font-mono text-xs text-gray-400">{w.wholesaler_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{w.contact_person || '—'}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        {w.contact_phone || w.phone || '—'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        {w.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="flex items-center gap-1 text-sm text-gray-800">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {w.city}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{[w.region, w.country].filter(Boolean).join(', ')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-gray-700">{w.license_number}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {t('wholesalers.regShort', 'Reg')}: {w.registration_number || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#000F14]">{w.orders_count || 0}</p>
                      <p className="text-[11px] text-gray-400">
                        {w.inventory_count || 0} {t('wholesalers.inventoryItems', 'inventory items')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={w.status} label={statusLabel(w.status)} />
                      {Number(w.rating) > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {Number(w.rating).toFixed(1)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelected(w)} className="btn-icon-primary" title={t('wholesalers.viewDetails', 'View')}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openCatalog(w)} className="btn-ghost" title="Catalog">
                          <Boxes className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(w)} className="btn-icon-blue" title={t('common.edit', 'Edit')}>
                          <Edit className="h-4 w-4" />
                        </button>
                        {w.status === 'active' ? (
                          <button onClick={() => changeStatus(w, 'suspended')} className="btn-ghost" title={t('wholesalers.suspend', 'Suspend')}>
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => changeStatus(w, 'active')} className="btn-ghost" title={t('wholesalers.activate', 'Activate')}>
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => deleteWholesaler(w)} className="btn-ghost hover:!text-red-600" title={t('common.delete', 'Delete')}>
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
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-ghost">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-sm text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        maxWidth="max-w-2xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={selected.status} label={statusLabel(selected.status)} />
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {Number(selected.rating || 0).toFixed(1)} {t('wholesalers.rating', 'rating')}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {t('wholesalers.joined', 'Joined')} {formatDate(selected.created_at)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{t('wholesalers.col.orders', 'Orders')}</p>
                <p className="mt-1 text-2xl font-bold text-[#000F14]">{selected.orders_count || 0}</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{t('wholesalers.inventory', 'Inventory')}</p>
                <p className="mt-1 text-2xl font-bold text-[#000F14]">{selected.inventory_count || 0}</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{t('wholesalers.onTime', 'On-time delivery')}</p>
                <p className="mt-1 text-2xl font-bold text-[#000F14]">
                  {Number(selected.on_time_delivery_rate || 0).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow icon={User} label={t('wholesalers.contactPerson', 'Contact person')} value={selected.contact_person} />
              <InfoRow icon={Phone} label={t('wholesalers.contactPhone', 'Contact phone')} value={selected.contact_phone || selected.phone} />
              <InfoRow icon={Mail} label={t('wholesalers.email', 'Email')} value={selected.email} />
              <InfoRow icon={Phone} label={t('wholesalers.businessPhone', 'Business phone')} value={selected.phone} />
              <InfoRow icon={MapPin} label={t('wholesalers.address', 'Address')} value={selected.address} />
              <InfoRow icon={MapPin} label={t('wholesalers.cityRegion', 'City / region')} value={[selected.city, selected.region].filter(Boolean).join(', ')} />
              <InfoRow icon={Hash} label={t('wholesalers.licence', 'Licence number')} value={selected.license_number} mono />
              <InfoRow icon={Receipt} label={t('wholesalers.regNumber', 'Registration number')} value={selected.registration_number} mono />
              <InfoRow icon={Receipt} label={t('wholesalers.taxId', 'Tax ID')} value={selected.tax_id} mono />
              <InfoRow icon={Landmark} label={t('wholesalers.bank', 'Bank')} value={[selected.bank_name, selected.bank_account].filter(Boolean).join(' · ')} />
              <InfoRow icon={Truck} label="Supplier type" value={selected.business_type || 'wholesaler'} />
              <InfoRow icon={Truck} label="Delivery fee" value={Number(selected.delivery_fee || 0).toFixed(2)} />
              <InfoRow icon={Truck} label="Express delivery fee" value={Number(selected.express_delivery_fee || 0).toFixed(2)} />
              <InfoRow icon={Receipt} label="Minimum order" value={Number(selected.minimum_order_amount || 0).toFixed(2)} />
              <InfoRow icon={Clock} label="Credit terms" value={selected.accepts_credit === false ? 'Credit not accepted' : `${Number(selected.payment_terms_days || 0)} days`} />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <button onClick={() => openEdit(selected)} className="btn-primary">
                <Edit className="h-4 w-4" />
                {t('common.edit', 'Edit')}
              </button>
              <button onClick={() => openCatalog(selected)} className="btn-secondary">
                <Boxes className="h-4 w-4 text-[#0FD452]" />
                Manage catalog
              </button>
              {selected.status === 'active' ? (
                <button onClick={() => changeStatus(selected, 'suspended')} className="btn-secondary">
                  <Ban className="h-4 w-4 text-amber-500" />
                  {t('wholesalers.suspend', 'Suspend')}
                </button>
              ) : (
                <button onClick={() => changeStatus(selected, 'active')} className="btn-secondary">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {t('wholesalers.activate', 'Activate')}
                </button>
              )}
              <button onClick={() => deleteWholesaler(selected)} className="btn-danger-outline ml-auto">
                <Trash2 className="h-4 w-4" />
                {t('common.delete', 'Delete')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {confirmDialog}
    </div>
  )
}
