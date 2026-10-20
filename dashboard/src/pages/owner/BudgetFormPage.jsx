import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, X, Loader2, Calculator, Hash, Calendar, DollarSign, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { budgets, accounts } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

export default function BudgetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pharmacyId } = useAuth()
  const { t, lang } = useLanguage()
  const isEdit = Boolean(id)

  const now = new Date()
  const [form, setForm] = useState({
    account_id: '',
    budget_year: now.getFullYear(),
    budget_month: now.getMonth() + 1,
    budgeted_amount: '',
    notes: '',
  })
  const [accountOptions, setAccountOptions] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    loadAccounts()
    if (isEdit) fetchBudget()
  }, [id])

  const loadAccounts = async () => {
    try {
      const res = await accounts.getAll({ per_page: 200 })
      setAccountOptions(res.data.data || [])
    } catch { setAccountOptions([]) }
  }

  const fetchBudget = async () => {
    try {
      const res = await budgets.getById(id)
      const b = res.data.budget
      setForm({
        account_id: b.account_id ? String(b.account_id) : '',
        budget_year: b.budget_year,
        budget_month: b.budget_month,
        budgeted_amount: b.budgeted_amount ?? '',
        notes: b.notes || '',
      })
    } catch {
      toast.error(t('accounting.budget.loadFailed'))
    } finally { setFetching(false) }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.account_id) errs.account_id = t('accounting.ui.selectAccount')
    if (!form.budget_year) errs.budget_year = t('accounting.ui.yearRequired')
    if (!form.budget_month) errs.budget_month = t('accounting.ui.monthRequired')
    if (!form.budgeted_amount || parseFloat(form.budgeted_amount) < 0) errs.budgeted_amount = t('accounting.ui.validAmount')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      account_id: parseInt(form.account_id),
      budget_year: parseInt(form.budget_year),
      budget_month: parseInt(form.budget_month),
      budgeted_amount: parseFloat(form.budgeted_amount),
      notes: form.notes || null,
    }
    setLoading(true)
    try {
      if (isEdit) await budgets.update(id, payload)
      else await budgets.create({ ...payload, pharmacy_id: pharmacyId })
      toast.success(isEdit ? t('accounting.budget.updated') : t('accounting.budget.created'))
      navigate('/dashboard/budgets')
    } catch (err) {
      toast.error(err.response?.data?.message || t('accounting.budget.saveFailed'))
    } finally { setLoading(false) }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link to="/dashboard/budgets" className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? t('accounting.budget.editTitle') : t('accounting.budget.newTitle')}</h1>
        </div>
        <p className="text-gray-600">{isEdit ? t('accounting.budget.editSubtitle') : t('accounting.budget.newSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Calculator className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('accounting.budget.detailsTitle')}</h3>
                <p className="text-sm text-gray-600">{t('accounting.budget.detailsSubtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.ui.account')} <span className="text-red-500">*</span></label>
                <select
                  value={form.account_id}
                  onChange={(e) => handleChange('account_id', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                >
                  <option value="">{t('accounting.ui.selectAccount')}</option>
                  {accountOptions.map((a) => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name} ({a.account_type})</option>)}
                </select>
                {errors.account_id && <p className="text-xs text-red-500 mt-1">{errors.account_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.budget.year')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.budget_year}
                    onChange={(e) => handleChange('budget_year', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {errors.budget_year && <p className="text-xs text-red-500 mt-1">{errors.budget_year}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.budget.month')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.budget_month}
                    onChange={(e) => handleChange('budget_month', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {months.map((m) => <option key={m} value={m}>{new Date(2024, m - 1, 1).toLocaleString(lang === 'sw' ? 'sw' : 'en', { month: 'long' })}</option>)}
                  </select>
                </div>
                {errors.budget_month && <p className="text-xs text-red-500 mt-1">{errors.budget_month}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.budget.budgetedAmount')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.budgeted_amount}
                    onChange={(e) => handleChange('budgeted_amount', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm tabular-nums"
                  />
                </div>
                {errors.budgeted_amount && <p className="text-xs text-red-500 mt-1">{errors.budgeted_amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.budget.notes')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder={t('common.optional')}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/budgets" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>{t('common.cancel')}</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? t('accounting.budget.updateBtn') : t('accounting.budget.createBtn')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}