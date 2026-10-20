import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Building2, Briefcase,
  DollarSign, Clock, FileText, Star, Loader2, User, CreditCard, Heart,
  ToggleLeft, ToggleRight, Users, CheckCircle, Tag, Hash,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { employees } from '../../services/api'
import { formatMoney } from '../../utils/currency'
import Tabs from '../../components/Tabs'

function formatCurrency(amount) {
  return formatMoney(amount || 0, { decimals: 2 })
}

const DEPARTMENTS = { pharmacy: 'Pharmacy', management: 'Management', finance: 'Finance', operations: 'Operations', hr: 'HR' }
const STATUS_COLORS = { active: 'bg-green-100 text-green-700 border-green-200', inactive: 'bg-gray-100 text-gray-500 border-gray-200', suspended: 'bg-yellow-100 text-yellow-700 border-yellow-200', terminated: 'bg-red-100 text-red-700 border-red-200' }

export default function EmployeeDetailPage() {
  const { t } = useLanguage()
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [leaveBalance, setLeaveBalance] = useState({})

  const TABS = [
    { id: 'overview', label: t('people.employeeDetail.overview'), icon: User },
    { id: 'attendance', label: t('nav.items.attendance'), icon: Clock },
    { id: 'leave', label: t('nav.items.leaves'), icon: Calendar },
    { id: 'payroll', label: t('nav.items.payroll'), icon: DollarSign },
    { id: 'performance', label: t('nav.items.performance'), icon: Star },
  ]

  const DEPT_LABELS = { pharmacy: t('people.departments.pharmacy'), management: t('people.departments.management'), finance: t('people.departments.finance'), operations: t('people.departments.operations'), hr: t('people.departments.hr') }
  const EMP_STATUS_LABELS = { active: t('common.active'), inactive: t('common.inactive'), suspended: t('people.statuses.suspended'), terminated: t('people.statuses.terminated') }
  const ATT_STATUS_LABELS = { present: t('people.statuses.present'), absent: t('people.statuses.absent'), late: t('people.statuses.late'), half_day: t('people.statuses.half_day'), leave: t('people.statuses.leave'), holiday: t('people.statuses.holiday') }
  const LEAVE_STATUS_LABELS = { pending: t('common.pending'), approved: t('common.approved'), rejected: t('common.rejected'), cancelled: t('people.statuses.cancelled') }
  const PAYROLL_STATUS_LABELS = { draft: t('people.statuses.draft'), pending: t('common.pending'), approved: t('common.approved'), paid: t('people.statuses.paid'), cancelled: t('people.statuses.cancelled') }
  const LEAVE_TYPE_LABELS = { annual: t('people.leaveTypes.annual'), sick: t('people.leaveTypes.sick'), maternity: t('people.leaveTypes.maternity'), paternity: t('people.leaveTypes.paternity'), bereavement: t('people.leaveTypes.bereavement'), unpaid: t('people.leaveTypes.unpaid'), study: t('people.leaveTypes.study') }
  const ROLE_LABELS = { admin: t('common.roleAdmin'), owner: t('common.roleOwner'), pharmacist: t('common.rolePharmacist'), cashier: t('common.roleCashier'), delivery: t('common.roleDelivery'), customer: t('common.roleCustomer') }

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
      toast.success(t('people.employeeDetail.statusToggled'))
      fetchEmployee()
    } catch { toast.error(t('people.employeeDetail.toggleFailed')) }
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
        {t('people.employeeDetail.notFound')}
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
            <h1 className="text-2xl font-bold text-gray-900">{t('people.employeeDetail.title')}</h1>
            <p className="text-sm text-gray-500">{t('people.employeeDetail.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleToggleStatus} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${emp.status === 'active' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-[#0FD452]/10 border-[#0FD452]/30 text-[#0FD452] hover:bg-[#0FD452]/20'}`}>
              {emp.status === 'active' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
              {emp.status === 'active' ? t('people.employeeDetail.deactivate') : t('people.employeeDetail.activate')}
            </button>
            <button onClick={() => navigate(`/dashboard/employees/${id}/edit`)} className="btn-primary">
              <Edit className="w-4 h-4" /> {t('common.edit')}
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
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[emp.status] || ''}`}>{EMP_STATUS_LABELS[emp.status] || emp.status}</span>
              </div>
              <p className="text-gray-500 text-sm mb-2">{emp.position} &middot; {DEPT_LABELS[emp.department] || DEPARTMENTS[emp.department]} &middot; {emp.employee_number}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{emp.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{emp.phone}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{t('people.employeeDetail.joined')} {new Date(emp.hire_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">{t('people.employeeDetail.basicSalary')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(emp.basic_salary)}</p>
                <p className="text-xs text-gray-500 mt-1">+ {formatCurrency(emp.allowances)} {t('people.employeeDetail.allowancesNote')}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">{t('people.attendance.attendanceRate')}</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{emp.attendance?.length || 0} {t('people.shared.records')}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">{t('people.employeeDetail.loginAccess')}</p>
                {emp.user ? (
                  <p className="text-2xl font-bold text-[#0FD452] capitalize">{ROLE_LABELS[emp.user.role] || emp.user.role}</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-300">{t('common.none')}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {emp.user ? (emp.user.is_active ? t('people.employeeDetail.canSignIn') : t('people.employeeDetail.accountDeactivated')) : t('people.employeeDetail.noSystemAccount')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" /> {t('people.employeeDetail.bankDetails')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-500">{t('people.employeeDetail.bank')}<span className="text-sm text-gray-900">{emp.bank_name || t('people.shared.notSet')}</span></span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500">{t('people.employeeDetail.account')}<span className="text-sm text-gray-900">{emp.bank_account_number || t('people.shared.notSet')}</span></span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500">TIN<span className="text-sm text-gray-900">{emp.tax_id || t('people.shared.notSet')}</span></span></div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Heart className="w-4 h-4" /> {t('people.employeeDetail.emergencyContact')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-500">{t('common.name')}<span className="text-sm text-gray-900">{emp.emergency_contact_name || t('people.shared.notSet')}</span></span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500">{t('common.phone')}<span className="text-sm text-gray-900">{emp.emergency_contact_phone || t('people.shared.notSet')}</span></span></div>
                </div>
              </div>
            </div>

            {emp.leaves && emp.leaves.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('people.employeeDetail.recentLeaveRequests')}</h3>
                <div className="space-y-3">
                  {emp.leaves.slice(0, 5).map(leave => (
                    <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-900 capitalize">{LEAVE_TYPE_LABELS[leave.leave_type] || leave.leave_type}</p>
                        <p className="text-xs text-gray-500">{leave.start_date} {t('people.shared.to')} {leave.end_date} ({leave.days_count} {t('people.shared.days')})</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {LEAVE_STATUS_LABELS[leave.status] || leave.status}
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
              <h3 className="text-lg font-semibold text-gray-900">{t('people.employeeDetail.attendanceHistory')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('common.date')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.attendance.clockIn')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.attendance.clockOut')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.attendance.hours')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.attendance.overtime')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('common.status')}</span>
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
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${a.status === 'present' ? 'bg-green-100 text-green-700' : a.status === 'late' ? 'bg-yellow-100 text-yellow-700' : a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{ATT_STATUS_LABELS[a.status] || a.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">{t('people.employeeDetail.noAttendance')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('people.employeeDetail.leaveHistory')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.employeeDetail.type')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.employeeDetail.dates')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.shared.days')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('leaves.reason')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('common.status')}</span>
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
                          <span className="text-sm text-gray-900 capitalize">{LEAVE_TYPE_LABELS[l.leave_type] || l.leave_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{l.start_date} - {l.end_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{l.days_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{l.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${l.status === 'approved' ? 'bg-green-100 text-green-700' : l.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : l.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{LEAVE_STATUS_LABELS[l.status] || l.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">{t('people.employeeDetail.noLeave')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('people.employeeDetail.payrollHistory')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.employeeDetail.period')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.employeeDetail.gross')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.employeeDetail.deductions')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('people.employeeDetail.net')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{t('common.status')}</span>
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
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'approved' ? 'bg-blue-100 text-blue-700' : p.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{PAYROLL_STATUS_LABELS[p.status] || p.status}</span>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">{t('people.employeeDetail.noPayroll')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('people.employeeDetail.performanceReviews')}</h3>
            </div>
            {emp.performanceReviews && emp.performanceReviews.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {emp.performanceReviews.map(r => (
                  <div key={r.id} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-900 font-medium">{r.review_period_start} - {r.review_period_end}</p>
                        <p className="text-xs text-gray-500">{t('people.employeeDetail.reviewedBy')} {r.reviewer?.name || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(r.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="ml-2 text-sm text-gray-900 font-medium">{r.rating}</span>
                      </div>
                    </div>
                    {r.strengths && <p className="text-sm text-gray-600 mb-2"><span className="text-gray-500">{t('people.employeeDetail.strengthsLabel')} {r.strengths}</span></p>}
                    {r.areas_for_improvement && <p className="text-sm text-gray-600"><span className="text-gray-500">{t('people.employeeDetail.areasToImproveLabel')} {r.areas_for_improvement}</span></p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 text-sm">{t('people.employeeDetail.noReviews')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
