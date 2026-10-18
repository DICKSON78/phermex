import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader2, BookOpen, Building, DollarSign, Hash, Calendar,
  Send, RotateCcw, Pencil, Trash2, CheckCircle, Settings,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { journal } from '../../services/api'
import { formatMoney } from '../../utils/currency'
import PageHeader from '../../components/PageHeader'

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-700',
  posted: 'bg-green-100 text-green-700',
  reversed: 'bg-red-100 text-red-700',
}

function formatCurrency(amount) {
  return formatMoney(amount, { decimals: 2 })
}

export default function JournalEntryViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showReverse, setShowReverse] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => { fetchEntry() }, [id])

  const fetchEntry = async () => {
    try {
      const res = await journal.getById(id)
      setEntry(res.data.entry)
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true)
      else toast.error('Failed to load entry')
    } finally { setLoading(false) }
  }

  const handlePost = async () => {
    setProcessing(true)
    try {
      await journal.post(id)
      toast.success('Entry posted')
      fetchEntry()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post')
    } finally { setProcessing(false) }
  }

  const handleReverse = async () => {
    if (!reason.trim()) { toast.error('Reason required'); return }
    setProcessing(true)
    try {
      await journal.reverse(id, { reason })
      toast.success('Entry reversed')
      setShowReverse(false)
      setReason('')
      fetchEntry()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reverse')
    } finally { setProcessing(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this draft entry? This cannot be undone.')) return
    setProcessing(true)
    try {
      await journal.delete(id)
      toast.success('Entry deleted')
      navigate('/dashboard/journal-entries')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setProcessing(false) }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (notFound || !entry) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/journal-entries" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Journal Entry</h1>
          </div>
          <p className="text-gray-600">Entry not found.</p>
        </div>
        <Link to="/dashboard/journal-entries" className="btn-secondary">Back to Journal Entries</Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={BookOpen}
        title={entry.entry_number}
        subtitle={`${entry.entry_date} | ${entry.description}`}
        actions={
          <div className="flex items-center gap-2">
            {entry.status === 'draft' && (
              <>
                <Link to={`/dashboard/journal-entries/${entry.id}/edit`} className="btn-secondary">
                  <Pencil className="w-4 h-4" /> Edit
                </Link>
                <button onClick={handleDelete} disabled={processing} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button onClick={handlePost} disabled={processing} className="btn-primary">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post Entry
                </button>
              </>
            )}
            {entry.status === 'posted' && (
              <button onClick={() => setShowReverse(true)} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-xl transition-colors text-sm">
                <RotateCcw className="w-4 h-4" /> Reverse
              </button>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[entry.status]}`}>{entry.status}</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><DollarSign className="w-4 h-4 text-red-600" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Total Debit</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{formatCurrency(entry.total_debit)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="w-4 h-4 text-green-600" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Total Credit</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{formatCurrency(entry.total_credit)}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Hash className="w-4 h-4 text-blue-600" /></div></div>
          <p className="text-xs text-gray-500 mb-1">Entry Number</p>
          <p className="text-xl font-bold text-gray-900">{entry.entry_number}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 pt-5 pb-3">
          <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Journal Lines</h3>
            <p className="text-sm text-gray-600">Accounts affected by this entry</p>
          </div>
          <Settings className="w-4 h-4 text-gray-300 ml-auto" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#0FD452]" /><span>Account</span></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[#0FD452]" /><span>Debit</span></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[#0FD452]" /><span>Credit</span></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entry.lines?.map((line) => (
                <tr key={line.id} className="transition-colors hover:bg-[#0FD452]/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                        <Building className="h-4 w-4 text-[#0FD452]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{line.account?.account_name}</p>
                        <p className="text-xs text-gray-500">{line.account?.account_code}{line.description ? ` | ${line.description}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm tabular-nums text-right text-gray-900">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                  <td className="px-6 py-4 text-sm tabular-nums text-right text-green-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-bold">
                <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                <td className="px-6 py-4 text-sm text-right tabular-nums text-gray-900">{formatCurrency(entry.total_debit)}</td>
                <td className="px-6 py-4 text-sm text-right tabular-nums text-green-600">{formatCurrency(entry.total_credit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {entry.reversal_reason && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5"><RotateCcw className="w-3 h-3" /> Reversal Reason: {entry.reversal_reason}</p>
        </div>
      )}

      {showReverse && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Reverse Journal Entry</h3>
          <p className="text-sm text-gray-600 mb-4">Posting a reversing entry will negate this entry.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Enter reason for reversal..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 text-sm resize-none"
          />
          <div className="mt-4 flex gap-3 justify-end">
            <button onClick={() => { setShowReverse(false); setReason('') }} className="btn-secondary">Cancel</button>
            <button onClick={handleReverse} disabled={processing} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Reverse Entry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}