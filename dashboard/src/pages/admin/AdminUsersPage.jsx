import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  UserCog,
  ShieldCheck,
  Stethoscope,
  Wallet,
  Truck,
  User,
  Plus,
  Mail,
  Phone,
  Hash,
  Building2,
  Calendar,
  Zap,
} from 'lucide-react'
import api from '../../services/api'

const SAMPLE_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@pharmex.com', phone: '+256700000000', code: 'PHX-000001', role: 'admin', pharmacy: '—', status: 'active', joined: '2025-06-01' },
  { id: 2, name: 'Alice Mwamba', email: 'alice@healthplus.com', phone: '+256701111111', code: 'PHX-000042', role: 'owner', pharmacy: 'HealthPlus Pharmacy', status: 'active', joined: '2026-01-15' },
  { id: 3, name: 'Bob Phiri', email: 'bob@wellcare.com', phone: '+234801222222', code: 'PHX-000089', role: 'owner', pharmacy: 'WellCare Drugs', status: 'active', joined: '2026-02-20' },
  { id: 4, name: 'Sarah Nakamya', email: 'sarah@healthplus.com', phone: '+256703333333', code: 'PHX-000115', role: 'pharmacist', pharmacy: 'HealthPlus Pharmacy', status: 'active', joined: '2026-03-01' },
  { id: 5, name: 'James Ochieng', email: 'james@medvita.com', phone: '+254704444444', code: 'PHX-000148', role: 'pharmacist', pharmacy: 'MedVita Pharmacy', status: 'active', joined: '2026-03-10' },
  { id: 6, name: 'Mary Ajambo', email: 'mary@healthplus.com', phone: '+256705555555', code: 'PHX-000176', role: 'cashier', pharmacy: 'HealthPlus Pharmacy', status: 'active', joined: '2026-04-05' },
  { id: 7, name: 'David Lungu', email: 'david@lifeline.com', phone: '+255706666666', code: 'PHX-000203', role: 'owner', pharmacy: 'LifeLine Chemists', status: 'pending', joined: '2026-07-15' },
  { id: 8, name: 'Eva Tembo', email: 'eva@pharmastar.com', phone: '+256707777777', code: 'PHX-000234', role: 'owner', pharmacy: 'PharmaStar', status: 'active', joined: '2026-03-12' },
  { id: 9, name: 'Frank Zulu', email: 'frank@carepoint.com', phone: '+260708888888', code: 'PHX-000267', role: 'owner', pharmacy: 'CarePoint Pharmacy', status: 'active', joined: '2025-12-01' },
  { id: 10, name: 'Peter Delivery', email: 'peter@healthplus.com', phone: '+256709999999', code: 'PHX-000301', role: 'delivery', pharmacy: 'HealthPlus Pharmacy', status: 'active', joined: '2026-05-20' },
  { id: 11, name: 'Grace NCustomer', email: 'grace@email.com', phone: '+260710000000', code: 'PHX-000345', role: 'customer', pharmacy: '—', status: 'active', joined: '2026-06-01' },
  { id: 12, name: 'Peter Ssekitooleko', email: 'peter.s@medvita.com', phone: '+254711111111', code: 'PHX-000378', role: 'pharmacist', pharmacy: 'MedVita Pharmacy', status: 'inactive', joined: '2026-02-14' },
]

const ROLE_STYLES = {
  admin: 'bg-red-100 text-red-700',
  owner: 'bg-blue-100 text-blue-700',
  pharmacist: 'bg-green-100 text-green-700',
  cashier: 'bg-purple-100 text-purple-700',
  delivery: 'bg-orange-100 text-orange-700',
  customer: 'bg-gray-100 text-gray-600',
}

const ROLE_ICONS = {
  admin: Shield,
  owner: UserCog,
  pharmacist: Stethoscope,
  cashier: Wallet,
  delivery: Truck,
  customer: User,
}

const ROLES = ['admin', 'owner', 'pharmacist', 'cashier', 'delivery', 'customer']

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      const rawData = response.data.data || response.data
      const list = Array.isArray(rawData) ? rawData : []
      setUsers(list.map(u => ({
        ...u,
        code: u.code || u.user_code || '',
        joined: u.joined || u.created_at || '',
        status: u.status || (u.is_active ? 'active' : 'inactive'),
        pharmacy: Array.isArray(u.pharmacy)
          ? u.pharmacy.map(p => p.pharmacy_name || p.name).join(', ')
          : (typeof u.pharmacy === 'object' ? u.pharmacy?.pharmacy_name || '' : u.pharmacy || ''),
      })))
    } catch {
      setUsers(SAMPLE_USERS)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    )
    setActiveMenu(null)
    try {
      await api.patch(`/admin/users/${user.id}`, { status: newStatus })
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u))
      )
    }
  }

  const filtered = users.filter((u) => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.code || '').toLowerCase().includes(q) &&
        !(u.phone || '').includes(q)
      ) {
        return false
      }
    }
    if (roleFilter && u.role !== roleFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    owner: users.filter((u) => u.role === 'owner').length,
    pharmacist: users.filter((u) => u.role === 'pharmacist').length,
    cashier: users.filter((u) => u.role === 'cashier').length,
    delivery: users.filter((u) => u.role === 'delivery').length,
    customer: users.filter((u) => u.role === 'customer').length,
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
              <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl h-16 border border-gray-200 animate-pulse" />
        <div className="bg-white rounded-xl h-96 border border-gray-200 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500">Manage all platform users, roles, and access permissions.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          New User
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-[#000F14]">{stats.total}</p>
        </div>
        {ROLES.map((role) => (
          <div key={role} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500 capitalize">{role}</p>
            <p className={`mt-1 text-2xl font-bold capitalize ${ROLE_STYLES[role]?.split(' ')[1] || 'text-gray-600'}`}>
              {stats[role]}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or code..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Users className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">No users found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Email</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Phone</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Code</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Role</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Pharmacy</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Joined</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Zap className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#000F14]/10">
                          <span className="text-xs font-semibold text-[#000F14]">
                            {user.name.charAt(0)}
                          </span>
                          
                        </div>
                        <span className="text-sm font-medium text-[#000F14]">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{user.user_code || user.code}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                      
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{Array.isArray(user.pharmacy) ? user.pharmacy.map(p => p.pharmacy_name || p.name).join(', ') : (typeof user.pharmacy === 'object' ? user.pharmacy?.pharmacy_name || user.pharmacy?.name : user.pharmacy)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate('/admin/users/' + user.id)}
                          className="btn-icon-primary"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate('/admin/users/' + user.id + '/edit')}
                          className="btn-icon-blue"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                            className="btn-ghost"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {activeMenu === user.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                                <button
                                  onClick={() => handleToggleActive(user)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {user.status === 'active' ? (
                                    <ToggleLeft className="h-4 w-4" />
                                  ) : (
                                    <ToggleRight className="h-4 w-4" />
                                  )}
                                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => { setActiveMenu(null); navigate('/admin/users/' + user.id) }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete User
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page
                  if (totalPages <= 5) page = i + 1
                  else if (currentPage <= 3) page = i + 1
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                  else page = currentPage - 2 + i
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#0FD452] text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
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
    </div>
  )
}
