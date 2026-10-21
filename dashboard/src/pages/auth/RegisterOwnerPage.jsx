import React, { useState, useCallback, useEffect, useRef } from 'react'
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
  ChevronDown,
  ImageUp,
} from 'lucide-react'
import { TANZANIA_REGIONS } from '../../data/tanzaniaLocations'
import { useCurrency, tzsFromUsd } from '../../utils/currency'
import { useLanguage } from '../../contexts/LanguageContext'

// Required fields are marked with this. The browser's own required attribute
// cannot be used: validation runs per step so the wizard can advance, and these
// are the fields it actually insists on.
const Required = () => <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>

/**
 * A live requirement checklist under a password field.
 *
 * The old form only complained after the owner pressed Continue, and the
 * message ("Password must contain at least one letter and one number") said
 * nothing about which half was missing. Each rule now shows its own tick as
 * soon as it is satisfied, so the owner can see what is still outstanding
 * while typing.
 */
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

const findRegion = (name) => TANZANIA_REGIONS.find((r) => r.name === name)

const districtsFor = (region) => findRegion(region)?.districts.map((d) => d.name) ?? []

const wardsFor = (region, district) =>
  findRegion(region)?.districts.find((d) => d.name === district)?.wards ?? []

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
]

// Every country Helix registers accepts a nine digit subscriber number, or ten
// when it keeps the leading zero. Anything longer is a typo, not a number.
const PHONE_MIN = 9
const PHONE_MAX = 10

/**
 * Strips the separators people paste in from a phone number and returns the
 * digits. Returns null when what is left is not a number at all.
 */
function phoneDigits(value) {
  return String(value ?? '').replace(/[\s()\-.]/g, '')
}

function isValidPhone(value) {
  const digits = phoneDigits(value)
  return new RegExp(`^[0-9]{${PHONE_MIN},${PHONE_MAX}}$`).test(digits)
}

// Deliberately stricter than the old /\S+@\S+\.\S+/, which accepted things
// like "a@b.c" and "@host.com" and let a mistyped address reach the mailer.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/

/** Rejects the shapes that pass a naive check but no mail server accepts. */
function hasValidEmailShape(value) {
  const email = String(value ?? '').trim()
  if (!EMAIL_RE.test(email)) return false
  const domain = email.split('@')[1]
  if (domain.includes('..')) return false
  if (email.includes('..')) return false
  return true
}

function isValidEmail(value) {
  return hasValidEmailShape(value)
}

function isFutureDate(value) {
  if (!value) return true
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() > Date.now()
}

const pharmacyTypes = [
  { value: 'independent', label: 'Independent' },
  { value: 'chain', label: 'Chain' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'online', label: 'Online' },
]

const workingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DEFAULT_CENTER = [-6.7924, 39.2083]

function LocationMap({ latitude, longitude, onChange }) {
  const { t } = useLanguage()
  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  // The map and marker are created once and kept in refs. The old code reached
  // for them through an effect keyed on latitude/longitude and a getElementById
  // button, which meant the detect click had no map to move: the JSX onClick
  // updated the form and that re-ran the effect before it could.
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const leafletRef = useRef(null)

  // Leaflet is loaded with a dynamic import, so the map usually does not exist
  // yet when the automatic detection on mount resolves. Without somewhere to
  // park the answer, that callback had no map to move and the view stayed on
  // the Dar es Salaam default. The position waits here until the map is built.
  const pendingLocationRef = useRef(null)

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('authPages.registerOwner.browserNoGeo'))
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

        // Move the map and drop the marker where we actually are, then report
        // it up to the form. Both halves were missing before.
        if (map && L) {
          map.setView([lat, lng], 16)
          if (markerRef.current) markerRef.current.remove()
          markerRef.current = L.marker([lat, lng]).addTo(map)
        } else {
          // The map has not finished loading. Remember the position so the
          // effect that builds it can centre on us instead of the default.
          pendingLocationRef.current = [lat, lng]
        }

        onChange(lat, lng)
      },
      (err) => {
        setLocating(false)
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? t('authPages.registerOwner.locationBlocked')
            : t('authPages.registerOwner.locationFailed')
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [onChange, t])

  // Ask once on mount: a pharmacy owner registering at the premises should not
  // have to tap anything.
  useEffect(() => {
    handleDetectLocation()
    // Intentionally runs once; re-running would re-prompt on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMapClick = useCallback((e) => {
    const lat = parseFloat(e.latlng.lat.toFixed(7))
    const lng = parseFloat(e.latlng.lng.toFixed(7))

    if (markerRef.current) markerRef.current.remove()
    markerRef.current = leafletRef.current
      ? leafletRef.current.marker([lat, lng]).addTo(mapRef.current)
      : null

    onChange(lat, lng)
  }, [onChange])

  useEffect(() => {
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

  useEffect(() => {
    if (!mapReady || typeof window === 'undefined') return
    const container = document.getElementById('pharmacy-map')
    if (!container || container._leaflet_id) return

    const L = leafletRef.current

    // A freshly detected position wins over the saved one, because it is more
    // accurate about where the owner is standing right now.
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

    // Consumed, so a later rebuild does not yank the view back here.
    pendingLocationRef.current = null

    map.on('click', handleMapClick)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      const el = document.getElementById('pharmacy-map')
      if (el) el._leaflet_id = null
    }
  }, [mapReady, handleMapClick])

  return (
    <div className="space-y-3">
      <div id="pharmacy-map" className="w-full h-72 rounded-xl border border-gray-200 overflow-hidden z-0" />
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
        {locating ? t('authPages.registerOwner.detectingLocation') : t('authPages.registerOwner.detectLocation')}
      </button>
      {locationError && (
        <p className="text-xs text-amber-600 text-center">{locationError}</p>
      )}
      <p className="text-xs text-gray-400 text-center">{t('authPages.registerOwner.mapHint')}</p>
    </div>
  )
}

