import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen, Plus, Search, Filter, X, Send, RotateCcw, Eye,
  Calendar, Loader2, CheckCircle, AlertCircle, FileText, ArrowLeftRight,
  Hash, Settings, Building, DollarSign,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'posted', label: 'Posted' },
  { id: 'reversed', label: 'Reversed' },
]

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-700',
  posted: 'bg-green-100 text-green-700',
  reversed: 'bg-red-100 text-red-700',
}

const FALLBACK_ENTRIES = [
  { id: 1, entry_number: 'JE-2026-00001', entry_date: '2026-07-20', description: 'Initial cash deposit', total_debit: 50000, total_credit: 50000, status: 'posted', poster: { name: 'Admin' }, lines: [
    { id: 1, account: { account_code: '1000', account_name: 'Cash' }, debit: 50000, credit: 0 },
    { id: 2, account: { account_code: '3000', account_name: 'Owner Equity' }, debit: 0, credit: 50000 },
  ]},
  { id: 2, entry_number: 'JE-2026-00002', entry_date: '2026-07-20', description: 'Purchased inventory on credit', total_debit: 12500, total_credit: 12500, status: 'posted', poster: { name: 'Admin' }, lines: [
    { id: 3, account: { account_code: '1200', account_name: 'Inventory' }, debit: 12500, credit: 0 },
    { id: 4, account: { account_code: '2000', account_name: 'Accounts Payable' }, debit: 0, credit: 12500 },
  ]},
  { id: 3, entry_number: 'JE-2026-00003', entry_date: '2026-07-19', description: 'Cash sales revenue', total_debit: 8200, total_credit: 8200, status: 'draft', poster: null, lines: [
    { id: 5, account: { account_code: '1000', account_name: 'Cash' }, debit: 8200, credit: 0 },
    { id: 6, account: { account_code: '4000', account_name: 'Sales Revenue' }, debit: 0, credit: 8200 },
  ]},
  { id: 4, entry_number: 'JE-2026-00004', entry_date: '2026-07-18', description: 'Monthly rent payment', total_debit: 2000, total_credit: 2000, status: 'posted', poster: { name: 'Admin' }, lines: [
    { id: 7, account: { account_code: '5100', account_name: 'Rent Expense' }, debit: 2000, credit: 0 },
    { id: 8, account: { account_code: '1000', account_name: 'Cash' }, debit: 0, credit: 2000 },
  ]},
  { id: 5, entry_number: 'JE-2026-00005', entry_date: '2026-07-15', description: 'Reversal of incorrect entry', total_debit: 3500, total_credit: 3500, status: 'reversed', poster: { name: 'Admin' }, reverser: { name: 'Admin' }, reversal_reason: 'Incorrect amount recorded', lines: [
    { id: 9, account: { account_code: '5200', account_name: 'Salary Expense' }, debit: 3500, credit: 0 },
    { id: 10, account: { account_code: '1000', account_name: 'Cash' }, debit: 0, credit: 3500 },
  ]},
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 2 }).format(amount)
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewEntry, setViewEntry] = useState(null)
  const [showReverseModal, setShowReverseModal] = useState(null)
  const [reverseReason, setReverseReason] = useState('')
  const [processing, setProcessing] = useState(null)
  const [formData, setFormData] = useState({ entry_date: new Date().toISOString().split('T')[0], description: '', lines: [{ account_id: '', debit: '', credit: '', description: '' }, { account_id: '', debit: '', credit: '', description: '' }] })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [entriesRes, accountsRes] = await Promise.all([
        api.get('/journal', { params: { per_page: 100 } }),
        api.get('/accounts', { params: { per_page: 200 } }),
      ])
      setEntries(entriesRes.data.data || [])
      setAccounts(accountsRes.data.data || [])
    } catch {
      setEntries(FALLBACK_ENTRIES)
      setAccounts([
        { id: 1, account_code: '1000', account_name: 'Cash' },
        { id: 2, account_code: '2000', account_name: 'Accounts Payable' },
        { id: 3, account_code: '3000', account_name: 'Owner Equity' },
        { id: 4, account_code: '4000', account_name: 'Sales Revenue' },
        { id: 5, account_code: '5100', account_name: 'Rent Expense' },
        { id: 6, account_code: '5200', account_name: 'Salary Expense' },
        { id: 7, account_code: '1200', account_name: 'Inventory' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchStatus = activeStatus === 'all' || e.status === activeStatus
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.entry_number.toLowerCase().includes(search.toLowerCase())
      const matchDateFrom = !dateFrom || e.entry_date >= dateFrom
      const matchDateTo = !dateTo || e.entry_date <= dateTo
      return matchStatus && matchSearch && matchDateFrom && matchDateTo
    })
  }, [entries, activeStatus, search, dateFrom, dateTo])

  const totalDebit = filtered.reduce((s, e) => s + (e.total_debit || 0), 0)
  const totalCredit = filtered.reduce((s, e) => s + (e.total_credit || 0), 0)

  const addLine = () => setFormData({ ...formData, lines: [...formData.lines, { account_id: '', debit: '', credit: '', description: '' }] })
  const removeLine = (idx) => { if (formData.lines.length <= 2) return; setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== idx) }) }
  const updateLine = (idx, field, val) => {
    const lines = [...formData.lines]
    lines[idx] = { ...lines[idx], [field]: val }
    setFormData({ ...formData, lines })
  }

  const lineTotals = useMemo(() => ({
    debit: formData.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0),
    credit: formData.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0),
  }), [formData.lines])

  const isBalanced = Math.abs(lineTotals.debit - lineTotals.credit) < 0.01 && lineTotals.debit > 0

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!isBalanced) { toast.error('Debits must equal credits'); return }
    try {
      await api.post('/journal', {
        entry_date: formData.entry_date,
        description: formData.description,
        lines: formData.lines.map((l) => ({
          account_id: parseInt(l.account_id),
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description || null,
        })),
      })
      toast.success('Journal entry created')
      setShowForm(false)
      setFormData({ entry_date: new Date().toISOString().split('T')[0], description: '', lines: [{ account_id: '', debit: '', credit: '', description: '' }, { account_id: '', debit: '', credit: '', description: '' }] })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create entry')
    }
  }

  const handlePost = async (id) => {
    setProcessing(id)
    try {
      await api.post(`/journal/${id}/post`)
      toast.success('Entry posted')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post')
    } finally { setProcessing(null) }
  }

  const handleReverse = async () => {
    if (!reverseReason.trim()) { toast.error('Reason required'); return }
    setProcessing(showReverseModal)
    try {
      await api.post(`/journal/${showReverseModal}/reverse`, { reason: reverseReason })
      toast.success('Entry reversed')
      setShowReverseModal(null)
      setReverseReason('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reverse')
    } finally { setProcessing(null) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
            <p className="text-sm text-gray-500 mt-1">Record and manage accounting journal entries.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Entries</p>
          <p className="text-xl font-bold text-gray-900 font-mono">{filtered.length}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Debit</p>
          <p className="text-xl font-bold text-gray-900 font-mono tabular-nums">{formatCurrency(totalDebit)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Credit</p>
          <p className="text-xl font-bold text-gray-900 font-mono tabular-nums">{formatCurrency(totalCredit)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Draft Entries</p>
          <p className="text-xl font-bold text-yellow-600 font-mono">{entries.filter((e) => e.status === 'draft').length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white rounded-xl border border-gray-200 p-1">
          {STATUS_TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveStatus(tab.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeStatus === tab.id ? 'bg-[#0FD452] text-[#000F14]' : 'text-gray-500 hover:text-gray-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..." className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none w-full" />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0FD452]" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0FD452]" />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Entry #</span>
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
                    <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Description</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Debit</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Credit</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
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
                <tr><td colSpan={7} className="px-6 py-16 text-center"><Loader2 className="w-8 h-8 text-[#0FD452] animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500">No entries found</td></tr>
              ) : filtered.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-[#0FD452]/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                        <BookOpen className="h-4 w-4 text-[#0FD452]" />
                      </div>
                      <span className="text-sm font-mono text-gray-900">{entry.entry_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{entry.entry_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{entry.description}</td>
                  <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-gray-900">{formatCurrency(entry.total_debit)}</td>
                  <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-green-600">{formatCurrency(entry.total_credit)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[entry.status]}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewEntry(entry)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {entry.status === 'draft' && (
                        <button onClick={() => handlePost(entry.id)} disabled={processing === entry.id} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors" title="Post">
                          {processing === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {entry.status === 'posted' && (
                        <button onClick={() => setShowReverseModal(entry.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors" title="Reverse">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">New Journal Entry</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Entry Date</label>
                  <input type="date" value={formData.entry_date} onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0FD452]" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder="Entry description" required />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-500">Journal Lines</label>
                  <button type="button" onClick={addLine} className="text-xs text-[#0FD452] hover:text-[#0FD452]/80 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Line</button>
                </div>
                {formData.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      <select value={line.account_id} onChange={(e) => updateLine(idx, 'account_id', e.target.value)} className="w-full bg-gray-100 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 outline-none focus:border-[#0FD452]">
                        <option value="">Account</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="number" step="0.01" min="0" value={line.debit} onChange={(e) => updateLine(idx, 'debit', e.target.value)} className="w-full bg-gray-100 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder="Debit" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" step="0.01" min="0" value={line.credit} onChange={(e) => updateLine(idx, 'credit', e.target.value)} className="w-full bg-gray-100 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder="Credit" />
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      {formData.lines.length > 2 && <button type="button" onClick={() => removeLine(idx)} className="p-1.5 text-gray-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-end gap-6 pt-2 text-sm font-mono">
                  <span className="text-gray-500">Debit: <span className="text-gray-900">{formatCurrency(lineTotals.debit)}</span></span>
                  <span className="text-gray-500">Credit: <span className="text-green-600">{formatCurrency(lineTotals.credit)}</span></span>
                  <span className={`font-bold ${isBalanced ? 'text-[#0FD452]' : 'text-red-600'}`}>
                    {isBalanced ? 'Balanced' : 'Unbalanced'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={!isBalanced} className="btn-primary">
                  Create Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{viewEntry.entry_number}</h2>
                <p className="text-xs text-gray-500">{viewEntry.entry_date} | {viewEntry.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[viewEntry.status]}`}>{viewEntry.status}</span>
                <button onClick={() => setViewEntry(null)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
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
                            <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                            <span>Debit</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <div className="flex items-center justify-end gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                            <span>Credit</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewEntry.lines?.map((line) => (
                        <tr key={line.id} className="transition-colors hover:bg-[#0FD452]/5">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                                <Building className="h-4 w-4 text-[#0FD452]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{line.account?.account_name}</p>
                                <p className="text-xs text-gray-500">{line.account?.account_code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-gray-900">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                          <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-green-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 font-bold">
                        <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                        <td className="px-6 py-4 text-sm text-right font-mono tabular-nums text-gray-900">{formatCurrency(viewEntry.total_debit)}</td>
                        <td className="px-6 py-4 text-sm text-right font-mono tabular-nums text-green-600">{formatCurrency(viewEntry.total_credit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              {viewEntry.reversal_reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-600 font-medium">Reversal Reason: {viewEntry.reversal_reason}</p>
                </div>
              )}
              <div className="mt-4 flex gap-3">
                {viewEntry.status === 'draft' && (
                  <button onClick={() => { handlePost(viewEntry.id); setViewEntry(null) }} className="flex items-center gap-2 bg-[#0FD452] hover:bg-[#0FD452]/90 text-[#000F14] font-semibold px-4 py-2 rounded-xl transition-colors text-sm">
                    <Send className="w-4 h-4" /> Post Entry
                  </button>
                )}
                {viewEntry.status === 'posted' && (
                  <button onClick={() => { setViewEntry(null); setShowReverseModal(viewEntry.id) }} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-xl transition-colors text-sm">
                    <RotateCcw className="w-4 h-4" /> Reverse
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showReverseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Reverse Journal Entry</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Reason for Reversal</label>
                <textarea value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452] resize-none" rows={3} placeholder="Enter reason..." required />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowReverseModal(null); setReverseReason('') }} className="btn-secondary">Cancel</button>
                <button onClick={handleReverse} disabled={processing} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Reverse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
