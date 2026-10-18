import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Save, ClipboardCheck, BarChart3, Hash, Package } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }

export default function StockTakeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [take, setTake] = useState(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({})
  const [summary, setSummary] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchTake = async () => {
    try {
      const res = await api.get(`/stock-takes/${id}`)
      const data = res.data.stock_take || res.data
      setTake(data)
      const map = {}
      ;(data.items || []).forEach((item) => { map[item.drug_id] = item.counted_quantity ?? '' })
      setCounts(map)
    } catch { setTake(null) } finally { setLoading(false) }
  }

  useEffect(() => { fetchTake() }, [id])

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-200 rounded-xl animate-pulse" /></div>
  if (!take) return <div className="p-6 text-center text-gray-500">Stock take not found</div>

  const items = take.items || []
  const allCounted = items.length > 0 && items.every((it) => counts[it.drug_id] !== '' && counts[it.drug_id] !== null && counts[it.drug_id] !== undefined)
  const liveVariance = (item) => { const c = counts[item.drug_id]; return c === '' || c === undefined ? null : parseInt(c) - item.system_quantity }

  const setCount = (drugId, val) => setCounts((prev) => ({ ...prev, [drugId]: val }))

  const handleSaveCounts = async () => {
    if (!allCounted) { toast.error('Enter a counted quantity for every drug first'); return }
    setSaving(true)
    try {
      await api.post(`/stock-takes/${id}/record`, {
        items: items.map((it) => ({ drug_id: it.drug_id, counted_quantity: parseInt(counts[it.drug_id]) })),
      })
      toast.success('Counts saved')
      await fetchTake()
    } catch { toast.error('Failed to save counts') } finally { setSaving(false) }
  }

  const handleComplete = async () => {
    if (!allCounted) { toast.error('Not all drugs have been counted yet'); return }
    setSaving(true)
    try {
      const res = await api.post(`/stock-takes/${id}/complete`)
      setSummary(res.data.summary)
      toast.success('Stock take completed — review variance before approving')
      await fetchTake()
    } catch { toast.error('Failed to complete stock take') } finally { setSaving(false) }
  }

  const handleApprove = async () => {
    if (!window.confirm('Approve this count and apply the stock adjustments?')) return
    setSaving(true)
    try {
      await api.post(`/stock-takes/${id}/approve`)
      toast.success('Adjustments applied to stock')
      setSummary(null)
      await fetchTake()
    } catch { toast.error('Failed to approve stock take') } finally { setSaving(false) }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this stock take?')) return
    try {
      await api.post(`/stock-takes/${id}/cancel`)
      toast.success('Stock take cancelled')
      await fetchTake()
    } catch { toast.error('Failed to cancel stock take') }
  }

  const editable = ['draft', 'in_progress'].includes(take.status)

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/stock-takes')} className="btn-ghost"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-[#0FD452]" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Take {take.stock_take_code}</h1>
          <p className="text-sm text-gray-500">{take.title || 'Stock count'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-dark">{take.stock_take_code}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[take.status]}`}>{take.status?.replace(/_/g, ' ')}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{take.count_type === 'cycle' ? 'Cycle Count' : 'Full Count'}</span>
          </div>
          <div className="flex gap-2">
            {editable && <button onClick={handleSaveCounts} disabled={saving} className="btn-primary"><Save className="w-4 h-4" /> Save Counts</button>}
            {editable && <button onClick={handleComplete} disabled={saving} className="btn-primary"><CheckCircle className="w-4 h-4" /> Complete</button>}
            {take.status === 'completed' && <button onClick={handleApprove} disabled={saving} className="btn-primary"><CheckCircle className="w-4 h-4" /> Approve & Apply</button>}
            {take.status === 'completed' && <button onClick={() => navigate(`/dashboard/stock-movements`)} className="btn-secondary"><BarChart3 className="w-4 h-4" /> View Movements</button>}
            {editable && <button onClick={handleCancel} className="btn-danger-outline"><XCircle className="w-4 h-4" /> Cancel</button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase font-semibold">Total Items</p><p className="text-2xl font-bold text-dark mt-1"><span className="inline-flex items-center gap-2"><Package className="w-4 h-4 text-[#0FD452]" />{take.total_items}</span></p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase font-semibold">Counted</p><p className="text-2xl font-bold text-dark mt-1">{take.counted_items || 0}<span className="text-sm text-gray-400"> / {take.total_items}</span></p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase font-semibold">Variance Total</p><p className={`text-2xl font-bold mt-1 ${take.variance_total > 0 ? 'text-green-600' : take.variance_total < 0 ? 'text-red-600' : 'text-dark'}`}>{take.variance_total > 0 ? '+' : ''}{take.variance_total}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase font-semibold">Started</p><p className="text-sm font-semibold text-dark mt-1">{take.started_at ? new Date(take.started_at).toLocaleString() : '—'}</p></div>
      </div>

      {summary && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-green-800 mb-2">Count locked. Variance summary ready.</p>
          <div className="flex flex-wrap gap-4 text-sm text-green-700">
            <span><span className="font-semibold">{summary.total_items}</span> items</span>
            <span>Variance: <span className="font-semibold">{summary.variance_total > 0 ? '+' : ''}{summary.variance_total}</span></span>
          </div>
          <button onClick={handleApprove} disabled={saving} className="mt-3 px-4 py-2 bg-[#0FD452] text-[#000F14] rounded-lg text-sm font-bold"><CheckCircle className="inline w-4 h-4 mr-1" /> Approve & Apply Adjustments</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-lg font-semibold text-dark">Count Items</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5 text-[#0FD452]" /><span>Drug</span></div></th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center justify-end gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>System Qty</span></div></th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center justify-end gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>Counted Qty</span></div></th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center justify-end gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-[#0FD452]" /><span>Variance</span></div></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const variance = liveVariance(item)
                return (
                  <tr key={item.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><ClipboardCheck className="h-4 w-4 text-[#0FD452]" /></div>
                        <div><p className="text-sm font-medium text-dark">{item.drug?.name || 'Drug #' + item.drug_id}</p>{item.drug?.manufacturer && <p className="text-xs text-gray-400">{item.drug.manufacturer}</p>}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.system_quantity}</td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="number"
                        min="0"
                        disabled={!editable}
                        value={counts[item.drug_id] ?? ''}
                        onChange={(e) => setCount(item.drug_id, e.target.value)}
                        className={`w-24 px-3 py-2 text-right text-sm rounded-lg outline-none border ${editable ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}
                        placeholder="—"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {variance === null ? <span className="text-gray-300">—</span> : <span className={variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-500'}>{variance > 0 ? '+' : ''}{variance}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <div className="text-center py-12 text-gray-400"><ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No countable items</p></div>}
      </div>
    </div>
  )
}