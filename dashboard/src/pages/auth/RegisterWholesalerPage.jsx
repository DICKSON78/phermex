import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Pill,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Check,
  CheckCircle2,
  Building2,
  MapPin,
  Hash,
  Truck,
  Landmark,
  CreditCard,
  Calendar,
  ShieldCheck,
} from 'lucide-react'
import api from '../../services/api'
import { BANKS } from '../../constants/banks'

const Required = () => <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
]

const BUSINESS_COUNTRIES = ['Tanzania', 'Kenya', 'Nigeria', 'Uganda', 'Zambia', 'Zimbabwe', 'Malawi']
const BUSINESS_TYPES = ['wholesaler', 'distributor']

// Same national-number rules as the manufacturer and owner forms.
const PHONE_MIN = 9
const PHONE_MAX = 10

function phoneDigits(value) {
  return String(value ?? '').replace(/[\s()\-.]/g, '')
}

function isValidPhone(value) {
  return new RegExp(`^[0-9]{${PHONE_MIN},${PHONE_MAX}}$`).test(phoneDigits(value))
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/

function isValidEmail(value) {
  const email = String(value ?? '').trim()
  if (!EMAIL_RE.test(email)) return false
  const domain = email.split('@')[1]
  if (domain.includes('..') || email.includes('..')) return false
  return true
}

function blankWholesaler() {
  return {
    // Account holder
    name: '',
    email: '',
    phone: '',
    countryCode: '+255',
    password: '',
    password_confirmation: '',
    // Business
    business_name: '',
    business_type: 'wholesaler',
    business_email: '',
    business_phone: '',
    contact_person: '',
    contact_phone: '',
    address: '',
    city: '',
    region: '',
    country: 'Tanzania',
    license_number: '',
    registration_number: '',
    tax_id: '',
    // Delivery & settlement
    delivery_fee: 0,
    express_delivery_fee: 0,
    minimum_order_amount: 0,
    payment_terms_days: 30,
    accepts_credit: true,
    bank_name: '',
    bank_account: '',
  }
}

const DRAFT_KEY = 'pharmex_wholesaler_registration_draft'

function readDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.form) return null
    return parsed
  } catch { return null }
}

function writeDraft(draft) {
  try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* ignore */ }
}

