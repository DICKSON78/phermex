import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import {
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Lock,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  Globe,
  FileText,
  Clock,
  Hash,
  Store,
  CreditCard,
  Calendar,
  X,
  AlertTriangle,
} from 'lucide-react'

const COUNTRIES = ['Tanzania', 'Kenya', 'Nigeria', 'Uganda', 'Zambia', 'Zimbabwe', 'Malawi']
const PHARMACY_TYPES = ['independent', 'chain', 'hospital', 'online']

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

function FormField({ icon: Icon, label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        <span className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-[#0FD452]" />
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function AdminPharmacyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    pharmacy_name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    password: '',
    country: 'Tanzania',
    region: '',
    district: '',
    ward: '',
    street: '',
    phone: '',
    email: '',
    pharmacy_type: 'independent',
    license_number: '',
    license_expiry: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [successToast, setSuccessToast] = useState(null)

  useEffect(() => { if (isEdit) fetchPharmacy() }, [id])

  const fetchPharmacy = async () => {
    try {
      const res = await api.get(`/admin/pharmacies/${id}`)
      const d = res.data.data || res.data
      const owner = typeof d.owner === 'object' ? d.owner : null
      setForm({
        pharmacy_name: d.pharmacy_name || '',
        owner_name: owner?.name || '',
        owner_email: owner?.email || '',
        owner_phone: owner?.phone || '',
        password: '',
        country: d.country || 'Tanzania',
        region: d.region || '',
        district: d.district || '',
        ward: d.ward || '',
        street: d.street || '',
        phone: d.phone || '',
        email: d.email || '',
        pharmacy_type: d.pharmacy_type || 'independent',
        license_number: d.license_number || '',
        license_expiry: d.license_expiry || '',
      })
    } catch {
      // Failed to fetch pharmacy data — leave form with empty values
    } finally { setLoading(false) }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.pharmacy_name.trim()) errs.pharmacy_name = 'Pharmacy name is required'
    if (!form.owner_name.trim()) errs.owner_name = 'Owner name is required'
    if (!isEdit && !form.owner_email.trim()) errs.owner_email = 'Owner email is required (login)'
    else if (!isEdit && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.owner_email)) errs.owner_email = 'Invalid email'
    if (!isEdit && !form.password) errs.password = 'Login password is required'
    else if (!isEdit && form.password.length < 8) errs.password = 'Min 8 characters'
    if (!form.country) errs.country = 'Country is required'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (isEdit) {
        const { owner_email, owner_phone, password, ...rest } = form
        await api.put(`/admin/pharmacies/${id}`, rest)
      } else {
        await api.post('/admin/pharmacies', form)
      }
      setSuccessToast(isEdit ? 'Pharmacy updated successfully' : 'Pharmacy and owner account created')
      setTimeout(() => navigate('/dashboard/pharmacies'), 1500)
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 bg-gray-200 animate-pulse rounded-xl" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl" />)}
      </div>
    )
  }

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm text-[#000F14] bg-gray-50 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 ${errors[field] ? '!border-red-400' : 'border-gray-200'}`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/pharmacies" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            {isEdit ? <FileText className="w-5 h-5 text-[#0FD452]" /> : <Building2 className="w-5 h-5 text-[#0FD452]" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Pharmacy' : 'Create New Pharmacy'}</h1>
            <p className="text-sm text-gray-500">{isEdit ? 'Update existing pharmacy details' : 'Add a pharmacy and create its owner login account'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <SectionCard icon={Building2} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Basic Information" subtitle="Pharmacy name and classification details">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FormField icon={Building2} label="Pharmacy Name" required error={errors.pharmacy_name}>
                <input type="text" value={form.pharmacy_name} onChange={(e) => handleChange('pharmacy_name', e.target.value)}
                  className={inputClass('pharmacy_name')} placeholder="Enter pharmacy name" />
              </FormField>
            </div>
            <FormField icon={User} label="Owner Name" required error={errors.owner_name}>
              <input type="text" value={form.owner_name} onChange={(e) => handleChange('owner_name', e.target.value)}
                className={inputClass('owner_name')} placeholder="Enter owner name" />
            </FormField>
            {!isEdit && (
              <>
                <FormField icon={Mail} label="Owner Email (login)" required error={errors.owner_email}>
                  <input type="email" value={form.owner_email} onChange={(e) => handleChange('owner_email', e.target.value)}
                    className={inputClass('owner_email')} placeholder="owner@example.com" />
                </FormField>
                <FormField icon={Phone} label="Owner Phone" error={errors.owner_phone}>
                  <input type="tel" value={form.owner_phone} onChange={(e) => handleChange('owner_phone', e.target.value)}
                    className={inputClass('owner_phone')} placeholder="+255..." />
                </FormField>
                <FormField icon={Lock} label="Login Password" required error={errors.password}>
                  <input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)}
                    className={inputClass('password')} placeholder="Min 8 characters" />
                </FormField>
              </>
            )}
            <FormField icon={Globe} label="Country" required error={errors.country}>
              <select value={form.country} onChange={(e) => handleChange('country', e.target.value)} className={inputClass('country')}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField icon={Store} label="Pharmacy Type" error={errors.pharmacy_type}>
              <select value={form.pharmacy_type} onChange={(e) => handleChange('pharmacy_type', e.target.value)} className={inputClass('pharmacy_type')}>
                {PHARMACY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
              </select>
            </FormField>
            <FormField icon={Hash} label="License Number" error={errors.license_number}>
              <input type="text" value={form.license_number} onChange={(e) => handleChange('license_number', e.target.value)}
                className={inputClass('license_number')} placeholder="TZ-PH-XXXX-XXXX" />
            </FormField>
          </div>
        </SectionCard>

        {/* Location */}
        <SectionCard icon={MapPin} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Location" subtitle="Pharmacy address details">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField icon={MapPin} label="Region" error={errors.region}>
              <input type="text" value={form.region} onChange={(e) => handleChange('region', e.target.value)}
                className={inputClass('region')} placeholder="e.g. Dar es Salaam" />
            </FormField>
            <FormField icon={MapPin} label="District" error={errors.district}>
              <input type="text" value={form.district} onChange={(e) => handleChange('district', e.target.value)}
                className={inputClass('district')} placeholder="e.g. Kinondoni" />
            </FormField>
            <FormField icon={MapPin} label="Ward" error={errors.ward}>
              <input type="text" value={form.ward} onChange={(e) => handleChange('ward', e.target.value)}
                className={inputClass('ward')} placeholder="e.g. Mikocheni" />
            </FormField>
            <FormField icon={MapPin} label="Street" error={errors.street}>
              <input type="text" value={form.street} onChange={(e) => handleChange('street', e.target.value)}
                className={inputClass('street')} placeholder="e.g. Bagamoyo Road" />
            </FormField>
          </div>
        </SectionCard>

        {/* Contact Information */}
        <SectionCard icon={Phone} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Contact Information" subtitle="Phone and email for the pharmacy">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField icon={Phone} label="Phone" required error={errors.phone}>
              <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClass('phone')} placeholder="+255..." />
            </FormField>
            <FormField icon={Mail} label="Email" error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass('email')} placeholder="email@example.com" />
            </FormField>
          </div>
        </SectionCard>

        {/* License Expiry */}
        <SectionCard icon={Calendar} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="License & Validity" subtitle="License expiry date">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField icon={Calendar} label="License Expiry Date" error={errors.license_expiry}>
              <input type="date" value={form.license_expiry} onChange={(e) => handleChange('license_expiry', e.target.value)}
                className={inputClass('license_expiry')} />
            </FormField>
          </div>
        </SectionCard>

        {/* Sticky bottom bar */}
        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 rounded-b-xl flex justify-end gap-3 -mb-5">
          <Link to="/dashboard/pharmacies"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
            <X className="w-4 h-4" /> Cancel
          </Link>
          <button type="submit" disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update Pharmacy' : 'Create Pharmacy & Owner Account'}
          </button>
        </div>
      </form>

      {/* Toast */}
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
