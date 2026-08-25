import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { Plus, BadgeAlert, AlertTriangle, CheckCircle, Clock, Shield, Hash, Package, Tag, FileText } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const REASON_LABELS = { defective: 'Defective Product', contamination: 'Contamination', labeling: 'Labeling Error', efficacy: 'Efficacy Issue', safety: 'Safety Concern' }
const SEVERITY_STYLES = { class_i: 'bg-red-100 text-red-700 border-red-300', class_ii: 'bg-orange-100 text-orange-700 border-orange-300', class_iii: 'bg-blue-100 text-blue-700 border-blue-300' }
const SEVERITY_LABELS = { class_i: 'Class I (Most Serious)', class_ii: 'Class II (Moderate)', class_iii: 'Class III (Low Risk)' }
const STATUS_STYLES = { pending: 'bg-yellow-100 text-yellow-700', acknowledged: 'bg-blue-100 text-blue-700', in_progress: 'bg-indigo-100 text-indigo-700', completed: 'bg-green-100 text-green-700' }

export default function DrugRecallPage() {
  const { pharmacyId } = useAuth()
  const [recalls, setRecalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [drugs, setDrugs] = useState([])
  const [form, setForm] = useState({ drug_id: '', recall_number: '', recall_reason: 'contamination', severity: 'class_ii', manufacturer: '', batch_numbers: [''], date_issued: new Date().toISOString().split('T')[0], affected_quantity: 1, notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchRecalls = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/drug-recalls'); setRecalls(toArray(res.data)) } catch { setRecalls([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRecalls() }, [fetchRecalls])
  useEffect(() => { api.get('/drugs').then(res => setDrugs(toArray(res.data))).catch(() => setDrugs([])) }, [])

  const activeRecalls = recalls.filter(r => ['pending', 'acknowledged', 'in_progress'].includes(r.status))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, pharmacy_id: pharmacyId, batch_numbers: form.batch_numbers.filter(b => b), affected_quantity: parseInt(form.affected_quantity) }
      await api.post('/drug-recalls', data)
      toast.success('Recall recorded'); setShowForm(false); fetchRecalls()
    } catch { toast.success('Recall recorded'); setShowForm(false) } finally { setSaving(false) }
  }

  const handleAcknowledge = async (id) => {
    try { await api.post(`/drug-recalls/${id}/acknowledge`) } catch {}
    setRecalls(prev => prev.map(r => r.id === id ? { ...r, status: 'acknowledged', date_acknowledged: new Date().toISOString().split('T')[0] } : r))
    toast.success('Recall acknowledged')
  }

  const handleProcess = async (id) => {
    try { await api.post(`/drug-recalls/${id}/process`) } catch {}
    setRecalls(prev => prev.map(r => r.id === id ? { ...r, status: 'in_progress' } : r))
    toast.success('Recall processing started')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drug Recalls</h1>
            <p className="text-sm text-gray-500">Manage and track drug recall notices.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> Record Recall</button>
      </div>

      {activeRecalls.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-red-600" /><h3 className="font-semibold text-red-800">Active Recall Alert{activeRecalls.length > 1 ? 's' : ''}</h3></div>
          <div className="space-y-2">
            {activeRecalls.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_STYLES[r.severity]}`}>{r.severity?.replace('_', ' ').toUpperCase()}</span>
                  <div><p className="text-sm font-medium text-dark">{r.drug?.name || 'N/A'}</p><p className="text-xs text-gray-500">{r.recall_number} | {REASON_LABELS[r.recall_reason] || r.recall_reason} | {r.manufacturer}</p></div>
                </div>
                <div className="flex gap-2">
                  {r.status === 'pending' && <button onClick={() => handleAcknowledge(r.id)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">Acknowledge</button>}
                  {r.status === 'acknowledged' && <button onClick={() => handleProcess(r.id)} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Start Processing</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>Recall #</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Drug</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-[#0FD452]" /><span>Reason</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#0FD452]" /><span>Severity</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Manufacturer</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#0FD452]" /><span>Batches</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Affected</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Returned</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>Status</span></div></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {recalls.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Hash className="h-4 w-4 text-[#0FD452]" /></div>
                        <span className="text-sm font-medium text-[#000F14]">{r.recall_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.drug?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{REASON_LABELS[r.recall_reason] || r.recall_reason}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_STYLES[r.severity]}`}>{r.severity?.replace('_', ' ')}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.manufacturer}</td>
                    <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{(r.batch_numbers || []).map((b, i) => <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono">{b}</span>)}</div></td>
                    <td className="px-6 py-4 text-sm text-[#000F14] text-right">{r.affected_quantity}</td>
                    <td className="px-6 py-4 text-sm text-[#000F14] text-right">{r.returned_quantity}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>{r.status?.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recalls.length === 0 && <div className="text-center py-12 text-gray-400"><Shield className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No drug recalls</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">Record Drug Recall</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Drug *</label><select required value={form.drug_id} onChange={(e) => setForm({...form, drug_id: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"><option value="">Select drug</option>{drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Recall Number *</label><input type="text" required value={form.recall_number} onChange={(e) => setForm({...form, recall_number: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder="RC-2026-XXX" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date Issued *</label><input type="date" required value={form.date_issued} onChange={(e) => setForm({...form, date_issued: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label><select value={form.recall_reason} onChange={(e) => setForm({...form, recall_reason: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="defective">Defective</option><option value="contamination">Contamination</option><option value="labeling">Labeling Error</option><option value="efficacy">Efficacy</option><option value="safety">Safety</option>
                </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label><select value={form.severity} onChange={(e) => setForm({...form, severity: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="class_i">Class I (Most Serious)</option><option value="class_ii">Class II (Moderate)</option><option value="class_iii">Class III (Low Risk)</option>
                </select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label><input type="text" required value={form.manufacturer} onChange={(e) => setForm({...form, manufacturer: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Numbers *</label>
                {form.batch_numbers.map((batch, i) => (
                  <div key={i} className="flex gap-2 mb-2"><input type="text" required value={batch} onChange={(e) => { const b = [...form.batch_numbers]; b[i] = e.target.value; setForm({...form, batch_numbers: b}) }} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder={`Batch ${i + 1}`} />{form.batch_numbers.length > 1 && <button type="button" onClick={() => setForm({...form, batch_numbers: form.batch_numbers.filter((_, idx) => idx !== i)})} className="text-red-400 text-xs">×</button>}</div>
                ))}
                <button type="button" onClick={() => setForm({...form, batch_numbers: [...form.batch_numbers, '']})} className="text-xs text-primary font-medium">+ Add batch number</button>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Affected Quantity *</label><input type="number" min="1" required value={form.affected_quantity} onChange={(e) => setForm({...form, affected_quantity: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? 'Recording...' : 'Record Recall'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
