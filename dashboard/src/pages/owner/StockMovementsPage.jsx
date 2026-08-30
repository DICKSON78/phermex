import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import {
  Activity, Search, ArrowDown, ArrowUp, RefreshCw, Undo2, X, ArrowRight,
  ChevronLeft, ChevronRight, Plus, Filter, XCircle,
  Calendar, Pill, Tag, Package, DollarSign, FileText, User,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'


const TYPE_CONFIG = {
  purchase: { color: 'bg-green-100 text-green-700', icon: ArrowDown, label: 'Purchase' },
  sale: { color: 'bg-blue-100 text-blue-700', icon: ArrowUp, label: 'Sale' },
  adjustment: { color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw, label: 'Adjustment' },
  return: { color: 'bg-orange-100 text-orange-700', icon: Undo2, label: 'Return' },
  expiry: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Expiry' },
  transfer: { color: 'bg-purple-100 text-purple-700', icon: ArrowRight, label: 'Transfer' },
}

const TYPE_OPTIONS = ['All', 'Purchase', 'Sale', 'Adjustment', 'Return', 'Expiry', 'Transfer']

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAdjustForm, setShowAdjustForm] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState({ drug_id: '', type: 'adjustment_in', quantity: '', reason: '', unit_cost: '' })
  const [drugs, setDrugs] = useState([])
  const pageSize = 25

  useEffect(() => {
    fetchMovements()
    const fetchDrugs = async () => {
      try {
        const drugsRes = await api.get('/drugs')
        setDrugs(drugsRes.data?.data || drugsRes.data || [])
      } catch (e) { /* ignore */ }
    }
    fetchDrugs()
  }, [])

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const res = await api.get('/drug-movements')
      setMovements(toArray(res.data))
    } catch {
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = movements.filter((m) => {
    const matchSearch = !search ||
      m.drug_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.reference?.toLowerCase().includes(search.toLowerCase()) ||
      m.performed_by?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || m.type === typeFilter.toLowerCase()
    let matchDate = true
    if (dateFrom) matchDate = matchDate && m.created_at?.substring(0, 10) >= dateFrom
    if (dateTo) matchDate = matchDate && m.created_at?.substring(0, 10) <= dateTo
    return matchSearch && matchType && matchDate
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = {
    total: movements.length,
    purchases: movements.filter((m) => m.type === 'purchase').length,
    sales: movements.filter((m) => m.type === 'sale').length,
    adjustments: movements.filter((m) => m.type === 'adjustment').length,
    returns: movements.filter((m) => m.type === 'return').length,
    expiries: movements.filter((m) => m.type === 'expiry').length,
  }

  const statCards = [
    { label: 'Total Movements', value: stats.total, icon: Activity, color: 'bg-[#0FD452]/10 text-[#0FD452]' },
    { label: 'Purchases', value: stats.purchases, icon: ArrowDown, color: 'bg-green-100 text-green-600' },
    { label: 'Sales', value: stats.sales, icon: ArrowUp, color: 'bg-blue-100 text-blue-600' },
    { label: 'Adjustments', value: stats.adjustments, icon: RefreshCw, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Returns', value: stats.returns, icon: Undo2, color: 'bg-orange-100 text-orange-600' },
    { label: 'Expiries', value: stats.expiries, icon: XCircle, color: 'bg-red-100 text-red-600' },
  ]

  const handleManualAdjustment = async () => {
    if (!adjustmentForm.drug_id || !adjustmentForm.quantity || !adjustmentForm.reason) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      const res = await api.post('/drug-movements', {
        drug_id: parseInt(adjustmentForm.drug_id),
        type: adjustmentForm.type,
        quantity: parseInt(adjustmentForm.quantity),
        reason: adjustmentForm.reason,
        unit_cost: parseFloat(adjustmentForm.unit_cost || 0)
      })
      setShowAdjustForm(false)
      setAdjustmentForm({ drug_id: '', type: 'adjustment_in', quantity: '', reason: '', unit_cost: '' })
      toast.success('Stock adjustment recorded')
      fetchMovements()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record adjustment')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
            <p className="text-sm text-gray-500">Track all inventory changes and adjustments.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdjustForm(true)}
          className="flex items-center gap-2 bg-[#0FD452] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0bc246] transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Record Manual Adjustment
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-[#000F14]">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search by drug, reference, or user..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#000F14] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#000F14] outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
              className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#000F14] outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
              className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#000F14] outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>DateTime</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Drug</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Type</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Quantity</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Unit Cost</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Total Value</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Reference</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden xl:table-cell">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Performed By</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden xl:table-cell">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Notes</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-[#0FD452] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No stock movements found</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((m) => {
                  const tc = TYPE_CONFIG[m.type] || TYPE_CONFIG.adjustment
                  const TypeIcon = tc.icon
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Calendar className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm text-gray-600 whitespace-nowrap">{m.created_at}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#000F14]">{m.drug_name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tc.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {tc.label}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium ${m.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity >= 0 ? '+' : ''}{m.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">TZS {Number(m.unit_cost || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#000F14] hidden lg:table-cell">TZS {Number(m.total_value || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-500 hidden lg:table-cell">{m.reference || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 hidden xl:table-cell">{m.performed_by || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden xl:table-cell max-w-[180px] truncate">{m.notes || '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-ghost"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page
                if (totalPages <= 5) page = i + 1
                else if (currentPage <= 3) page = i + 1
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                else page = currentPage - 2 + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded text-xs font-medium transition ${
                      currentPage === page
                        ? 'bg-[#0FD452] text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-ghost"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAdjustForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAdjustForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#000F14]">Record Manual Adjustment</h3>
                <button onClick={() => setShowAdjustForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Drug</label>
                  <select
                    value={adjustmentForm.drug_id}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, drug_id: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 focus:outline-none focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452]/30"
                  >
                    <option value="">Select drug</option>
                    {drugs.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select
                    value={adjustmentForm.type}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 focus:outline-none focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452]/30"
                  >
                    <option value="adjustment_in">Adjustment In (+)</option>
                    <option value="adjustment_out">Adjustment Out (-)</option>
                    <option value="return">Return</option>
                    <option value="expiry">Expiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
                    placeholder="0"
                    min="1"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 focus:outline-none focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
                  <input
                    type="text"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    placeholder="Reason for adjustment"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 focus:outline-none focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Cost (Optional)</label>
                  <input
                    type="number"
                    value={adjustmentForm.unit_cost}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, unit_cost: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 focus:outline-none focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452]/30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 justify-end">
                <button
                  onClick={() => setShowAdjustForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAdjustment}
                  disabled={!adjustmentForm.drug_id || !adjustmentForm.quantity || !adjustmentForm.reason}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0FD452] text-white rounded-xl text-sm font-semibold hover:bg-[#0bc246] disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Record Adjustment
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
