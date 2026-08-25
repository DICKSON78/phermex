import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, Search, Download, Filter, Building2, Briefcase,
  UserCheck, UserMinus, TrendingUp, ChevronLeft, ChevronRight, Loader2,
  Hash, Package, CheckCircle,
} from 'lucide-react'
import { employees } from '../../services/api'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'TZS', minimumFractionDigits: 2,
  }).format(amount || 0)
}

const DEPARTMENTS = { pharmacy: 'Pharmacy', management: 'Management', finance: 'Finance', operations: 'Operations', hr: 'HR' }
const STATUSES = { active: 'Active', inactive: 'Inactive', suspended: 'Suspended', terminated: 'Terminated' }
const STATUS_COLORS = { active: 'bg-green-100 text-green-700 border-green-200', inactive: 'bg-gray-100 text-gray-500 border-gray-200', suspended: 'bg-yellow-100 text-yellow-700 border-yellow-200', terminated: 'bg-red-100 text-red-700 border-red-200' }
const DEPT_COLORS = { pharmacy: 'bg-[#0FD452]/10 text-[#0FD452]', management: 'bg-blue-100 text-blue-700', finance: 'bg-purple-100 text-purple-700', operations: 'bg-orange-100 text-orange-700', hr: 'bg-pink-100 text-pink-700' }

export default function EmployeeListPage() {
  const navigate = useNavigate()
  const [employeeList, setEmployeeList] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, on_leave: 0, new_this_month: 0 })
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => { fetchData(); fetchStats() }, [page, department, statusFilter, employmentType])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search) params.search = search
      if (department) params.department = department
      if (statusFilter) params.status = statusFilter
      if (employmentType) params.employment_type = employmentType
      const res = await employees.getAll(params)
      setEmployeeList(toArray(res.data))
      setTotalPages(res.data.last_page || 1)
    } catch {
      setEmployeeList([])
      setTotalPages(1)
    } finally { setLoading(false) }
  }

  const fetchStats = async () => {
    try {
      const res = await employees.getStats()
      setStats(res.data)
    } catch {
      setStats({ total: 0, active: 0, on_leave: 0, new_this_month: 0 })
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const exportCSV = () => {
    const headers = ['Employee #', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Type', 'Status', 'Salary']
    const rows = employeeList.map(e => [
      e.employee_number, e.first_name, e.last_name, e.email,
      DEPARTMENTS[e.department] || e.department, e.position,
      e.employment_type?.replace('_', ' '), e.status, e.basic_salary,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'employees.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const statCards = [
    { label: 'Total Employees', value: stats.total, icon: Users, color: 'text-[#0FD452]' },
    { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-green-600' },
    { label: 'On Leave', value: stats.on_leave, icon: UserMinus, color: 'text-yellow-600' },
    { label: 'New This Month', value: stats.new_this_month, icon: TrendingUp, color: 'text-blue-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
              <p className="text-sm text-gray-500">Manage employee records and information.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportCSV} className="btn-secondary">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => navigate('/dashboard/employees/new')} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-4 flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees..." className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none w-full" />
            </form>
            <div className="flex flex-wrap gap-2">
              <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1) }} className="bg-gray-100 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
                <option value="">All Departments</option>
                {Object.entries(DEPARTMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="bg-gray-100 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
                <option value="">All Status</option>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={employmentType} onChange={(e) => { setEmploymentType(e.target.value); setPage(1) }} className="bg-gray-100 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#0FD452]" /><span>Employee</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-[#0FD452]" /><span>Department</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#0FD452]" /><span>Position</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Type</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Salary</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>Status</span></div></th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Users className="w-3.5 h-3.5 text-[#0FD452]" /><span>Actions</span></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin mx-auto" />
                  </td></tr>
                ) : employeeList.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No employees found</p>
                  </td></tr>
                ) : (
                  employeeList.map(emp => (
                    <tr key={emp.id} className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer" onClick={() => navigate(`/dashboard/employees/${emp.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10 flex-shrink-0">
                            <span className="text-[#0FD452] text-sm font-semibold">{emp.first_name?.[0]}{emp.last_name?.[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-gray-500">{emp.employee_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${DEPT_COLORS[emp.department] || 'bg-gray-100 text-gray-500'}`}>
                          {DEPARTMENTS[emp.department] || emp.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.position}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize hidden lg:table-cell">{emp.employment_type?.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(emp.basic_salary)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[emp.status] || ''}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/employees/${emp.id}`) }} className="text-[#0FD452] hover:text-[#0DC048] text-sm font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
