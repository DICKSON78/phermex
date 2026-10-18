import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Plus, Search, X, Send, RotateCcw, Eye, Pencil, Trash2,
  Calendar, Loader2, CheckCircle, AlertCircle, FileText, ArrowLeftRight,
  Hash, Settings, Building, DollarSign, ArrowDownRight, ArrowUpRight, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'
import PageHeader from '../../components/PageHeader'
import Tabs from '../../components/Tabs'

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-700',
  posted: 'bg-green-100 text-green-700',
  reversed: 'bg-red-100 text-red-700',
}


function formatCurrency(amount) {
  return formatMoney(amount, { decimals: 2 })
}

export default function JournalEntriesPage() {
  const navigate = useNavigate()
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
      setEntries([])
      setAccounts([])
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft journal entry?')) return
    setProcessing(id)
    try {
      await api.delete(`/journal/${id}`)
      toast.success('Journal entry deleted')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setProcessing(null) }
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
      <PageHeader
        icon={BookOpen}
        title="Journal Entries"
        subtitle="Record and manage accounting journal entries."
        actions={
          <button onClick={() => navigate('/dashboard/journal-entries/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> New Entry
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-[#0FD452]/10 rounded-lg flex items-center justify-center"><BookOpen className="w-4 h-4 text-[#0FD452]" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Total Entries</p>
          <p className="text-xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><ArrowDownRight className="w-4 h-4 text-red-600" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Total Debit</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{formatCurrency(totalDebit)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><ArrowUpRight className="w-4 h-4 text-green-600" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Total Credit</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{formatCurrency(totalCredit)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center"><Clock className="w-4 h-4 text-yellow-600" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Draft Entries</p>
          <p className="text-xl font-bold text-yellow-600">{entries.filter((e) => e.status === 'draft').length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Tabs
          tabs={[
            { id: 'all', label: 'All', count: entries.length },
            { id: 'draft', label: 'Draft', count: entries.filter((e) => e.status === 'draft').length },
            { id: 'posted', label: 'Posted', count: entries.filter((e) => e.status === 'posted').length },
            { id: 'reversed', label: 'Reversed', count: entries.filter((e) => e.status === 'reversed').length },
          ]}
          active={activeStatus}
          onChange={setActiveStatus}
          className="mb-0"
        />
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
                      <span className="text-sm  text-gray-900">{entry.entry_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{entry.entry_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{entry.description}</td>
                  <td className="px-6 py-4 text-sm  tabular-nums text-right text-gray-900">{formatCurrency(entry.total_debit)}</td>
                  <td className="px-6 py-4 text-sm  tabular-nums text-right text-green-600">{formatCurrency(entry.total_credit)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[entry.status]}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/dashboard/journal-entries/${entry.id}`)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {entry.status === 'draft' && (
                        <button onClick={() => navigate(`/dashboard/journal-entries/${entry.id}/edit`)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {entry.status === 'draft' && (
                        <button onClick={() => handleDelete(entry.id)} disabled={processing === entry.id} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors" title="Delete">
                          {processing === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
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
