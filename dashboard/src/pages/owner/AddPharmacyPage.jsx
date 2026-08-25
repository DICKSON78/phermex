import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
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
  Navigation,
  Crosshair,
} from 'lucide-react'

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
      const container = document.getElementById('add-pharmacy-map')
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

      const detectBtn = document.getElementById('add-detect-location-btn')
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
        const container = document.getElementById('add-pharmacy-map')
        if (container) container._leaflet_id = null
      }
    }
  }, [mapReady, latitude, longitude, onChange])

  return (
    <div className="space-y-3">
      <div id="add-pharmacy-map" className="w-full h-72 rounded-xl border border-gray-200 overflow-hidden z-0" />
      {latitude && longitude && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Navigation className="w-4 h-4 text-[#0FD452]" />
          <span className="font-mono">{latitude}, {longitude}</span>
        </div>
      )}
      <button type="button" id="add-detect-location-btn" onClick={() => navigator.geolocation?.getCurrentPosition(
        (pos) => onChange(parseFloat(pos.coords.latitude.toFixed(7)), parseFloat(pos.coords.longitude.toFixed(7))),
        () => {},
        { enableHighAccuracy: true }
      )} className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#0FD452] text-[#0FD452] rounded-xl text-sm font-semibold hover:bg-[#0FD452]/5 transition-all">
        <Crosshair className="w-4 h-4" />
        Detect My Current Location
      </button>
      <p className="text-xs text-gray-400 text-center">Click on the map to set your pharmacy location, or use detect above.</p>
    </div>
  )
}

export default function AddPharmacyPage() {
  const navigate = useNavigate()
  const { user, switchPharmacy } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [plans, setPlans] = useState([])

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
    if (!form.pharmacy_name.trim()) errs.pharmacy_name = 'Pharmacy name is required'
    if (!form.region.trim()) errs.region = 'Region is required'
    if (!form.district.trim()) errs.district = 'District is required'
    if (form.latitude === null || form.longitude === null) errs.location = 'Please pick this pharmacy\'s location on the map'
    if (form.working_days.length === 0) errs.working_days = 'Select at least one working day'
    if (!form.subscription_plan_id) errs.subscription_plan_id = 'Please select a subscription plan'
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

      setSuccess(res.data?.message || 'Pharmacy created successfully.')

      if (pharmacy?.id) {
        try {
          await switchPharmacy(pharmacy.id)
        } catch (swErr) {
          // Switcher may not be available if the branch is still pending; ignore.
        }
      }

      setTimeout(() => navigate('/dashboard/settings'), 1600)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create pharmacy. Please try again.')
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/dashboard/settings')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>

        <div className="mb-8">
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-2">Add A Pharmacy</p>
          <h1 className="text-3xl font-black text-gray-800">Add a New Branch</h1>
          <p className="text-gray-500 mt-1">Register another pharmacy under your account. It will be submitted for approval.</p>
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
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Pharmacy Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Store className="w-5 h-5 text-gray-400" />
              </div>
              <input type="text" value={form.pharmacy_name} onChange={(e) => updateForm('pharmacy_name', e.target.value)} className={`${inputClasses} ${errors.pharmacy_name ? 'border-red-400' : ''}`} placeholder="e.g. Pharmex Branch - Mikocheni" />
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

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">License Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <input type="text" value={form.license_number} onChange={(e) => updateForm('license_number', e.target.value)} className={inputClasses} placeholder="e.g. TMD-12345" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">License Expiry</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <input type="date" value={form.license_expiry} onChange={(e) => updateForm('license_expiry', e.target.value)} className={inputClasses} />
              </div>
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

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Pharmacy Description</label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none">
                <Info className="w-5 h-5 text-gray-400" />
              </div>
              <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] resize-none" placeholder="Brief description of this pharmacy..." />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-700 text-sm font-medium">Set the location</p>
            <p className="text-blue-600 text-xs mt-1 mb-3">Customers discover pharmacies near them on the Pharmex app. Accurate location helps patients find your pharmacy quickly.</p>
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

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Subscription Plan</label>
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
                <p className="text-sm text-gray-400">Loading plans...</p>
              )}
            </div>
            {errors.subscription_plan_id && <p className="text-red-500 text-xs mt-1">{errors.subscription_plan_id}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Pharmacy...
              </span>
            ) : (
              'Create Pharmacy'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
