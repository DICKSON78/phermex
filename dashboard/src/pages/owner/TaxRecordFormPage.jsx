import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, X, Loader2, Receipt, Calendar, Hash, DollarSign, Percent } from 'lucide-react'
import toast from 'react-hot-toast'
import { taxes } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatMoney } from '../../utils/currency'

const TAX_TYPES = [
  { id: 'VAT', label: 'VAT', rate: 18 },
  { id: 'PAYE', label: 'PAYE', rate: 30 },
  { id: 'NSSF', label: 'NSSF', rate: 10 },
  { id: 'NHIF', label: 'NHIF', rate: 5 },
  { id: 'Housing', label: 'Housing Levy', rate: 1.5 },
]

function formatCurrency(amount) {
  return formatMoney(amount || 0, { decimals: 2 })
}

export default function TaxRecordFormPage() {
  const { t } = useLanguage()
  const { id } = useParams()
  const navigate = useNavigate()
  const { pharmacyId } = useAuth()
  const isEdit = Boolean(id)

  const now = new Date()
  const [form, setForm] = useState({
    tax_type: 'VAT',
    period_month: now.getMonth() + 1,
    period_year: now.getFullYear(),
    taxable_amount: '',
    tax_amount: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (isEdit) fetchRecord()
  }, [id])

  const fetchRecord = async () => {
    try {
      const res = await taxes.getById(id)
      const r = res.data.record
      if (r.status !== 'draft') setBlocked(true)
      setForm({
        tax_type: r.tax_type,
        period_month: r.period_month,
        period_year: r.period_year,
        taxable_amount: r.taxable_amount ?? '',
        tax_amount: r.tax_amount ?? '',
      })
    } catch {
      toast.error('Failed to load tax record')
    } finally { setFetching(false) }
  }

  const selectedRate = TAX_TYPES.find((t) => t.id === form.tax_type)?.rate || 0
  const computedTax = (parseFloat(form.taxable_amount) || 0) * (selectedRate / 100)
  const manualOverride = form.tax_amount !== '' && parseFloat(form.tax_amount) > 0

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.taxable_amount || parseFloat(form.taxable_amount) < 0) errs.taxable_amount = 'Enter a valid taxable amount'
    if (!form.period_month) errs.period_month = 'Month is required'
    if (!form.period_year) errs.period_year = 'Year is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      tax_type: form.tax_type,
      period_month: parseInt(form.period_month),
      period_year: parseInt(form.period_year),
      taxable_amount: parseFloat(form.taxable_amount),
      tax_amount: manualOverride ? parseFloat(form.tax_amount) : '',
    }
    setLoading(true)
    try {
      if (isEdit) await taxes.update(id, payload)
      else await taxes.create({ ...payload, pharmacy_id: pharmacyId })
      toast.success(isEdit ? 'Tax record updated' : 'Tax record created')
      navigate('/dashboard/tax-management')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save tax record')
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

  if (blocked) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/tax-management" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Tax Record</h1>
          </div>
          <p className="text-gray-600">This record can no longer be edited.</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          Only draft records can be edited. This record has already been processed.
        </div>
        <Link to="/dashboard/tax-management" className="btn-secondary">
          Back to Tax Management
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link to="/dashboard/tax-management" className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Tax Record' : 'New Tax Record'}</h1>
        </div>
        <p className="text-gray-600">{isEdit ? 'Update this draft tax record' : 'Create a tax record for a period'}</p>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Receipt className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Tax Details</h3>
                <p className="text-sm text-gray-600">Type, period and amounts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tax Type <span className="text-red-500">*</span></label>
                <select
                  value={form.tax_type}
                  onChange={(e) => handleChange('tax_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                >
                  {TAX_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label} ({t.rate}%)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Period Month <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.period_month}
                    onChange={(e) => handleChange('period_month', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {months.map((m) => <option key={m} value={m}>{new Date(2024, m - 1, 1).toLocaleString('en', { month: 'long' })}</option>)}
                  </select>
                </div>
                {errors.period_month && <p className="text-xs text-red-500 mt-1">{errors.period_month}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Period Year <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.period_year}
                    onChange={(e) => handleChange('period_year', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {errors.period_year && <p className="text-xs text-red-500 mt-1">{errors.period_year}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Taxable Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.taxable_amount}
                    onChange={(e) => handleChange('taxable_amount', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm tabular-nums"
                  />
                </div>
                {errors.taxable_amount && <p className="text-xs text-red-500 mt-1">{errors.taxable_amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tax Amount <span className="text-xs font-normal text-gray-500">(auto at {selectedRate}%)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.tax_amount}
                    onChange={(e) => handleChange('tax_amount', e.target.value)}
                    placeholder={String(formatCurrency(computedTax))}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm tabular-nums"
                  />
                </div>
                {!manualOverride && form.taxable_amount !== '' && (
                  <p className="text-xs text-gray-500 mt-1">Computed: {formatCurrency(computedTax)}. Leave empty to auto-calculate on save.</p>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/tax-management" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Record' : 'Create Record'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}