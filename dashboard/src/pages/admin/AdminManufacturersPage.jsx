import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Factory, Search, Users, Package, ShoppingCart, CheckCircle2, Ban, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const PAGE_SIZE = 20

function money(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

function StatCard({ label, value, icon: Icon, tone = 'bg-[#0FD452]/10 text-[#0FD452]' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminManufacturersPage() {
  const navigate = useNavigate()
  const [manufacturers, setManufacturers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/manufacturers')
      setManufacturers(res.data?.data || [])
      if (res.data?.stats) setStats(res.data.stats)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load manufacturers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search])

  const toggleActive = async (manufacturer) => {
    setBusyId(manufacturer.id)
    try {
      await api.patch(`/admin/users/${manufacturer.id}`, {
        status: manufacturer.is_active ? 'inactive' : 'active',
      })
      toast.success(manufacturer.is_active ? 'Manufacturer suspended' : 'Manufacturer activated')
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update manufacturer')
    } finally {
      setBusyId(null)
    }
  }

  const filtered = manufacturers.filter((m) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [m.name, m.contact_name, m.email, m.phone, m.license]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  })

  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Factory className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manufacturers</h1>
            <p className="text-sm text-gray-500">
              Oversee manufacturer accounts. Their catalogue and wholesaler orders stay in their own portal.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Manufacturers" value={stats.total} icon={Factory} />
        <StatCard label="Active" value={stats.active} icon={CheckCircle2} tone="bg-green-100 text-green-600" />
        <StatCard label="Suspended" value={stats.inactive} icon={Ban} tone="bg-red-100 text-red-600" />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search manufacturer, contact, email or licence..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            />
          </div>
          <span className="text-xs text-gray-400">{filtered.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Manufacturer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Products</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order value</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">Loading manufacturers...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    <Factory className="mx-auto mb-2 h-10 w-10 opacity-40" />
                    No manufacturer accounts yet.
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.license || 'No licence on file'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p>{m.contact_name || '—'}</p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                      <p className="text-xs text-gray-400">{m.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4 text-gray-400" />{m.products_count}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1.5"><ShoppingCart className="h-4 w-4 text-gray-400" />{m.orders_count}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{money(m.order_value)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {m.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/users/${m.id}`)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-[#0FD452] hover:text-[#0FD452]"
                          title="View account"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(m)}
                          disabled={busyId === m.id}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                            m.is_active
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-green-200 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {m.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
          <span>Page {page} of {lastPage}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <Users className="h-4 w-4" />
        Manufacturer catalogue and order fulfilment are managed inside the manufacturer portal.
      </p>
    </div>
  )
}
