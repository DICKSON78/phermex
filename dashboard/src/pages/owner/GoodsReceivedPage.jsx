import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { Plus, Search, CheckCircle, AlertTriangle, Package, Hash, ClipboardList, Building2, Calendar, DollarSign, Settings } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function GoodsReceivedPage() {
  const [grns, setGrns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showQC, setShowQC] = useState(null)
  const [qcResult, setQcResult] = useState('passed')
  const [qcNotes, setQcNotes] = useState('')

  const fetchGRNs = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/goods-received'); setGrns(toArray(res.data)) } catch { setGrns([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchGRNs() }, [fetchGRNs])

  const handleQC = async () => {
    try { await api.post(`/goods-received/${showQC.id}/quality-check`, { quality_check: qcResult, quality_notes: qcNotes }) } catch {}
    setGrns(prev => prev.map(g => g.id === showQC.id ? { ...g, quality_check: qcResult, quality_notes: qcNotes } : g))
    setShowQC(null)
    toast.success('Quality check updated')
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Goods Received</h1>
            <p className="text-sm text-gray-500">Record and verify received shipments.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search GRNs..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>GRN #</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>PO #</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Supplier</span>
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
                    <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Items</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Value</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Quality</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Actions</span>
                  </div>
                </th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {grns.filter(g => !search || g.grn_number.toLowerCase().includes(search.toLowerCase())).map(g => (
                  <tr key={g.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Hash className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="text-sm font-medium text-dark">{g.grn_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{g.purchase_order?.order_number || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{g.supplier?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(g.received_date)}</td>
                    <td className="px-6 py-4 text-sm text-dark">{g.total_items}</td>
                    <td className="px-6 py-4 text-sm font-medium text-dark">TZS {parseFloat(g.total_value).toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.quality_check === 'passed' ? 'bg-green-100 text-green-700' : g.quality_check === 'failed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{g.quality_check}</span></td>
                    <td className="px-6 py-4 text-right"><button onClick={() => { setShowQC(g); setQcResult(g.quality_check || 'passed'); setQcNotes(g.quality_notes || '') }} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">QC Check</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {grns.length === 0 && <div className="text-center py-12 text-gray-400"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No goods received notes found</p></div>}
        </div>
      )}

      {showQC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQC(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">Quality Check - {showQC.grn_number}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                <div className="flex gap-3">
                  <button onClick={() => setQcResult('passed')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${qcResult === 'passed' ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Passed</button>
                  <button onClick={() => setQcResult('failed')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${qcResult === 'failed' ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Failed</button>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={qcNotes} onChange={(e) => setQcNotes(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder="Quality check notes..." /></div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowQC(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleQC} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