function clearDraft() {
  try { window.localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

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

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0FD452]/10">
          <Icon className="h-4 w-4 text-[#0FD452]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#000F14]">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Field({ label, required, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const STEP_TITLES = [
  'Create your account',
  'Tell us about your business',
  'Delivery, credit and settlement',
]

const ACCOUNT_KEYS = ['name', 'email', 'phone', 'password', 'password_confirmation']
const BUSINESS_KEYS = [
  'business_name', 'business_type', 'business_email', 'business_phone',
  'contact_person', 'contact_phone', 'address', 'city', 'region', 'country',
  'license_number', 'registration_number', 'tax_id',
]
const TERMS_KEYS = [
  'delivery_fee', 'express_delivery_fee', 'minimum_order_amount',
  'payment_terms_days', 'accepts_credit', 'bank_name', 'bank_account',
]

export default function RegisterWholesalerPage() {
  const navigate = useNavigate()

  const [draft] = useState(() => readDraft())
  const [step, setStep] = useState(() => {
    const saved = Number(draft?.step)
    return saved >= 1 && saved <= 3 ? saved : 1
  })
  const [stepDir, setStepDir] = useState('left')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resumedFrom, setResumedFrom] = useState(() => draft?.savedAt || null)
  const [form, setForm] = useState(() => {
    const empty = blankWholesaler()
    if (!draft?.form) return empty
    // Passwords are never written to the draft.
    return { ...empty, ...draft.form, password: '', password_confirmation: '' }
  })
  const skipFirstWriteRef = useRef(true)

  useEffect(() => {
    if (skipFirstWriteRef.current) {
      skipFirstWriteRef.current = false
      return
    }
    // Passwords are never persisted, even on a shared machine.
    writeDraft({ step, form: { ...form, password: '', password_confirmation: '' }, savedAt: Date.now() })
  }, [step, form])

  const discardDraft = () => {
    clearDraft()
    setResumedFrom(null)
    setStep(1)
    setStepDir('right')
    setForm(blankWholesaler())
    setErrors({})
    setError('')
  }

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const goStep = (next, dir) => {
    setStepDir(dir)
    setStep(next)
    setError('')
  }

  const validateAccount = () => {
    const errs = {}
    const name = form.name.trim()
    if (!name) errs.name = 'Your full name is required'
    else if (name.length < 2) errs.name = 'Name must be at least 2 characters'
    else if (name.length > 255) errs.name = 'Name is too long'

    const email = form.email.trim()
    if (!email) errs.email = 'Email address is required'
    else if (!isValidEmail(email)) errs.email = 'Enter a valid email address'

    const digits = phoneDigits(form.phone)
    if (!digits) errs.phone = 'Phone number is required'
    else if (!/^[0-9]+$/.test(digits)) errs.phone = 'Phone number can only contain digits'
    else if (!isValidPhone(digits)) errs.phone = `Enter ${PHONE_MIN} to ${PHONE_MAX} digits`

    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errs.password = 'Password needs at least one uppercase letter and one number'
    }

    if (!form.password_confirmation) errs.password_confirmation = 'Confirm your password'
    else if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateBusiness = () => {
    const errs = {}
    const name = form.business_name.trim()
    if (!name) errs.business_name = 'Business name is required'
    else if (name.length < 2) errs.business_name = 'Business name must be at least 2 characters'
    else if (name.length > 255) errs.business_name = 'Business name is too long'

    const email = form.business_email.trim()
    if (!email) errs.business_email = 'Business email is required'
    else if (!isValidEmail(email)) errs.business_email = 'Enter a valid business email'

    if (!form.business_phone.trim()) errs.business_phone = 'Business phone is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.region.trim()) errs.region = 'Region is required'
    if (!form.license_number.trim()) errs.license_number = 'Licence number is required'
    if (!form.registration_number.trim()) errs.registration_number = 'Registration number is required'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateTerms = () => {
    const errs = {}
    if (Number(form.delivery_fee) < 0) errs.delivery_fee = 'Cannot be negative'
    if (Number(form.express_delivery_fee) < 0) errs.express_delivery_fee = 'Cannot be negative'
    if (Number(form.minimum_order_amount) < 0) errs.minimum_order_amount = 'Cannot be negative'
    if (Number(form.payment_terms_days) < 0 || Number(form.payment_terms_days) > 365) {
      errs.payment_terms_days = 'Enter between 0 and 365 days'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Carries the account contact details into the business step so the
  // registrant does not type the same email and phone twice. They stay
  // editable, and anything already typed in the business fields is kept.
  const prefillBusinessFromAccount = () => {
    setForm((prev) => ({
      ...prev,
      business_email: prev.business_email || prev.email,
      business_phone: prev.business_phone || prev.phone,
      contact_person: prev.contact_person || prev.name,
      contact_phone: prev.contact_phone || prev.phone,
    }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!validateAccount()) return
      prefillBusinessFromAccount()
      goStep(2, 'left')
      return
    }
    if (step === 2 && validateBusiness()) {
      goStep(3, 'left')
    }
  }

  const submit = async (e) => {
    e.preventDefault()

    if (!validateAccount()) {
      goStep(1, 'right')
      return
    }
    if (!validateBusiness()) {
      goStep(2, 'right')
      return
    }
    if (!validateTerms()) return

    setLoading(true)
    setError('')
    try {
      const { countryCode, ...rest } = form
      await api.post('/register', {
        ...rest,
        phone: `${countryCode}${form.phone}`,
        role: 'wholesaler',
        delivery_fee: Number(form.delivery_fee) || 0,
        express_delivery_fee: Number(form.express_delivery_fee) || 0,
        minimum_order_amount: Number(form.minimum_order_amount) || 0,
        payment_terms_days: Number(form.payment_terms_days) || 0,
        accepts_credit: Boolean(form.accepts_credit),
      })
      clearDraft()
      setSubmitted(true)
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) {
        const mapped = {}
        Object.entries(serverErrors).forEach(([key, messages]) => {
          mapped[key] = Array.isArray(messages) ? messages[0] : messages
        })
        const firstField = Object.keys(mapped)[0]
        const target = ACCOUNT_KEYS.includes(firstField)
          ? 1
          : TERMS_KEYS.includes(firstField)
            ? 3
            : 2
        setErrors(mapped)
        setError(mapped[firstField] || 'Registration failed')
        goStep(target, 'right')
      } else {
        setError(err.response?.data?.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 ${
      errors[field] ? 'border-red-400' : 'border-gray-200'
    }`

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 auth-page">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0FD452]/15">
            <CheckCircle2 className="h-9 w-9 text-[#0FD452]" />
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[3px] text-[#0FD452]">Application received</p>
          <h1 className="mb-3 text-3xl font-black text-gray-700">Your supplier account is active</h1>
          <p className="mb-8 text-gray-500">
            We have recorded your business, licensing, delivery and banking details. You can sign in now to
            manage your catalogue, stock and orders — pharmacies can already find you in the marketplace.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-xl bg-[#0FD452] px-6 py-3 text-sm font-bold text-[#000F14] transition hover:bg-[#0cb843]"
            >
              Go to sign in
            </button>
            <Link
              to="/register"
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Back to registration
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 auth-page">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <Link to="/register" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-xl font-bold text-gray-600">HELIX</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">
            Wholesaler &amp; distributor registration
          </p>
          <h1 className="text-3xl font-black text-gray-600 mb-2">{STEP_TITLES[step - 1]}</h1>
          <p className="text-sm text-gray-500">Step {step} of 3</p>

          {resumedFrom && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#0FD452]/30 bg-[#0FD452]/5 px-4 py-3 text-left">
              <p className="text-xs text-gray-600">
                Your progress was saved. Step {step} of 3.
                {step > 1 && ' Re-enter your password on step 1 before submitting.'}
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

          <div className="mt-6 flex items-center justify-center gap-2">
            {[1, 2, 3].map((number) => (
              <div key={number} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step > number
                      ? 'bg-[#0FD452] text-[#000F14]'
                      : step === number
                        ? 'bg-[#0FD452] text-[#000F14]'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step > number ? <Check className="w-4 h-4" /> : number}
                </div>
                {number < 3 && (
                  <div className={`h-0.5 w-12 rounded-full transition-colors ${step > number ? 'bg-[#0FD452]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form
          onSubmit={step === 3 ? submit : (e) => { e.preventDefault(); handleNext() }}
          noValidate
          className="space-y-4"
        >
          {step === 1 && (
            <div className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <SectionCard icon={User} title="Account holder" subtitle="The person who will sign in and manage the supplier account">
                <div className="space-y-5">
                  <Field label="Full name" required error={errors.name}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => updateForm('name', e.target.value)}
                        className={`${inputClass('name')} pl-11`}
                        placeholder="Your full name"
                      />
                    </div>
                  </Field>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Login email" required error={errors.email}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <Mail className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={(e) => updateForm('email', e.target.value)}
                          className={`${inputClass('email')} pl-11`}
                          placeholder="you@example.com"
                        />
                      </div>
                    </Field>

                    <Field label="Phone number" required error={errors.phone}>
                      <div className="flex gap-2">
                        <select
                          value={form.countryCode}
                          onChange={(e) => updateForm('countryCode', e.target.value)}
                          className="w-28 shrink-0 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-sm text-gray-900 outline-none"
                          aria-label="Country code"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={PHONE_MAX}
                          value={form.phone}
                          onChange={(e) => {
                            const dial = form.countryCode.replace(/[^0-9]/g, '')
                            let digits = e.target.value.replace(/[^0-9]/g, '')
                            if (dial && digits.startsWith(dial) && digits.length > PHONE_MAX) {
                              digits = digits.slice(dial.length)
                            }
                            if (digits.length > 1 && digits.startsWith('0')) {
                              digits = digits.slice(1)
                            }
                            updateForm('phone', digits.slice(0, PHONE_MAX))
                          }}
                          className={`flex-1 ${inputClass('phone')}`}
                          placeholder="712 345 678"
                        />
                      </div>
                    </Field>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Password" required error={errors.password}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <Lock className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(e) => updateForm('password', e.target.value)}
                          className={`${inputClass('password')} pl-11 pr-11`}
                          placeholder="Min 8 chars, 1 uppercase, 1 number"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <PasswordRequirement met={form.password.length >= 8}>≥ 8 characters</PasswordRequirement>
                        <PasswordRequirement met={/[A-Z]/.test(form.password)}>1 uppercase letter</PasswordRequirement>
                        <PasswordRequirement met={/[0-9]/.test(form.password)}>1 number</PasswordRequirement>
                      </div>
                    </Field>

                    <Field label="Confirm password" required error={errors.password_confirmation}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                          <Lock className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={form.password_confirmation}
                          onChange={(e) => updateForm('password_confirmation', e.target.value)}
                          className={`${inputClass('password_confirmation')} pl-11 pr-11`}
                          placeholder="Re-enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {form.password_confirmation && (
                        <div className="mt-2">
                          <PasswordRequirement met={form.password_confirmation === form.password}>Passwords match</PasswordRequirement>
                        </div>
                      )}
                    </Field>
                  </div>
                </div>
              </SectionCard>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="w-full md:w-auto md:min-w-[220px] py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={`space-y-4 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <SectionCard icon={Building2} title="Business information" subtitle="Who the supplier is and how it is classified">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Business name" required error={errors.business_name} className="md:col-span-2">
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={(e) => updateForm('business_name', e.target.value)}
                      className={inputClass('business_name')}
                      placeholder="e.g. Tanzania Wholesale Pharmacy Ltd"
                    />
                  </Field>

                  <Field label="Supplier type" required error={errors.business_type}>
                    <select
                      value={form.business_type}
                      onChange={(e) => updateForm('business_type', e.target.value)}
                      className={`${inputClass('business_type')} capitalize`}
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type} className="capitalize">{type}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Business email" required error={errors.business_email}>
                    <input
                      type="email"
                      value={form.business_email}
                      onChange={(e) => updateForm('business_email', e.target.value)}
                      className={inputClass('business_email')}
                      placeholder="orders@supplier.co.tz"
                    />
                  </Field>

                  <Field label="Business phone" required error={errors.business_phone}>
                    <input
                      type="tel"
                      value={form.business_phone}
                      onChange={(e) => updateForm('business_phone', e.target.value)}
                      className={inputClass('business_phone')}
                      placeholder="+255 700 000 000"
                    />
                  </Field>

                  <Field label="Contact person" error={errors.contact_person}>
                    <input
                      type="text"
                      value={form.contact_person}
                      onChange={(e) => updateForm('contact_person', e.target.value)}
                      className={inputClass('contact_person')}
                      placeholder="Full name"
                    />
                  </Field>

                  <Field label="Contact phone" error={errors.contact_phone}>
                    <input
                      type="tel"
                      value={form.contact_phone}
                      onChange={(e) => updateForm('contact_phone', e.target.value)}
                      className={inputClass('contact_phone')}
                      placeholder="+255 700 000 000"
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={MapPin} title="Location" subtitle="Where the supplier operates and delivers from">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Address" required error={errors.address} className="md:col-span-2">
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateForm('address', e.target.value)}
                      className={inputClass('address')}
                      placeholder="Street, plot, building"
                    />
                  </Field>

                  <Field label="City" required error={errors.city}>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateForm('city', e.target.value)}
                      className={inputClass('city')}
                      placeholder="e.g. Dar es Salaam"
                    />
                  </Field>

                  <Field label="Region" required error={errors.region}>
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => updateForm('region', e.target.value)}
                      className={inputClass('region')}
                      placeholder="e.g. Dar es Salaam"
                    />
                  </Field>

                  <Field label="Country" error={errors.country}>
                    <select
                      value={form.country}
                      onChange={(e) => updateForm('country', e.target.value)}
                      className={inputClass('country')}
                    >
                      {BUSINESS_COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={Hash} title="Licensing" subtitle="Regulatory identifiers used to verify the supplier">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Licence number" required error={errors.license_number}>
                    <input
                      type="text"
                      value={form.license_number}
                      onChange={(e) => updateForm('license_number', e.target.value)}
                      className={inputClass('license_number')}
                      placeholder="e.g. TZ-WHL-00123"
                    />
                  </Field>

                  <Field label="Registration number" required error={errors.registration_number}>
                    <input
                      type="text"
                      value={form.registration_number}
                      onChange={(e) => updateForm('registration_number', e.target.value)}
                      className={inputClass('registration_number')}
                      placeholder="e.g. BRELA-123456"
                    />
                  </Field>

                  <Field label="Tax ID" error={errors.tax_id}>
                    <input
                      type="text"
                      value={form.tax_id}
                      onChange={(e) => updateForm('tax_id', e.target.value)}
                      className={inputClass('tax_id')}
                      placeholder="TIN"
                    />
                  </Field>
                </div>
              </SectionCard>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => goStep(1, 'right')}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={`space-y-4 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <div className="flex items-start gap-3 rounded-2xl border border-[#0FD452]/30 bg-[#0FD452]/5 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0a8f3c]" />
                <p className="text-xs text-gray-700">
                  Your account is <span className="font-semibold">activated on submission</span>. You can sign in
                  right away to manage your catalogue, stock and orders. The platform team can still suspend the
                  account if any detail needs follow-up.
                </p>
              </div>

              <SectionCard icon={Truck} title="Delivery & order terms" subtitle="Charges and minimums shown to pharmacies in the marketplace">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Standard delivery fee" error={errors.delivery_fee} hint="Applied when the pharmacy chooses standard delivery.">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.delivery_fee}
                      onChange={(e) => updateForm('delivery_fee', e.target.value)}
                      className={inputClass('delivery_fee')}
                      placeholder="0.00"
                    />
                  </Field>

                  <Field label="Express delivery fee" error={errors.express_delivery_fee} hint="Falls back to the standard fee when left at zero.">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.express_delivery_fee}
                      onChange={(e) => updateForm('express_delivery_fee', e.target.value)}
                      className={inputClass('express_delivery_fee')}
                      placeholder="0.00"
                    />
                  </Field>

                  <Field label="Minimum order amount" error={errors.minimum_order_amount} hint="Orders below this subtotal are rejected.">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minimum_order_amount}
                      onChange={(e) => updateForm('minimum_order_amount', e.target.value)}
                      className={inputClass('minimum_order_amount')}
                      placeholder="0.00"
                    />
                  </Field>

                  <Field label="Credit terms (days)" error={errors.payment_terms_days}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={form.payment_terms_days}
                        onChange={(e) => updateForm('payment_terms_days', e.target.value)}
                        className={`${inputClass('payment_terms_days')} pl-10`}
                        placeholder="30"
                      />
                    </div>
                  </Field>

                  <div className="md:col-span-2">
                    <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <input
                        type="checkbox"
                        checked={form.accepts_credit}
                        onChange={(e) => updateForm('accepts_credit', e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0FD452] focus:ring-[#0FD452]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#000F14]">Accept credit accounts</p>
                        <p className="text-xs text-gray-500">
                          Pharmacies can place credit orders against their account number. Turn this off to require
                          cash on delivery or pickup.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={Landmark} title="Banking" subtitle="Where the supplier receives settlement payments">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Bank name" error={errors.bank_name}>
                    <select
                      value={form.bank_name}
                      onChange={(e) => updateForm('bank_name', e.target.value)}
                      className={inputClass('bank_name')}
                    >
                      <option value="">Select a bank</option>
                      {BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Bank account" error={errors.bank_account}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={form.bank_account}
                        onChange={(e) => updateForm('bank_account', e.target.value)}
                        className={`${inputClass('bank_account')} pl-10`}
                        placeholder="Account number"
                      />
                    </div>
                  </Field>
                </div>
              </SectionCard>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => goStep(2, 'right')}
                  disabled={loading}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </span>
                  ) : (
                    'Submit application →'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0FD452] font-semibold hover:text-[#0cb843] transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
