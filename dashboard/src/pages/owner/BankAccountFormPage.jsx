import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, X, Loader2, Landmark, Building2, Hash, Globe, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { bank } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

export default function BankAccountFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pharmacyId } = useAuth()
  const { t } = useLanguage()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ bank_name: '', account_name: '', account_number: '', swift_code: '', opening_balance: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [hasTransactions, setHasTransactions] = useState(false)

  useEffect(() => {
    if (isEdit) fetchAccount()
  }, [id])

  const fetchAccount = async () => {
    try {
      const res = await bank.getById(id)
      const a = res.data.account
      setHasTransactions((a.transactions?.length || 0) > 0)
      setForm({
        bank_name: a.bank_name || '',
        account_name: a.account_name || '',
        account_number: a.account_number || '',
        swift_code: a.swift_code || '',
        opening_balance: a.opening_balance ?? '',
      })
    } catch {
      toast.error(t('accounting.bank.loadFailed'))
    } finally { setFetching(false) }
  }

  const validate = () => {
    const errs = {}
    if (!form.bank_name.trim()) errs.bank_name = t('accounting.bank.bankNameRequired')
    if (!form.account_name.trim()) errs.account_name = t('accounting.bank.accountNameRequired')
    if (!form.account_number.trim()) errs.account_number = t('accounting.bank.accountNumberRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit) {
        const payload = {
          bank_name: form.bank_name,
          account_name: form.account_name,
          account_number: form.account_number,
          swift_code: form.swift_code || null,
        }
        if (!hasTransactions) payload.opening_balance = parseFloat(form.opening_balance) || 0
        await bank.update(id, payload)
      } else {
        await bank.create({ ...form, pharmacy_id: pharmacyId, opening_balance: parseFloat(form.opening_balance) || 0 })
      }
      toast.success(isEdit ? t('accounting.bank.updated') : t('accounting.bank.created'))
      navigate('/dashboard/bank-management')
    } catch (err) {
      toast.error(err.response?.data?.message || t('accounting.bank.saveFailed'))
    } finally { setLoading(false) }
  }

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
          <Link to="/dashboard/bank-management" className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? t('accounting.bank.editTitle') : t('accounting.bank.newTitle')}</h1>
        </div>
        <p className="text-gray-600">{isEdit ? t('accounting.bank.editSubtitle') : t('accounting.bank.newSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Landmark className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('accounting.bank.detailsTitle')}</h3>
                <p className="text-sm text-gray-600">{t('accounting.bank.detailsSubtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.bank.bankName')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder={t('accounting.bank.bankNamePlaceholder')}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.bank_name && <p className="text-xs text-red-500 mt-1">{errors.bank_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.accountName')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.account_name}
                    onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    placeholder={t('accounting.bank.accountNamePlaceholder')}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.account_name && <p className="text-xs text-red-500 mt-1">{errors.account_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.bank.accountNumber')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    placeholder={t('accounting.bank.accountNumberPlaceholder')}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.account_number && <p className="text-xs text-red-500 mt-1">{errors.account_number}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.bank.swiftCode')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.swift_code}
                    onChange={(e) => setForm({ ...form, swift_code: e.target.value })}
                    placeholder={t('common.optional')}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.bank.openingBalance')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={hasTransactions}
                  value={form.opening_balance}
                  onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm tabular-nums disabled:bg-gray-50 disabled:text-gray-500"
                />
                {hasTransactions && <p className="text-xs text-red-500 mt-1">{t('accounting.bank.openingBalanceLocked')}</p>}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/bank-management" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>{t('common.cancel')}</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? t('accounting.ui.updateAccount') : t('accounting.ui.createAccount')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}