import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { Plus, FileCheck, Send, Eye, Clock, CheckCircle, FileText, Hash, Calendar, ShieldCheck, MapPin, Zap } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'


const STATUS_STYLES = { draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700', approved: 'bg-green-100 text-green-700' }

const TEMPLATE_INFO = {
  monthly_sales: { icon: '📊', label: 'reports.regulatory.templates.monthly_sales.label', description: 'reports.regulatory.templates.monthly_sales.description' },
  inventory_status: { icon: '📦', label: 'reports.regulatory.templates.inventory_status.label', description: 'reports.regulatory.templates.inventory_status.description' },
  controlled_substances: { icon: '💊', label: 'reports.regulatory.templates.controlled_substances.label', description: 'reports.regulatory.templates.controlled_substances.description' },
  drug_expiry: { icon: '⏰', label: 'reports.regulatory.templates.drug_expiry.label', description: 'reports.regulatory.templates.drug_expiry.description' },
  supplier_activity: { icon: '🚚', label: 'reports.regulatory.templates.supplier_activity.label', description: 'reports.regulatory.templates.supplier_activity.description' },
}

export default function RegulatoryReportsPage() {
  const { t } = useLanguage()
  const { pharmacyId, user } = useAuth()
  const currentPharmacy =
    user?.current_pharmacy ??
    user?.currentPharmacy ??
    (user?.pharmacy || []).find((p) => p.id === pharmacyId) ??
    (user?.pharmacy || [])[0]
  const pharmacyName = currentPharmacy?.pharmacy_name || currentPharmacy?.name || 'Phermex Pharmacy'
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [showPreview, setShowPreview] = useState(null)
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState({ report_type: 'monthly_sales', report_period_month: new Date().getMonth() + 1, report_period_year: new Date().getFullYear(), notes: '' })
  const [generating, setGenerating] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/regulatory-reports'); setReports(toArray(res.data)) } catch { setReports([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchReports()
    api.get('/regulatory-reports/templates').then(res => setTemplates(res.data.templates || [])).catch(() => setTemplates([]))
  }, [fetchReports])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/regulatory-reports', { ...form, pharmacy_id: pharmacyId })
      toast.success(t('reports.regulatory.toastGenerated'))
      setShowGenerate(false)
      setShowPreview(res.data.report)
      fetchReports()
    } catch { toast.error(t('reports.regulatory.toastSubmitFailed')); setShowGenerate(false) } finally { setGenerating(false) }
  }

  const handleSubmit = async (id) => {
    try {
      await api.post(`/regulatory-reports/${id}/submit`, { submitted_to: 'TMDA' })
      toast.success(t('reports.regulatory.toastSubmitted'))
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'submitted', submitted_to: 'TMDA', submitted_at: new Date().toISOString() } : r))
    } catch { toast.error(t('reports.regulatory.toastSubmitFailed')) }
  }

  const months = [
    t('reports.regulatory.months.january'), t('reports.regulatory.months.february'), t('reports.regulatory.months.march'),
    t('reports.regulatory.months.april'), t('reports.regulatory.months.may'), t('reports.regulatory.months.june'),
    t('reports.regulatory.months.july'), t('reports.regulatory.months.august'), t('reports.regulatory.months.september'),
    t('reports.regulatory.months.october'), t('reports.regulatory.months.november'), t('reports.regulatory.months.december'),
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('reports.regulatory.title')}</h1>
            <p className="text-sm text-gray-500">{t('reports.regulatory.subtitle')}</p>
          </div>
        </div>
        <button onClick={() => setShowGenerate(true)} className="btn-primary"><Plus className="w-5 h-5" /> {t('reports.regulatory.generateButton')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(TEMPLATE_INFO).map(([type, info]) => (
          <div key={type} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setForm({...form, report_type: type}); setShowGenerate(true) }}>
            <div className="text-2xl mb-2">{info.icon}</div>
            <h4 className="text-sm font-semibold text-dark">{t(info.label)}</h4>
            <p className="text-xs text-gray-500 mt-1">{t(info.description)}</p>
          </div>
        ))}
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>{t('reports.regulatory.reportType')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>{t('reports.regulatory.period')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>{t('common.status')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>{t('reports.regulatory.submittedTo')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>{t('reports.regulatory.submittedAt')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Zap className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>{t('common.actions')}</span>
                  </div>
                </th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <FileText className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="text-sm font-medium text-dark">{TEMPLATE_INFO[r.report_type] ? t(TEMPLATE_INFO[r.report_type].label) : r.report_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{months[(r.report_period_month || 1) - 1]} {r.report_period_year}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>{t(`reports.regulatory.status.${r.status}`, r.status)}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.submitted_to || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowPreview(r)} className="btn-icon-primary"><Eye className="w-4 h-4" /></button>
                        {r.status === 'draft' && <button onClick={() => handleSubmit(r.id)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"><Send className="w-3 h-3" /> {t('reports.regulatory.submit')}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reports.length === 0 && <div className="text-center py-12 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('reports.regulatory.empty')}</p></div>}
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowGenerate(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">{t('reports.regulatory.generateButton')}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.regulatory.reportTypeLabel')}</label>
                <select value={form.report_type} onChange={(e) => setForm({...form, report_type: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                  {Object.entries(TEMPLATE_INFO).map(([k, v]) => <option key={k} value={k}>{t(v.label)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.regulatory.monthLabel')}</label>
                  <select value={form.report_period_month} onChange={(e) => setForm({...form, report_period_month: parseInt(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.regulatory.yearLabel')}</label>
                  <select value={form.report_period_year} onChange={(e) => setForm({...form, report_period_year: parseInt(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                    {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.regulatory.notes')}</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-blue-700">{t('reports.regulatory.infoBox')}</p></div>
              <div className="flex gap-3 justify-end"><button onClick={() => setShowGenerate(false)} className="btn-secondary">{t('common.cancel')}</button><button onClick={handleGenerate} disabled={generating} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{generating ? t('reports.regulatory.generating') : t('reports.regulatory.generateButton')}</button></div>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(null)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark">{TEMPLATE_INFO[showPreview.report_type] ? t(TEMPLATE_INFO[showPreview.report_type].label) : t('reports.regulatory.previewFallback')}</h3>
              <button onClick={() => setShowPreview(null)} className="text-gray-400 hover:text-dark">×</button>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <div className="text-center mb-4">
                <h4 className="font-bold text-dark text-lg">{pharmacyName}</h4>
                <p className="text-sm text-gray-500">{TEMPLATE_INFO[showPreview.report_type] ? t(TEMPLATE_INFO[showPreview.report_type].label) : ''} — {months[(showPreview.report_period_month || 1) - 1]} {showPreview.report_period_year}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {showPreview.report_data && Object.entries(showPreview.report_data).filter(([k]) => !['pharmacy_name', 'generated_at'].includes(k)).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-3 bg-white rounded border border-gray-200">
                    <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium text-dark">{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              {showPreview.status === 'draft' && <button onClick={() => { handleSubmit(showPreview.id); setShowPreview(null) }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><Send className="w-4 h-4" /> {t('reports.regulatory.submitToTmda')}</button>}
              <button onClick={() => setShowPreview(null)} className="btn-secondary">{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
