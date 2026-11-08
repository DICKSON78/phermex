import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import {
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  Globe,
  FileText,
  Hash,
  Truck,
  Landmark,
  CreditCard,
  Calendar,
  X,
  ShieldCheck,
  Percent,
  Boxes,
} from 'lucide-react'

const COUNTRIES = ['Tanzania', 'Kenya', 'Nigeria', 'Uganda', 'Zambia', 'Zimbabwe', 'Malawi']
const BUSINESS_TYPES = ['wholesaler', 'distributor']
const STATUSES = ['pending', 'active', 'inactive', 'suspended']

function SectionCard({ icon: Icon, iconBg, iconColor, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#000F14]">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function FormField({ icon: Icon, label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        <span className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-[#0FD452]" />
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const emptyForm = {
  name: '',
  business_type: 'wholesaler',
  status: 'active',
  email: '',
  phone: '',
  contact_person: '',
  contact_phone: '',
  country: 'Tanzania',
  region: '',
  city: '',
  address: '',
  license_number: '',
  registration_number: '',
  tax_id: '',
  bank_name: '',
  bank_account: '',
  delivery_fee: 0,
  express_delivery_fee: 0,
  minimum_order_amount: 0,
  payment_terms_days: 30,
  accepts_credit: true,
}

export default function AdminWholesalerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [successToast, setSuccessToast] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (isEdit) fetchWholesaler()
  }, [id])

  const fetchWholesaler = async () => {
    try {
      const res = await api.get(`/admin/wholesalers/${id}`)
      const d = res.data?.data || res.data
      setForm({
        ...emptyForm,
        name: d.name || '',
        business_type: d.business_type || 'wholesaler',
        status: d.status || 'active',
        email: d.email || '',
        phone: d.phone || '',
        contact_person: d.contact_person || '',
        contact_phone: d.contact_phone || '',
        country: d.country || 'Tanzania',
        region: d.region || '',
        city: d.city || '',
        address: d.address || '',
        license_number: d.license_number || '',
        registration_number: d.registration_number || '',
        tax_id: d.tax_id || '',
        bank_name: d.bank_name || '',
        bank_account: d.bank_account || '',
        delivery_fee: Number(d.delivery_fee ?? 0),
        express_delivery_fee: Number(d.express_delivery_fee ?? 0),
        minimum_order_amount: Number(d.minimum_order_amount ?? 0),
        payment_terms_days: Number(d.payment_terms_days ?? 30),
        accepts_credit: d.accepts_credit !== false,
      })
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load this wholesaler.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Business name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    if (!form.phone.trim()) errs.phone = 'Business phone is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.region.trim()) errs.region = 'Region is required'
    if (!form.license_number.trim()) errs.license_number = 'Licence number is required'
    if (!form.registration_number.trim()) errs.registration_number = 'Registration number is required'
    if (Number(form.delivery_fee) < 0) errs.delivery_fee = 'Cannot be negative'
    if (Number(form.express_delivery_fee) < 0) errs.express_delivery_fee = 'Cannot be negative'
    if (Number(form.minimum_order_amount) < 0) errs.minimum_order_amount = 'Cannot be negative'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        delivery_fee: Number(form.delivery_fee) || 0,
        express_delivery_fee: Number(form.express_delivery_fee) || 0,
        minimum_order_amount: Number(form.minimum_order_amount) || 0,
        payment_terms_days: Number(form.payment_terms_days) || 0,
        accepts_credit: Boolean(form.accepts_credit),
      }

      if (isEdit) {
        await api.put(`/admin/wholesalers/${id}`, payload)
      } else {
        await api.post('/admin/wholesalers', payload)
      }

      setSuccessToast(isEdit ? 'Wholesaler updated successfully' : 'Wholesaler created successfully')
      setTimeout(() => navigate('/dashboard/wholesalers'), 1200)
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        setErrors({ general: err.response?.data?.message || 'Could not save wholesaler.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 bg-gray-200 animate-pulse rounded-xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm text-[#000F14] bg-gray-50 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 ${
      errors[field] ? '!border-red-400' : 'border-gray-200'
    }`

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/wholesalers" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            {isEdit ? <FileText className="w-5 h-5 text-[#0FD452]" /> : <Truck className="w-5 h-5 text-[#0FD452]" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Wholesaler' : 'New Wholesaler'}</h1>
            <p className="text-sm text-gray-500">
              {isEdit
                ? 'Update supplier details, delivery charges and credit terms'
                : 'Register a wholesaler or distributor and set its initial status'}
            </p>
          </div>
        </div>
        {isEdit && (
          <Link
            to={`/dashboard/wholesalers/${id}/catalog`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Boxes className="w-4 h-4 text-[#0FD452]" />
            Manage catalog
          </Link>
        )}
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}
      {errors.general && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <SectionCard
          icon={Building2}
          iconBg="bg-[#0FD452]/10"
          iconColor="text-[#0FD452]"
          title="Business Information"
          subtitle="Who the supplier is and how it is classified"
        >
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FormField icon={Building2} label="Business Name" required error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={inputClass('name')}
                  placeholder="e.g. Tanzania Wholesale Pharmacy Ltd"
                />
              </FormField>
            </div>
            <FormField icon={Truck} label="Supplier Type" required error={errors.business_type}>
              <select
                value={form.business_type}
                onChange={(e) => handleChange('business_type', e.target.value)}
                className={`${inputClass('business_type')} capitalize`}
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField icon={ShieldCheck} label="Initial Status" error={errors.status}>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={`${inputClass('status')} capitalize`}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status} className="capitalize">
                    {status}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField icon={Mail} label="Business Email" required error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass('email')}
                placeholder="orders@supplier.co.tz"
              />
            </FormField>
            <FormField icon={Phone} label="Business Phone" required error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClass('phone')}
                placeholder="+255 700 000 000"
              />
            </FormField>
            <FormField icon={User} label="Contact Person" error={errors.contact_person}>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                className={inputClass('contact_person')}
                placeholder="Full name"
              />
            </FormField>
            <FormField icon={Phone} label="Contact Phone" error={errors.contact_phone}>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className={inputClass('contact_phone')}
                placeholder="+255 700 000 000"
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard icon={MapPin} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Location" subtitle="Where the supplier operates and delivers from">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FormField icon={MapPin} label="Address" required error={errors.address}>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={inputClass('address')}
                  placeholder="Street, plot, building"
                />
              </FormField>
            </div>
            <FormField icon={MapPin} label="City" required error={errors.city}>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={inputClass('city')}
                placeholder="e.g. Dar es Salaam"
              />
            </FormField>
            <FormField icon={MapPin} label="Region" required error={errors.region}>
              <input
                type="text"
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className={inputClass('region')}
                placeholder="e.g. Dar es Salaam"
              />
            </FormField>
            <FormField icon={Globe} label="Country" error={errors.country}>
              <select
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className={inputClass('country')}
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </SectionCard>

        <SectionCard icon={Hash} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Licensing" subtitle="Regulatory identifiers used to verify the supplier">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField icon={Hash} label="Licence Number" required error={errors.license_number}>
              <input
                type="text"
                value={form.license_number}
                onChange={(e) => handleChange('license_number', e.target.value)}
                className={inputClass('license_number')}
                placeholder="e.g. TZ-WHL-00123"
              />
            </FormField>
            <FormField icon={FileText} label="Registration Number" required error={errors.registration_number}>
              <input
                type="text"
                value={form.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                className={inputClass('registration_number')}
                placeholder="e.g. BRELA-123456"
              />
            </FormField>
            <FormField icon={FileText} label="Tax ID" error={errors.tax_id}>
              <input
                type="text"
                value={form.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                className={inputClass('tax_id')}
                placeholder="TIN"
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard
          icon={Truck}
          iconBg="bg-[#0FD452]/10"
          iconColor="text-[#0FD452]"
          title="Delivery & Order Terms"
          subtitle="Charges and minimums shown to pharmacies in the marketplace"
        >
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField icon={Truck} label="Standard Delivery Fee" error={errors.delivery_fee} hint="Applied when the pharmacy chooses standard delivery.">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.delivery_fee}
                onChange={(e) => handleChange('delivery_fee', e.target.value)}
                className={inputClass('delivery_fee')}
                placeholder="0.00"
              />
            </FormField>
            <FormField icon={Truck} label="Express Delivery Fee" error={errors.express_delivery_fee} hint="Falls back to the standard fee when left at zero.">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.express_delivery_fee}
                onChange={(e) => handleChange('express_delivery_fee', e.target.value)}
                className={inputClass('express_delivery_fee')}
                placeholder="0.00"
              />
            </FormField>
            <FormField icon={Boxes} label="Minimum Order Amount" error={errors.minimum_order_amount} hint="Orders below this subtotal are rejected.">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minimum_order_amount}
                onChange={(e) => handleChange('minimum_order_amount', e.target.value)}
                className={inputClass('minimum_order_amount')}
                placeholder="0.00"
              />
            </FormField>
            <FormField icon={Calendar} label="Credit Terms (days)" error={errors.payment_terms_days}>
              <input
                type="number"
                min="0"
                max="365"
                value={form.payment_terms_days}
                onChange={(e) => handleChange('payment_terms_days', e.target.value)}
                className={inputClass('payment_terms_days')}
                placeholder="30"
              />
            </FormField>
            <div className="md:col-span-2">
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={form.accepts_credit}
                  onChange={(e) => handleChange('accepts_credit', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0FD452] focus:ring-[#0FD452]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#000F14]">Accept credit accounts</p>
                  <p className="text-xs text-gray-500">
                    Pharmacies can place credit orders against their account number. Turn this off to require cash on delivery or pickup.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Landmark} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Banking" subtitle="Where the supplier receives settlement payments">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField icon={Landmark} label="Bank Name" error={errors.bank_name}>
              <input
                type="text"
                value={form.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className={inputClass('bank_name')}
                placeholder="e.g. CRDB Bank"
              />
            </FormField>
            <FormField icon={CreditCard} label="Bank Account" error={errors.bank_account}>
              <input
                type="text"
                value={form.bank_account}
                onChange={(e) => handleChange('bank_account', e.target.value)}
                className={inputClass('bank_account')}
                placeholder="Account number"
              />
            </FormField>
          </div>
        </SectionCard>

        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 rounded-b-xl flex justify-end gap-3 -mb-5">
          <Link
            to="/dashboard/wholesalers"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            <X className="w-4 h-4" /> Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update Wholesaler' : 'Create Wholesaler'}
          </button>
        </div>
      </form>

      {successToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-[#000F14] text-white">
            <CheckCircle2 className="w-4 h-4" /> {successToast}
          </div>
        </div>
      )}
    </div>
  )
}
