import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import {
  UserCog, UserPlus, Search, Edit, Trash2, MoreVertical,
  Shield, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Users, Phone, Hash, Briefcase, DollarSign, Activity,
} from 'lucide-react'
import api from '../../services/api'

const sampleStaff = [
  { id: 1, name: 'Sarah Nakamya', phone: '+256701111111', license_number: 'PH-2024-001', position: 'pharmacist', salary: 250000, active: true, permissions: { inventory: ['view', 'add', 'edit', 'delete'], orders: ['view', 'create', 'cancel'], prescriptions: ['view', 'dispense'], customers: ['view', 'add', 'edit'], reports: ['view'], settings: ['view'] } },
  { id: 2, name: 'James Ochieng', phone: '+256702222222', license_number: 'PH-2024-002', position: 'technician', salary: 180000, active: true, permissions: { inventory: ['view', 'add', 'edit'], orders: ['view', 'create'], prescriptions: ['view'], customers: ['view', 'add'], reports: [], settings: [] } },
  { id: 3, name: 'Mary Ajambo', phone: '+256703333333', license_number: 'PH-2024-003', position: 'cashier', salary: 120000, active: true, permissions: { inventory: ['view'], orders: ['view', 'create'], prescriptions: [], customers: ['view'], reports: [], settings: [] } },
  { id: 4, name: 'Peter Ssekitooleko', phone: '+256704444444', license_number: 'PH-2024-004', position: 'intern', salary: 80000, active: false, permissions: { inventory: ['view'], orders: ['view'], prescriptions: ['view'], customers: ['view'], reports: [], settings: [] } },
]

const positionColors = {
  pharmacist: 'bg-green-100 text-green-700',
  technician: 'bg-blue-100 text-blue-700',
  cashier: 'bg-purple-100 text-purple-700',
  intern: 'bg-gray-100 text-gray-600',
}

const permissionLabels = {
  inventory: 'Inventory',
  orders: 'Orders',
  prescriptions: 'Prescriptions',
  customers: 'Customers',
  reports: 'Reports',
  settings: 'Settings',
}

export default function StaffListPage() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const res = await api.get('/employees')
      const raw = toArray(res.data)
      setStaff(raw.map((e) => ({
        id: e.id,
        name: e.name || '—',
        phone: e.phone || '—',
        license_number: e.license_number || e.license_no || '—',
        position: e.position || 'staff',
        salary: e.salary || 0,
        active: e.active ?? (e.status === 'active'),
        permissions: e.permissions || {},
      })))
    } catch {
      setStaff(sampleStaff)
    } finally {
      setLoading(false)
    }
  }

  const filtered = staff.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.license_number?.toLowerCase().includes(q)
  })

  const handleToggleActive = async (member) => {
    try {
      await api.patch(`/staff/${member.id}`, { active: !member.active })
    } catch {}
    setStaff((prev) =>
      prev.map((s) => s.id === member.id ? { ...s, active: !s.active } : s)
    )
  }

  const handleDelete = async (member) => {
    if (!window.confirm(`Remove "${member.name}" from staff?`)) return
    try {
      await api.delete(`/staff/${member.id}`)
    } catch {}
    setStaff((prev) => prev.filter((s) => s.id !== member.id))
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount / 1000)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
            <p className="text-sm text-gray-500">Manage pharmacy staff members.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/owner/staff/new')}
          className="btn-primary"
        >
          <UserPlus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or license number..."
              className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
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
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>License #</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Position</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Salary</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Status</span>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No staff found</td>
                </tr>
              ) : (
                filtered.map((member, index) => (
                  <>
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === member.id ? null : member.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <span className="text-[#0FD452] text-xs font-semibold">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.phone}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{member.license_number}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${positionColors[member.position] || 'bg-gray-100 text-gray-600'}`}>
                          {member.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatMoney(member.salary)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${member.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {member.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedRow(expandedRow === member.id ? null : member.id)}
                            className="btn-ghost"
                          >
                            {expandedRow === member.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                            className="btn-ghost"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {activeMenu === index && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                              <div className="absolute right-6 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                                <button
                                  onClick={() => { navigate(`/owner/staff/${member.id}/edit`); setActiveMenu(null) }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => { handleToggleActive(member); setActiveMenu(null) }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {member.active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                                  {member.active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => { handleDelete(member); setActiveMenu(null) }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === member.id && (
                      <tr key={`${member.id}-perms`}>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="flex items-start gap-2 mb-2">
                            <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ml-6">
                            {Object.entries(permissionLabels).map(([key, label]) => (
                              <div key={key}>
                                <p className="text-xs font-semibold text-gray-900 mb-1">{label}</p>
                                <div className="flex flex-wrap gap-1">
                                  {(member.permissions?.[key] || []).length === 0 ? (
                                    <span className="text-xs text-gray-400">None</span>
                                  ) : (
                                    member.permissions[key].map((perm) => (
                                      <span key={perm} className="inline-flex px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded">
                                        {perm}
                                      </span>
                                      
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
