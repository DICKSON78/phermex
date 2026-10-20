import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { Plus, AlertTriangle, PieChart, Hash, Package, CalendarDays, FileText, User } from 'lucide-react'
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

const REASON_COLORS = { expired: '#ef4444', damaged: '#f59e0b', contaminated: '#8b5cf6', stolen: '#6b7280', recalled: '#3b82f6' }
const REASON_KEYS = { expired: 'inventory.damaged.reasonExpired', damaged: 'inventory.damaged.reasonDamaged', contaminated: 'inventory.damaged.reasonContaminated', stolen: 'inventory.damaged.reasonStolen', recalled: 'inventory.damaged.reasonRecalled' }
const DISPOSAL_KEYS = { returned_to_supplier: 'inventory.damaged.disposalReturned', documented_disposal: 'inventory.damaged.disposalDocumented', donated: 'inventory.damaged.disposalDonated' }

export default function DamagedGoodsPage() {
  const { pharmacyId } = useAuth()
  const { t } = useLanguage()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [drugs, setDrugs] = useState([])
  const [form, setForm] = useState({ drug_id: '', damage_date: new Date().toISOString().split('T')[0], quantity: 1, unit_cost: 0, reason: 'expired', notes: '' })
  const [saving, setSaving] = useState(false)
  const [showProcess, setShowProcess] = useState(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/damaged-goods'); setRecords(toArray(res.data)) } catch { setRecords([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { api.get('/drugs').then(res => setDrugs(toArray(res.data))).catch(() => setDrugs([])) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/damaged-goods', { ...form, pharmacy_id: pharmacyId, quantity: parseInt(form.quantity), unit_cost: parseFloat(form.unit_cost) })
      toast.success(t('inventory.damaged.toastRecorded')); setShowForm(false); fetchRecords()
    } catch { toast.error(t('inventory.damaged.toastRecordFailed')); setShowForm(false) } finally { setSaving(false) }
  }

  const handleProcess = async () => {
    try {
      await api.post(`/damaged-goods/${showProcess.id}/process`, { disposal_method: showProcess.disposal_method || 'documented_disposal' })
      setRecords(prev => prev.map(r => r.id === showProcess.id ? { ...r, disposal_method: showProcess.disposal_method } : r))
      setShowProcess(null)
      toast.success(t('inventory.damaged.toastDisposalRecorded'))
    } catch {
      toast.error(t('inventory.damaged.toastDisposalFailed'))
    }
  }

  const totalLoss = records.reduce((s, r) => s + parseFloat(r.total_loss || 0), 0)
  const pieData = Object.entries(records.reduce((acc, r) => { acc[r.reason] = (acc[r.reason] || 0) + parseFloat(r.total_loss); return acc }, {})).map(([name, value]) => ({ name: REASON_KEYS[name] ? t(REASON_KEYS[name]) : name, value }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.items.damagedGoods')}</h1>
            <p className="text-sm text-gray-500">{t('inventory.damaged.subtitle')}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> {t('inventory.damaged.reportDamage')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div><div><p className="text-sm text-gray-500">{t('inventory.damaged.totalLoss')}</p><p className="text-2xl font-bold text-dark">TZS {totalLoss.toLocaleString()}</p></div></div></div>
        <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-orange-600" /></div><div><p className="text-sm text-gray-500">{t('inventory.damaged.totalRecords')}</p><p className="text-2xl font-bold text-dark">{records.length}</p></div></div></div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}><RePieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={3} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#8b5cf6', '#6b7280', '#3b82f6'][i % 5]} />)}
            </Pie><Tooltip formatter={(v) => `TZS ${v.toFixed(2)}`} /></RePieChart></ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">{t('common.noData')}</div>}
        </div>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.damaged.damageNo')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.damaged.drug')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.date')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.damaged.reason')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.damaged.qty')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><FileText className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.damaged.loss')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.damaged.disposal')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><AlertTriangle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.actions')}</span></div></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Hash className="h-4 w-4 text-[#0FD452]" /></div>
                        <span className="text-sm font-medium text-[#000F14]">{r.damage_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.drug?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.damage_date ? new Date(r.damage_date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4"><span className="text-sm capitalize" style={{ color: REASON_COLORS[r.reason] }}>{REASON_KEYS[r.reason] ? t(REASON_KEYS[r.reason]) : r.reason}</span></td>
                    <td className="px-6 py-4 text-sm text-[#000F14] text-right">{r.quantity}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600 text-right">TZS {parseFloat(r.total_loss).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{DISPOSAL_KEYS[r.disposal_method] ? t(DISPOSAL_KEYS[r.disposal_method]) : <span className="text-yellow-600 italic">{t('common.pending')}</span>}</td>
                    <td className="px-6 py-4 text-right">{!r.disposal_method && <button onClick={() => setShowProcess({ ...r, disposal_method: 'documented_disposal' })} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">{t('inventory.damaged.process')}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length === 0 && <div className="text-center py-12 text-gray-400"><AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('inventory.damaged.noRecords')}</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">{t('inventory.damaged.reportTitle')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.drug.drug')} *</label><select required value={form.drug_id} onChange={(e) => setForm({...form, drug_id: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"><option value="">{t('inventory.damaged.selectDrug')}</option>{drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.damaged.damageDate')} *</label><input type="date" required value={form.damage_date} onChange={(e) => setForm({...form, damage_date: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.damaged.reason')} *</label>
                  <select value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                    <option value="expired">{t('inventory.damaged.reasonExpired')}</option><option value="damaged">{t('inventory.damaged.reasonDamaged')}</option><option value="contaminated">{t('inventory.damaged.reasonContaminated')}</option><option value="stolen">{t('inventory.damaged.reasonStolen')}</option><option value="recalled">{t('inventory.damaged.reasonRecalled')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('pos.quantity')} *</label><input type="number" min="1" required value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.damaged.unitCost')} *</label><input type="number" step="0.01" min="0" required value={form.unit_cost} onChange={(e) => setForm({...form, unit_cost: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              </div>
              <div className="bg-red-50 rounded-lg p-3"><p className="text-sm text-red-600">{t('inventory.damaged.totalLoss')}: <strong>TZS ${(parseInt(form.quantity || 0) * parseFloat(form.unit_cost || 0)).toFixed(2)}</strong></p></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.labels.notes')}</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button><button type="submit" disabled={saving} className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">{saving ? t('inventory.damaged.recording') : t('inventory.damaged.recordDamage')}</button></div>
            </form>
          </div>
        </div>
      )}

      {showProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProcess(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">{t('inventory.damaged.processDisposal')}</h3>
            <div className="space-y-3">
              {['returned_to_supplier', 'documented_disposal', 'donated'].map(method => (
                <button key={method} onClick={() => setShowProcess({...showProcess, disposal_method: method})} className={`w-full p-3 rounded-lg text-sm font-medium text-left border ${showProcess.disposal_method === method ? 'border-primary bg-primary/5 text-dark' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {DISPOSAL_KEYS[method] ? t(DISPOSAL_KEYS[method]) : method}
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-6"><button onClick={() => setShowProcess(null)} className="btn-secondary">{t('common.cancel')}</button><button onClick={handleProcess} className="btn-primary">{t('common.confirm')}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
