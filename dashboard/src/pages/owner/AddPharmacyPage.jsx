import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { canAddPharmacy } from '../../utils/planConfig'
import api from '../../services/api'
import {
  Store,
  Building2,
  MapPin,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Info,
  Loader2,
  ArrowLeft,
  Check,
  Lock,
  Navigation,
  Crosshair,
} from 'lucide-react'

const pharmacyTypes = [
  { value: 'independent', label: 'supply.addPharmacy.types.independent' },
  { value: 'chain', label: 'supply.addPharmacy.types.chain' },
  { value: 'hospital', label: 'supply.addPharmacy.types.hospital' },
  { value: 'online', label: 'supply.addPharmacy.types.online' },
]

const workingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DEFAULT_CENTER = [-6.7924, 39.2083]

function LocationMap({ latitude, longitude, onChange }) {
  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const { t } = useLanguage()

  // Same defect as the registration map: the button had both a JSX onClick
  // that only set the form value and an imperative onclick in an effect that
  // moved the map. React's own handler ran first, so the map never moved.
  const mapRef = React.useRef(null)
  const markerRef = React.useRef(null)
  const leafletRef = React.useRef(null)

  // Leaflet arrives through a dynamic import, so detection usually finishes
  // before the map exists. The position waits here for the map to be built.
  const pendingLocationRef = React.useRef(null)

  const handleDetectLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('supply.addPharmacy.geoUnsupported'))
      return
    }

    setLocating(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(7))
        const lng = parseFloat(pos.coords.longitude.toFixed(7))

        setLocating(false)

        const map = mapRef.current
        const L = leafletRef.current

        if (map && L) {
          map.setView([lat, lng], 16)
          if (markerRef.current) markerRef.current.remove()
          markerRef.current = L.marker([lat, lng]).addTo(map)
        } else {
          pendingLocationRef.current = [lat, lng]
        }

        onChange(lat, lng)
      },
      (err) => {
        setLocating(false)
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? t('supply.addPharmacy.geoBlocked')
            : t('supply.addPharmacy.geoFailed')
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [onChange])

  React.useEffect(() => {
    handleDetectLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (mapReady || typeof window === 'undefined') return
    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      leafletRef.current = L
      setMapReady(true)
    })
  }, [mapReady])

  React.useEffect(() => {
    if (!mapReady || typeof window === 'undefined') return

    const container = document.getElementById('add-pharmacy-map')
    if (!container || container._leaflet_id) return

    const L = leafletRef.current

    const pending = pendingLocationRef.current
    const restored = latitude && longitude ? [latitude, longitude] : null
    const center = pending || restored || DEFAULT_CENTER
    const zoom = pending || restored ? 16 : 13

    const map = L.map(container).setView(center, zoom)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    if (pending || restored) {
      markerRef.current = L.marker(center).addTo(map)
    }

    pendingLocationRef.current = null

    map.on('click', (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(7))
      const lng = parseFloat(e.latlng.lng.toFixed(7))
      if (markerRef.current) markerRef.current.remove()
      markerRef.current = L.marker([lat, lng]).addTo(map)
      onChange(lat, lng)
    })

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      const el = document.getElementById('add-pharmacy-map')
      if (el) el._leaflet_id = null
    }
  }, [mapReady, onChange])

  return (
    <div className="space-y-3">
      <div id="add-pharmacy-map" className="w-full h-72 rounded-xl border border-gray-200 overflow-hidden z-0" />
      {latitude && longitude && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Navigation className="w-4 h-4 text-[#0FD452]" />
          <span className="font-mono">{latitude}, {longitude}</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleDetectLocation}
        disabled={locating}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#0FD452] text-[#0FD452] rounded-xl text-sm font-semibold hover:bg-[#0FD452]/5 transition-all disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Crosshair className="w-4 h-4" />
        )}
        {locating ? t('supply.addPharmacy.detecting') : t('supply.addPharmacy.detectLocation')}
      </button>
      {locationError && (
        <p className="text-xs text-amber-600 text-center">{locationError}</p>
      )}
      <p className="text-xs text-gray-400 text-center">{t('supply.addPharmacy.mapHint')}</p>
    </div>
  )
}

