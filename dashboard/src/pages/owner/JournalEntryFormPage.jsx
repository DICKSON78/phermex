import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, X, Loader2, BookOpen, Plus, Hash, Calendar, FileText, Scale } from 'lucide-react'
import toast from 'react-hot-toast'
import { journal, accounts } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatMoney } from '../../utils/currency'

function formatCurrency(amount) {
  return formatMoney(amount, { decimals: 2 })
}

const emptyLine = () => ({ account_id: '', debit: '', credit: '', description: '' })

export default function JournalEntryFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pharmacyId } = useAuth()
  const { t } = useLanguage()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ entry_date: new Date().toISOString().split('T')[0], description: '' })
  const [lines, setLines] = useState([emptyLine(), emptyLine()])
  const [accountOptions, setAccountOptions] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    loadAccounts()
    if (isEdit) fetchEntry()
  }, [id])

  const loadAccounts = async () => {
    try {
      const res = await accounts.getAll({ per_page: 200 })
      setAccountOptions(res.data.data || [])
    } catch { setAccountOptions([]) }
  }

  const fetchEntry = async () => {
    try {
      const res = await journal.getById(id)
      const entry = res.data.entry
      if (entry.status !== 'draft') {
        setBlocked(true)
      }
      setForm({ entry_date: entry.entry_date, description: entry.description })
      setLines((entry.lines || []).length >= 2
        ? entry.lines.map((l) => ({ account_id: l.account_id ? String(l.account_id) : '', debit: l.debit, credit: l.credit, description: l.description || '' }))
        : [...entry.lines.map((l) => ({ account_id: l.account_id ? String(l.account_id) : '', debit: l.debit, credit: l.credit, description: l.description || '' })), emptyLine()])
    } catch {
      toast.error(t('accounting.journal.loadFailed'))
    } finally { setFetching(false) }
  }

  const addLine = () => setLines((prev) => [...prev, emptyLine()])
  const removeLine = (idx) => { if (lines.length <= 2) return; setLines((prev) => prev.filter((_, i) => i !== idx)) }
  const updateLine = (idx, field, val) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: val } : l)))
    if (errors.linesHeader) setErrors((prev) => ({ ...prev, linesHeader: '' }))
  }

  const lineTotals = useMemo(() => ({
    debit: lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0),
    credit: lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0),
  }), [lines])

  const isBalanced = Math.abs(lineTotals.debit - lineTotals.credit) < 0.01 && lineTotals.debit > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.entry_date) errs.entry_date = t('accounting.journal.entryDateRequired')
    if (!form.description.trim()) errs.description = t('accounting.ui.descriptionRequired')
    if (!isBalanced) errs.linesHeader = t('accounting.journal.balanceError')
    if (lines.some((l) => !l.account_id)) errs.linesHeader = errs.linesHeader || t('accounting.journal.lineAccountRequired')
    setErrors(errs)
    if (Object.keys(errs).length) return

    const payload = {
      entry_date: form.entry_date,
      description: form.description,
      lines: lines.map((l) => ({
        account_id: parseInt(l.account_id),
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description || null,
      })),
    }

    setLoading(true)
    try {
      if (isEdit) await journal.update(id, payload)
      else await journal.create({ ...payload, pharmacy_id: pharmacyId })
      toast.success(isEdit ? t('accounting.journal.entryUpdated') : t('accounting.journal.entryCreated'))
      navigate('/dashboard/journal-entries')
    } catch (err) {
      toast.error(err.response?.data?.message || t('accounting.journal.saveFailed'))
    } finally { setLoading(false) }
  }

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (blocked) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/journal-entries" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('accounting.journal.editTitle')}</h1>
          </div>
          <p className="text-gray-600">{t('accounting.journal.blockedSubtitle')}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          {t('accounting.journal.editBlocked')} {form.status || t('accounting.journal.processed')}.
        </div>
        <Link to="/dashboard/journal-entries" className="btn-secondary">
          {t('accounting.journal.backToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link to="/dashboard/journal-entries" className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? t('accounting.journal.editTitle') : t('accounting.journal.newTitle')}</h1>
        </div>
        <p className="text-gray-600">{isEdit ? t('accounting.journal.editSubtitle') : t('accounting.journal.newSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <BookOpen className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('accounting.journal.detailsTitle')}</h3>
                <p className="text-sm text-gray-600">{t('accounting.journal.detailsSubtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.journal.entryDate')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.entry_date}
                    onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.entry_date && <p className="text-xs text-red-500 mt-1">{errors.entry_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.description')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('accounting.journal.descriptionPlaceholder')}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('accounting.journal.linesTitle')}</h3>
                <p className="text-sm text-gray-600">{t('accounting.journal.linesSubtitle')}</p>
              </div>
              <button type="button" onClick={addLine} className="btn-secondary">
                <Plus className="w-4 h-4" /> {t('accounting.journal.addLine')}
              </button>
            </div>
            {errors.linesHeader && <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><Scale className="w-3 h-3" /> {errors.linesHeader}</p>}
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 md:col-span-4">
                    <select
                      value={line.account_id}
                      onChange={(e) => updateLine(idx, 'account_id', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-[#0FD452]"
                    >
                      <option value="">{t('accounting.ui.selectAccount')}</option>
                      {accountOptions.map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-5 md:col-span-3">
                    <input
                      type="number" step="0.01" min="0"
                      value={line.debit}
                      onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                      placeholder={t('accounting.journal.debitPlaceholder')}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 tabular-nums focus:border-[#0FD452]"
                    />
                  </div>
                  <div className="col-span-5 md:col-span-3">
                    <input
                      type="number" step="0.01" min="0"
                      value={line.credit}
                      onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                      placeholder={t('accounting.journal.creditPlaceholder')}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 tabular-nums focus:border-[#0FD452]"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    {lines.length > 2 && (
                      <button type="button" onClick={() => removeLine(idx)} className="p-1.5 text-gray-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-6 pt-4 text-sm">
              <span className="text-gray-500">{t('accounting.journal.debit')}: <span className="text-gray-900 tabular-nums">{formatCurrency(lineTotals.debit)}</span></span>
              <span className="text-gray-500">{t('accounting.journal.credit')}: <span className="text-green-600 tabular-nums">{formatCurrency(lineTotals.credit)}</span></span>
              <span className={`font-bold ${isBalanced ? 'text-[#0FD452]' : 'text-red-600'}`} title={t('accounting.journal.debitsEqual')}>
                {isBalanced ? t('accounting.journal.balanced') : t('accounting.journal.unbalanced')}
              </span>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/journal-entries" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>{t('common.cancel')}</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isEdit ? t('accounting.journal.updateEntryBtn') : t('accounting.journal.createEntryBtn')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}