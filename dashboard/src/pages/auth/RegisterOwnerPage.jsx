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
  Zap,
  Star,
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

export default function RegisterOwnerPage() {
  const [step, setStep] = useState(1)
  const [stepDir, setStepDir] = useState('left')
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [plans, setPlans] = useState([])
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/subscriptions/plans').then((res) => {
      setPlans(res.data?.data || res.data || [])
    }).catch(() => {})
  }, [])

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+255',
    password: '',
    password_confirmation: '',
    pharmacy_name: '',
    pharmacy_type: 'independent',
    license_number: '',
    license_expiry: '',
    country: 'Tanzania',
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
    subscription_plan_id: null,
  })

  const [errors, setErrors] = useState({})

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const goStep = (s, dir) => {
    setStepDir(dir)
    setStep(s)
    setAnimKey((k) => k + 1)
  }

  const toggleWorkingDay = (day) => {
    const days = form.working_days.includes(day)
      ? form.working_days.filter((d) => d !== day)
      : [...form.working_days, day]
    updateForm('working_days', days)
  }

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    const errs = {}
    if (!form.pharmacy_name.trim()) errs.pharmacy_name = 'Pharmacy name is required'
    if (!form.region.trim()) errs.region = 'Region is required'
    if (!form.district.trim()) errs.district = 'District is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep3 = () => {
    const errs = {}
    if (form.latitude === null || form.longitude === null) errs.location = 'Please pick your pharmacy location on the map'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep4 = () => {
    const errs = {}
    if (form.working_days.length === 0) errs.working_days = 'Select at least one working day'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep5 = () => {
    const errs = {}
    if (!form.subscription_plan_id) errs.subscription_plan_id = 'Please select a subscription plan'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) goStep(2, 'left')
    else if (step === 2 && validateStep2()) goStep(3, 'left')
    else if (step === 3 && validateStep3()) goStep(4, 'left')
    else if (step === 4 && validateStep4()) goStep(5, 'left')
  }

  const handleBack = () => goStep(step - 1, 'right')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep5()) return

    setLoading(true)
    setError('')

    try {
      await register({
        ...form,
        phone: `${form.countryCode}${form.phone}`,
        working_hours: { open: form.opening_time, close: form.closing_time },
        role: 'owner',
      })
      navigate('/pending-approval')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 auth-page">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/register" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-xl font-bold text-gray-600">PHARMEX</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">Pharmacy Registration</p>
          <h1 className="text-4xl font-black text-gray-600 mb-3">Set Up Your Pharmacy</h1>
          {step === 1 && <p className="text-gray-500 text-lg">Tell us about yourself</p>}
          {step === 2 && <p className="text-gray-500 text-lg">Pharmacy information & address</p>}
          {step === 3 && <p className="text-gray-500 text-lg">Pin your pharmacy on the map</p>}
          {step === 4 && <p className="text-gray-500 text-lg">Working hours</p>}
          {step === 5 && <p className="text-gray-500 text-lg">Choose your subscription plan</p>}

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#0FD452] text-[#000F14]' : 'bg-gray-200 text-gray-400'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 5 && <div className={`w-4 h-0.5 ${step > s ? 'bg-[#0FD452]' : 'bg-gray-200'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext() }}>
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

          {/* Step 2 - Pharmacy Details + Address */}
          {step === 2 && (
            <div key={`step2-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Pharmacy Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Store className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="text" value={form.pharmacy_name} onChange={(e) => updateForm('pharmacy_name', e.target.value)} className={`${inputClasses} ${errors.pharmacy_name ? 'border-red-400' : ''}`} placeholder="e.g. Pharmex Central Pharmacy" />
                </div>
                {errors.pharmacy_name && <p className="text-red-500 text-xs mt-1">{errors.pharmacy_name}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Pharmacy Type</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <select value={form.pharmacy_type} onChange={(e) => updateForm('pharmacy_type', e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
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
                    <select value={form.country} onChange={(e) => updateForm('country', e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
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
                    <input type="text" value={form.region} onChange={(e) => updateForm('region', e.target.value)} className={`${inputClasses} ${errors.region ? 'border-red-400' : ''}`} placeholder="e.g. Dar es Salaam" />
                  </div>
                  {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">District / City</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="text" value={form.district} onChange={(e) => updateForm('district', e.target.value)} className={`${inputClasses} ${errors.district ? 'border-red-400' : ''}`} placeholder="e.g. Kinondoni" />
                  </div>
                  {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Ward</label>
                  <input type="text" value={form.ward} onChange={(e) => updateForm('ward', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="e.g. Mikocheni" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Street</label>
                  <input type="text" value={form.street} onChange={(e) => updateForm('street', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="e.g. Bagamoyo Road" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">License Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="text" value={form.license_number} onChange={(e) => updateForm('license_number', e.target.value)} className={inputClasses} placeholder="e.g. TMD-12345" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">License Expiry</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="date" value={form.license_expiry} onChange={(e) => updateForm('license_expiry', e.target.value)} className={inputClasses} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Opening Capital (TZS)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="number" value={form.opening_capital} onChange={(e) => updateForm('opening_capital', e.target.value)} className={inputClasses} placeholder="e.g. 5000000" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Pharmacy Description</label>
                <div className="relative">
                  <div className="absolute top-3 left-3.5 pointer-events-none">
                    <Info className="w-5 h-5 text-gray-400" />
                  </div>
                  <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] resize-none" placeholder="Brief description of your pharmacy..." />
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
          )}

          {/* Step 3 - Location on Map */}
          {step === 3 && (
            <div key={`step3-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
                <p className="text-blue-700 text-sm font-medium">Why is location important?</p>
                <p className="text-blue-600 text-xs mt-1">Customers discover pharmacies near them on the Pharmex app. Accurate location helps patients find your pharmacy quickly.</p>
              </div>

              <LocationMap
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => {
                  updateForm('latitude', lat)
                  updateForm('longitude', lng)
                }}
              />
              {errors.location && <p className="text-red-500 text-xs">{errors.location}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={handleBack} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                  <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</span>
                </button>
                <button type="submit" className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4 - Schedule */}
          {step === 4 && (
            <div key={`step4-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {workingDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        form.working_days.includes(day)
                          ? 'bg-[#0FD452] text-[#000F14]'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 hover:border-[#0FD452]/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {errors.working_days && <p className="text-red-500 text-xs mt-1">{errors.working_days}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Opening Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="time" value={form.opening_time} onChange={(e) => updateForm('opening_time', e.target.value)} className={inputClasses} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Closing Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="time" value={form.closing_time} onChange={(e) => updateForm('closing_time', e.target.value)} className={inputClasses} />
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
          )}

          {/* Step 5 - Subscription Plan */}
          {step === 5 && (
            <div key={`step5-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
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
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Registration Summary</h4>
                <div className="space-y-1 text-sm text-gray-500">
                  <p><span className="font-medium text-gray-600">Pharmacy:</span> {form.pharmacy_name || '—'}</p>
                  <p><span className="font-medium text-gray-600">Address:</span> {[form.ward, form.district, form.region].filter(Boolean).join(', ') || '—'}</p>
                  <p><span className="font-medium text-gray-600">Hours:</span> {form.opening_time} — {form.closing_time} ({form.working_days.length} days)</p>
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
