import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import {
  Calendar, Search, Check, X, Clock, Loader2, Filter, ChevronRight,
  AlertCircle, CheckCircle, XCircle, Ban, FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { leaves, employees } from '../../services/api'

const TYPE_LABELS = { annual: 'Annual Leave', sick: 'Sick Leave', maternity: 'Maternity', paternity: 'Paternity', bereavement: 'Bereavement', unpaid: 'Unpaid Leave', study: 'Study Leave' }
const STATUS_COLORS = { pending: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50', approved: 'bg-green-900/40 text-green-400 border-green-700/50', rejected: 'bg-red-900/40 text-red-400 border-red-700/50', cancelled: 'bg-gray-700/40 text-gray-400 border-gray-600/50' }
const STATUS_ICONS = { pending: Clock, approved: CheckCircle, rejected: XCircle, cancelled: Ban }
const TYPE_BADGE_COLORS = { annual: 'bg-blue-900/30 text-blue-400', sick: 'bg-red-900/30 text-red-400', maternity: 'bg-pink-900/30 text-pink-400', paternity: 'bg-purple-900/30 text-purple-400', bereavement: 'bg-gray-700/40 text-gray-400', unpaid: 'bg-orange-900/30 text-orange-400', study: 'bg-cyan-900/30 text-cyan-400' }

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
    <div className="min-h-screen bg-[#000F14] p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Leave Management</h1>
              <p className="text-sm text-gray-400">Manage employee leave requests.</p>
            </div>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-300"><span className="font-semibold">{pendingCount} pending leave request{pendingCount > 1 ? 's' : ''} require{pendingCount === 1 ? 's' : ''} your attention</span></p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <form onSubmit={(e) => { e.preventDefault(); fetchLeaves() }} className="flex-1 flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee name..." className="bg-transparent text-sm text-white placeholder-gray-400 outline-none w-full" />
                </form>
                <div className="flex gap-2">
                  {['all', 'pending', 'approved', 'rejected'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-[#0FD452]/10 text-[#0FD452]' : 'text-gray-400 hover:bg-gray-700/50'}`}>{f}</button>
                  ))}
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-gray-700/50 border border-gray-600 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
                  <option value="">All Types</option>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-16 text-center">
                  <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin mx-auto" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-16 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">No leave requests found</p>
                </div>
              ) : (
                filtered.map(leave => {
                  const StatusIcon = STATUS_ICONS[leave.status] || Clock
                  return (
                    <div key={leave.id} className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[#0FD452] text-sm font-semibold">{leave.employee?.first_name?.[0]}{leave.employee?.last_name?.[0]}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white">{leave.employee?.first_name} {leave.employee?.last_name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_BADGE_COLORS[leave.leave_type] || 'bg-gray-700 text-gray-400'}`}>
                                {TYPE_LABELS[leave.leave_type] || leave.leave_type}
                              </span>
                              
                            </div>
                            <p className="text-xs text-gray-400 mb-1">{leave.start_date} to {leave.end_date} &middot; {leave.days_count} day{leave.days_count > 1 ? 's' : ''}</p>
                            <p className="text-sm text-gray-300">{leave.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[leave.status] || ''}`}>
                            <StatusIcon className="w-3 h-3" /> {leave.status}
                          </span>
                          
                          {leave.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleApprove(leave.id)} className="p-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors" title="Approve">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleReject(leave.id)} className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors" title="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {leave.status === 'pending' && (
                            <button onClick={() => handleCancel(leave.id)} className="p-1.5 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 transition-colors" title="Cancel">
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
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Leave Balance</h3>
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600 text-gray-300 text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
                <option value="">Select employee</option>
                {employeeList.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
              {selectedEmployee && (
                <div className="space-y-3">
                  {Object.entries(leaveBalances).map(([type, days]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 capitalize">{type}</span>
                      <span className="text-sm font-medium text-white">{days} days</span>
                    </div>
                  ))}
                </div>
              )}
              {!selectedEmployee && <p className="text-sm text-gray-500 text-center py-4">Select an employee to view balance</p>}
            </div>

            {upcomingLeaves.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming Leaves</h3>
                <div className="space-y-3">
                  {upcomingLeaves.map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{l.employee?.first_name} {l.employee?.last_name}</p>
                        <p className="text-xs text-gray-400">{l.start_date} - {l.end_date}</p>
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
