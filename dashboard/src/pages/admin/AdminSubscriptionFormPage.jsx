import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, CreditCard, DollarSign, Calendar, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import api from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'

const PLANS = ['Trial', 'Basic', 'Starter', 'Pro', 'Professional', 'Enterprise']
const PLAN_AMOUNTS = { Trial: 0, Basic: 50000, Starter: 390000, Pro: 100000, Professional: 520000, Enterprise: 650000 }

export default function AdminSubscriptionFormPage() {
  const { t } = useLanguage()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [errors, setErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [pharmacies, setPharmacies] = useState([])

  const [form, setForm] = useState({
    pharmacy_id: '',
    plan: 'Basic',
    amount: 50000,
    startDate: '',
    expiryDate: '',
  })

  useEffect(() => {
    fetchPharmacies()
    if (isEdit) fetchSubscription()
  }, [id])

  const fetchPharmacies = async () => {
    try {
      const res = await api.get('/admin/pharmacies')
      setPharmacies(res.data?.data || res.data || [])
    } catch {
      setPharmacies([])
    }
  }

  const fetchSubscription = async () => {
    try {
      const res = await api.get(`/admin/subscriptions/${id}`)
      const data = res.data.data || res.data
      setForm({
        pharmacy_id: data.pharmacy_id || '',
        plan: data.plan || 'Basic',
        amount: data.amount || 50000,
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        expiryDate: data.expiryDate ? data.expiryDate.split('T')[0] : '',
      })
    } catch {
      toast.error(t('adminUsers.subscriptions.loadDataFailed', 'Failed to load subscription data'))
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handlePlanChange = (plan) => {
    setForm(prev => ({ ...prev, plan, amount: PLAN_AMOUNTS[plan] || 0 }))
  }

  const validate = () => {
    const errs = {}
    if (!form.pharmacy_id) errs.pharmacy_id = t('adminUsers.shared.pharmacyRequired', 'Pharmacy is required')
    if (!form.plan) errs.plan = t('adminUsers.subscriptions.planRequired', 'Plan is required')
    if (!form.startDate) errs.startDate = t('adminUsers.subscriptions.startDateRequired', 'Start date is required')
    if (!form.expiryDate) errs.expiryDate = t('adminUsers.subscriptions.expiryDateRequired', 'Expiry date is required')
    if (form.startDate && form.expiryDate && new Date(form.startDate) >= new Date(form.expiryDate)) {
      errs.expiryDate = t('adminUsers.subscriptions.expiryAfterStart', 'Expiry date must be after start date')
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = { ...form, amount: Number(form.amount) }
      if (isEdit) {
        await api.put(`/admin/subscriptions/${id}`, data)
      } else {
        await api.post('/admin/subscriptions', data)
      }
      setShowSuccess(true)
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
        toast.error(t('adminUsers.shared.validationFailed', 'Validation failed'))
      } else {
        toast.error(err.response?.data?.message || t('adminUsers.subscriptions.saveFailed', 'Failed to save subscription'))
      }
    } finally {
      setLoading(false)
    }
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/subscriptions" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? t('adminUsers.subscriptions.editSubscription', 'Edit Subscription') : t('adminUsers.subscriptions.createNewSubscription', 'Create New Subscription')}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? t('adminUsers.subscriptions.editSub', 'Update existing subscription details') : t('adminUsers.subscriptions.createSub', 'Add a new subscription to the platform')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          {/* Section 1: Plan Details */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <CreditCard className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('adminUsers.subscriptions.planDetails', 'Plan Details')}</h3>
                <p className="text-sm text-gray-600">{t('adminUsers.subscriptions.planDetailsSub', 'Subscription plan and pharmacy assignment')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('adminUsers.shared.pharmacy', 'Pharmacy')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.pharmacy_id}
                    onChange={(e) => handleChange('pharmacy_id', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.pharmacy_id ? '!border-red-400' : ''}`}
                  >
                    <option value="">{t('common.selectPharmacy', 'Select Pharmacy')}</option>
                    {pharmacies.map((p) => (
                      <option key={p.id} value={p.id}>{p.pharmacy_name || p.name}</option>
                    ))}
                  </select>
                </div>
                {errors.pharmacy_id && <p className="text-xs text-red-500 mt-1">{errors.pharmacy_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('adminUsers.shared.plan', 'Plan')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.plan}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.plan ? '!border-red-400' : ''}`}
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>{t('adminUsers.shared.plans.' + p, p)}</option>
                    ))}
                  </select>
                </div>
                {errors.plan && <p className="text-xs text-red-500 mt-1">{errors.plan}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Payment */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('adminUsers.subscriptions.payment', 'Payment')}</h3>
                <p className="text-sm text-gray-600">{t('adminUsers.subscriptions.paymentSub', 'Billing amount and payment details')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('adminUsers.subscriptions.amountTzsMonth', 'Amount (TZS/month)')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    min="0"
                    step="0.01"
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.amount ? '!border-red-400' : ''}`}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Dates */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('adminUsers.subscriptions.dates', 'Dates')}</h3>
                <p className="text-sm text-gray-600">{t('adminUsers.subscriptions.datesSub', 'Subscription start and expiry dates')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('adminUsers.subscriptions.startDate', 'Start Date')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.startDate ? '!border-red-400' : ''}`}
                  />
                </div>
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('products.expiryDate', 'Expiry Date')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => handleChange('expiryDate', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.expiryDate ? '!border-red-400' : ''}`}
                  />
                </div>
                {errors.expiryDate && <p className="text-xs text-red-500 mt-1">{errors.expiryDate}</p>}
              </div>
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/subscriptions" className="btn-secondary">
              <span>{t('common.cancel', 'Cancel')}</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? t('adminUsers.subscriptions.updateSubscription', 'Update Subscription') : t('adminUsers.subscriptions.createSubscription', 'Create Subscription')}</span>
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          navigate('/dashboard/subscriptions')
        }}
        title={isEdit ? t('adminUsers.subscriptions.updated', 'Subscription Updated') : t('adminUsers.subscriptions.created', 'Subscription Created')}
        subtitle={t('adminUsers.subscriptions.savedSub', 'The subscription has been saved successfully')}
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 mb-6">
            {isEdit
              ? t('adminUsers.subscriptions.updatedBody', 'The subscription details have been updated.')
              : t('adminUsers.subscriptions.createdBody', 'The new subscription has been created and is now active.')}
          </p>
          <button
            onClick={() => {
              setShowSuccess(false)
              navigate('/dashboard/subscriptions')
            }}
            className="btn-primary w-full"
          >
            {t('adminUsers.subscriptions.backTo', 'Back to Subscriptions')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
