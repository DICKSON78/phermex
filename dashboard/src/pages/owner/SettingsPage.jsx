import { useState, useEffect, useRef } from 'react'
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Save,
  Upload,
  Check,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Camera,
  Settings,
  Calendar,
  Hash,
  Receipt,
  ShieldCheck,
  Plus,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { currentBase } from '../../utils/roles'

const WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PLAN_FEATURES = {
  trial: [
    'Up to 50 drugs in inventory',
    'Basic sales tracking',
    '1 staff member',
    'Email support',
  ],
  basic: [
    'Up to 200 drugs in inventory',
    'Sales & purchase tracking',
    '5 staff members',
    'Basic reports',
    'Email support',
  ],
  pro: [
    'Unlimited drugs in inventory',
    'Advanced analytics & reports',
    '25 staff members',
    'Prescription management',
    'Delivery tracking',
    'Priority support',
  ],
  enterprise: [
    'Everything in Pro',
    'Unlimited staff',
    'Multi-branch support',
    'Custom integrations',
    'Dedicated account manager',
    'API access',
  ],
}

const PLAN_COLORS = {
  trial: 'bg-gray-100 text-gray-700',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-[#0FD452]/10 text-[#0FD452]',
  enterprise: 'bg-purple-100 text-purple-700',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pharmacy, setPharmacy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    type: 'retail',
    license_number: '',
    license_expiry: '',
    phone: '',
    email: '',
    website: '',
    logo: null,
    logo_preview: '',
    country: '',
    region: '',
    district: '',
    ward: '',
    street: '',
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    opening_time: '08:00',
    closing_time: '18:00',
    opening_capital: 0,
    currency: 'TZS',
    subscription: { plan: 'trial', expiry: '', features: [] },
    payment_history: [],
  })

  useEffect(() => {
    fetchPharmacy()
  }, [])

  const fetchPharmacy = async () => {
    try {
      setLoading(true)
      const response = await api.get('/pharmacies/current')
      const data = response.data
      setPharmacy(data)
      setForm({
        name: data.name || '',
        type: data.type || 'retail',
        license_number: data.license_number || '',
        license_expiry: data.license_expiry || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        logo: null,
        logo_preview: data.logo_url || '',
        country: data.country || '',
        region: data.region || '',
        district: data.district || '',
        ward: data.ward || '',
        street: data.street || '',
        working_days: data.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        opening_time: data.opening_time || '08:00',
        closing_time: data.closing_time || '18:00',
        opening_capital: data.opening_capital || 0,
        currency: data.currency || 'TZS',
        subscription: data.subscription || { plan: 'trial', expiry: '', features: [] },
        payment_history: data.payment_history || [],
      })
    } catch (err) {
      console.error('Failed to fetch pharmacy:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleDayToggle = (day) => {
    setForm((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({
        ...prev,
        logo: file,
        logo_preview: URL.createObjectURL(file),
      }))
    }
  }

  const removeLogo = () => {
    setForm((prev) => ({ ...prev, logo: null, logo_preview: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const formData = new FormData()
      Object.keys(form).forEach((key) => {
        if (key === 'logo' && form.logo) {
          formData.append('logo', form.logo)
        } else if (key === 'working_days') {
          formData.append(key, JSON.stringify(form[key]))
        } else if (key === 'subscription' || key === 'payment_history') {
          formData.append(key, JSON.stringify(form[key]))
        } else {
          formData.append(key, form[key])
        }
      })

      await api.put(`/pharmacies/${pharmacy.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-gray-100 rounded-lg" />
              <div className="h-10 w-full bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#0FD452]" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Configure your pharmacy profile and preferences.</p>
        </div>
        {user?.isOwner?.() || user?.role === 'owner' ? (
          <button
            onClick={() => navigate('/dashboard/settings/pharmacies/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl text-sm font-bold transition-all duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Pharmacy
          </button>
        ) : null}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <Check className="w-4 h-4 shrink-0" />
          Settings saved successfully!
        </div>
      )}

      {/* Pharmacy Profile */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#0FD452]" />
          </div>
          <h2 className="text-lg font-bold text-[#000F14]">Pharmacy Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pharmacy Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pharmacy Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition bg-white"
            >
              <option value="retail">Retail Pharmacy</option>
              <option value="wholesale">Wholesale Pharmacy</option>
              <option value="hospital">Hospital Pharmacy</option>
              <option value="clinic">Clinic Pharmacy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
            <input
              type="text"
              name="license_number"
              value={form.license_number}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">License Expiry</label>
            <input
              type="date"
              name="license_expiry"
              value={form.license_expiry}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pharmacy Logo</label>
          <div className="flex items-center gap-4">
            {form.logo_preview ? (
              <div className="relative w-20 h-20 rounded-xl border-2 border-gray-200 overflow-hidden">
                <img src={form.logo_preview} alt="Logo preview" className="w-full h-full object-cover" />
                <button
                  onClick={removeLogo}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#0FD452] hover:text-[#0FD452] transition-colors"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px] mt-1">Upload</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <div>
              <p className="text-sm text-gray-500">JPG, PNG or SVG. Max 2MB.</p>
              {form.logo_preview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-[#0FD452] hover:underline mt-1"
                >
                  Change logo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#0FD452]" />
          </div>
          <h2 className="text-lg font-bold text-[#000F14]">Location</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
            <input
              type="text"
              name="region"
              value={form.region}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">District</label>
            <input
              type="text"
              name="district"
              value={form.district}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ward</label>
            <input
              type="text"
              name="ward"
              value={form.ward}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Street</label>
            <input
              type="text"
              name="street"
              value={form.street}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#0FD452]" />
          </div>
          <h2 className="text-lg font-bold text-[#000F14]">Operating Hours</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Working Days</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {WORKING_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  form.working_days.includes(day)
                    ? 'bg-[#0FD452] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Time</label>
            <input
              type="time"
              name="opening_time"
              value={form.opening_time}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Closing Time</label>
            <input
              type="time"
              name="closing_time"
              value={form.closing_time}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-[#000F14] focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452] outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Financial */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#0FD452]" />
          </div>
          <h2 className="text-lg font-bold text-[#000F14]">Financial</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Capital (TZS)</label>
            <input
              type="text"
              value={formatCurrency(form.opening_capital)}
              readOnly
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Opening capital is set during registration</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <input
              type="text"
              value={form.currency}
              readOnly
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#0FD452]" />
          </div>
          <h2 className="text-lg font-bold text-[#000F14]">Subscription</h2>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-medium text-gray-500">Current Plan</span>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold uppercase ${PLAN_COLORS[form.subscription.plan] || PLAN_COLORS.trial}`}>
                {form.subscription.plan || 'Trial'}
              </span>
              
            </div>
            {form.subscription.expiry && (
              <p className="text-sm text-gray-500">
                Expires: {new Date(form.subscription.expiry).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/subscribe')}
            className="btn-primary"
          >
            Upgrade Plan
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Plan Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(PLAN_FEATURES[form.subscription.plan] || PLAN_FEATURES.trial).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-[#0FD452] shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {form.payment_history.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Payment History</h3>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                          <span>Date</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                          <span>Amount</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#0FD452]" />
                          <span>Plan</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                          <span>Status</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {form.payment_history.map((payment, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-[#0FD452]/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                              <Receipt className="h-4 w-4 text-[#0FD452]" />
                            </div>
                            <span className="text-sm text-gray-600">
                              {new Date(payment.date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[#000F14]">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{payment.plan}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {form.payment_history.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No payment history yet
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border-2 border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
            <p className="text-sm text-gray-500">Irreversible actions</p>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-700">
            Deactivating your pharmacy will:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-red-600 list-disc list-inside">
            <li>Stop all active subscriptions and billing</li>
            <li>Hide your pharmacy from the platform</li>
            <li>Archive all sales records and customer data</li>
            <li>Remove staff access immediately</li>
          </ul>
        </div>

        <button
          onClick={() => setShowDeactivateConfirm(true)}
          className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Deactivate Pharmacy
        </button>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeactivateConfirm(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#000F14]">Deactivate Pharmacy?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. All your data will be permanently archived. Type <strong>DEACTIVATE</strong> to confirm.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.post('/subscriptions/cancel')
                    toast.success('Subscription deactivated')
                    setShowDeactivateConfirm(false)
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to deactivate')
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0FD452] text-white text-sm font-semibold hover:bg-[#0bc246] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  )
}