function blankPharmacy(country) {
  return {
    pharmacy_name: '',
    pharmacy_type: 'independent',
    pharmacy_logo: null, // uploaded File, not yet sent
    pharmacy_logo_preview: null,
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

const DRAFT_KEY = 'pharmex_registration_draft'

/**
 * Registration is long enough that losing it to a refresh is a real cost, so
 * the draft is kept in localStorage.
 *
 * The password is deliberately never stored. A draft sitting on a shared or
 * borrowed machine would otherwise hand over the account, so a returning
 * visitor has to re-enter the password on the first step.
 */
function readDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeDraft(draft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Private browsing or a full quota: losing the draft is acceptable.
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

export default function RegisterOwnerPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { rates } = useCurrency()
  const { t } = useLanguage()

  // Plan prices are held in USD and charged in TZS. Labelling the raw USD
  // number "TZS" made a 150 dollar plan read as 150 shillings, a price that
  // does not exist. Until the rate arrives, show the dollar amount instead of
  // guessing at the conversion.
  const planPrice = (plan) => {
    const tzs = tzsFromUsd(plan?.price, rates)
    if (tzs == null) return `USD ${Number(plan?.price || 0).toLocaleString()}`
    return `TZS ${tzs.toLocaleString()}`
  }

  const multiple = new URLSearchParams(window.location.search).get('mode') === 'multiple'

  // A draft saved from the multi branch form describes a different number of
  // steps than the single branch one, so mixing them would land the owner on a
  // step that no longer exists. Only restore the draft for the mode it was
  // written in.
  const [draft] = useState(() => {
    const saved = readDraft()
    if (!saved) return null
    if (Boolean(saved.multiple) !== multiple) return null
    if (!saved.pharmacies?.length) return null
    return saved
  })

  const [step, setStep] = useState(() => {
    if (!draft?.step) return 1
    // Clamped below against the real step count once that is known.
    return Math.max(1, Number(draft.step) || 1)
  })
  const [stepDir, setStepDir] = useState('left')
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [plans, setPlans] = useState([])

  const [form, setForm] = useState(() => {
    const empty = {
      name: '',
      email: '',
      phone: '',
      countryCode: '+255',
      // Never restored from the draft: see DRAFT_KEY.
      password: '',
      password_confirmation: '',
      country: 'Tanzania',
      subscription_plan_id: null,
    }
    if (!draft?.form) return empty
    return {
      ...empty,
      ...draft.form,
      password: '',
      password_confirmation: '',
    }
  })

  const [pharmacies, setPharmacies] = useState(() => {
    if (!Array.isArray(draft?.pharmacies) || !draft.pharmacies.length) {
      return [blankPharmacy('Tanzania')]
    }

    return draft.pharmacies.map((p) => {
      const base = blankPharmacy('Tanzania')
      // The uploaded logo is a File and cannot survive a JSON round trip, so
      // that branch comes back without a logo and has to be picked again.
      const restored = { ...base, ...p, pharmacy_logo: null, pharmacy_logo_preview: null }
      if (!Array.isArray(restored.working_days) || !restored.working_days.length) {
        restored.working_days = base.working_days
      }
      return restored
    })
  })
  const [errors, setErrors] = useState({})
  const [resumedFrom, setResumedFrom] = useState(null)

  const totalSteps = 3 * pharmacies.length + 2

  // A draft can hold a step number that no longer fits, either because the
  // draft predates a branch being removed or because the owner navigated back
  // to the single form. Pull them back rather than rendering nothing.
  useEffect(() => {
    if (step > totalSteps) {
      setStep(totalSteps)
      setAnimKey((k) => k + 1)
    }
  }, [step, totalSteps])

  // Persist as they type.
  //
  // Only the first pass after reading a draft back is skipped. An earlier
  // version guarded this with `if (!draft) return`, which meant a brand new
  // visitor never wrote a draft at all: there was nothing to read on mount, so
  // nothing was saved afterwards, so a refresh threw the work away. The people
  // who needed the draft were exactly the ones who could not get one.
  const skipFirstWriteRef = useRef(Boolean(draft))
  useEffect(() => {
    if (skipFirstWriteRef.current) {
      skipFirstWriteRef.current = false
      return
    }
    writeDraft({
      step,
      multiple,
      // The password is dropped on the way out as well as on the way back in.
      // Storing it and clearing it after the read would still leave it sitting
      // in localStorage for the whole session.
      form: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        countryCode: form.countryCode,
        country: form.country,
        subscription_plan_id: form.subscription_plan_id,
      },
      // pharmacy_logo is a File; JSON.stringify would drop it anyway, so the
      // draft keeps every other field.
      pharmacies,
      savedAt: Date.now(),
    })
  }, [step, form, pharmacies, multiple, draft])

  const discardDraft = () => {
    clearDraft()
    setResumedFrom(null)
    setStep(1)
    setAnimKey((k) => k + 1)
    setForm((prev) => ({
      name: '',
      email: '',
      phone: '',
      countryCode: prev.countryCode,
      password: '',
      password_confirmation: '',
      country: prev.country,
      subscription_plan_id: null,
    }))
    setPharmacies([blankPharmacy('Tanzania')])
    setErrors({})
  }

  useEffect(() => {
    api.get('/subscriptions/plans').then((res) => {
      setPlans(res.data?.data || res.data || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setErrors({})
  }, [step])

  // Tell the owner their answers came back rather than letting the restored
  // step look like a page that forgot to render.
  useEffect(() => {
    if (!draft) return
    setResumedFrom(draft.savedAt || null)
  }, [draft])

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const updatePharmacy = (index, field, value) => {
    setPharmacies((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        // The selects cascade, so a choice higher up invalidates the ones below
        // it. Leaving a district behind after changing region would submit a
        // district that does not belong to the chosen region.
        if (field === 'region') return { ...p, region: value, district: '', ward: '' }
        if (field === 'district') return { ...p, district: value, ward: '' }
        return { ...p, [field]: value }
      })
    )
    // Any change to a place name clears its own error, and changing region or
    // district clears the dependent one so a stale "District is required" does
    // not survive the pick that fixed it.
    const cleared = [field]
    if (field === 'region') cleared.push('district')
    if (field === 'region' || field === 'district') cleared.push('ward')
    setErrors((prev) => {
      const next = { ...prev }
      let changed = false
      cleared.forEach((f) => {
        const key = `p${index}_${f}`
        if (next[key]) {
          next[key] = ''
          changed = true
        }
      })
      return changed ? next : prev
    })
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
    const name = form.name.trim()

    if (!name) errs.name = t('authPages.registerOwner.fullNameRequired')
    else if (name.length < 2) errs.name = t('authPages.registerOwner.fullNameEnter')
    else if (name.length > 120) errs.name = t('authPages.registerOwner.fullNameTooLong')

    const email = form.email.trim()
    if (!email) errs.email = t('auth.emailRequired')
    else if (!isValidEmail(email)) errs.email = t('authPages.validation.invalidEmail')

    const digits = phoneDigits(form.phone)
    if (!digits) errs.phone = t('authPages.validation.phoneRequired')
    else if (!/^[0-9]+$/.test(digits)) errs.phone = t('authPages.validation.phoneOnlyDigits')
    else if (digits.length < PHONE_MIN) errs.phone = `${t('authPages.validation.phoneMinDigits')} ${PHONE_MIN} ${t('authPages.validation.digits')}`
    else if (digits.length > PHONE_MAX) errs.phone = `${t('authPages.validation.phoneMaxDigits')} ${PHONE_MAX} ${t('authPages.validation.digits')}`

    if (!form.password) errs.password = t('auth.passwordRequired')
    else if (form.password.length < 8) errs.password = t('authPages.validation.passwordMin8')
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[A-Z]/.test(form.password)) {
      errs.password = t('authPages.validation.passwordNeedsUpperNumber')
    }
    if (form.password_confirmation && form.password !== form.password_confirmation) {
      errs.password_confirmation = t('authPages.validation.passwordsNoMatch')
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateDetails = (i) => {
    const errs = {}
    const p = pharmacies[i]
    const name = (p.pharmacy_name || '').trim()

    if (!name) errs[`p${i}_pharmacy_name`] = t('authPages.registerOwner.pharmacyNameRequired')
    else if (name.length < 2) errs[`p${i}_pharmacy_name`] = t('authPages.registerOwner.pharmacyNameTooShort')
    else if (name.length > 255) errs[`p${i}_pharmacy_name`] = t('authPages.registerOwner.pharmacyNameTooLong')

    if (!p.region.trim()) errs[`p${i}_region`] = t('authPages.registerOwner.regionRequired')
    if (!p.district.trim()) errs[`p${i}_district`] = t('authPages.registerOwner.districtRequired')

    // A licence that expired before today would let an owner through the door
    // and fail later, so say so while they can still fix it.
    if (p.license_expiry && !isFutureDate(p.license_expiry)) {
      errs[`p${i}_license_expiry`] = t('authPages.registerOwner.licenseFuture')
    }

    const capital = (p.opening_capital || '').trim()
    if (capital) {
      if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(capital)) {
        errs[`p${i}_opening_capital`] = t('authPages.registerOwner.amountInvalid')
      } else if (Number(capital) < 0) {
        errs[`p${i}_opening_capital`] = t('authPages.registerOwner.capitalNegative')
      }
    }

    if ((p.description || '').length > 1000) {
      errs[`p${i}_description`] = t('authPages.registerOwner.descTooLong')
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateLocation = (i) => {
    const errs = {}
    const p = pharmacies[i]
    if (p.latitude === null || p.longitude === null) errs[`p${i}_location`] = t('authPages.registerOwner.pickLocation')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateHours = (i) => {
    const errs = {}
    const p = pharmacies[i]

    if (p.working_days.length === 0) {
      errs[`p${i}_working_days`] = t('authPages.registerOwner.selectWorkingDay')
    }

    // Comparing as strings is safe here because both values are zero padded
    // "HH:MM" from a time input, so an earlier opening than closing compares
    // true. Validating it catches the shop that would report itself open all
    // night.
    if (p.opening_time && p.closing_time && p.opening_time >= p.closing_time) {
      errs[`p${i}_closing_time`] = t('authPages.registerOwner.closingAfterOpening')
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validatePlan = () => {
    const errs = {}
    if (!form.subscription_plan_id) errs.subscription_plan_id = t('authPages.registerOwner.selectPlan')
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

  const MAX_LOGO_MB = 5
  const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  const updatePharmacyLogo = (i, file) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`p${i}_pharmacy_logo`]
      return next
    })
    if (!file) return
    setPharmacies((prev) => prev.map((p, idx) => {
      if (idx !== i || !p.pharmacy_logo_preview) return p
      URL.revokeObjectURL(p.pharmacy_logo_preview)
      return { ...p, pharmacy_logo_preview: null }
    }))
    if (!LOGO_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [`p${i}_pharmacy_logo`]: t('authPages.registerOwner.logoTypeInvalid') }))
      return
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [`p${i}_pharmacy_logo`]: `${t('authPages.registerOwner.logoTooBig')} ${MAX_LOGO_MB} MB.` }))
      return
    }
    setPharmacies((prev) => prev.map((p, idx) => (idx === i
      ? { ...p, pharmacy_logo: file, pharmacy_logo_preview: URL.createObjectURL(file) }
      : p)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // The draft keeps the password out of localStorage, so anyone resuming
    // after step one arrives here with no password at all. Submitting anyway
    // failed with a validation error for a field that is not on this screen, so
    // the owner was left staring at a form that refused to send and no way to
    // tell why. Send them to the field that needs filling instead.
    if (!form.password) {
      setError(t('authPages.registerOwner.reenterPassword'))
      setErrors((prev) => ({ ...prev, password: t('auth.passwordRequired') }))
      goStep(1, 'left')
      return
    }

    if (!validatePlan()) return

    setLoading(true)
    setError('')

    const body = new FormData()
    body.append('name', form.name)
    body.append('email', form.email)
    body.append('phone', `${form.countryCode}${form.phone}`)
    body.append('password', form.password)
    body.append('password_confirmation', form.password_confirmation)
    body.append('role', 'owner')
    body.append('country', form.country)
    body.append('subscription_plan_id', form.subscription_plan_id)

    // Branch fields use bracket notation so Laravel rebuilds the nested array,
    // and the logo is attached as a real file on the same request.
    const scalarKeys = [
      'pharmacy_name',
      'pharmacy_type',
      'license_number',
      'license_expiry',
      'country',
      'region',
      'district',
      'ward',
      'street',
      'latitude',
      'longitude',
      'opening_capital',
      'description',
    ]

    pharmacies.forEach((p, i) => {
      scalarKeys.forEach((key) => {
        const value = p[key]
        if (value === undefined || value === null || value === '') return
        body.append(`pharmacies[${i}][${key}]`, typeof value === 'boolean' ? String(value) : value)
      })
      if (p.working_days?.length) {
        p.working_days.forEach((day) => body.append(`pharmacies[${i}][working_days][]`, day))
      }
      if (p.opening_time) body.append(`pharmacies[${i}][working_hours][open]`, p.opening_time)
      if (p.closing_time) body.append(`pharmacies[${i}][working_hours][close]`, p.closing_time)
      if (p.pharmacy_logo) body.append(`pharmacies[${i}][pharmacy_logo]`, p.pharmacy_logo)
    })

    try {
      await register(body)
      // The account exists now, so the draft has done its job. Leaving it
      // behind would repopulate the form if they register again.
      clearDraft()
      navigate('/pending-approval')
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) {
        // The server names its fields in Laravel's own notation
        // ("pharmacies.0.region"), while the form tracks them as "p0_region".
        // Pushing the server keys in as they arrive left every field blank
        // and the owner staring at a bare "Validation failed.".
        const mapped = {}
        Object.entries(serverErrors).forEach(([key, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages
          const branch = key.match(/^pharmacies\.(\d+)\.(.+)$/)
          mapped[branch ? `p${branch[1]}_${branch[2]}` : key] = message
        })
        setErrors((prev) => ({ ...prev, ...mapped }))

        // Take the owner back to the screen that holds the offending field,
        // otherwise a rejected email is reported on a screen they have
        // already moved past.
        const firstField = Object.keys(mapped)[0]
        const target = stepForField(firstField)
        if (target) {
          setError(t('authPages.registerOwner.registrationFailed'))
          goStep(target, 'right')
        } else {
          setError(t('authPages.registerOwner.registrationFailed'))
        }
      } else {
        setError(err.response?.data?.message || t('authPages.registerOwner.registrationFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Which wizard step holds a given field, so a server rejection can send
   * the owner back to the screen they need to fix.
   */
  const stepForField = (field) => {
    if (!field) return null
    if (['name', 'email', 'phone', 'password', 'password_confirmation'].includes(field)) return 1
    if (field === 'subscription_plan_id') return totalSteps
    const branch = field.match(/^p(\d+)_(.+)$/)
    if (!branch) return null
    const index = Number(branch[1])
    const name = branch[2]
    if (['pharmacy_name', 'pharmacy_type', 'pharmacy_logo', 'license_number', 'license_expiry', 'country', 'region', 'district', 'ward', 'street', 'opening_capital', 'description'].includes(name)) {
      return 2 + index * 3
    }
    if (['latitude', 'longitude'].includes(name)) return 3 + index * 3
    if (['working_days', 'working_hours'].includes(name)) return 4 + index * 3
    return null
  }

  const inputClasses = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"

  const stepLabel = () => {
    if (step === 1) return t('authPages.registerOwner.stepPersonal')
    if (step === totalSteps) return t('authPages.registerOwner.stepPlan')
    const i = pharmacyIndex(step)
    const type = stepType(step)
    if (type === 'details') return multiple ? `${t('authPages.shared.branch')} ${i + 1} — ${t('authPages.registerOwner.stepDetailsMulti')}` : t('authPages.registerOwner.stepDetails')
    if (type === 'location') return multiple ? `${t('authPages.shared.branch')} ${i + 1} — ${t('authPages.registerOwner.stepLocationMulti')}` : t('authPages.registerOwner.stepLocation')
    return multiple ? `${t('authPages.shared.branch')} ${i + 1} — ${t('authPages.registerOwner.stepHoursMulti')}` : t('authPages.registerOwner.stepHours')
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
            {multiple ? `${t('authPages.registerOwner.registrationSingle')} — ${pharmacies.length} ${t('authPages.registerOwner.registrationBranches')}` : t('authPages.registerOwner.registrationSingle')}
          </p>
          <h1 className="text-4xl font-black text-gray-600 mb-3">{t('authPages.registerOwner.setupTitle')}</h1>
          <p className="text-gray-500 text-lg">{stepLabel()}</p>

          {resumedFrom && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#0FD452]/30 bg-[#0FD452]/5 px-4 py-3 text-left">
              <p className="text-xs text-gray-600">
                {t('authPages.registerOwner.progressSaved')}
                {resumedFrom
                  ? ` ${t('authPages.registerOwner.progressSavedOn')} ${new Date(resumedFrom).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
                  : ''}
                {`. ${t('authPages.registerOwner.progressStep')} ${step} ${t('authPages.registerOwner.progressStepOf')} ${totalSteps}.`}
                {step > 1 && ` ${t('authPages.registerOwner.progressPassword')}`}
              </p>
              <button
                type="button"
                onClick={discardDraft}
                className="shrink-0 text-xs font-semibold text-gray-500 underline hover:text-gray-800 transition-colors"
              >
                {t('authPages.registerOwner.startOver')}
              </button>
            </div>
          )}

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
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.fullName')}<Required /></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} className={`${inputClasses} ${errors.name ? 'border-red-400' : ''}`} placeholder={t('authPages.registerOwner.fullNamePh')} />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('customers.emailAddress')}<Required /></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className={`${inputClasses} ${errors.email ? 'border-red-400' : ''}`} placeholder="email@example.com" />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('customers.phoneNumber')}<Required /></label>
                  <div className="flex gap-2">
                    <select value={form.countryCode} onChange={(e) => updateForm('countryCode', e.target.value)} className="w-32 px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white">
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
                        // Strip anything that is not a digit as it is typed, so
                        // the field cannot hold a letter or an eleventh digit.
                        // The validator alone would only complain after the
                        // fact, by which point the owner has already typed it.
                        const dial = form.countryCode.replace(/[^0-9]/g, '')
                        let digits = e.target.value.replace(/[^0-9]/g, '')
                        // People paste the full number including the country
                        // code even though the separate dropdown already adds
                        // it. Cutting it here keeps "+255712345678" from
                        // silently becoming "2557123456".
                        if (dial && digits.startsWith(dial) && digits.length > PHONE_MAX) {
                          digits = digits.slice(dial.length)
                        }
                        updateForm('phone', digits.slice(0, PHONE_MAX))
                      }} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="712 345 678" />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('auth.password')}<Required /></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => updateForm('password', e.target.value)} className={`${inputClasses} pr-11 ${errors.password ? 'border-red-400' : ''}`} placeholder={t('authPages.registerOwner.passwordPh')} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Live checklist: each rule earns its tick as it is met,
                      so the owner sees what is still missing while typing
                      instead of only being told after the fact. */}
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
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('auth.confirmPassword')}<Required /></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type={showConfirmPassword ? 'text' : 'password'} value={form.password_confirmation} onChange={(e) => updateForm('password_confirmation', e.target.value)} className={`${inputClasses} ${errors.password_confirmation ? 'border-red-400' : ''}`} placeholder={t('authPages.registerOwner.reenterPasswordPh')} />
                  </div>
                  {/* The confirm field gets its own tick the moment the two
                      match, which is the moment the owner is looking for. */}
                  {form.password_confirmation && (
                    <div className="mt-2">
                      <PasswordRequirement met={form.password_confirmation === form.password}>
                        {t('authPages.validation.passwordMatches')}
                      </PasswordRequirement>
                    </div>
                  )}
                  {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                </div>
              </div>

              {/* Step 1 had no visible navigation, so users could only advance
                  by pressing Enter inside a field. */}
              <div className="flex justify-end">
                <button type="submit" className="w-full md:w-auto md:min-w-[220px] py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                  {t('authPages.shared.continueBtn')} →
                </button>
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
                      <p className="text-sm font-bold text-gray-700">{t('authPages.shared.branch')} {i + 1} {t('authPages.shared.branchOf')} {pharmacies.length}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { addPharmacy(); goStep(3 * pharmacies.length + 2, 'left') }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#0FD452] hover:text-[#0cb843]"
                        >
                          <Plus className="w-4 h-4" /> {t('authPages.registerOwner.addBranch')}
                        </button>
                        {pharmacies.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePharmacy(i)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" /> {t('authPages.registerOwner.remove')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.pharmacyName')}<Required /></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Store className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="text" value={p.pharmacy_name} onChange={(e) => updatePharmacy(i, 'pharmacy_name', e.target.value)} className={`${inputClasses} ${errors[`p${i}_pharmacy_name`] ? 'border-red-400' : ''}`} placeholder={t('authPages.registerOwner.pharmacyNamePh')} />
                    </div>
                    {errors[`p${i}_pharmacy_name`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_pharmacy_name`]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                      {t('authPages.registerOwner.logoLabel')} <span className="font-normal text-gray-400">({t('authPages.shared.optional')})</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 shrink-0 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {p.pharmacy_logo_preview ? (
                          <img
                            src={p.pharmacy_logo_preview}
                            alt={t('authPages.registerOwner.logoAlt')}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageUp className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          id={`pharmacy-logo-${i}`}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => updatePharmacyLogo(i, e.target.files?.[0])}
                          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-[#0FD452] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[#000F14] hover:file:bg-[#0cb843] cursor-pointer"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {t('authPages.registerOwner.logoHelp')}
                        </p>
                        {errors[`p${i}_pharmacy_logo`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`p${i}_pharmacy_logo`]}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.pharmacyType')}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Building2 className="w-5 h-5 text-gray-400" />
                        </div>
                        <select value={p.pharmacy_type} onChange={(e) => updatePharmacy(i, 'pharmacy_type', e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
                          {pharmacyTypes.map((ptype) => (
                            <option key={ptype.value} value={ptype.value}>{t(`authPages.registerOwner.pharmacyTypes.${ptype.value}`)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.country')}</label>
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
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.region')}<Required /></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <MapPin className="w-5 h-5 text-gray-400" />
                        </div>
                        <select
                          value={p.region}
                          onChange={(e) => updatePharmacy(i, 'region', e.target.value)}
                          className={`w-full pl-11 pr-10 py-3 border rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] ${errors[`p${i}_region`] ? 'border-red-400' : 'border-gray-200'}`}
                        >
                          <option value="">{t('authPages.registerOwner.selectRegion')}</option>
                          {TANZANIA_REGIONS.map((r) => (
                            <option key={r.name} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors[`p${i}_region`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_region`]}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.district')}<Required /></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <MapPin className="w-5 h-5 text-gray-400" />
                        </div>
                        <select
                          value={p.district}
                          onChange={(e) => updatePharmacy(i, 'district', e.target.value)}
                          disabled={!p.region}
                          className={`w-full pl-11 pr-10 py-3 border rounded-xl text-sm outline-none bg-white appearance-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${errors[`p${i}_district`] ? 'border-red-400' : 'border-gray-200'}`}
                        >
                          <option value="">{p.region ? t('authPages.registerOwner.selectDistrict') : t('authPages.registerOwner.selectRegionFirst')}</option>
                          {districtsFor(p.region).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors[`p${i}_district`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_district`]}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.ward')}</label>
                      <div className="relative">
                        <select
                          value={p.ward}
                          onChange={(e) => updatePharmacy(i, 'ward', e.target.value)}
                          disabled={!p.district}
                          className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <option value="">{p.district ? t('authPages.registerOwner.selectWard') : t('authPages.registerOwner.selectDistrictFirst')}</option>
                          {wardsFor(p.region, p.district).map((w) => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.street')}</label>
                      <input type="text" value={p.street} onChange={(e) => updatePharmacy(i, 'street', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder={t('authPages.registerOwner.streetPh')} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.licenseNumber')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="text" value={p.license_number} onChange={(e) => updatePharmacy(i, 'license_number', e.target.value)} className={inputClasses} placeholder={t('authPages.registerOwner.licenseNumberPh')} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.licenseExpiry')}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="date" value={p.license_expiry} onChange={(e) => updatePharmacy(i, 'license_expiry', e.target.value)} className={`${inputClasses} ${errors[`p${i}_license_expiry`] ? 'border-red-400' : ''}`} />
                      </div>
                      {errors[`p${i}_license_expiry`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_license_expiry`]}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.openingCapital')}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                        type="text"
                        inputMode="decimal"
                        value={p.opening_capital}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9.]/g, '').replace(/(\.[0-9]{0,2}).*$/, '$1')
                          updatePharmacy(i, 'opening_capital', clean)
                        }} className={`${inputClasses} ${errors[`p${i}_opening_capital`] ? 'border-red-400' : ''}`} placeholder={t('authPages.registerOwner.openingCapitalPh')} />
                      </div>
                      {errors[`p${i}_opening_capital`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_opening_capital`]}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.descriptionLabel')}</label>
                    <div className="relative">
                      <div className="absolute top-3 left-3.5 pointer-events-none">
                        <Info className="w-5 h-5 text-gray-400" />
                      </div>
                      <textarea value={p.description} onChange={(e) => updatePharmacy(i, 'description', e.target.value)} rows={3} maxLength={1000} className={`w-full pl-11 pr-4 py-3 border rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] resize-none ${errors[`p${i}_description`] ? 'border-red-400' : 'border-gray-200'}`} placeholder={t('authPages.registerOwner.descriptionPh')} />
                    </div>
                    <div className="flex justify-between mt-1">
                      {errors[`p${i}_description`]
                        ? <p className="text-red-500 text-xs">{errors[`p${i}_description`]}</p>
                        : <span />}
                      <span className="text-xs text-gray-400">{(p.description || '').length}/1000</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={handleBack} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                      <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> {t('common.back')}</span>
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                      {t('authPages.shared.continueBtn')} →
                    </button>
                  </div>
                </div>
              )
            }

            if (type === 'location') {
              return (
                <div key={`step-location-${i}-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
                    <p className="text-blue-700 text-sm font-medium">{multiple ? `${t('authPages.registerOwner.setLocationFor')} ${p.pharmacy_name || `${t('authPages.shared.branch')} ${i + 1}`}` : t('authPages.registerOwner.whyLocation')}</p>
                    <p className="text-blue-600 text-xs mt-1">{t('authPages.registerOwner.locationWhyBody')}</p>
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
                      <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> {t('common.back')}</span>
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                      {t('authPages.shared.continueBtn')} →
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={`step-hours-${i}-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">{t('authPages.registerOwner.workingDays')}<Required /></label>
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
                        {t(`authPages.registerOwner.dayNames.${day}`)}
                      </button>
                    ))}
                  </div>
                  {errors[`p${i}_working_days`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_working_days`]}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.openingTime')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="time" value={p.opening_time} onChange={(e) => updatePharmacy(i, 'opening_time', e.target.value)} className={inputClasses} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('authPages.registerOwner.closingTime')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="time" value={p.closing_time} onChange={(e) => updatePharmacy(i, 'closing_time', e.target.value)} className={`${inputClasses} ${errors[`p${i}_closing_time`] ? 'border-red-400' : ''}`} />
                    </div>
                    {errors[`p${i}_closing_time`] && <p className="text-red-500 text-xs mt-1">{errors[`p${i}_closing_time`]}</p>}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handleBack} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                    <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> {t('common.back')}</span>
                  </button>
                  <button type="submit" className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                    {t('authPages.shared.continueBtn')} →
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Step 5 - Subscription Plan + Summary */}
          {step === totalSteps && (
            <div key={`step-plan-${animKey}`} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-700 text-sm font-medium">{t('authPages.shared.chooseYourPlan')}<Required /></p>
                <p className="text-blue-600 text-xs mt-1">{t('authPages.registerOwner.planIntro')}</p>
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
                        {(() => {
                          // features is the comparison matrix: [{ section, rows }],
                          // so render row names rather than the wrapper objects.
                          const chips = (plan.features || []).flatMap((sec) =>
                            (sec.rows || []).map((row) => row.name)
                          ).filter(Boolean)
                          if (chips.length === 0) return null
                          return (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {chips.slice(0, 4).map((name) => (
                                <span key={name} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{name}</span>
                              ))}
                              {chips.length > 4 && (
                                <span className="text-[10px] text-gray-400">+{chips.length - 4} {t('authPages.shared.more')}</span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-xl font-black text-[#000F14]">{planPrice(plan)}</p>
                        <p className="text-xs text-gray-500">{plan.duration_months} {plan.duration_months > 1 ? t('authPages.shared.months') : t('authPages.shared.month')}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.subscription_plan_id && <p className="text-red-500 text-xs">{errors.subscription_plan_id}</p>}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">{t('authPages.registerOwner.registrationSummary')}</h4>
                  <button
                    type="button"
                    onClick={() => { addPharmacy(); goStep(3 * pharmacies.length + 2, 'left') }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0FD452] hover:text-[#0cb843]"
                  >
                    <Plus className="w-4 h-4" /> {t('authPages.registerOwner.addAnotherPharmacy')}
                  </button>
                </div>
                <div className="space-y-2">
                  {pharmacies.map((p, i) => (
                    <div key={`summary-${i}`} className="flex items-start justify-between bg-white border border-gray-200 rounded-xl p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {multiple && <span className="text-[10px] font-bold bg-[#0FD452]/10 text-[#0FD452] px-2 py-0.5 rounded-full shrink-0">{t('authPages.shared.branch')} {i + 1}</span>}
                          <p className="font-semibold text-gray-800 text-sm truncate">{p.pharmacy_name || t('authPages.registerOwner.unnamedPharmacy')}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[p.ward, p.district, p.region].filter(Boolean).join(', ') || '—'} · {p.opening_time} — {p.closing_time} ({p.working_days.length} {t('authPages.shared.days')})
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => goStep(3 * i + 2, 'left')}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0FD452] hover:bg-[#0FD452]/5 transition-colors"
                          title={t('authPages.registerOwner.editBranch')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {pharmacies.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePharmacy(i)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title={t('authPages.registerOwner.removeBranch')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  <p><span className="font-medium text-gray-600">{t('authPages.registerOwner.ownerLabel')}</span> {form.name || '—'}</p>
                  {form.subscription_plan_id && (
                    <p><span className="font-medium text-gray-600">{t('authPages.registerOwner.planLabel')}</span> {plans.find(p => p.id === form.subscription_plan_id)?.name} — {planPrice(plans.find(p => p.id === form.subscription_plan_id))}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleBack} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                  <span className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> {t('common.back')}</span>
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('authPages.registerOwner.submitting')}
                    </span>
                  ) : (
                    t('authPages.registerOwner.submitApplication')
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-[#0FD452] font-semibold hover:text-[#0cb843] transition-colors">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
