import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowLeftRight, Loader2, X, Building2, Calendar, FileText, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { bank } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { formatMoney } from '../../utils/currency'
import { useLanguage } from '../../contexts/LanguageContext'

function formatCurrency(amount) {
  return formatMoney(amount, { decimals: 2, abs: true })
}

export default function BankTransferPage() {
  const navigate = useNavigate()
  const { pharmacyId } = useAuth()
  const { t } = useLanguage()

  const [bankAccounts, setBankAccounts] = useState([])
  const [form, setForm] = useState({ from_bank_account_id: '', to_bank_account_id: '', amount: '', description: '', transfer_date: new Date().toISOString().split('T')[0] })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => { loadAccounts() }, [])

  const loadAccounts = async () => {
    try {
      const res = await bank.getAll()
      setBankAccounts(res.data.accounts || [])
    } catch {
      setBankAccounts([])
      toast.error(t('accounting.bank.loadAccountsFailed'))
    } finally { setFetching(false) }
  }

  const validate = () => {
    const errs = {}
    if (!form.from_bank_account_id) errs.from_bank_account_id = t('accounting.transfer.selectSourceAccount')
    if (!form.to_bank_account_id) errs.to_bank_account_id = t('accounting.transfer.selectDestinationAccount')
    if (form.from_bank_account_id && form.from_bank_account_id === form.to_bank_account_id) errs.to_bank_account_id = t('accounting.transfer.differentAccounts')
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = t('accounting.ui.validAmount')
    if (!form.transfer_date) errs.transfer_date = t('accounting.ui.dateRequired')
    if (!form.description.trim()) errs.description = t('accounting.ui.descriptionRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const maxAmount = bankAccounts.find((a) => String(a.id) === form.from_bank_account_id)?.current_balance || 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await bank.transfer({ ...form, pharmacy_id: pharmacyId, amount: parseFloat(form.amount) })
      toast.success(t('accounting.transfer.completed'))
      navigate('/dashboard/bank-management')
    } catch (err) {
      toast.error(err.response?.data?.message || t('accounting.transfer.failed'))
    } finally { setLoading(false) }
  }

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (bankAccounts.length < 2) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/bank-management" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('accounting.transfer.title')}</h1>
          </div>
          <p className="text-gray-600">{t('accounting.transfer.subtitleShort')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          {t('accounting.transfer.needTwo')} <Link to="/dashboard/bank-management/new" className="text-[#0FD452] font-semibold hover:underline">{t('accounting.transfer.addAnother')}</Link>.
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">{t('accounting.transfer.title')}</h1>
        </div>
        <p className="text-gray-600">{t('accounting.transfer.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <ArrowLeftRight className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('accounting.transfer.detailsTitle')}</h3>
                <p className="text-sm text-gray-600">{t('accounting.transfer.detailsSubtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.transfer.fromAccount')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.from_bank_account_id}
                    onChange={(e) => setForm({ ...form, from_bank_account_id: e.target.value })}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    <option value="">{t('accounting.transfer.selectSourceAccount')}</option>
                    {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.bank_name} - {formatCurrency(a.current_balance)}</option>)}
                  </select>
                </div>
                {errors.from_bank_account_id && <p className="text-xs text-red-500 mt-1">{errors.from_bank_account_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('accounting.transfer.toAccount')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.to_bank_account_id}
                    onChange={(e) => setForm({ ...form, to_bank_account_id: e.target.value })}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    <option value="">{t('accounting.transfer.selectDestinationAccount')}</option>
                    {bankAccounts.filter((a) => String(a.id) !== form.from_bank_account_id).map((a) => <option key={a.id} value={a.id}>{a.bank_name} - {formatCurrency(a.current_balance)}</option>)}
                  </select>
                </div>
                {errors.to_bank_account_id && <p className="text-xs text-red-500 mt-1">{errors.to_bank_account_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('orders.amount')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxAmount || undefined}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm tabular-nums"
                  />
                </div>
                {form.from_bank_account_id && <p className="text-xs text-gray-500 mt-1">{t('accounting.transfer.available')} {formatCurrency(maxAmount)}</p>}
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('stockTransfers.transferDate')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.transfer_date}
                    onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.transfer_date && <p className="text-xs text-red-500 mt-1">{errors.transfer_date}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('common.description')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('accounting.transfer.descriptionPlaceholder')}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/bank-management" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>{t('common.cancel')}</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
              <span>{t('accounting.transfer.transferBtn')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}