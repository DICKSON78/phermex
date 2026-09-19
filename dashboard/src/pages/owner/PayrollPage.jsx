import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import {
  DollarSign, Loader2, FileText, Download, Check, X, CreditCard,
  ChevronLeft, ChevronRight, PieChart, TrendingDown, TrendingUp,
  User, Coins, Shield, Settings,
} from 'lucide-react'
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import toast from 'react-hot-toast'
import { payroll, employees } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 2 }).format(amount || 0)
}

const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600 border-gray-200', pending: 'bg-yellow-100 text-yellow-700 border-yellow-200', approved: 'bg-blue-100 text-blue-700 border-blue-200', paid: 'bg-green-100 text-green-700 border-green-200', cancelled: 'bg-red-100 text-red-700 border-red-200' }
const PIE_COLORS = ['#0FD452', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6']

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function PayrollPage() {
  const { pharmacyId } = useAuth()
  const [payrollList, setPayrollList] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState({})
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1)
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear())
  const [statusFilter, setStatusFilter] = useState('')
  const [showPayslip, setShowPayslip] = useState(null)
  const [payslipData, setPayslipData] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmInfo, setConfirmInfo] = useState({ title: '', message: '' })

  useEffect(() => { fetchPayroll(); fetchSummary() }, [periodMonth, periodYear, statusFilter])

  const fetchPayroll = async () => {
    setLoading(true)
    try {
      const params = { period_month: periodMonth, period_year: periodYear, per_page: 50 }
      if (statusFilter) params.status = statusFilter
      const res = await payroll.getAll(params)
      setPayrollList(toArray(res.data))
    } catch {
      setPayrollList([])
    } finally { setLoading(false) }
  }

  const fetchSummary = async () => {
    try {
      const res = await payroll.getSummary({ period_month: periodMonth, period_year: periodYear })
      setSummary(res.data)
    } catch {
      setSummary({})
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await payroll.create({ pharmacy_id: pharmacyId, period_month: periodMonth, period_year: periodYear })
      toast.success(res.data.message)
      fetchPayroll()
      fetchSummary()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payroll')
    } finally { setGenerating(false) }
  }

  const handleApprove = async (id) => {
    try {
      await payroll.approve(id)
      toast.success('Payroll approved')
      fetchPayroll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handlePay = async (id) => {
    try {
      await payroll.pay(id, { payment_method: 'bank' })
      toast.success('Marked as paid')
      fetchPayroll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleCancel = async (id) => {
    try {
      await payroll.cancel(id)
      toast.success('Payroll cancelled')
      fetchPayroll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const viewPayslip = async (id) => {
    try {
      const res = await payroll.getPayslip(id)
      setPayslipData(res.data)
      setShowPayslip(id)
    } catch {
      toast.error('Failed to load payslip')
    }
  }

  const deductionData = [
    { name: 'PAYE', value: summary.total_paye || 0 },
    { name: 'NSSF', value: summary.total_nssf || 0 },
    { name: 'NHIF', value: summary.total_nhif || 0 },
    { name: 'Housing Levy', value: summary.total_housing_levy || 0 },
  ].filter(d => d.value > 0)

  const summaryCards = [
    { label: 'Total Gross', value: formatCurrency(summary.total_gross), icon: TrendingUp, color: 'text-[#0FD452]' },
    { label: 'Total Deductions', value: formatCurrency(summary.total_deductions), icon: TrendingDown, color: 'text-red-600' },
    { label: 'Total Net', value: formatCurrency(summary.total_net), icon: DollarSign, color: 'text-blue-600' },
    { label: 'Employees', value: summary.employee_count || 0, icon: FileText, color: 'text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
              <p className="text-sm text-gray-500">Process and manage employee payroll.</p>
            </div>
          </div>
          <button onClick={() => { setConfirmInfo({ title: 'Generate Payroll', message: `Generate payroll for ${MONTHS[periodMonth - 1]} ${periodYear}?` }); setConfirmAction(() => handleGenerate) }} disabled={generating} className="btn-primary">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            Generate Payroll
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Month</label>
              <select value={periodMonth} onChange={(e) => setPeriodMonth(Number(e.target.value))} className="bg-gray-100 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Year</label>
              <select value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} className="bg-gray-100 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0FD452]">
                {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              {['', 'draft', 'approved', 'paid'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === f ? 'bg-[#0FD452]/10 text-[#0FD452]' : 'text-gray-500 hover:bg-gray-100'}`}>{f || 'All'}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {summaryCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {deductionData.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Deduction Breakdown</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={deductionData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                      {deductionData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                {deductionData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <div>
                      <p className="text-sm text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(d.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Employee</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Basic</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Allow.</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Gross</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>PAYE</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>NSSF</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Net</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={9} className="px-6 py-16 text-center"><Loader2 className="w-8 h-8 text-[#0FD452] animate-spin mx-auto" /></td></tr>
                ) : payrollList.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-16 text-center text-gray-500 text-sm">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No payroll records for this period</p>
                    <button onClick={handleGenerate} className="mt-3 text-[#0FD452] hover:underline text-sm">Generate Payroll</button>
                  </td></tr>
                ) : (
                  payrollList.map(p => (
                    <tr key={p.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <User className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.employee?.first_name} {p.employee?.last_name}</p>
                            <p className="text-xs text-gray-500">{p.employee?.employee_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(p.basic_salary)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500 hidden lg:table-cell">{formatCurrency(p.allowances)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">{formatCurrency(p.gross_salary)}</td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 hidden md:table-cell">{formatCurrency(p.paye_tax)}</td>
                      <td className="px-6 py-4 text-sm text-right text-yellow-600 hidden md:table-cell">{formatCurrency(p.nssf_employee)}</td>
                      <td className="px-6 py-4 text-sm text-right text-[#0FD452] font-medium">{formatCurrency(p.net_salary)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewPayslip(p.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="View Payslip">
                            <FileText className="w-4 h-4" />
                          </button>
                          {p.status === 'draft' && (
                            <button onClick={() => handleApprove(p.id)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {(p.status === 'draft' || p.status === 'approved') && (
                            <button onClick={() => { setConfirmInfo({ title: 'Mark as Paid', message: 'Mark this payroll as paid?' }); setConfirmAction(() => () => handlePay(p.id)) }} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Mark Paid">
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          {p.status !== 'paid' && p.status !== 'cancelled' && (
                            <button onClick={() => { setConfirmInfo({ title: 'Cancel Payroll', message: 'Cancel this payroll record?' }); setConfirmAction(() => () => handleCancel(p.id)) }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Cancel">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showPayslip && payslipData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowPayslip(null); setPayslipData(null) }}>
            <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Payslip</h2>
                  <button onClick={() => { setShowPayslip(null); setPayslipData(null) }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center mb-4">
                  <p className="text-lg font-semibold text-[#0FD452]">{payslipData.payroll?.employee?.first_name} {payslipData.payroll?.employee?.last_name}</p>
                  <p className="text-sm text-gray-500">Period: {payslipData.payroll?.period_month}/{payslipData.payroll?.period_year}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Earnings</h4>
                  <div className="space-y-2">
                    {Object.entries(payslipData.breakdown?.earnings || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-700">{key}</span>
                        <span className="text-gray-900">{formatCurrency(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                      <span className="text-gray-700">Gross Salary</span>
                      <span className="text-[#0FD452]">{formatCurrency(payslipData.payroll?.gross_salary)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Deductions</h4>
                  <div className="space-y-2">
                    {Object.entries(payslipData.breakdown?.deductions || {}).filter(([, val]) => val > 0).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-700">{key}</span>
                        <span className="text-red-600">-{formatCurrency(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Net Salary</span>
                    <span className="text-[#0FD452]">{formatCurrency(payslipData.payroll?.net_salary)}</span>
                  </div>
                </div>

                {payslipData.breakdown?.employer_costs && Object.values(payslipData.breakdown.employer_costs).some(v => v > 0) && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Employer Costs</h4>
                    {Object.entries(payslipData.breakdown.employer_costs).filter(([, val]) => val > 0).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-700">{key}</span>
                        <span className="text-yellow-600">{formatCurrency(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmInfo.title}
        message={confirmInfo.message}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => { confirmAction?.(); setConfirmAction(null); setConfirmInfo({ title: '', message: '' }) }}
        onCancel={() => { setConfirmAction(null); setConfirmInfo({ title: '', message: '' }) }}
      />
    </div>
  )
}