export default function AddPharmacyPage() {
  const navigate = useNavigate()
  const { user, switchPharmacy } = useAuth()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [plans, setPlans] = useState([])
  // The package in force decides whether a pharmacy may be added at all. A
  // free trial runs on one pharmacy, so it says no until a package is paid for.
  const [subscription, setSubscription] = useState(null)
  const [checkingPlan, setCheckingPlan] = useState(true)

  const currentPharmacy = user?.current_pharmacy ?? user?.currentPharmacy
    ?? (Array.isArray(user?.accessible_pharmacies) ? user.accessible_pharmacies[0] : null)
    ?? (Array.isArray(user?.pharmacy) ? user.pharmacy[0] : null)

  const [form, setForm] = useState({
    pharmacy_name: '',
    pharmacy_type: 'independent',
    license_number: '',
    license_expiry: '',
    country: currentPharmacy?.country || 'Tanzania',
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
    subscription_plan_id: currentPharmacy?.subscription_plan_id || null,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!plans.length) {
      api.get('/subscriptions/plans').then((res) => {
        setPlans(res.data?.data || res.data || [])
      }).catch(() => {})
    }
  }, [plans.length])

  useEffect(() => {
    api.get('/subscriptions/status')
      .then((res) => setSubscription(res.data))
      .catch(() => setSubscription(null))
      .finally(() => setCheckingPlan(false))
  }, [])

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const toggleWorkingDay = (day) => {
    const days = form.working_days.includes(day)
      ? form.working_days.filter((d) => d !== day)
      : [...form.working_days, day]
    updateForm('working_days', days)
  }

  const validate = () => {
    const errs = {}
    if (!form.pharmacy_name.trim()) errs.pharmacy_name = t('supply.addPharmacy.nameRequired')
    if (!form.region.trim()) errs.region = t('supply.addPharmacy.regionRequired')
    if (!form.district.trim()) errs.district = t('supply.addPharmacy.districtRequired')
    if (form.latitude === null || form.longitude === null) errs.location = t('supply.addPharmacy.locationRequired')
    if (form.working_days.length === 0) errs.working_days = t('supply.addPharmacy.daysRequired')
    if (!form.subscription_plan_id) errs.subscription_plan_id = t('supply.addPharmacy.planRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await api.post('/pharmacies', {
        pharmacy_name: form.pharmacy_name,
        pharmacy_type: form.pharmacy_type,
        license_number: form.license_number || null,
        license_expiry: form.license_expiry || null,
        country: form.country,
        region: form.region,
        district: form.district,
        ward: form.ward || null,
        street: form.street || null,
        latitude: form.latitude,
        longitude: form.longitude,
        opening_capital: form.opening_capital || 0,
        working_days: form.working_days,
        working_hours: { open: form.opening_time, close: form.closing_time },
        description: form.description || null,
        subscription_plan_id: form.subscription_plan_id,
      })
      const pharmacy = res.data?.pharmacy || res.data?.data

      setSuccess(res.data?.message || t('supply.addPharmacy.created'))

      if (pharmacy?.id) {
        try {
          await switchPharmacy(pharmacy.id)
        } catch (swErr) {
          // Switcher may not be available if the branch is still pending; ignore.
        }
      }

      setTimeout(() => navigate('/dashboard/settings'), 1600)
    } catch (err) {
      setError(err.response?.data?.message || t('supply.addPharmacy.createFailed'))
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"

  if (checkingPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  // A trial cannot add a pharmacy. Say so plainly instead of letting the
  // owner fill in the whole form only to be refused at the end.
  if (!canAddPharmacy(subscription)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">
            {t('subscription.trialNoAddPharmacy')}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {t('subscription.choosePackageToAddPharmacy')}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              {t('supply.addPharmacy.backToSettings')}
            </button>
            <button
              onClick={() => navigate('/subscribe')}
              className="px-5 py-3 bg-[#0FD452] text-[#000F14] rounded-xl text-sm font-bold hover:bg-[#0cb843] transition-all active:scale-95"
            >
              {t('subscription.choosePlan')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/dashboard/settings')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> {t('supply.addPharmacy.backToSettings')}
        </button>

        <div className="mb-8">
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-2">{t('supply.addPharmacy.eyebrow')}</p>
          <h1 className="text-3xl font-black text-gray-800">{t('supply.addPharmacy.title')}</h1>
          <p className="text-gray-500 mt-1">{t('supply.addPharmacy.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.pharmacyName')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Store className="w-5 h-5 text-gray-400" />
              </div>
              <input type="text" value={form.pharmacy_name} onChange={(e) => updateForm('pharmacy_name', e.target.value)} className={`${inputClasses} ${errors.pharmacy_name ? 'border-red-400' : ''}`} placeholder={t('supply.addPharmacy.namePlaceholder')} />
            </div>
            {errors.pharmacy_name && <p className="text-red-500 text-xs mt-1">{errors.pharmacy_name}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.pharmacyType')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>
                <select value={form.pharmacy_type} onChange={(e) => updateForm('pharmacy_type', e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
                  {pharmacyTypes.map((pt) => (
                    <option key={pt.value} value={pt.value}>{t(pt.label)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.country')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <select value={form.country} onChange={(e) => updateForm('country', e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
                  <option value="Tanzania">🇹🇿 Tanzania</option>
                  <option value="Kenya">🇰🇪 Kenya</option>
                  <option value="Uganda">🇺🇬 Uganda</option>
                  <option value="Rwanda">🇷🇼 Rwanda</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.region')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <input type="text" value={form.region} onChange={(e) => updateForm('region', e.target.value)} className={`${inputClasses} ${errors.region ? 'border-red-400' : ''}`} placeholder={t('supply.addPharmacy.regionPlaceholder')} />
              </div>
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.district')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <input type="text" value={form.district} onChange={(e) => updateForm('district', e.target.value)} className={`${inputClasses} ${errors.district ? 'border-red-400' : ''}`} placeholder={t('supply.addPharmacy.districtPlaceholder')} />
              </div>
              {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.ward')}</label>
              <input type="text" value={form.ward} onChange={(e) => updateForm('ward', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder={t('supply.addPharmacy.wardPlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.street')}</label>
              <input type="text" value={form.street} onChange={(e) => updateForm('street', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder={t('supply.addPharmacy.streetPlaceholder')} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.licenseNumber')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <input type="text" value={form.license_number} onChange={(e) => updateForm('license_number', e.target.value)} className={inputClasses} placeholder={t('supply.addPharmacy.licensePlaceholder')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.licenseExpiry')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <input type="date" value={form.license_expiry} onChange={(e) => updateForm('license_expiry', e.target.value)} className={inputClasses} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.openingCapital')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input type="number" value={form.opening_capital} onChange={(e) => updateForm('opening_capital', e.target.value)} className={inputClasses} placeholder={t('supply.addPharmacy.capitalPlaceholder')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.descriptionLabel')}</label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none">
                <Info className="w-5 h-5 text-gray-400" />
              </div>
              <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] resize-none" placeholder={t('supply.addPharmacy.descriptionPlaceholder')} />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-700 text-sm font-medium">{t('supply.addPharmacy.setLocation')}</p>
            <p className="text-blue-600 text-xs mt-1 mb-3">{t('supply.addPharmacy.locationInfo')}</p>
            <LocationMap
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => {
                updateForm('latitude', lat)
                updateForm('longitude', lng)
              }}
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">{t('supply.addPharmacy.workingDays')}</label>
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
                  {t(`supply.addPharmacy.days.${day}`)}
                </button>
              ))}
            </div>
            {errors.working_days && <p className="text-red-500 text-xs mt-1">{errors.working_days}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.openingTime')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <input type="time" value={form.opening_time} onChange={(e) => updateForm('opening_time', e.target.value)} className={inputClasses} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.closingTime')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <input type="time" value={form.closing_time} onChange={(e) => updateForm('closing_time', e.target.value)} className={inputClasses} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('supply.addPharmacy.subscriptionPlan')}</label>
            <div className="grid gap-2">
              {plans.length > 0 ? plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => updateForm('subscription_plan_id', plan.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    form.subscription_plan_id === plan.id
                      ? 'border-[#0FD452] bg-[#0FD452]/5'
                      : 'border-gray-200 hover:border-[#0FD452]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{plan.name}</h4>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                    </div>
                    <p className="text-sm font-black text-[#000F14] ml-3 shrink-0">TZS {Number(plan.price).toLocaleString()}</p>
                  </div>
                </button>
              )) : (
                <p className="text-sm text-gray-400">{t('supply.addPharmacy.loadingPlans')}</p>
              )}
            </div>
            {errors.subscription_plan_id && <p className="text-red-500 text-xs mt-1">{errors.subscription_plan_id}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('supply.addPharmacy.creating')}
              </span>
            ) : (
              t('supply.addPharmacy.create')
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
