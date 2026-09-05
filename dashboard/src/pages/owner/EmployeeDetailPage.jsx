import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Building2, Briefcase,
  DollarSign, Clock, FileText, Star, Loader2, User, CreditCard, Heart,
  ToggleLeft, ToggleRight, Users, CheckCircle, Tag, Hash,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { employees } from '../../services/api'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 2 }).format(amount || 0)
}

const DEPARTMENTS = { pharmacy: 'Pharmacy', management: 'Management', finance: 'Finance', operations: 'Operations', hr: 'HR' }
const STATUS_COLORS = { active: 'bg-green-100 text-green-700 border-green-200', inactive: 'bg-gray-100 text-gray-500 border-gray-200', suspended: 'bg-yellow-100 text-yellow-700 border-yellow-200', terminated: 'bg-red-100 text-red-700 border-red-200' }

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'leave', label: 'Leave', icon: Calendar },
  { id: 'payroll', label: 'Payroll', icon: DollarSign },
  { id: 'performance', label: 'Performance', icon: Star },
]

export default function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [leaveBalance, setLeaveBalance] = useState({})

  useEffect(() => { fetchEmployee() }, [id])

  const fetchEmployee = async () => {
    try {
      const res = await employees.getById(id)
      setEmployee(res.data.employee)
    } catch {
      setEmployee(null)
    } finally { setLoading(false) }
  }

  const handleToggleStatus = async () => {
    try {
      await employees.toggleStatus(id)
      toast.success('Status toggled')
      fetchEmployee()
    } catch { toast.error('Failed to toggle status') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-900">
        Employee not found
      </div>
    )
  }

  const emp = employee
  const totalEarned = emp.payroll?.reduce((sum, p) => sum + Number(p.gross_salary || 0), 0) || 0
  const totalNet = emp.payroll?.reduce((sum, p) => sum + Number(p.net_salary || 0), 0) || 0
  const attendanceRate = emp.attendance?.length > 0
    ? Math.round((emp.attendance.filter(a => a.status === 'present').length / emp.attendance.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard/employees')} className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Employee Details</h1>
            <p className="text-sm text-gray-500">View employee profile and history.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleToggleStatus} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${emp.status === 'active' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-[#0FD452]/10 border-[#0FD452]/30 text-[#0FD452] hover:bg-[#0FD452]/20'}`}>
              {emp.status === 'active' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
              {emp.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => navigate(`/dashboard/employees/${id}/edit`)} className="btn-primary">
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>

        <div className="bg-white backdrop-blur border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#0FD452] text-2xl font-bold">{emp.first_name?.[0]}{emp.last_name?.[0]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{emp.first_name} {emp.last_name}</h2>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[emp.status] || ''}`}>{emp.status}</span>
              </div>
              <p className="text-gray-500 text-sm mb-2">{emp.position} &middot; {DEPARTMENTS[emp.department]} &middot; {emp.employee_number}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{emp.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{emp.phone}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {new Date(emp.hire_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-[#0FD452]/10 text-[#0FD452]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">Basic Salary</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(emp.basic_salary)}</p>
                <p className="text-xs text-gray-500 mt-1">+ {formatCurrency(emp.allowances)} allowances</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{emp.attendance?.length || 0} records</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">Login Access</p>
                {emp.user ? (
                  <p className="text-2xl font-bold text-[#0FD452] capitalize">{emp.user.role}</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-300">None</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {emp.user ? (emp.user.is_active ? 'Can sign in to this pharmacy only' : 'Account deactivated') : 'No system account created'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Bank Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-500">Bank<span className="text-sm text-gray-900">{emp.bank_name || 'Not set'}</span></span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500">Account<span className="text-sm text-gray-900">{emp.bank_account_number || 'Not set'}</span></span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500">TIN<span className="text-sm text-gray-900">{emp.tax_id || 'Not set'}</span></span></div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Heart className="w-4 h-4" /> Emergency Contact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-500">Name<span className="text-sm text-gray-900">{emp.emergency_contact_name || 'Not set'}</span></span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500">Phone<span className="text-sm text-gray-900">{emp.emergency_contact_phone || 'Not set'}</span></span></div>
                </div>
              </div>
            </div>

            {emp.leaves && emp.leaves.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Leave Requests</h3>
                <div className="space-y-3">
                  {emp.leaves.slice(0, 5).map(leave => (
                    <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-900 capitalize">{leave.leave_type} Leave</p>
                        <p className="text-xs text-gray-500">{leave.start_date} to {leave.end_date} ({leave.days_count} days)</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Date</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Clock In</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Clock Out</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Hours</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Overtime</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emp.attendance && emp.attendance.length > 0 ? emp.attendance.map(a => (
                    <tr key={a.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Calendar className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm text-gray-900">{new Date(a.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.clock_in ? new Date(a.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.clock_out ? new Date(a.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{a.hours_worked}h</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.overtime_hours}h</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${a.status === 'present' ? 'bg-green-100 text-green-700' : a.status === 'late' ? 'bg-yellow-100 text-yellow-700' : a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{a.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">No attendance records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Leave History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Type</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Dates</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Days</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Reason</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emp.leaves && emp.leaves.length > 0 ? emp.leaves.map(l => (
                    <tr key={l.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Tag className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm text-gray-900 capitalize">{l.leave_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{l.start_date} - {l.end_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{l.days_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{l.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${l.status === 'approved' ? 'bg-green-100 text-green-700' : l.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : l.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{l.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">No leave records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Payroll History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Period</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Gross</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Deductions</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Net</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emp.payroll && emp.payroll.length > 0 ? emp.payroll.map(p => {
                    const totalDeductions = Number(p.paye_tax) + Number(p.nssf_employee) + Number(p.nhif) + Number(p.housing_levy) + Number(p.other_deductions)
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-[#0FD452]/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                              <Calendar className="h-4 w-4 text-[#0FD452]" />
                            </div>
                            <span className="text-sm text-gray-900">{p.period_month}/{p.period_year}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(p.gross_salary)}</td>
                        <td className="px-6 py-4 text-sm text-red-600">-{formatCurrency(totalDeductions)}</td>
                        <td className="px-6 py-4 text-sm text-[#0FD452] font-medium">{formatCurrency(p.net_salary)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'approved' ? 'bg-blue-100 text-blue-700' : p.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">No payroll records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Performance Reviews</h3>
            </div>
            {emp.performanceReviews && emp.performanceReviews.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {emp.performanceReviews.map(r => (
                  <div key={r.id} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-900 font-medium">{r.review_period_start} - {r.review_period_end}</p>
                        <p className="text-xs text-gray-500">Reviewed by: {r.reviewer?.name || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(r.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="ml-2 text-sm text-gray-900 font-medium">{r.rating}</span>
                      </div>
                    </div>
                    {r.strengths && <p className="text-sm text-gray-600 mb-2"><span className="text-gray-500">Strengths: {r.strengths}</span></p>}
                    {r.areas_for_improvement && <p className="text-sm text-gray-600"><span className="text-gray-500">Areas to improve: {r.areas_for_improvement}</span></p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 text-sm">No performance reviews yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
