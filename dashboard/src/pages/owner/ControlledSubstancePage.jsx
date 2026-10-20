import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { Plus, Shield, ShieldAlert, Printer, BookOpen, AlertTriangle, Hash, Package, CalendarDays, User, FileText } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

const SCHEDULE_TABS = [
  { key: 'all', labelKey: 'inventory.controlled.allSchedules' },
  { key: 'schedule_i', labelKey: 'inventory.controlled.scheduleI' },
  { key: 'schedule_ii', labelKey: 'inventory.controlled.scheduleII' },
  { key: 'schedule_iii', labelKey: 'inventory.controlled.scheduleIII' },
]

export default function ControlledSubstancePage() {
  const { t } = useLanguage()
  const { pharmacyId } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [scheduleTab, setScheduleTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showIssue, setShowIssue] = useState(null)
  const [drugs, setDrugs] = useState([])
  const [balanceReport, setBalanceReport] = useState(null)
  const [form, setForm] = useState({ drug_id: '', schedule: 'schedule_ii', date_received: new Date().toISOString().split('T')[0], quantity_received: 1, notes: '' })
  const [issueForm, setIssueForm] = useState({ issued_to: '', quantity_issued: 1, receiving_person_name: '', receiving_person_id_number: '', witness_name: '', witness_id_number: '' })
  const [saving, setSaving] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = scheduleTab !== 'all' ? { schedule: scheduleTab } : {}
      const [regRes, balRes] = await Promise.all([
        api.get('/controlled-substances', { params }),
        api.get('/controlled-substances/balance-report', { params: scheduleTab !== 'all' ? { schedule: scheduleTab } : {} })
      ])
      setRecords(regRes.data.data || regRes.data || [])
      setBalanceReport(balRes.data)
    } catch { setRecords([]); setBalanceReport(null) } finally { setLoading(false) }
  }, [scheduleTab])

  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { api.get('/drugs').then(res => setDrugs(toArray(res.data))).catch(() => setDrugs([])) }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/controlled-substances', { ...form, pharmacy_id: pharmacyId, quantity_received: parseInt(form.quantity_received) })
      toast.success(t('inventory.controlled.toastRegistered')); setShowForm(false); fetchRecords()
    } catch { toast.error(t('inventory.controlled.toastSaveFailed')); setShowForm(false) } finally { setSaving(false) }
  }

  const handleIssue = async () => {
    if (!showIssue) return
    setSaving(true)
    try {
      await api.post(`/controlled-substances/${showIssue.id}/issue`, { ...issueForm, quantity_issued: parseInt(issueForm.quantity_issued) })
      toast.success(t('inventory.controlled.toastIssued')); setShowIssue(null); fetchRecords()
    } catch { toast.error(t('inventory.controlled.toastSaveFailed')); setShowIssue(null) } finally { setSaving(false) }
  }

  const printRegister = () => {
    const content = document.getElementById('register-table')
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>Controlled Substance Register</title><style>body{font-family:serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px 8px;font-size:11px;text-align:left}th{background:#f0f0f0;font-weight:bold}h1{text-align:center;font-size:16px}h2{text-align:center;font-size:13px;margin-bottom:10px}.footer{margin-top:20px;font-size:11px}.sig{margin-top:30px;display:flex;justify-content:space-between}</style></head><body>`)
    win.document.write('<h1>TANZANIA PHARMACEUTICAL BOARD</h1>')
    win.document.write('<h2>CONTROLLED SUBSTANCE REGISTER</h2>')
    win.document.write('<p style="text-align:center">Pharmacy Name: ____________________ | License #: ____________________</p>')
    win.document.write(content.outerHTML)
    win.document.write('<div class="sig"><div>Pharmacist Signature: _______________<br>Name: ____________________<br>License #: ____________________</div><div>Witness Signature: _______________<br>Name: ____________________<br>ID Number: ____________________</div></div>')
    win.document.write('</body></html>')
    win.document.close()
    win.print()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.items.controlledSubstances')}</h1>
            <p className="text-sm text-gray-500">{t('inventory.controlled.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={printRegister} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"><Printer className="w-4 h-4" /> {t('inventory.controlled.printRegister')}</button>
          <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> {t('inventory.controlled.registerEntry')}</button>
        </div>
      </div>

      {balanceReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><ShieldAlert className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-gray-500">{t('inventory.controlled.totalReceived')}</p><p className="text-2xl font-bold text-dark">{balanceReport.total_received}</p></div></div></div>
          <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-orange-600" /></div><div><p className="text-sm text-gray-500">{t('inventory.controlled.totalIssued')}</p><p className="text-2xl font-bold text-dark">{balanceReport.total_issued}</p></div></div></div>
          <div className="bg-white rounded-xl p-5 border border-gray-200"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><BookOpen className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-500">{t('inventory.controlled.currentBalance')}</p><p className="text-2xl font-bold text-dark">{balanceReport.total_balance}</p></div></div></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center gap-1 px-4 pt-4 overflow-x-auto">
          {SCHEDULE_TABS.map(tab => (
            <button key={tab.key} onClick={() => setScheduleTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${scheduleTab === tab.key ? 'bg-primary text-dark' : 'text-gray-500 hover:bg-gray-100'}`}>{t(tab.labelKey)}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-[#000F14]">{t('inventory.controlled.registerBook')}</h3>
            <span className="text-xs text-gray-500">{t('inventory.controlled.tmdaNote')}</span>
          </div>
          <div className="overflow-x-auto" id="register-table">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.regNo')}</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('products.drugName')}</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.schedule')}</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.dateReceived')}</span></div></th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.qtyReceived')}</span></div></th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.balance')}</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.issuedTo')}</span></div></th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.qtyIssued')}</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.issueDate')}</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.patientId')}</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.rolePharmacist')}</span></div></th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.controlled.witness')}</span></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4 text-xs font-mono font-bold text-[#000F14]">{r.register_number}</td>
                    <td className="px-6 py-4 text-xs font-medium text-[#000F14]">{r.drug?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600 uppercase">{(r.schedule || '').replace('schedule_', 'Sched. ').replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{r.date_received ? new Date(r.date_received).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-6 py-4 text-xs text-[#000F14] font-medium text-right">{r.quantity_received}</td>
                    <td className="px-6 py-4 text-xs font-bold text-[#000F14] text-right">{r.balance_stock}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{r.issued_to || '—'}</td>
                    <td className="px-6 py-4 text-xs text-[#000F14] text-right">{r.quantity_issued || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{r.issue_date ? new Date(r.issue_date).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-mono">{r.receiving_person_id_number || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{r.issuing_pharmacist?.name || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{r.witness_name || '—'}</td>
                  </tr>
                ))}
                {records.length === 0 && <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-400 text-sm">{t('inventory.controlled.noRecords')}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
            {records.filter(r => r.balance_stock > 0 && !r.issued_to).map(r => (
              <button key={r.id} onClick={() => { setShowIssue(r); setIssueForm({ issued_to: '', quantity_issued: 1, receiving_person_name: '', receiving_person_id_number: '', witness_name: '', witness_id_number: '' }) }} className="px-3 py-1.5 text-xs font-medium bg-primary text-dark rounded-lg hover:bg-primary-600">{t('inventory.controlled.issueFrom')} {r.register_number}</button>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">{t('inventory.controlled.registerTitle')}</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.drug.drug')} *</label><select required value={form.drug_id} onChange={(e) => setForm({...form, drug_id: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"><option value="">{t('inventory.drug.selectDrug')}</option>{drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.schedule')} *</label><select value={form.schedule} onChange={(e) => setForm({...form, schedule: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"><option value="schedule_i">{t('inventory.controlled.scheduleI')}</option><option value="schedule_ii">{t('inventory.controlled.scheduleII')}</option><option value="schedule_iii">{t('inventory.controlled.scheduleIII')}</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.dateReceived')} *</label><input type="date" required value={form.date_received} onChange={(e) => setForm({...form, date_received: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.quantityReceived')} *</label><input type="number" min="1" required value={form.quantity_received} onChange={(e) => setForm({...form, quantity_received: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('common.notes')}</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button><button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? t('inventory.controlled.registering') : t('inventory.controlled.register')}</button></div>
            </form>
          </div>
        </div>
      )}

      {showIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowIssue(null)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-dark mb-1">{t('inventory.controlled.issueTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">{showIssue.drug?.name} | {t('inventory.controlled.balance')}: {showIssue.balance_stock} | {t('inventory.controlled.regNo')}: {showIssue.register_number}</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.issuedToField')} *</label><input type="text" required value={issueForm.issued_to} onChange={(e) => setIssueForm({...issueForm, issued_to: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.quantityIssued')} *</label><input type="number" min="1" max={showIssue.balance_stock} required value={issueForm.quantity_issued} onChange={(e) => setIssueForm({...issueForm, quantity_issued: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.patientName')} *</label><input type="text" required value={issueForm.receiving_person_name} onChange={(e) => setIssueForm({...issueForm, receiving_person_name: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.patientNidaId')} *</label><input type="text" required value={issueForm.receiving_person_id_number} onChange={(e) => setIssueForm({...issueForm, receiving_person_id_number: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder="NIDA-..." /></div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-dark mb-3">{t('inventory.controlled.witnessInfo')}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.witnessName')} *</label><input type="text" required value={issueForm.witness_name} onChange={(e) => setIssueForm({...issueForm, witness_name: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.controlled.witnessId')} *</label><input type="text" required value={issueForm.witness_id_number} onChange={(e) => setIssueForm({...issueForm, witness_id_number: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder="NIDA-..." /></div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2"><button onClick={() => setShowIssue(null)} className="btn-secondary">{t('common.cancel')}</button><button onClick={handleIssue} disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? t('inventory.controlled.issuing') : t('inventory.controlled.confirmIssue')}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
