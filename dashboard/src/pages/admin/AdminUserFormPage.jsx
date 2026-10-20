import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { UserPlus, ArrowLeft, Save, User, Mail, Phone, Shield, Lock, Loader2, CheckCircle, Building2 } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/Modal'
import { useLanguage } from '../../contexts/LanguageContext'

const INITIAL_FORM = { name: '', email: '', phone: '', role: 'pharmacist', pharmacy_id: '', password: '' }

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'customer', label: 'Customer' },
]

export default function AdminUserFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [successModal, setSuccessModal] = useState(false)
  const [pharmacies, setPharmacies] = useState([])

  useEffect(() => {
    fetchPharmacies()
  }, [])

  const fetchPharmacies = async () => {
    try {
      const res = await api.get('/admin/pharmacies')
      setPharmacies(res.data.data || [])
    } catch {
      // Leave pharmacy list empty — field hidden
    }
  }

  useEffect(() => {
    if (isEdit) fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      const res = await api.get(`/admin/users/${id}`)
      const user = res.data.data || res.data
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'pharmacist',
        pharmacy_id: user.pharmacy_id || '',
        password: '',
      })
    } catch {
      // Failed to fetch user data — leave form with empty values
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
    if (!form.name.trim()) errs.name = t('adminUsers.users.nameRequired')
    if (!form.email.trim()) errs.email = t('auth.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('adminUsers.users.invalidEmail')
    if (!form.phone.trim()) errs.phone = t('adminUsers.users.phoneRequired')
    if (!form.role) errs.role = t('adminUsers.users.roleRequired')
    if (!isEdit && !form.password) errs.password = t('auth.passwordRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = { ...form }
      if (isEdit && !payload.password) delete payload.password

      if (isEdit) {
        await api.put(`/admin/users/${id}`, payload)
      } else {
        await api.post('/admin/users', payload)
      }
      setSuccessModal(true)
      setTimeout(() => navigate('/dashboard/users'), 1500)
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
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
            <Link to="/dashboard/users" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? t('adminUsers.users.editUser') : t('adminUsers.users.createNewUser')}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? t('adminUsers.users.editUserSubtitle') : t('adminUsers.users.createUserSubtitle')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          {/* Section 1: Personal Information */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('profile.personalInfo')}</h3>
                <p className="text-sm text-gray-600">{t('adminUsers.users.personalInfoSub')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('adminUsers.users.fullName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.name ? '!border-red-400' : ''}`}
                    placeholder={t('adminUsers.users.enterFullName')}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('customers.emailAddress')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.email ? '!border-red-400' : ''}`}
                    placeholder="user@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('customers.phoneNumber')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.phone ? '!border-red-400' : ''}`}
                    placeholder="+256700000000"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Role & Access */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('adminUsers.users.roleAccess')}</h3>
                <p className="text-sm text-gray-600">{t('adminUsers.users.roleAccessSub')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('adminUsers.shared.role')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.role ? '!border-red-400' : ''}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{t('common.role' + r.value.charAt(0).toUpperCase() + r.value.slice(1), r.label)}</option>
                    ))}
                  </select>
                </div>
                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
              </div>
              {['owner', 'pharmacist', 'cashier', 'delivery'].includes(form.role) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('adminUsers.shared.pharmacy')} <span className="text-red-500">*</span>
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
                      <option value="">{t('common.selectPharmacy')}</option>
                      {pharmacies.map((p) => (
                        <option key={p.id} value={p.id}>{p.pharmacy_name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.pharmacy_id && <p className="text-xs text-red-500 mt-1">{errors.pharmacy_id}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Security */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Lock className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('adminUsers.users.security')}</h3>
                <p className="text-sm text-gray-600">{t('adminUsers.users.securitySub')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('auth.password')} {!isEdit && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.password ? '!border-red-400' : ''}`}
                    placeholder={isEdit ? t('adminUsers.users.keepCurrent') : t('adminUsers.users.min8')}
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/users" className="btn-secondary">
              <span>{t('common.cancel')}</span>
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? t('adminUsers.users.updateUser') : t('adminUsers.users.createUser')}</span>
            </button>
          </div>
        </form>
      </div>

      <Modal isOpen={successModal} onClose={() => setSuccessModal(null)} title="" maxWidth="max-w-sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#0FD452]" />
          </div>
          <h3 className="text-lg font-bold text-[#000F14] mb-1">{isEdit ? t('adminUsers.users.userUpdated') : t('adminUsers.users.userCreated')}</h3>
          <p className="text-sm text-gray-500">{t('adminUsers.users.redirecting')}</p>
        </div>
      </Modal>
    </div>
  )
}
