import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import {
  Calendar, Search, Check, X, Clock, Loader2,
  AlertCircle, CheckCircle, XCircle, Ban, FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { leaves, employees } from '../../services/api'

const TYPE_LABELS = { annual: 'Annual Leave', sick: 'Sick Leave', maternity: 'Maternity', paternity: 'Paternity', bereavement: 'Bereavement', unpaid: 'Unpaid Leave', study: 'Study Leave' }
const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700 border-yellow-200', approved: 'bg-green-100 text-green-700 border-green-200', rejected: 'bg-red-100 text-red-700 border-red-200', cancelled: 'bg-gray-100 text-gray-500 border-gray-200' }
const STATUS_ICONS = { pending: Clock, approved: CheckCircle, rejected: XCircle, cancelled: Ban }
const TYPE_BADGE_COLORS = { annual: 'bg-blue-100 text-blue-700', sick: 'bg-red-100 text-red-700', maternity: 'bg-pink-100 text-pink-700', paternity: 'bg-purple-100 text-purple-700', bereavement: 'bg-gray-100 text-gray-600', unpaid: 'bg-orange-100 text-orange-700', study: 'bg-cyan-100 text-cyan-700' }

export default function LeavePage() {
  const [leaveList, setLeaveList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [leaveBalances, setLeaveBalances] = useState({})
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [upcomingLeaves, setUpcomingLeaves] = useState([])
  const [employeeList, setEmployeeList] = useState([])

  useEffect(() => { fetchLeaves(); fetchEmployees() }, [filter, typeFilter])
  useEffect(() => { if (selectedEmployee) fetchBalance() }, [selectedEmployee])

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const params = { per_page: 50 }
      if (filter !== 'all') params.status = filter
      if (typeFilter) params.leave_type = typeFilter
      const res = await leaves.getAll(params)
      const data = toArray(res.data)
      setLeaveList(data)
      setUpcomingLeaves(data.filter(l => l.status === 'approved' && new Date(l.start_date) >= new Date()).slice(0, 5))
    } catch {
      setLeaveList([])
      setUpcomingLeaves([])
    } finally { setLoading(false) }
  }

  const fetchEmployees = async () => {
    try {
      const res = await employees.getAll({ per_page: 100 })
      setEmployeeList(toArray(res.data))
    } catch {
      setEmployeeList([])
    }
  }

  const fetchBalance = async () => {
    try {
      const res = await leaves.getBalance({ employee_id: selectedEmployee })
      setLeaveBalances(res.data.balance || {})
    } catch {
      setLeaveBalances({})
    }
  }

  const handleApprove = async (id) => {
    try {
      await leaves.approve(id, { approved_by: 1 })
      toast.success('Leave approved')
      fetchLeaves()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):')
    if (reason === null) return
    try {
      await leaves.reject(id, { approved_by: 1, rejection_reason: reason })
      toast.success('Leave rejected')
      fetchLeaves()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return
    try {
      await leaves.cancel(id)
      toast.success('Leave cancelled')
      fetchLeaves()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const filtered = leaveList.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${l.employee?.first_name} ${l.employee?.last_name}`.toLowerCase().includes(q) || l.reason?.toLowerCase().includes(q)
  })

  const pendingCount = leaveList.filter(l => l.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
              <p className="text-sm text-gray-500">Manage employee leave requests.</p>
            </div>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-800"><span className="font-semibold">{pendingCount} pending leave request{pendingCount > 1 ? 's' : ''} require{pendingCount === 1 ? 's' : ''} your attention</span></p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <form onSubmit={(e) => { e.preventDefault(); fetchLeaves() }} className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee name..." className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none w-full" />
                </form>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'pending', 'approved', 'rejected'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-[#0FD452] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{f}</button>
                  ))}
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">All Types</option>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
                  <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin mx-auto" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No leave requests found</p>
                </div>
              ) : (
                filtered.map(leave => {
                  const StatusIcon = STATUS_ICONS[leave.status] || Clock
                  return (
                    <div key={leave.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[#0FD452] text-sm font-semibold">{leave.employee?.first_name?.[0]}{leave.employee?.last_name?.[0]}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">{leave.employee?.first_name} {leave.employee?.last_name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${TYPE_BADGE_COLORS[leave.leave_type] || 'bg-gray-100 text-gray-600'}`}>
                                {TYPE_LABELS[leave.leave_type] || leave.leave_type}
                              </span>
                              
                            </div>
                            <p className="text-xs text-gray-500 mb-1">{leave.start_date} to {leave.end_date} &middot; {leave.days_count} day{leave.days_count > 1 ? 's' : ''}</p>
                            <p className="text-sm text-gray-600">{leave.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wide ${STATUS_COLORS[leave.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            <StatusIcon className="w-3 h-3" /> {leave.status}
                          </span>
                          
                          {leave.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleApprove(leave.id)} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors" title="Approve">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleReject(leave.id)} className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors" title="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {leave.status === 'pending' && (
                            <button onClick={() => handleCancel(leave.id)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" title="Cancel">
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Leave Balance</h3>
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select employee</option>
                {employeeList.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
              {selectedEmployee && (
                <div className="space-y-3">
                  {Object.entries(leaveBalances).map(([type, days]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{type}</span>
                      <span className="text-sm font-medium text-gray-900">{days} days</span>
                    </div>
                  ))}
                </div>
              )}
              {!selectedEmployee && <p className="text-sm text-gray-500 text-center py-4">Select an employee to view balance</p>}
            </div>

            {upcomingLeaves.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming Leaves</h3>
                <div className="space-y-3">
                  {upcomingLeaves.map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">{l.employee?.first_name} {l.employee?.last_name}</p>
                        <p className="text-xs text-gray-500">{l.start_date} - {l.end_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}