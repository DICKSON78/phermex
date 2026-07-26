import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import {
  Clock, Calendar, Search, ChevronLeft, ChevronRight, Loader2, Users,
  TrendingUp, AlertTriangle, Download, Timer, Activity, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { attendance, employees } from '../../services/api'

function formatTime(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString()
}

const FALLBACK_ATTENDANCE = [
  { id: 1, employee: { id: 1, first_name: 'Sarah', last_name: 'Nakamya', employee_number: 'EMP-00001' }, date: '2026-07-21', clock_in: '2026-07-21 07:55:00', clock_out: '2026-07-21 17:05:00', hours_worked: 8.17, overtime_hours: 0.17, status: 'present' },
  { id: 2, employee: { id: 2, first_name: 'James', last_name: 'Ochieng', employee_number: 'EMP-00002' }, date: '2026-07-21', clock_in: '2026-07-21 08:10:00', clock_out: null, hours_worked: 0, overtime_hours: 0, status: 'late' },
  { id: 3, employee: { id: 3, first_name: 'Mary', last_name: 'Ajambo', employee_number: 'EMP-00003' }, date: '2026-07-21', clock_in: '2026-07-21 07:48:00', clock_out: '2026-07-21 17:00:00', hours_worked: 8, overtime_hours: 0, status: 'present' },
  { id: 4, employee: { id: 4, first_name: 'Peter', last_name: 'Ssekitooleko', employee_number: 'EMP-00004' }, date: '2026-07-21', clock_in: null, clock_out: null, hours_worked: 0, overtime_hours: 0, status: 'absent' },
  { id: 5, employee: { id: 5, first_name: 'Grace', last_name: 'Mwangi', employee_number: 'EMP-00005' }, date: '2026-07-21', clock_in: '2026-07-21 07:50:00', clock_out: '2026-07-21 13:00:00', hours_worked: 4, overtime_hours: 0, status: 'half_day' },
]

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-700 border-green-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  half_day: 'bg-blue-100 text-blue-700 border-blue-200',
  leave: 'bg-purple-100 text-purple-700 border-purple-200',
  holiday: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function AttendancePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState({})
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employeeList, setEmployeeList] = useState([])
  const [viewMode, setViewMode] = useState('table')

  useEffect(() => { fetchRecords(); fetchReport(); fetchEmployees() }, [dateFrom, dateTo, employeeFilter, statusFilter])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const params = { per_page: 50 }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (employeeFilter) params.employee_id = employeeFilter
      if (statusFilter) params.status = statusFilter
      const res = await attendance.getAll(params)
      setRecords(toArray(res.data))
    } catch {
      setRecords(FALLBACK_ATTENDANCE)
    } finally { setLoading(false) }
  }

  const fetchReport = async () => {
    try {
      const params = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (employeeFilter) params.employee_id = employeeFilter
      const res = await attendance.getReport(params)
      setReport(res.data)
    } catch {
      setReport({ total_days: 5, present: 3, absent: 1, late: 1, total_hours: 20, total_overtime: 0.17, attendance_rate: 60, avg_hours_per_day: 6.67 })
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await employees.getAll({ per_page: 100 })
      setEmployeeList(toArray(res.data))
    } catch {
      setEmployeeList(FALLBACK_ATTENDANCE.map(r => r.employee))
    }
  }

  const handleClockIn = async (empId) => {
    try {
      await attendance.clockIn({ employee_id: empId })
      toast.success('Clocked in')
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock in')
    }
  }

  const handleClockOut = async (empId) => {
    try {
      await attendance.clockOut({ employee_id: empId })
      toast.success('Clocked out')
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock out')
    }
  }

  const getCalendarDays = () => {
    const start = new Date(dateFrom)
    const end = new Date(dateTo)
    const days = []
    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const dayRecords = records.filter(r => r.date?.split('T')[0] === dateStr)
      days.push({
        date: new Date(current),
        dateStr,
        records: dayRecords,
        present: dayRecords.filter(r => r.status === 'present').length,
        absent: dayRecords.filter(r => r.status === 'absent').length,
        late: dayRecords.filter(r => r.status === 'late').length,
      })
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const statCards = [
    { label: 'Attendance Rate', value: `${report.attendance_rate || 0}%`, color: 'text-[#0FD452]' },
    { label: 'Avg Hours/Day', value: `${report.avg_hours_per_day || 0}h`, color: 'text-blue-600' },
    { label: 'Total Overtime', value: `${report.total_overtime || 0}h`, color: 'text-yellow-600' },
    { label: 'Present', value: report.present || 0, color: 'text-green-600' },
  ]

  const calendarDays = viewMode === 'calendar' ? getCalendarDays() : []

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-500">Track employee attendance and working hours.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('table')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-[#0FD452]/10 text-[#0FD452]' : 'text-gray-500 hover:bg-gray-100'}`}>Table</button>
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-[#0FD452]/10 text-[#0FD452]' : 'text-gray-500 hover:bg-gray-100'}`}>Calendar</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-gray-100 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-gray-100 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]" />
            </div>
            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
              <option value="">All Employees</option>
              {employeeList.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Employee</span>
                      </div>
                    </th>
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
                        <Timer className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Hours</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Overtime</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center"><Loader2 className="w-8 h-8 text-[#0FD452] animate-spin mx-auto" /></td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">No records found</td></tr>
                  ) : (
                    records.map(rec => (
                      <tr key={rec.id} className="transition-colors hover:bg-[#0FD452]/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                              <User className="h-4 w-4 text-[#0FD452]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{rec.employee?.first_name} {rec.employee?.last_name}</p>
                              <p className="text-xs text-gray-500">{rec.employee?.employee_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(rec.date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatTime(rec.clock_in)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatTime(rec.clock_out)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{rec.hours_worked}h</td>
                        <td className="px-6 py-4 text-sm text-yellow-600">{rec.overtime_hours}h</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${STATUS_COLORS[rec.status] || ''}`}>{rec.status?.replace('_', ' ')}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {calendarDays.map(day => (
              <div key={day.dateStr} className={`bg-white shadow-sm border rounded-xl p-4 ${day.absent > 0 ? 'border-red-200' : day.late > 0 ? 'border-yellow-200' : 'border-gray-200'}`}>
                <p className="text-sm font-medium text-gray-900 mb-2">{day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-600">Present</span>
                    <span className="text-gray-900">{day.present}</span>
                  </div>
                  {day.late > 0 && <div className="flex items-center justify-between text-xs"><span className="text-yellow-600">Late<span className="text-gray-900">{day.late}</span></span></div>}
                  {day.absent > 0 && <div className="flex items-center justify-between text-xs"><span className="text-red-600">Absent<span className="text-gray-900">{day.absent}</span></span></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
