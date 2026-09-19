import React, { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import {
  Pill,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  FileText,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader2,
  Navigation,
  Crosshair,
  Store,
  Info,
  Check,
  CreditCard,
  Plus,
  Trash2,
  Pencil,
} from 'lucide-react'

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
]

const pharmacyTypes = [
  { value: 'independent', label: 'Independent' },
  { value: 'chain', label: 'Chain' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'online', label: 'Online' },
]

const workingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DEFAULT_CENTER = [-6.7924, 39.2083]

function LocationMap({ latitude, longitude, onChange }) {
  const [mapReady, setMapReady] = useState(false)

  const handleMapClick = useCallback((e) => {
    onChange(parseFloat(e.latlng.lat.toFixed(7)), parseFloat(e.latlng.lng.toFixed(7)))
  }, [onChange])

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChange(parseFloat(pos.coords.latitude.toFixed(7)), parseFloat(pos.coords.longitude.toFixed(7)))
        },
        () => {}
      )
    }
  }

  React.useEffect(() => {
    if (mapReady || typeof window === 'undefined') return
    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      setMapReady(true)
    })
  }, [mapReady])

  React.useEffect(() => {
    if (!mapReady || typeof window === 'undefined') return
    let mapInstance = null

    import('leaflet').then((L) => {
      const container = document.getElementById('pharmacy-map')
      if (!container || container._leaflet_id) return

      const center = latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER
      mapInstance = L.map(container).setView(center, 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstance)

      let marker = latitude && longitude ? L.marker(center).addTo(mapInstance) : null

      mapInstance.on('click', (e) => {
        const lat = parseFloat(e.latlng.lat.toFixed(7))
        const lng = parseFloat(e.latlng.lng.toFixed(7))
        if (marker) mapInstance.removeLayer(marker)
        marker = L.marker([lat, lng]).addTo(mapInstance)
        onChange(lat, lng)
      })

      const detectBtn = document.getElementById('detect-location-btn')
      if (detectBtn) {
        detectBtn.onclick = () => {
          navigator.geolocation?.getCurrentPosition(
            (pos) => {
              const lat = parseFloat(pos.coords.latitude.toFixed(7))
              const lng = parseFloat(pos.coords.longitude.toFixed(7))
              mapInstance.setView([lat, lng], 15)
              if (marker) mapInstance.removeLayer(marker)
              marker = L.marker([lat, lng]).addTo(mapInstance)
              onChange(lat, lng)
            },
            () => {},
            { enableHighAccuracy: true }
          )
        }
      }
    })

    return () => {
      if (mapInstance) {
        mapInstance.remove()
        const container = document.getElementById('pharmacy-map')
        if (container) container._leaflet_id = null
      }
    }
  }, [mapReady, latitude, longitude, onChange])

  return (
    <div className="space-y-3">
      <div id="pharmacy-map" className="w-full h-72 rounded-xl border border-gray-200 overflow-hidden z-0" />
      {latitude && longitude && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Navigation className="w-4 h-4 text-[#0FD452]" />
          <span className="font-mono">{latitude}, {longitude}</span>
        </div>
      )}
      <button type="button" id="detect-location-btn" onClick={handleDetectLocation} className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#0FD452] text-[#0FD452] rounded-xl text-sm font-semibold hover:bg-[#0FD452]/5 transition-all">
        <Crosshair className="w-4 h-4" />
        Detect My Current Location
      </button>
      <p className="text-xs text-gray-400 text-center">Click on the map to set your pharmacy location, or use detect above.</p>
    </div>
  )
}

function blankPharmacy(country) {
  return {
    pharmacy_name: '',
    pharmacy_type: 'independent',
    license_number: '',
    license_expiry: '',
    country,
    region: '',
    district: '',
    ward: '',
    street: '',
    description: '',
    opening_capital: '',
    latitude: null,
    longitude: null,
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    opening_time: '08:00',
    closing_time: '18:00',
  }
}

