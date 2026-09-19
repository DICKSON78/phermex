import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, Search, Eye, Edit, Trash2, MoreVertical,
  UserCheck, DollarSign, User, Filter, X,
  Hash, Phone, Mail, Tag,
} from 'lucide-react'
import api from '../../services/api'
import { currentBase } from '../../utils/roles'
import ConfirmDialog from '../../components/ConfirmDialog'

function normalizeCustomer(c) {
  return {
    ...c,
    name: c.full_name || c.name || 'Unknown',
    code: c.customer_code || c.code || '',
    gender: c.gender || 'N/A',
  }
}

export default function CustomerListPage() {
  const navigate = useNavigate()
  const base = currentBase()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers')
      const raw = toArray(res.data)
      setCustomers(Array.isArray(raw) ? raw.map(normalizeCustomer) : [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = customers.filter((c) => {
    const matchSearch = !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search) ||
      (c.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    const matchGender = !genderFilter || (c.gender || '').toLowerCase() === genderFilter.toLowerCase()
    return matchSearch && matchGender
  })

  const stats = {
    total: customers.length,
    newThisMonth: customers.filter((c) => {
      if (!c.created_at) return false
      return new Date(c.created_at) >= new Date(Date.now() - 30 * 86400000)
    }).length,
    active: customers.length,
    totalRevenue: 0,
  }

  const handleDelete = async (customer) => {
    try {
      await api.delete(`/customers/${customer.id}`)
    } catch {}
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount || 0)
  }

  const statCards = [
    { label: 'Total Customers', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Active Customers', value: stats.active, icon: UserCheck, color: 'bg-purple-500/10 text-purple-500' },
    { label: 'Total Revenue', value: formatMoney(stats.totalRevenue), icon: DollarSign, color: 'bg-orange-500/10 text-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500">Manage your customer database.</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`${base}/customers/new`)}
          className="btn-primary"
        >
          <UserPlus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, or code..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              showFilters ? 'bg-[#0FD452]/10 text-[#0FD452]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-gray-50 text-sm text-gray-900 rounded-lg px-3 py-1.5 border border-gray-200 outline-none"
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            {genderFilter && (
              <button
                onClick={() => setGenderFilter('')}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Code</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Name</span>
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
                    <Mail className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Email</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Gender</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-[#0FD452] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">No customers found</p>
                    <p className="text-xs text-gray-400">{search ? 'Try a different search term' : 'Add your first customer to get started'}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer"
                    onClick={() => navigate(`${base}/customers/${customer.id}`)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{customer.code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <span className="text-[#0FD452] text-xs font-semibold">
                            {(customer.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.email || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-sm text-gray-600">{customer.gender || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenu === index && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-6 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                            <button
                              onClick={() => { navigate(`${base}/customers/${customer.id}`); setActiveMenu(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4" />
                              View Profile
                            </button>
                            <button
                              onClick={() => { navigate(`${base}/customers/${customer.id}/edit`); setActiveMenu(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => { setConfirmAction(() => () => { handleDelete(customer); setActiveMenu(null) }); setActiveMenu(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
