import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pill, User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, Loader2, Check, Building2, MapPin, Clock, ChevronRight, Plus, Trash2, Info, Flag } from 'lucide-react'
import api from '../../services/api'

const Required = () => <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>

function PasswordRequirement({ met, children }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs ${met ? 'text-[#0FD452]' : 'text-gray-400'}`}>
      <span
        className={`flex items-center justify-center w-3.5 h-3.5 rounded-full border shrink-0 transition-colors ${
          met ? 'bg-[#0FD452] border-[#0FD452] text-[#000F14]' : 'border-gray-300 text-transparent'
        }`}
      >
        <Check className="w-2.5 h-2.5" strokeWidth={3} />
      </span>
      {children}
    </span>
  )
}

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
]

const PHONE_MIN = 9
const PHONE_MAX = 13

function phoneDigits(value) {
  return String(value ?? '').replace(/[\s()\-.]/g, '')
}

function isValidPhone(value) {
  const digits = phoneDigits(value)
  return new RegExp(`^[0-9]{${PHONE_MIN},${PHONE_MAX}}$`).test(digits)
}

function blankManufacturer() {
  return {
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    manufacturer_name: '',
    manufacturer_license: '',
    manufacturer_address: '',
    manufacturer_phone: '',
    manufacturer_email: '',
    manufacturer_website: '',
    manufacturer_description: '',
  }
}

const DRAFT_KEY = 'pharmex_registration_draft'

function readDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch { return null }
}

function writeDraft(draft) {
  try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* ignore */ }
}

function clearDraft() {
  try { window.localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

export default function RegisterManufacturerPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(() => {
    const saved = readDraft()
    return Math.max(1, Number(saved?.step) || 1)
  })
  const [stepDir, setStepDir] = useState('left')
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [form, setForm] = useState(blankManufacturer)
  const [resumedFrom, setResumedFrom] = useState(null)
  const skipFirstWriteRef = useRef(true)

  // Draft persistence
  React.useEffect(() => {
    if (skipFirstWriteRef.current) {
      skipFirstWriteRef.current = false
      return
    }
    writeDraft({
      step,
      form: {
        name: form.name, email: form.email, phone: form.phone,
        manufacturer_name: form.manufacturer_name,
        manufacturer_license: form.manufacturer_license,
        manufacturer_address: form.manufacturer_address,
        manufacturer_phone: form.manufacturer_phone,
        manufacturer_email: form.manufacturer_email,
        manufacturer_website: form.manufacturer_website,
        manufacturer_description: form.manufacturer_description,
      },
      savedAt: Date.now(),
    })
  }, [step, form])

  const discardDraft = () => {
    clearDraft()
    setResumedFrom(null)
    setStep(1)
    setAnimKey((k) => k + 1)
    setForm(blankManufacturer())
    setError('')
  }

  useEffect(() => {
    setError('')
  }, [step])

  useEffect(() => {
    if (readDraft()) setResumedFrom(readDraft().savedAt)
  }, [])

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const goStep = (s, dir) => {
    setStepDir(dir)
    setStep(s)
    setAnimKey((k) => k + 1)
  }

  const togglePwd = () => setShowPassword(!showPassword)
  const toggleConfPwd = () => setShowConfirmPassword(!showConfirmPassword)

  const validatePersonal = () => {
    const errs = {}
    if (!form.name?.trim()) errs.name = 'Full name is required'
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters'

    if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address'

    const digits = phoneDigits(form.phone)
    if (!digits) errs.phone = 'Enter a valid phone number'
    else if (digits.length < PHONE_MIN) errs.phone = `${PHONE_MIN} digits minimum`
    else if (digits.length > PHONE_MAX) errs.phone = `${PHONE_MAX} digits maximum`
    else if (!/^[0-9]+$/.test(digits)) errs.phone = 'Phone must contain only numbers'

    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errs.password = 'Password needs at least one uppercase letter and one number'
    }
    if (form.password_confirmation && form.password !== form.password_confirmation) {
      errs.password_confirmation = 'Passwords do not match'
    }
    setError('')
    return Object.keys(errs).length === 0
  }

  const validateBusiness = () => {
    const errs = {}
    if (!form.manufacturer_name?.trim()) errs.manufacturer_name = 'Manufacturer name is required'
    else if (form.manufacturer_name.trim().length < 2) errs.manufacturer_name = 'Name too short'

    if (form.manufacturer_license && form.manufacturer_license.length > 100) errs.manufacturer_license = 'License too long'
    if (form.manufacturer_address && form.manufacturer_address.length > 255) errs.manufacturer_address = 'Address too long'
    if (form.manufacturer_phone && form.manufacturer_phone.length > 50) errs.manufacturer_phone = 'Phone too long'
    if (form.manufacturer_email && !isValidEmail(form.manufacturer_email)) errs.manufacturer_email = 'Invalid email'
    if (form.manufacturer_website && form.manufacturer_website.length > 255) errs.manufacturer_website = 'Website too long'
    if (form.manufacturer_description && form.manufacturer_description.length > 2000) errs.manufacturer_description = 'Description too long'
    setError('')
    return Object.keys(errs).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validatePersonal()) {
      goStep(1, 'left')
      return
    }
    if (!validateBusiness()) {
      goStep(2, 'left')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/register', { ...form, role: 'manufacturer' })
      clearDraft()
      navigate('/login')
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) {
        const mapped = {}
        Object.entries(serverErrors).forEach(([key, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages
          mapped[key] = message
        })
        setError(mapped.manufacturer_name || mapped.manufacturer_license || mapped.manufacturer_address || mapped.name || 'Registration failed')
        goStep(2, 'right')
      } else {
        setError(err.response?.data?.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"

  const maxW = 'max-w-2xl'

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 auth-page">
      <div className={`w-full ${maxW}`}>
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/register" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-xl font-bold text-gray-600">HELIX</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">
            New Manufacturer Registration
          </p>
          <h1 className="text-4xl font-black text-gray-600 mb-3">{form.manufacturer_name ? 'Complete your profile' : 'Create your manufacturer account'}</h1>

          {resumedFrom && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#0FD452]/30 bg-[#0FD452]/5 px-4 py-3 text-left">
              <p className="text-xs text-gray-600">
                {`. ${step} / 2`}
                {step > 1 && '. Continue where you left off'}
              </p>
              <button
                type="button"
                onClick={discardDraft}
                className="shrink-0 text-xs font-semibold text-gray-500 underline hover:text-gray-800 transition-colors"
              >
                Start over
              </button>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 text-gray-400" key={animKey}>
              {step > 1 ? <Check className="w-4 h-4" /> : 1}
            </div>
            <div className={`w-16 h-0.5 rounded-full transition-colors ${step > 1 ? 'bg-[#0FD452]' : 'bg-gray-200'}`} />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 text-gray-400" key={animKey + 1}>
              {step === 2 ? <Check className="w-4 h-4" /> : 2}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={step === 2 ? submit : () => {}} >
          {/* STEP 1 - Personal Information */}
          {step === 1 && (
            <div key={`s1-${animKey}`} className={`space-y-5 ${step === 1 ? 'step-enter-left' : ''}`}>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Contact name<Required /></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} className={`${inputClass} ${form.name ? 'border-green-400' : ''}`} placeholder="Your full name" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email address<Required /></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className={`${inputClass} ${form.email ? 'border-green-400' : ''}`} placeholder="you@example.com" />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone number<Required /></label>
                  <div className="flex gap-2">
                    <select value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="w-32 px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white">
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={PHONE_MAX}
                      value={form.phone?.replace(/[^0-9]/g, '') || ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, '')
                        const dial = form.phone?.replace(/[^0-9]/g, '').replace(/^\+/, '') || ''
                        if (dial && digits.startsWith(dial) && digits.length > PHONE_MAX) {
                          digits = digits.slice(dial.length)
                        }
                        if (digits.length > 1 && digits.startsWith('0')) {
                          digits = digits.slice(1)
                        }
                        updateForm('phone', '+' + dial + digits.slice(0, PHONE_MAX - dial.length))
                      }}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
                      placeholder="712 345 678"
                    />
                  </div>
                  {form.phone && digits.length < PHONE_MIN && <p className="text-red-500 text-xs mt-1">Enter a valid phone number</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password<Required /></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => updateForm('password', e.target.value)}
                      className={`${inputClass} pr-11 ${form.password ? 'border-green-400' : ''}`}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                    />
                    <button type="button" onClick={togglePwd} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <PasswordRequirement met={form.password.length >= 8}>
                      {t('authPages.validation.passwordHasMin8')}
                    </PasswordRequirement>
                    <PasswordRequirement met={/[A-Z]/.test(form.password)}>
                      {t('authPages.validation.passwordHasUppercase')}
                    </PasswordRequirement>
                    <PasswordRequirement met={/[0-9]/.test(form.password)}>
                      {t('authPages.validation.passwordHasNumber')}
                    </PasswordRequirement>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Confirm password<Required /></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.password_confirmation}
                      onChange={(e) => updateForm('password_confirmation', e.target.value)}
                      className={`${inputClass} ${errors.password_confirmation ? 'border-red-400' : ''}`}
                      placeholder="Re-enter password"
                    />
                    {form.password_confirmation && (
                      <PasswordRequirement met={form.password_confirmation === form.password}>
                        {t('authPages.validation.passwordMatches')}
                      </PasswordRequirement>
                    )}
                    {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="w-full md:w-auto md:min-w-[220px] py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                  {t('authPages.shared.continueBtn')} →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 - Business Information */}
          {step === 2 && (
            <div key={`s2-${animKey}`} className="space-y-5">
              <div className="flex items-center justify-between bg-[#0FD452]/5 border border-[#0FD452]/20 rounded-xl px-4 py-2.5">
                <p className="text-sm font-bold text-gray-700">Manufacturer details</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Manufacturer name<Required /></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="text" value={form.manufacturer_name} onChange={(e) => updateForm('manufacturer_name', e.target.value)} className={`${inputClass} ${form.manufacturer_name ? 'border-green-400' : ''}`} placeholder="Your business name" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">License number</label>
                  <input type="text" value={form.manufacturer_license} onChange={(e) => updateForm('manufacturer_license', e.target.value)} className={`${inputClass} ${form.manufacturer_license ? 'border-green-400' : ''}`} placeholder="Your licence number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Address</label>
                  <input type="text" value={form.manufacturer_address} onChange={(e) => updateForm('manufacturer_address', e.target.value)} className={`${inputClass} ${form.manufacturer_address ? 'border-green-400' : ''}`} placeholder="Your registered address" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone</label>
                  <input type="tel" value={form.manufacturer_phone} onChange={(e) => updateForm('manufacturer_phone', e.target.value)} className={`${inputClass} ${form.manufacturer_phone ? 'border-green-400' : ''}`} placeholder="+255 712 345 678" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
                  <input type="email" value={form.manufacturer_email} onChange={(e) => updateForm('manufacturer_email', e.target.value)} className={`${inputClass} ${form.manufacturer_email ? 'border-green-400' : ''}`} placeholder="contact@yourcompany.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Website</label>
                <input type="url" value={form.manufacturer_website} onChange={(e) => updateForm('manufacturer_website', e.target.value)} className={`${inputClass} ${form.manufacturer_website ? 'border-green-400' : ''}`} placeholder="https://yourcompany.com" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea value={form.manufacturer_description} onChange={(e) => updateForm('manufacturer_description', e.target.value)} className={`${inputClass} resize-none ${form.manufacturer_description ? 'border-green-400' : ''}`} rows={3} placeholder="Tell us about your products and manufacturing process" />
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => goStep(1, 'right')} className="w-full md:w-auto md:min-w-[220px] py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                  ← Back
                </button>
                <button type="submit" className="ml-auto w-full md:w-auto md:min-w-[220px] py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                  Register →
                </button>
              </div>
            </div>
          )}
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account? <Link to="/login" className="text-[#0FD452] font-semibold hover:text-[#0cb843] transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}