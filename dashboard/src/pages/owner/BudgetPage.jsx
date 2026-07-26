import { useState, useEffect, useMemo } from 'react'
import {
  Target, Plus, Search, Loader2, X, TrendingUp, TrendingDown,
  BarChart3, DollarSign, Calendar, Filter, Building, FileText,
} from 'lucide-react'
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../services/api'

const PIE_COLORS = ['#0FD452', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 2 }).format(amount)
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [showForm, setShowForm] = useState(false)
  const [varianceData, setVarianceData] = useState(null)
  const [formData, setFormData] = useState({ account_id: '', budgeted_amount: '', notes: '' })
  const [processing, setProcessing] = useState(false)

  useEffect(() => { fetchData() }, [selectedYear, selectedMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [budgetRes, varRes, accRes] = await Promise.all([
        api.get('/budgets', { params: { year: selectedYear, month: selectedMonth, per_page: 100 } }),
        api.get('/budgets/variance', { params: { year: selectedYear } }),
        api.get('/accounts', { params: { type: 'expense', per_page: 100 } }),
      ])
      setBudgets(budgetRes.data.data || [])
      setVarianceData(varRes.data)
      setAccounts(accRes.data.data || [])
    } catch {
      setBudgets([])
      setVarianceData(null)
      setAccounts([])
    } finally { setLoading(false) }
  }

  const totalBudgeted = budgets.reduce((s, b) => s + (b.budgeted_amount || 0), 0)
  const totalActual = budgets.reduce((s, b) => s + (b.actual_amount || 0), 0)
  const totalVariance = totalActual - totalBudgeted
  const variancePct = totalBudgeted > 0 ? ((totalVariance / totalBudgeted) * 100).toFixed(1) : 0

  const pieData = budgets.map((b) => ({
    name: b.account?.account_name || 'Unknown',
    value: b.budgeted_amount || 0,
  }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setProcessing(true)
    try {
      await api.post('/budgets', {
        account_id: parseInt(formData.account_id),
        budget_year: selectedYear,
        budget_month: selectedMonth,
        budgeted_amount: parseFloat(formData.budgeted_amount),
        notes: formData.notes || null,
      })
      toast.success('Budget entry created')
      setShowForm(false)
      setFormData({ account_id: '', budgeted_amount: '', notes: '' })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setProcessing(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-sm text-gray-500 mt-1">Plan and track financial budgets.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Budget
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0FD452]">
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex bg-white rounded-xl border border-gray-200 p-1">
          {MONTHS.map((m, i) => (
            <button key={i} onClick={() => setSelectedMonth(i + 1)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedMonth === i + 1 ? 'bg-[#0FD452] text-[#000F14]' : 'text-gray-500 hover:text-gray-900'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-[#0FD452]/10 rounded-lg flex items-center justify-center"><Target className="w-4 h-4 text-[#0FD452]" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Budgeted</p>
          <p className="text-xl font-bold text-gray-900 font-mono tabular-nums">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><DollarSign className="w-4 h-4 text-blue-600" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Actual</p>
          <p className="text-xl font-bold text-gray-900 font-mono tabular-nums">{formatCurrency(totalActual)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalVariance <= 0 ? 'bg-green-100' : 'bg-red-100'}`}>{totalVariance <= 0 ? <TrendingDown className="w-4 h-4 text-green-600" /> : <TrendingUp className="w-4 h-4 text-red-600" />}</div></div>
          <p className="text-xs text-gray-500 mb-1">Variance</p>
          <p className={`text-xl font-bold font-mono tabular-nums ${totalVariance <= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><BarChart3 className="w-4 h-4 text-purple-600" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Variance %</p>
          <p className={`text-xl font-bold font-mono tabular-nums ${parseFloat(variancePct) <= 0 ? 'text-green-600' : 'text-red-600'}`}>{variancePct}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Allocation</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }} formatter={(v) => [formatCurrency(v), 'Budgeted']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-gray-500">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900 font-mono tabular-nums">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Variance Trend ({selectedYear})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={varianceData?.monthly_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(v) => `TZS ${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '12px', background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }} formatter={(v) => [formatCurrency(v)]} />
                <Legend />
                <Bar dataKey="budgeted" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="actual" fill="#0FD452" radius={[4, 4, 0, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Budget vs Actual - {MONTHS[selectedMonth - 1]} {selectedYear}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Account</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Budgeted</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Actual</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Variance</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Progress</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Notes</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-[#0FD452] animate-spin mx-auto" /></td></tr>
              ) : budgets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No budgets for this period</td></tr>
              ) : budgets.map((budget) => {
                const variance = (budget.actual_amount || 0) - (budget.budgeted_amount || 0)
                const pct = budget.budgeted_amount > 0 ? ((budget.actual_amount / budget.budgeted_amount) * 100) : 0
                const isOver = variance > 0
                return (
                  <tr key={budget.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Building className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{budget.account?.account_name}</p>
                          <p className="text-xs text-gray-500">{budget.account?.account_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-gray-900">{formatCurrency(budget.budgeted_amount)}</td>
                    <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-gray-900">{formatCurrency(budget.actual_amount)}</td>
                    <td className={`px-6 py-4 text-sm font-mono tabular-nums text-right font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                      {isOver ? '+' : ''}{formatCurrency(variance)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[120px] mx-auto">
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="text-gray-500">{pct.toFixed(0)}%</span>
                          <span className={isOver ? 'text-red-600' : 'text-[#0FD452]'}>{isOver ? 'Over' : 'Under'}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className={`h-2 rounded-full transition-all ${isOver ? 'bg-red-400' : 'bg-[#0FD452]'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{budget.notes || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Add Budget Entry</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Period</label>
                  <p className="text-sm text-gray-900 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Account</label>
                  <select value={formData.account_id} onChange={(e) => setFormData({ ...formData, account_id: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0FD452]" required>
                    <option value="">Select account</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Budgeted Amount</label>
                <input type="number" step="0.01" min="0" value={formData.budgeted_amount} onChange={(e) => setFormData({ ...formData, budgeted_amount: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452] resize-none" rows={2} placeholder="Optional notes" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={processing} className="btn-primary">
                  {processing && <Loader2 className="w-4 h-4 animate-spin" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
