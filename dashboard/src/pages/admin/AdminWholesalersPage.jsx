import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Truck,
  Warehouse,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

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

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  region: '',
  country: 'Tanzania',
  license_number: '',
  registration_number: '',
  tax_id: '',
  bank_name: '',
  bank_account: '',
  contact_person: '',
  contact_phone: '',
  status: 'pending',
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        STATUS_STYLES[status] || STATUS_STYLES.inactive
      }`}
    >
      {status === 'active' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'pending' && <RefreshCw className="h-3 w-3" />}
      {status === 'suspended' && <Ban className="h-3 w-3" />}
      {STATUS_LABELS[status] || status}
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

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20'

export default function AdminWholesalersPage() {
  const [wholesalers, setWholesalers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmStatus, setConfirmStatus] = useState(null)

  const pageSize = 10

  const fetchWholesalers = async () => {
    try {
      const response = await api.get('/admin/wholesalers')
      const list = response.data?.data || []
      setWholesalers(Array.isArray(list) ? list : [])
      if (response.data?.stats) setStats(response.data.stats)
    } catch {
      setWholesalers([])
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

  const cities = useMemo(
    () => [...new Set(wholesalers.map((w) => w.city).filter(Boolean))].sort(),
    [wholesalers]
  )

  const filtered = useMemo(() => {
    return wholesalers.filter((w) => {
      if (statusFilter && w.status !== statusFilter) return false
      if (cityFilter && w.city !== cityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [
          w.name,
          w.wholesaler_id,
          w.email,
          w.phone,
          w.contact_person,
          w.license_number,
          w.city,
          w.region,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [wholesalers, statusFilter, cityFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (wholesaler) => {
    setEditing(wholesaler)
    setForm({
      name: wholesaler.name || '',
      email: wholesaler.email || '',
      phone: wholesaler.phone || '',
      address: wholesaler.address || '',
      city: wholesaler.city || '',
      region: wholesaler.region || '',
      country: wholesaler.country || 'Tanzania',
      license_number: wholesaler.license_number || '',
      registration_number: wholesaler.registration_number || '',
      tax_id: wholesaler.tax_id || '',
      bank_name: wholesaler.bank_name || '',
      bank_account: wholesaler.bank_account || '',
      contact_person: wholesaler.contact_person || '',
      contact_phone: wholesaler.contact_phone || '',
      status: wholesaler.status || 'pending',
    })
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
    setEditing(null)
    setFormError('')
  }

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submitForm = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      if (editing) {
        await api.put(`/admin/wholesalers/${editing.id}`, form)
        toast.success('Wholesaler updated')
      } else {
        await api.post('/admin/wholesalers', form)
        toast.success('Wholesaler created')
      }
      setShowForm(false)
      setEditing(null)
      await fetchWholesalers()
    } catch (error) {
      const errors = error.response?.data?.errors
      const firstError = errors ? Object.values(errors)[0]?.[0] : null
      setFormError(firstError || error.response?.data?.message || 'Could not save wholesaler.')
    } finally {
      setSaving(false)
    }
  }

  const applyStatus = async () => {
    if (!confirmStatus) return
    const { wholesaler, status } = confirmStatus
    try {
      await api.patch(`/admin/wholesalers/${wholesaler.id}/status`, { status })
      toast.success(`Wholesaler ${status === 'active' ? 'activated' : status}`)
      setConfirmStatus(null)
      setSelected((prev) => (prev?.id === wholesaler.id ? { ...prev, status } : prev))
      await fetchWholesalers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update status')
      setConfirmStatus(null)
    }
  }

  const deleteWholesaler = async () => {
    if (!confirmDelete) return
    try {
      await api.delete(`/admin/wholesalers/${confirmDelete.id}`)
      toast.success('Wholesaler deleted')
      setConfirmDelete(null)
      setSelected(null)
      await fetchWholesalers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete wholesaler')
      setConfirmDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
              <div className="h-8 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-gray-200 bg-white" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Warehouse className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wholesalers</h1>
            <p className="text-sm text-gray-500">
              Review, approve and manage wholesalers supplying the pharmacy network.
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Wholesaler
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-[#000F14]">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Suspended</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, contact, licence..."
              className={`${inputClass} pl-10`}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={inputClass}>
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Warehouse className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">No wholesalers found</h3>
          <p className="text-sm text-gray-500">
            {wholesalers.length === 0
              ? 'Add the first wholesaler to start managing your supply network.'
              : 'Try adjusting your filters.'}
          </p>
          {wholesalers.length === 0 && (
            <button onClick={openCreate} className="btn-primary mt-5">
              <Plus className="h-4 w-4" />
              New Wholesaler
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Wholesaler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Licence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((wholesaler) => (
                  <tr key={wholesaler.id} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0FD452]/10 text-[#0a8f3c]">
                          <Truck className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{wholesaler.name}</p>
                          <p className="font-mono text-[11px] text-gray-400">{wholesaler.wholesaler_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">
                        {wholesaler.contact_person || '—'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        {wholesaler.contact_phone || wholesaler.phone || '—'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        {wholesaler.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="flex items-center gap-1 text-sm text-gray-800">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {wholesaler.city}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {[wholesaler.region, wholesaler.country].filter(Boolean).join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-gray-700">{wholesaler.license_number}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        Reg: {wholesaler.registration_number || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        {wholesaler.orders_count || 0}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {wholesaler.inventory_count || 0} inventory items
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={wholesaler.status} />
                      {Number(wholesaler.rating) > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(wholesaler.rating).toFixed(1)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelected(wholesaler)}
                          title="View details"
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0a8f3c]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(wholesaler)}
                          title="Edit wholesaler"
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmStatus({
                              wholesaler,
                              status: wholesaler.status === 'active' ? 'suspended' : 'active',
                            })
                          }
                          title={wholesaler.status === 'active' ? 'Suspend wholesaler' : 'Activate wholesaler'}
                          className={`rounded-lg p-2 transition-colors hover:bg-gray-100 ${
                            wholesaler.status === 'active'
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {wholesaler.status === 'active' ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(wholesaler)}
                          title="Delete wholesaler"
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
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
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <p className="text-xs text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of{' '}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0a8f3c]">
                  <Warehouse className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                  <p className="font-mono text-xs text-gray-400">{selected.wholesaler_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={selected.status} />
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {Number(selected.rating || 0).toFixed(1)} rating
                </span>
                <span className="text-xs text-gray-500">
                  Joined {formatDate(selected.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Orders</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{selected.orders_count || 0}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Inventory</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{selected.inventory_count || 0}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">On-time delivery</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {Number(selected.on_time_delivery_rate || 0).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Contact</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow icon={BadgeCheck} label="Contact person" value={selected.contact_person} />
                  <InfoRow icon={Phone} label="Phone" value={selected.contact_phone || selected.phone} />
                  <InfoRow icon={Mail} label="Email" value={selected.email} />
                  <InfoRow icon={Mail} label="Business phone" value={selected.phone} />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Location</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow icon={MapPin} label="Address" value={selected.address} />
                  <InfoRow icon={MapPin} label="City / region" value={[selected.city, selected.region].filter(Boolean).join(', ')} />
                  <InfoRow icon={MapPin} label="Country" value={selected.country} />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Licensing & finance</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow icon={ShieldCheck} label="Licence number" value={selected.license_number} mono />
                  <InfoRow icon={ShieldCheck} label="Registration number" value={selected.registration_number} mono />
                  <InfoRow icon={Package} label="Tax ID" value={selected.tax_id || '—'} mono />
                  <InfoRow icon={Warehouse} label="Bank" value={[selected.bank_name, selected.bank_account].filter(Boolean).join(' · ') || '—'} />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-gray-100 bg-white px-6 py-4">
              <button onClick={() => openEdit(selected)} className="btn-primary">
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() =>
                  setConfirmStatus({
                    wholesaler: selected,
                    status: selected.status === 'active' ? 'suspended' : 'active',
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                {selected.status === 'active' ? (
                  <>
                    <Ban className="h-4 w-4 text-amber-500" />
                    Suspend
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Activate
                  </>
                )}
              </button>
              <button
                onClick={() => setConfirmDelete(selected)}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editing ? 'Edit wholesaler' : 'New wholesaler'}
                </h2>
                <p className="text-xs text-gray-500">
                  {editing
                    ? `Update the details for ${editing.name}.`
                    : 'Register a wholesaler and set its initial status.'}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-5 px-6 py-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Business</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Business name" required>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Tanzania Wholesale Pharmacy Ltd"
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={inputClass}
                      placeholder="supply@example.co.tz"
                    />
                  </Field>
                  <Field label="Business phone" required>
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={inputClass}
                      placeholder="+255 700 000 000"
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(e) => updateField('status', e.target.value)}
                      className={inputClass}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Location</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Address" required className="sm:col-span-2">
                    <input
                      required
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className={inputClass}
                      placeholder="Street, plot, building"
                    />
                  </Field>
                  <Field label="City" required>
                    <input
                      required
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className={inputClass}
                      placeholder="Dar es Salaam"
                    />
                  </Field>
                  <Field label="Region" required>
                    <input
                      required
                      value={form.region}
                      onChange={(e) => updateField('region', e.target.value)}
                      className={inputClass}
                      placeholder="Dar es Salaam"
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      value={form.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className={inputClass}
                      placeholder="Tanzania"
                    />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Licensing</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Licence number" required>
                    <input
                      required
                      value={form.license_number}
                      onChange={(e) => updateField('license_number', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. TZ-WHL-00123"
                    />
                  </Field>
                  <Field label="Registration number" required>
                    <input
                      required
                      value={form.registration_number}
                      onChange={(e) => updateField('registration_number', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. BRELA-123456"
                    />
                  </Field>
                  <Field label="Tax ID">
                    <input
                      value={form.tax_id}
                      onChange={(e) => updateField('tax_id', e.target.value)}
                      className={inputClass}
                      placeholder="TIN"
                    />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Contact & bank
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Contact person">
                    <input
                      value={form.contact_person}
                      onChange={(e) => updateField('contact_person', e.target.value)}
                      className={inputClass}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="Contact phone">
                    <input
                      value={form.contact_phone}
                      onChange={(e) => updateField('contact_phone', e.target.value)}
                      className={inputClass}
                      placeholder="+255 700 000 000"
                    />
                  </Field>
                  <Field label="Bank name">
                    <input
                      value={form.bank_name}
                      onChange={(e) => updateField('bank_name', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. CRDB Bank"
                    />
                  </Field>
                  <Field label="Bank account">
                    <input
                      value={form.bank_account}
                      onChange={(e) => updateField('bank_account', e.target.value)}
                      className={inputClass}
                      placeholder="Account number"
                    />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editing ? 'Save changes' : 'Create wholesaler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmStatus)}
        title={
          confirmStatus?.status === 'active'
            ? 'Activate wholesaler?'
            : confirmStatus?.status === 'suspended'
              ? 'Suspend wholesaler?'
              : 'Update wholesaler status?'
        }
        message={
          confirmStatus
            ? `${confirmStatus.wholesaler.name} will be marked ${confirmStatus.status}.`
            : ''
        }
        confirmText={confirmStatus?.status === 'active' ? 'Activate' : 'Suspend'}
        variant={confirmStatus?.status === 'active' ? 'info' : 'warning'}
        onConfirm={applyStatus}
        onCancel={() => setConfirmStatus(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete wholesaler?"
        message={
          confirmDelete
            ? `${confirmDelete.name} will be removed. Wholesalers with existing orders cannot be deleted.`
            : ''
        }
        confirmText="Delete"
        onConfirm={deleteWholesaler}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0a8f3c]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className={`mt-0.5 break-words text-sm text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}
