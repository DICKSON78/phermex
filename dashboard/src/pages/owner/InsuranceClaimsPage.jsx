import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData'
import { Loader2, Plus, X, Search, FileText, Send, CheckCircle2, XCircle, BadgeCheck, Eye, ShieldCheck } from 'lucide-react'
import { insurance } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import Tabs from '../../components/Tabs'
import { formatMoney as sharedMoney } from '../../utils/currency'
import { useLanguage } from '../../contexts/LanguageContext'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
  paid: 'bg-purple-50 text-purple-700',
}

const STATUS_FILTERS = ['all', 'draft', 'submitted', 'approved', 'rejected', 'paid']

const STATUS_TAB_KEYS = {
  all: 'common.all',
  draft: 'sales.insurance.status.draft',
  submitted: 'sales.insurance.status.submitted',
  approved: 'sales.insurance.status.approved',
  rejected: 'sales.insurance.status.rejected',
  paid: 'sales.insurance.status.paid',
}

const emptyForm = {
  patient_insurance_id: '',
  order_id: '',
  total_amount: '',
  notes: '',
}

export default function InsuranceClaimsPage() {
  const { t } = useLanguage()
  const [claims, setClaims] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [claimsRes, statsRes, patientsRes] = await Promise.all([
        insurance.claims({ status }),
        insurance.stats(),
        insurance.patients(),
      ])
      setClaims(toArray(claimsRes.data))
      setStats(statsRes.data?.data || statsRes.data || null)
      setPatients(toArray(patientsRes.data))
    } catch {
      showToast(t('sales.insurance.loadClaimsError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status])

  const openForm = () => {
    setForm(emptyForm)
    setModal(true)
  }

  const selectedPatient = patients.find((p) => p.id === Number(form.patient_insurance_id))
  const totalAmount = Number(form.total_amount) || 0
  const coveragePct = Number(selectedPatient?.coverage_percent ?? 0)
  const approvedAmount = Math.round((totalAmount * coveragePct) / 100 * 100) / 100
  const copay = Math.round((totalAmount - approvedAmount) * 100) / 100

  const save = async () => {
    if (!form.patient_insurance_id) { showToast(t('sales.insurance.selectRecordError'), 'error'); return }
    if (!form.total_amount || Number(form.total_amount) <= 0) { showToast(t('sales.insurance.validAmountError'), 'error'); return }
    setSaving(true)
    try {
      const res = await insurance.createClaim({
        patient_insurance_id: form.patient_insurance_id,
        order_id: form.order_id || null,
        total_amount: Number(form.total_amount),
        notes: form.notes || null,
      })
      showToast(res.data?.message || t('sales.insurance.createdToast'))
      setModal(false)
      await load()
    } catch (err) {
      showToast(err?.response?.data?.message || t('sales.insurance.createError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (claim, nextStatus) => {
    const confirm = nextStatus === 'rejected'
      ? window.confirm(`${t('sales.insurance.rejectConfirm')} ${claim.claim_number}?`)
      : true
    if (!confirm) return
    try {
      const res = await insurance.updateClaim(claim.id, { status: nextStatus })
      showToast(res.data?.message || `${t('sales.insurance.claim')} ${t(STATUS_TAB_KEYS[nextStatus] || 'common.status')}`)
      if (selected?.id === claim.id) setSelected(null)
      await load()
      if (nextStatus === 'submitted' || nextStatus === 'approved') {
        setLoadingDetail(true)
        try {
          const d = await insurance.claim(claim.id)
          setDetail(d.data?.data || d.data || null)
        } finally { setLoadingDetail(false) }
      }
    } catch (err) {
      showToast(err?.response?.data?.message || t('sales.insurance.updateError'), 'error')
    }
  }

  const openDetail = async (claim) => {
    setSelected(claim)
    setLoadingDetail(true)
    try {
      const res = await insurance.claim(claim.id)
      setDetail(res.data?.data || res.data || null)
    } catch {
      setDetail(claim)
    } finally {
      setLoadingDetail(false)
    }
  }

  const formatMoney = (v) => sharedMoney(v, { decimals: 0 })

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-[#0FD452]" /></div>
  }

  return (
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{toast.msg}</div>
      )}

      <PageHeader
        icon={FileText}
        title={t('nav.items.insuranceClaims')}
        subtitle={t('sales.insurance.subtitle')}
        actions={
          <button onClick={openForm} className="btn-primary">
            <Plus className="w-4 h-4" /> {t('sales.insurance.newClaim')}
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('sales.insurance.totalClaims'), value: stats?.total_claims ?? 0, icon: FileText, color: 'text-blue-600 bg-blue-100' },
          { label: t('sales.insurance.pendingSubmitted'), value: stats?.pending_claims ?? 0, icon: Send, color: 'text-amber-600 bg-amber-100' },
          { label: t('sales.insurance.approvedValue'), value: formatMoney(stats?.approved_value ?? 0), icon: BadgeCheck, color: 'text-green-600 bg-green-100' },
          { label: t('sales.insurance.insuredPatients'), value: stats?.insured_patients ?? 0, icon: ShieldCheck, color: 'text-purple-600 bg-purple-100' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <Tabs
        tabs={[
          { id: 'all', label: t('common.all'), count: claims.length },
          ...STATUS_FILTERS.filter((s) => s !== 'all').map((s) => ({
            id: s,
            label: t(STATUS_TAB_KEYS[s]),
            count: claims.filter((c) => c.status === s).length,
          })),
        ]}
        active={status}
        onChange={setStatus}
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-5 py-3 font-medium text-gray-500">{t('sales.insurance.claimNo')}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">{t('sales.insurance.patient')}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">{t('sales.insurance.provider')}</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">{t('orders.amount')}</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">{t('sales.insurance.approved')}</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">{t('sales.insurance.copay')}</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">{t('common.status')}</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">{t('sales.insurance.noneFound')}</td></tr>
              ) : claims.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-700">{c.claim_number}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{c.patient_insurance?.customer_user?.name || 'Unknown'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.patient_insurance?.provider?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatMoney(c.total_amount)}</td>
                  <td className="px-5 py-3.5 text-right text-green-600 font-medium">{c.approved_amount != null ? formatMoney(c.approved_amount) : '—'}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{c.patient_copay != null ? formatMoney(c.patient_copay) : '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[c.status] || STATUS_COLORS.draft}`}>{t(`sales.insurance.status.${c.status}`, c.status)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openDetail(c)} className="text-xs font-semibold text-gray-600 hover:text-[#0FD452] flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {t('common.view')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New claim modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{t('sales.insurance.newClaimTitle')}</h3>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.patientRecord')} *</label>
                <select
                  value={form.patient_insurance_id}
                  onChange={(e) => setForm({ ...form, patient_insurance_id: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white"
                >
                  <option value="">{t('sales.insurance.selectPatient')}</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.customer_user?.name || 'Unknown'} — {p.provider?.name || t('sales.insurance.provider')} ({p.coverage_percent}%)
                    </option>
                  ))}
                </select>
                {selectedPatient && (
                  <p className="text-xs text-gray-400 mt-1">{t('sales.insurance.coverage')}: {coveragePct}% · {t('sales.insurance.policyNumber')}: {selectedPatient.policy_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.insurance.totalAmount')} (TZS) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.total_amount}
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                  placeholder="e.g. 250000"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>

              {selectedPatient && totalAmount > 0 && (
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500">{t('sales.insurance.insurerPays')}</p>
                    <p className="text-sm font-bold text-green-600">{formatMoney(approvedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('sales.insurance.patientCopay')}</p>
                    <p className="text-sm font-bold text-gray-800">{formatMoney(copay)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.shared.notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="2"
                  placeholder={t('sales.insurance.notesPlaceholder')}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#0a2015] disabled:opacity-50">
                  {saving ? t('common.saving') : t('sales.insurance.createClaim')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{detail?.claim_number || selected.claim_number}</h2>
                <p className="text-sm text-gray-500">
                  {detail?.patient_insurance?.provider?.name || selected.patient_insurance?.provider?.name || ''} · {t('sales.insurance.created')} {selected.created_at}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0FD452]" /></div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-5 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{t('common.status')}</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[detail?.status] || STATUS_COLORS.draft}`}>{t(`sales.insurance.status.${detail?.status}`, detail?.status)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{t('sales.insurance.claimValue')}</p>
                    <p className="text-xl font-bold text-gray-900">{formatMoney(detail?.total_amount)}</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">{t('sales.insurance.patient')}</h3>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-[#0FD452] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{detail?.patient_insurance?.customer_user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{detail?.patient_insurance?.customer_user?.phone || ''}</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">{t('sales.insurance.billingSummary')}</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">{t('sales.insurance.totalAmount')}</span><span className="font-semibold">{formatMoney(detail?.total_amount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">{t('sales.insurance.insurerPays')} ({detail?.patient_insurance?.coverage_percent}%)</span><span className="font-semibold text-green-600">{formatMoney(detail?.approved_amount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">{t('sales.insurance.patientCopay')}</span><span className="font-semibold">{formatMoney(detail?.patient_copay)}</span></div>
                </div>

                {detail?.notes && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">{t('sales.shared.notes')}</h3>
                    <p className="text-sm text-gray-600 mb-6 bg-gray-50 rounded-xl p-4">{detail.notes}</p>
                  </>
                )}

                <div className="pt-4 border-t border-gray-100">
                  {detail?.status === 'draft' && (
                    <button
                      onClick={() => changeStatus(detail, 'submitted')}
                      className="w-full py-3 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#0a2015] flex items-center justify-center gap-2"
                    ><Send className="w-4 h-4" /> {t('sales.insurance.submitClaim')}</button>
                  )}
                  {detail?.status === 'submitted' && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => changeStatus(detail, 'approved')}
                        className="py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                      ><BadgeCheck className="w-4 h-4" /> {t('leaves.approve')}</button>
                      <button
                        onClick={() => changeStatus(detail, 'rejected')}
                        className="py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 flex items-center justify-center gap-2"
                      ><XCircle className="w-4 h-4" /> {t('leaves.reject')}</button>
                    </div>
                  )}
                  {detail?.status === 'approved' && (
                    <button
                      onClick={() => changeStatus(detail, 'paid')}
                      className="w-full py-3 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#0a2015] flex items-center justify-center gap-2"
                    ><CheckCircle2 className="w-4 h-4" /> {t('sales.insurance.markPaid')}</button>
                  )}
                  {(detail?.status === 'paid' || detail?.status === 'rejected') && (
                    <p className="text-center text-xs text-gray-400 py-3">
                      {detail?.status === 'paid' ? t('sales.insurance.paidNote') : t('sales.insurance.rejectedNote')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}