export default function RegisterOwnerPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const multiple = new URLSearchParams(window.location.search).get('mode') === 'multiple'

  const [step, setStep] = useState(1)
  const [stepDir, setStepDir] = useState('left')
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [plans, setPlans] = useState([])

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+255',
    password: '',
    password_confirmation: '',
    country: 'Tanzania',
    subscription_plan_id: null,
  })

  const [pharmacies, setPharmacies] = useState(() => [blankPharmacy('Tanzania')])
  const [errors, setErrors] = useState({})

  const totalSteps = 3 * pharmacies.length + 2

  useEffect(() => {
    api.get('/subscriptions/plans').then((res) => {
      setPlans(res.data?.data || res.data || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setErrors({})
  }, [step])

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const updatePharmacy = (index, field, value) => {
    setPharmacies((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
    const key = `p${index}_${field}`
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const addPharmacy = () => {
    setPharmacies((prev) => [...prev, blankPharmacy(form.country)])
  }

  const removePharmacy = (index) => {
    const nextCount = pharmacies.length - 1
    setPharmacies((prev) => prev.filter((_, i) => i !== index))
    if (step > 3 * nextCount + 2) {
      goStep(3 * nextCount + 2, 'left')
    }
  }

  const goStep = (s, dir) => {
    setStepDir(dir)
    setStep(s)
    setAnimKey((k) => k + 1)
  }

  const toggleWorkingDay = (index, day) => {
    const days = pharmacies[index].working_days.includes(day)
      ? pharmacies[index].working_days.filter((d) => d !== day)
      : [...pharmacies[index].working_days, day]
    updatePharmacy(index, 'working_days', days)
  }

  const stepType = (s) => {
    if (s === 1) return 'personal'
    if (s === totalSteps) return 'plan'
    const rem = (s - 2) % 3
    return rem === 0 ? 'details' : rem === 1 ? 'location' : 'hours'
  }

  const pharmacyIndex = (s) => Math.floor((s - 2) / 3)

  const validatePersonal = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.phone.trim()) errs.phone = 'Phone number is required'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateDetails = (i) => {
    const errs = {}
    const p = pharmacies[i]
    if (!p.pharmacy_name.trim()) errs[`p${i}_pharmacy_name`] = 'Pharmacy name is required'
    if (!p.region.trim()) errs[`p${i}_region`] = 'Region is required'
    if (!p.district.trim()) errs[`p${i}_district`] = 'District is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateLocation = (i) => {
    const errs = {}
    const p = pharmacies[i]
    if (p.latitude === null || p.longitude === null) errs[`p${i}_location`] = 'Please pick this pharmacy\'s location on the map'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateHours = (i) => {
    const errs = {}
    const p = pharmacies[i]
    if (p.working_days.length === 0) errs[`p${i}_working_days`] = 'Select at least one working day'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validatePlan = () => {
    const errs = {}
    if (!form.subscription_plan_id) errs.subscription_plan_id = 'Please select a subscription plan'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    const type = stepType(step)

    if (type === 'personal' && validatePersonal()) {
      goStep(2, 'left')
      return
    }

    if (type === 'details') {
      const i = pharmacyIndex(step)
      if (validateDetails(i)) goStep(step + 1, 'left')
      return
    }

    if (type === 'location') {
      const i = pharmacyIndex(step)
      if (validateLocation(i)) goStep(step + 1, 'left')
      return
    }

    if (type === 'hours') {
      const i = pharmacyIndex(step)
      if (validateHours(i)) goStep(step + 1, 'left')
    }
  }

  const handleBack = () => goStep(step - 1, 'right')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validatePlan()) return

    setLoading(true)
    setError('')

    const payload = {
      name: form.name,
      email: form.email,
      phone: `${form.countryCode}${form.phone}`,
      password: form.password,
      password_confirmation: form.password_confirmation,
      role: 'owner',
      country: form.country,
      subscription_plan_id: form.subscription_plan_id,
      pharmacies: pharmacies.map((p) => ({
        pharmacy_name: p.pharmacy_name,
        pharmacy_type: p.pharmacy_type,
        license_number: p.license_number || null,
        license_expiry: p.license_expiry || null,
        country: p.country || form.country,
        region: p.region,
        district: p.district,
        ward: p.ward || null,
        street: p.street || null,
        latitude: p.latitude,
        longitude: p.longitude,
        opening_capital: p.opening_capital || 0,
        working_days: p.working_days,
        working_hours: { open: p.opening_time, close: p.closing_time },
        description: p.description || null,
      })),
    }

    try {
      await register(payload)
      navigate('/pending-approval')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"

  const stepLabel = () => {
    if (step === 1) return 'Tell us about yourself'
    if (step === totalSteps) return 'Choose your subscription plan'
    const i = pharmacyIndex(step)
    const type = stepType(step)
    if (type === 'details') return multiple ? `Branch ${i + 1} — pharmacy details & address` : 'Pharmacy information & address'
    if (type === 'location') return multiple ? `Branch ${i + 1} — pin it on the map` : 'Pin your pharmacy on the map'
    return multiple ? `Branch ${i + 1} — working hours` : 'Working hours'
  }

  const pharm = (i) => pharmacies[i] || blankPharmacy(form.country)

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 auth-page">
      <div className="w-full max-w-2xl">
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
            {multiple ? `Pharmacy Registration — ${pharmacies.length} Branches` : 'Pharmacy Registration'}
          </p>
          <h1 className="text-4xl font-black text-gray-600 mb-3">Set Up Your Pharmacy</h1>
          <p className="text-gray-500 text-lg">{stepLabel()}</p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {multiple ? (
              <>
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                  <div key={s} className={`h-1.5 rounded-full transition-all ${step >= s ? 'bg-[#0FD452] w-5' : 'bg-gray-200 w-3'}`} />
                ))}
                <span className="text-xs font-bold text-gray-400 ml-1">{step}/{totalSteps}</span>
              </>
            ) : (
              Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#0FD452] text-[#000F14]' : 'bg-gray-200 text-gray-400'}`}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < totalSteps && <div className={`w-4 h-0.5 ${step > s ? 'bg-[#0FD452]' : 'bg-gray-200'}`}></div>}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext() }}>
          {/* Step 1 - Personal Information */}
          {step === 1 && (
            <div key={`step1-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} className={`${inputClasses} ${errors.name ? 'border-red-400' : ''}`} placeholder="Enter your full name" />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className={`${inputClasses} ${errors.email ? 'border-red-400' : ''}`} placeholder="email@example.com" />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone Number</label>
                  <div className="flex gap-2">
                    <select value={form.countryCode} onChange={(e) => updateForm('countryCode', e.target.value)} className="w-32 px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white">
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                      ))}
                    </select>
                    <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="712 345 678" />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => updateForm('password', e.target.value)} className={`${inputClasses} pr-11 ${errors.password ? 'border-red-400' : ''}`} placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type={showConfirmPassword ? 'text' : 'password'} value={form.password_confirmation} onChange={(e) => updateForm('password_confirmation', e.target.value)} className={`${inputClasses} ${errors.password_confirmation ? 'border-red-400' : ''}`} placeholder="Re-enter password" />
                  </div>
                  {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Pharmacy detail steps (repeated per branch) */}
          {step > 1 && step < totalSteps && (() => {
            const i = pharmacyIndex(step)
            const type = stepType(step)
            const p = pharm(i)

            if (type === 'details') {
              return (
                <div key={`step-details-${i}-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
                  {multiple && (
                    <div className="flex items-center justify-between bg-[#0FD452]/5 border border-[#0FD452]/20 rounded-xl px-4 py-2.5">
                      <p className="text-sm font-bold text-gray-700">Branch {i + 1} of {pharmacies.length}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { addPharmacy(); goStep(3 * pharmacies.length + 2, 'left') }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#0FD452] hover:text-[#0cb843]"
                        >
                          <Plus className="w-4 h-4" /> Add Branch
                        </button>
                        {pharmacies.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePharmacy(i)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Pharmacy Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Store className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="text" value={p.pharmacy_name} onChange={(e) => updatePharmacy(i, 'pharmacy_name', e.target.value)} className={`${inputClasses} ${errors[`p${i}_pharmacy_name`] ? 'border-red-400' : ''}`} placeholder="e.g. Helix Central Pharmacy" />
                    </div>
                    {errors[`p${i}_pharmacy_name`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_pharmacy_name`]}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Pharmacy Type</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Building2 className="w-5 h-5 text-gray-400" />
                        </div>
                        <select value={p.pharmacy_type} onChange={(e) => updatePharmacy(i, 'pharmacy_type', e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
                          {pharmacyTypes.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Country</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <MapPin className="w-5 h-5 text-gray-400" />
                        </div>
                        <select value={p.country} onChange={(e) => updatePharmacy(i, 'country', e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Region / State</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <MapPin className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" value={p.region} onChange={(e) => updatePharmacy(i, 'region', e.target.value)} className={`${inputClasses} ${errors[`p${i}_region`] ? 'border-red-400' : ''}`} placeholder="e.g. Dar es Salaam" />
                      </div>
                      {errors[`p${i}_region`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_region`]}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">District / City</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <MapPin className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" value={p.district} onChange={(e) => updatePharmacy(i, 'district', e.target.value)} className={`${inputClasses} ${errors[`p${i}_district`] ? 'border-red-400' : ''}`} placeholder="e.g. Kinondoni" />
                      </div>
                      {errors[`p${i}_district`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_district`]}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Ward</label>
                      <input type="text" value={p.ward} onChange={(e) => updatePharmacy(i, 'ward', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="e.g. Mikocheni" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Street</label>
                      <input type="text" value={p.street} onChange={(e) => updatePharmacy(i, 'street', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="e.g. Bagamoyo Road" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">License Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="text" value={p.license_number} onChange={(e) => updatePharmacy(i, 'license_number', e.target.value)} className={inputClasses} placeholder="e.g. TMD-12345" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">License Expiry</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="date" value={p.license_expiry} onChange={(e) => updatePharmacy(i, 'license_expiry', e.target.value)} className={inputClasses} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Opening Capital (TZS)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="number" value={p.opening_capital} onChange={(e) => updatePharmacy(i, 'opening_capital', e.target.value)} className={inputClasses} placeholder="e.g. 5000000" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Pharmacy Description</label>
                    <div className="relative">
                      <div className="absolute top-3 left-3.5 pointer-events-none">
                        <Info className="w-5 h-5 text-gray-400" />
                      </div>
                      <textarea value={p.description} onChange={(e) => updatePharmacy(i, 'description', e.target.value)} rows={3} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] resize-none" placeholder="Brief description of this pharmacy..." />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={handleBack} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                      <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</span>
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                      Continue →
                    </button>
                  </div>
                </div>
              )
            }

            if (type === 'location') {
              return (
                <div key={`step-location-${i}-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
                    <p className="text-blue-700 text-sm font-medium">{multiple ? `Set the location for ${p.pharmacy_name || `Branch ${i + 1}`}` : 'Why is location important?'}</p>
                    <p className="text-blue-600 text-xs mt-1">Customers discover pharmacies near them on the Helix app. Accurate location helps patients find your pharmacy quickly.</p>
                  </div>

                  <LocationMap
                    latitude={p.latitude}
                    longitude={p.longitude}
                    onChange={(lat, lng) => {
                      updatePharmacy(i, 'latitude', lat)
                      updatePharmacy(i, 'longitude', lng)
                    }}
                  />
                  {errors[`p${i}_location`] && <p className="text-red-500 text-xs">{errors[`p${i}_location`]}</p>}

                  <div className="flex gap-3">
                    <button type="button" onClick={handleBack} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                      <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</span>
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                      Continue →
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={`step-hours-${i}-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {workingDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(i, day)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          p.working_days.includes(day)
                            ? 'bg-[#0FD452] text-[#000F14]'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 hover:border-[#0FD452]/50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {errors[`p${i}_working_days`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_working_days`]}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Opening Time</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="time" value={p.opening_time} onChange={(e) => updatePharmacy(i, 'opening_time', e.target.value)} className={inputClasses} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Closing Time</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="time" value={p.closing_time} onChange={(e) => updatePharmacy(i, 'closing_time', e.target.value)} className={inputClasses} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handleBack} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                    <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</span>
                  </button>
                  <button type="submit" className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                    Continue →
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Step 5 - Subscription Plan + Summary */}
          {step === totalSteps && (
            <div key={`step-plan-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-700 text-sm font-medium">Choose Your Plan</p>
                <p className="text-blue-600 text-xs mt-1">Select a subscription plan. You'll get a 7-day free trial while your application is reviewed. After approval and payment confirmation, your subscription begins.</p>
              </div>

              <div className="grid gap-4">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => updateForm('subscription_plan_id', plan.id)}
                    className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      form.subscription_plan_id === plan.id
                        ? 'border-[#0FD452] bg-[#0FD452]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#0FD452]/50 hover:shadow-sm'
                    }`}
                  >
                    {form.subscription_plan_id === plan.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-[#0FD452] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#000F14]" />
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-[#0FD452]" />
                          <h4 className="font-bold text-gray-900">{plan.name}</h4>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                        {plan.features && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {plan.features.slice(0, 4).map((f, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                            ))}
                            {plan.features.length > 4 && (
                              <span className="text-[10px] text-gray-400">+{plan.features.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-xl font-black text-[#000F14]">TZS {Number(plan.price).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.subscription_plan_id && <p className="text-red-500 text-xs">{errors.subscription_plan_id}</p>}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Registration Summary</h4>
                  <button
                    type="button"
                    onClick={() => { addPharmacy(); goStep(3 * pharmacies.length + 2, 'left') }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0FD452] hover:text-[#0cb843]"
                  >
                    <Plus className="w-4 h-4" /> Add Another Pharmacy
                  </button>
                </div>
                <div className="space-y-2">
                  {pharmacies.map((p, i) => (
                    <div key={`summary-${i}`} className="flex items-start justify-between bg-white border border-gray-200 rounded-xl p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {multiple && <span className="text-[10px] font-bold bg-[#0FD452]/10 text-[#0FD452] px-2 py-0.5 rounded-full shrink-0">Branch {i + 1}</span>}
                          <p className="font-semibold text-gray-800 text-sm truncate">{p.pharmacy_name || 'Unnamed pharmacy'}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[p.ward, p.district, p.region].filter(Boolean).join(', ') || '—'} · {p.opening_time} — {p.closing_time} ({p.working_days.length} days)
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => goStep(3 * i + 2, 'left')}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0FD452] hover:bg-[#0FD452]/5 transition-colors"
                          title="Edit branch"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {pharmacies.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePharmacy(i)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove branch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  <p><span className="font-medium text-gray-600">Owner:</span> {form.name || '—'}</p>
                  {form.subscription_plan_id && (
                    <p><span className="font-medium text-gray-600">Plan:</span> {plans.find(p => p.id === form.subscription_plan_id)?.name} — TZS {Number(plans.find(p => p.id === form.subscription_plan_id)?.price || 0).toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleBack} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                  <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</span>
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Application'
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
