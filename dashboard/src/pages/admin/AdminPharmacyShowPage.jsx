import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Building2,
  ArrowLeft,
  Edit,
  Trash2,
  Pill,
  DollarSign,
  ShoppingCart,
  Users,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  FileText,
  TrendingUp,
  Hash,
  Store,
  Star,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
}

const PAY_STATUS = {
  unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-600' },
  pending: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Paid', color: 'bg-green-100 text-green-700' },
}

const SUB_TYPE = {
  trial: { label: 'Free Trial', color: 'bg-blue-100 text-blue-700' },
  subscription: { label: 'Active Subscription', color: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-600' },
  none: { label: 'No Plan', color: 'bg-gray-100 text-gray-500' },
}

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

function InfoItem({ icon: Icon, label, value, mono, span }) {
  return (
    <div className={`bg-gray-50 p-3 rounded-lg ${span ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-medium text-[#000F14] capitalize ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  )
}

export default function AdminPharmacyShowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pharmacy, setPharmacy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [approveComment, setApproveComment] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchPharmacy() }, [id])

  const fetchPharmacy = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/pharmacies/${id}`)
      const d = res.data.data || res.data
      const owner = typeof d.owner === 'object' ? d.owner : null
      setPharmacy({
        ...d,
        name: d.pharmacy_name || d.name || 'Unknown',
        code: d.pharmacy_code || d.code || '',
        owner_name: owner?.name || 'Unknown',
        owner_email: owner?.email || '',
        owner_phone: owner?.phone || '',
        region: d.region || '',
        district: d.district || '',
        ward: d.ward || '',
        street: d.street || '',
        phone: d.phone || '',
        email: d.email || '',
        pharmacy_type: d.pharmacy_type || 'independent',
        license_number: d.license_number || '',
        license_expiry: d.license_expiry || '',
        opening_hours: d.working_hours ? `${d.working_hours.open || '08:00'} - ${d.working_hours.close || '18:00'}` : '08:00 - 18:00',
        working_days: d.working_days || [],
        latitude: d.latitude,
        longitude: d.longitude,
        description: d.description || '',
        drugs_count: d.drugs_count || 0,
        monthly_revenue: d.monthly_revenue || 0,
        orders_count: d.orders_count || 0,
        employees_count: d.employees_count || 0,
        customers_count: d.customers_count || 0,
        status: d.status || 'pending',
        application_status: d.application_status || 'pending',
        subscription_type: d.subscription_type || 'trial',
        payment_status: d.payment_status || 'unpaid',
        days_remaining: d.days_remaining || 0,
        subscription_plan: d.subscription_plan || null,
        subscription_amount: d.subscription_amount || 0,
        subscription_start_date: d.subscription_start_date,
        subscription_end_date: d.subscription_end_date,
        trial_ends_at: d.trial_ends_at,
        rejection_reason: d.rejection_reason || '',
        created_at: d.created_at,
        last_order: d.last_order,
        rating: d.rating || 0,
        total_reviews: d.total_reviews || 0,
      })
    } catch {
      setPharmacy({
        id: 1, name: 'HealthPlus Pharmacy', code: 'PHM-001245',
        owner_name: 'Alice Mwamba', owner_email: 'alice@healthplus.co.tz', owner_phone: '+255 700 123456',
        country: 'Tanzania', region: 'Dar es Salaam', district: 'Kinondoni', ward: 'Mikocheni', street: 'Bagamoyo Road',
        phone: '+255 700 123456', email: 'info@healthplus.co.tz',
        pharmacy_type: 'independent', license_number: 'TZ-PH-2026-0042', license_expiry: '2027-12-31',
        opening_hours: '08:00 - 18:00', latitude: -6.7924, longitude: 39.2083,
        drugs_count: 342, monthly_revenue: 12500000, orders_count: 1280, employees_count: 15, customers_count: 2300,
        status: 'active', application_status: 'approved', subscription_type: 'trial',
        payment_status: 'unpaid', days_remaining: 5, created_at: '2026-01-15',
        last_order: '2026-07-25', rating: 4.5, total_reviews: 48,
      })
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      await api.patch(`/admin/pharmacies/${id}/approve`)
      setShowApproveModal(false)
      setApproveComment('')
      showToast('Pharmacy approved successfully')
      fetchPharmacy()
    } catch {} finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    try {
      setActionLoading(true)
      await api.patch(`/admin/pharmacies/${id}/reject`, { rejection_reason: rejectReason })
      setShowRejectModal(false)
      setRejectReason('')
      showToast('Pharmacy rejected')
      fetchPharmacy()
    } catch {} finally { setActionLoading(false) }
  }

  const handleConfirmPayment = async () => {
    try {
      setActionLoading(true)
      await api.patch(`/admin/pharmacies/${id}/confirm-payment`)
      setShowPaymentModal(false)
      setPaymentNote('')
      showToast('Payment confirmed. Subscription activated!')
      fetchPharmacy()
    } catch {} finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/pharmacies/${id}`)
      showToast('Pharmacy deleted')
      setTimeout(() => navigate('/admin/pharmacies'), 1000)
    } catch {} finally { setConfirmOpen(false) }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-36 bg-gray-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl" />)}
          </div>
          <div className="h-96 bg-gray-200 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Pharmacy not found</p>
          <button onClick={() => navigate('/admin/pharmacies')} className="text-[#0FD452] mt-2 text-sm font-medium hover:underline">Go back</button>
        </div>
      </div>
    )
  }

  const daysActive = pharmacy.created_at ? Math.floor((Date.now() - new Date(pharmacy.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
  const appCfg = STATUS_CONFIG[pharmacy.application_status] || STATUS_CONFIG.pending
  const subCfg = SUB_TYPE[pharmacy.subscription_type] || SUB_TYPE.none
  const payCfg = PAY_STATUS[pharmacy.payment_status] || PAY_STATUS.unpaid

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/pharmacies" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{pharmacy.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 font-mono">{pharmacy.code}</span>
              <span className={`inline-flex items-center gap-1 rounded-full text-xs font-medium px-2 py-0.5 ${appCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${appCfg.dot}`} />
                {appCfg.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${subCfg.color}`}>
                {subCfg.label}
              </span>
              {pharmacy.days_remaining > 0 && (
                <span className="text-xs text-gray-500">{Math.round(pharmacy.days_remaining)}d remaining</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pharmacy.application_status === 'pending' && (
            <>
              <button onClick={() => setShowApproveModal(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all">
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => setShowRejectModal(true)} className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-300 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          {pharmacy.application_status === 'approved' && pharmacy.payment_status !== 'confirmed' && (
            <button onClick={() => setShowPaymentModal(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50">
              <CreditCard className="w-4 h-4" /> Confirm Payment
            </button>
          )}
          <Link to={`/admin/pharmacies/${id}/edit`} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: Pill, label: 'Total Drugs', value: pharmacy.drugs_count || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: DollarSign, label: 'Monthly Revenue', value: formatCurrency(pharmacy.monthly_revenue), color: 'text-green-600', bg: 'bg-green-50' },
          { icon: ShoppingCart, label: 'Total Orders', value: pharmacy.orders_count || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Users, label: 'Customers', value: pharmacy.customers_count || 0, color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: CreditCard, label: 'Plan Amount', value: formatCurrency(pharmacy.subscription_amount), color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-[#000F14] leading-tight">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subscription & Payment */}
          <SectionCard icon={CreditCard} iconBg="bg-amber-100" iconColor="text-amber-600" title="Subscription & Payment" subtitle="Approval and payment status">
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Application', value: appCfg.label, badge: appCfg.color },
                  { label: 'Subscription', value: subCfg.label, badge: subCfg.color },
                  { label: 'Payment', value: payCfg.label, badge: payCfg.color },
                  { label: 'Plan', value: pharmacy.subscription_plan?.name || '—' },
                  { label: 'Amount', value: formatCurrency(pharmacy.subscription_amount) },
                  { label: 'Start Date', value: formatDate(pharmacy.subscription_start_date) },
                  { label: 'End Date', value: formatDate(pharmacy.subscription_end_date) },
                  { label: 'Trial Ends', value: formatDate(pharmacy.trial_ends_at) },
                ].map((f, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">{f.label}</span>
                    {f.badge ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${f.badge}`}>{f.value}</span>
                    ) : (
                      <p className="text-sm font-medium text-[#000F14]">{f.value}</p>
                    )}
                  </div>
                ))}
              </div>
              {pharmacy.application_status === 'pending' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Awaiting review</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button onClick={() => setShowApproveModal(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-lg text-xs font-bold transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => setShowRejectModal(true)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              )}
              {pharmacy.application_status === 'rejected' && pharmacy.rejection_reason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-800">Rejection Reason</span></div>
                  <p className="text-sm text-red-700">{pharmacy.rejection_reason}</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pharmacy Info */}
          <SectionCard icon={Store} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Pharmacy Information" subtitle="Basic pharmacy details">
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoItem icon={User} label="Owner" value={pharmacy.owner_name} />
              <InfoItem icon={Building2} label="Name" value={pharmacy.name} />
              <InfoItem icon={Hash} label="Code" value={pharmacy.code} mono />
              <InfoItem icon={Store} label="Type" value={(pharmacy.pharmacy_type || 'independent').replace('_', ' ')} />
              <InfoItem icon={FileText} label="License No." value={pharmacy.license_number} mono />
              <InfoItem icon={Calendar} label="License Expiry" value={formatDate(pharmacy.license_expiry)} />
              <InfoItem icon={Phone} label="Owner Phone" value={pharmacy.owner_phone || pharmacy.phone} />
              <InfoItem icon={Mail} label="Owner Email" value={pharmacy.owner_email || pharmacy.email} />
              <InfoItem icon={Star} label="Rating" value={pharmacy.rating ? `${pharmacy.rating} (${pharmacy.total_reviews} reviews)` : '—'} />
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard icon={MapPin} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Location" subtitle="Physical address and coordinates">
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoItem icon={MapPin} label="Street" value={pharmacy.street} />
              <InfoItem icon={MapPin} label="Ward" value={pharmacy.ward} />
              <InfoItem icon={MapPin} label="District" value={pharmacy.district} />
              <InfoItem icon={MapPin} label="Region" value={pharmacy.region} />
              <InfoItem icon={Hash} label="Latitude" value={pharmacy.latitude} mono />
              <InfoItem icon={Hash} label="Longitude" value={pharmacy.longitude} mono />
            </div>
            {pharmacy.latitude && pharmacy.longitude && (
              <div className="px-5 pb-5">
                <div className="rounded-xl overflow-hidden border border-gray-200 relative" style={{ height: '280px' }}>
                  <MapContainer
                    center={[pharmacy.latitude, pharmacy.longitude]}
                    zoom={15}
                    className="h-full w-full"
                    zoomControl={false}
                    attributionControl={false}
                    scrollWheelZoom={false}
                  >
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="Street">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Satellite">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                      </LayersControl.BaseLayer>
                    </LayersControl>
                    <Marker
                      position={[pharmacy.latitude, pharmacy.longitude]}
                      icon={L.divIcon({
                        className: '',
                        iconSize: [32, 40],
                        iconAnchor: [16, 40],
                        html: `<div style="width:32px;height:40px;display:flex;align-items:flex-start;justify-content:center"><div style="width:32px;height:32px;border-radius:50%;background:#0FD452;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div></div>`,
                      })}
                    />
                  </MapContainer>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Business Info */}
          <SectionCard icon={Clock} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Business Information" subtitle="Operational details">
            <div className="p-5 grid grid-cols-2 gap-3">
              <InfoItem icon={Clock} label="Opening Hours" value={pharmacy.opening_hours || '08:00 - 18:00'} />
              <InfoItem icon={Calendar} label="Working Days" value={pharmacy.working_days?.length > 0 ? pharmacy.working_days.join(', ') : 'Mon - Sat'} />
            </div>
          </SectionCard>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <SectionCard icon={TrendingUp} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Quick Stats">
            <div className="p-5 space-y-3">
              {[
                { icon: Calendar, label: 'Member Since', value: formatDate(pharmacy.created_at) },
                { icon: TrendingUp, label: 'Days Active', value: `${daysActive} days` },
                { icon: ShoppingCart, label: 'Last Order', value: formatDate(pharmacy.last_order) },
                { icon: DollarSign, label: 'Avg Revenue', value: formatCurrency(pharmacy.monthly_revenue) },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <s.icon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-500">{s.label}</span>
                    </div>
                    <span className="text-sm font-medium text-[#000F14]">{s.value}</span>
                  </div>
                  {i < 3 && <div className="border-t border-gray-100 mt-3" />}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Actions */}
          <SectionCard icon={ExternalLink} iconBg="bg-[#0FD452]/10" iconColor="text-[#0FD452]" title="Actions">
            <div className="p-5 space-y-1">
              {[
                { to: `/admin/pharmacies/${id}/orders`, icon: ShoppingCart, color: 'blue', label: 'View Orders', desc: 'Browse all orders' },
                { to: `/admin/pharmacies/${id}/stock`, icon: Pill, color: 'purple', label: 'View Stock', desc: 'Manage inventory' },
                { icon: FileText, color: 'green', label: 'Export Data', desc: 'Download reports' },
              ].map((a, i) => {
                const Wrapper = a.to ? Link : 'button'
                const props = a.to ? { to: a.to } : { className: 'w-full' }
                return (
                  <Wrapper key={i} {...props} className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className={`w-9 h-9 rounded-lg bg-${a.color}-50 flex items-center justify-center group-hover:bg-${a.color}-100 transition-colors`}>
                      <a.icon className={`w-3.5 h-3.5 text-${a.color}-600`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#000F14]">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.desc}</p>
                    </div>
                  </Wrapper>
                )
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowApproveModal(false); setApproveComment('') }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Approve Application</h3>
                <p className="text-xs text-gray-500">{pharmacy.name}</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-800">This will approve the pharmacy application and start their 7-day free trial. The owner will be notified.</p>
            </div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Comment (optional)</label>
            <textarea value={approveComment} onChange={(e) => setApproveComment(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/30 resize-none"
              placeholder="Any notes for this approval..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowApproveModal(false); setApproveComment('') }} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleApprove} disabled={actionLoading} className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowRejectModal(false); setRejectReason('') }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reject Application</h3>
                <p className="text-xs text-gray-500">{pharmacy.name}</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-800">This will reject the pharmacy application. The owner will be notified with the reason below.</p>
            </div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reason for rejection *</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 resize-none"
              placeholder="e.g. Invalid license number, missing documents..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowRejectModal(false); setRejectReason('') }} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowPaymentModal(false); setPaymentNote('') }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Payment</h3>
                <p className="text-xs text-gray-500">{pharmacy.name}</p>
              </div>
            </div>
            <div className="bg-[#0FD452]/5 border border-[#0FD452]/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-[#000F14]">This will confirm the payment has been received and activate the pharmacy's subscription. The owner will be notified.</p>
            </div>
            {pharmacy.subscription_plan && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Plan</p>
                    <p className="text-sm font-semibold text-gray-900">{pharmacy.subscription_plan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Amount</p>
                    <p className="text-sm font-bold text-[#0FD452]">TZS {(pharmacy.subscription_plan.price || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Note (optional)</label>
            <textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/30 resize-none"
              placeholder="e.g. Payment received via bank transfer, reference #12345..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowPaymentModal(false); setPaymentNote('') }} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleConfirmPayment} disabled={actionLoading} className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Pharmacy"
        message={`Are you sure you want to delete "${pharmacy.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        variant="danger"
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#000F14] text-white'}`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
