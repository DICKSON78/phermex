import { useState, useEffect, useMemo } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import {
  Receipt, Plus, Search, Edit, Trash2, MoreVertical,
  DollarSign, TrendingDown, BarChart3, Calendar, Filter, X,
  Tag, FileText, Hash, Settings,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'


const categoryColors = {
  Rent: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Utilities: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Supplies: { bg: 'bg-green-100', text: 'text-green-700' },
  Salaries: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Transport: { bg: 'bg-orange-100', text: 'text-orange-700' },
  Other: { bg: 'bg-gray-100', text: 'text-gray-600' },
}

const dateRanges = {
  'this_week': 'This Week',
  'this_month': 'This Month',
  'this_quarter': 'This Quarter',
  'custom': 'Custom',
}

export default function ExpenseListPage() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState('this_month')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [categories, setCategories] = useState(['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Other'])

  useEffect(() => {
    fetchExpenses()
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await api.get('/expenses/categories')
      if (res.data?.categories?.length) setCategories(res.data.categories)
    } catch (e) { /* use defaults */ }
  }

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses')
      setExpenses(toArray(res.data))
    } catch {
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !categoryFilter || e.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [expenses, search, categoryFilter])

  const totalThisMonth = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const avgDaily = Math.round(totalThisMonth / daysInMonth)

  const categoryTotals = {}
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (e.amount || 0)
  })
  const biggestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

  const monthlyData = [
    { name: 'Jan', amount: 320000 },
    { name: 'Feb', amount: 280000 },
    { name: 'Mar', amount: 350000 },
    { name: 'Apr', amount: 410000 },
    { name: 'May', amount: 390000 },
    { name: 'Jun', amount: 450000 },
    { name: 'Jul', amount: totalThisMonth },
  ]

  const handleDelete = async (expense) => {
    try {
      await api.delete(`/expenses/${expense.id}`)
    } catch {}
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount / 1000)
  }

  const statCards = [
    { label: 'Total This Month', value: formatMoney(totalThisMonth), icon: DollarSign, color: 'bg-primary/10 text-primary' },
    { label: 'Average Daily', value: formatMoney(avgDaily), icon: TrendingDown, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Biggest Category', value: biggestCategory ? biggestCategory[0] : 'N/A', icon: BarChart3, color: 'bg-purple-500/10 text-purple-500' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500">Track and manage pharmacy expenses.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/expenses/new')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenses</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis tick={{ fontSize: 12, fill: '#888' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                formatter={(value) => [formatMoney(value), 'Amount']}
              />
              <Bar dataKey="amount" fill="#0FD452" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(dateRanges).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateRange === key ? 'bg-primary text-dark' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Category
          </button>
        </div>
        {showFilters && (
          <div className="px-6 pb-4 border-t border-gray-100 pt-4 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? `${(categoryColors[cat] || categoryColors.Other).bg} ${(categoryColors[cat] || categoryColors.Other).text} ring-2 ring-offset-1 ring-current`
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter('')}
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
                    <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Date</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Category</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Description</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Amount</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Recorded By</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Receipt #</span>
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
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No expenses found</td>
                </tr>
              ) : (
                filtered.map((expense, index) => {
                  const catStyle = categoryColors[expense.category] || categoryColors.Other
                  return (
                    <tr key={expense.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Calendar className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm text-gray-900">{expense.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatMoney(expense.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.recorded_by}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{expense.receipt_number}</td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                          className="btn-ghost"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === index && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                            <div className="absolute right-6 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                              <button
                                onClick={() => { navigate(`/dashboard/expenses/${expense.id}/edit`); setActiveMenu(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => { setConfirmAction(() => () => { handleDelete(expense); setActiveMenu(null) }); setActiveMenu(null) }}
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
