import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Building2, User, MapPin, CreditCard, Calendar, Clock,
  FileText, Hash, Phone, Mail, Map, ExternalLink, ChevronRight
} from 'lucide-react'
import api from '../../services/api'

function InfoRow({ icon: Icon, label, value, mono, span }) {
  return (
    <div className={`flex items-start gap-3 py-2.5 ${span ? 'col-span-2' : ''}`}>
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
        <p className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  )
}

function Badge({ label, color }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full text-xs font-semibold px-3 py-1 ${color}`}>
      {label}
    </span>
  )
}

export default function AdminPharmacyApprovalPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pharmacy, setPharmacy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [note, setNote] = useState('')
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
        latitude: d.latitude,
        longitude: d.longitude,
        application_status: d.application_status || 'pending',
        subscription_type: d.subscription_type || 'trial',
        payment_status: d.payment_status || 'unpaid',
        days_remaining: d.days_remaining || 0,
        trial_ends_at: d.trial_ends_at,
        subscription_start_date: d.subscription_start_date,
        subscription_end_date: d.subscription_end_date,
        created_at: d.created_at,
        subscription_plan: d.subscription_plan || null,
        subscription_amount: d.subscription_amount || 0,
        rejection_reason: d.rejection_reason || '',
      })
    } catch {
      showToast('Failed to load pharmacy', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleConfirmPayment = async () => {
    try {
      setActionLoading(true)
      await api.patch(`/admin/pharmacies/${id}/confirm-payment`)
      showToast('Payment confirmed. Subscription activated!')
      setTimeout(() => navigate('/dashboard/pending-approvals'), 1200)
    } catch {
      showToast('Failed to confirm payment', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    try {
      setActionLoading(true)
      await api.patch(`/admin/pharmacies/${id}/reject`, { rejection_reason: rejectReason })
      showToast('Application rejected')
      setTimeout(() => navigate('/dashboard/pending-approvals'), 1200)
    } catch {
      showToast('Failed to reject', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500 mb-4">Pharmacy not found</p>
        <Link to="/dashboard/pending-approvals" className="text-[#0FD452] font-semibold text-sm hover:underline">Back to list</Link>
      </div>
    )
  }

  const appCfg = {
    pending: { color: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500', label: 'Pending Review' },
    approved: { color: 'bg-[#0FD452]/10 text-[#0FD452] border border-[#0FD452]/30', dot: 'bg-[#0FD452]', label: 'Approved' },
    rejected: { color: 'bg-red-50 text-red-600 border border-red-200', dot: 'bg-red-500', label: 'Rejected' },
  }[pharmacy.application_status] || { color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', label: pharmacy.application_status }

  const payCfg = {
    unpaid: { color: 'bg-red-50 text-red-600 border border-red-200', label: 'Unpaid' },
    paid: { color: 'bg-[#0FD452]/10 text-[#0FD452] border border-[#0FD452]/30', label: 'Paid' },
    confirmed: { color: 'bg-[#0FD452]/10 text-[#0FD452] border border-[#0FD452]/30', label: 'Paid' },
    pending: { color: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Pending' },
  }[pharmacy.payment_status] || { color: 'bg-gray-100 text-gray-500', label: pharmacy.payment_status }

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return d }
  }

  const showPaymentAction = pharmacy.application_status === 'approved' && pharmacy.payment_status !== 'confirmed' && pharmacy.payment_status !== 'paid'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/dashboard/pending-approvals" className="mt-1 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-[#0FD452]/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-500 font-mono">{pharmacy.code}</span>
              <Badge label={appCfg.label} color={appCfg.color} />
            </div>
          </div>
        </div>
        <Link to={`/dashboard/pharmacies/${id}`} className="text-xs text-[#0FD452] font-semibold hover:underline flex items-center gap-1 shrink-0 mt-2">
          View Full Profile <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Owner + Pharmacy info in 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Owner */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Owner Information</h2>
          </div>
          <div className="space-y-0.5 divide-y divide-gray-50">
            <InfoRow icon={User} label="Name" value={pharmacy.owner_name} />
            <InfoRow icon={Phone} label="Phone" value={pharmacy.owner_phone} mono />
            <InfoRow icon={Mail} label="Email" value={pharmacy.owner_email} />
            <InfoRow icon={Hash} label="Code" value={pharmacy.code} mono />
          </div>
        </div>

        {/* Pharmacy */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Pharmacy Details</h2>
          </div>
          <div className="space-y-0.5 divide-y divide-gray-50">
            <InfoRow icon={Building2} label="Type" value={pharmacy.pharmacy_type} />
            <InfoRow icon={FileText} label="License No." value={pharmacy.license_number} mono />
            <InfoRow icon={Calendar} label="License Expiry" value={formatDate(pharmacy.license_expiry)} />
            <InfoRow icon={MapPin} label="Country" value="Tanzania" />
            <InfoRow icon={MapPin} label="Region" value={pharmacy.region} />
            <InfoRow icon={MapPin} label="District" value={pharmacy.district} />
            <InfoRow icon={MapPin} label="Ward" value={pharmacy.ward} />
            <InfoRow icon={MapPin} label="Street" value={pharmacy.street} />
          </div>
        </div>
      </div>

      {/* Map */}
      {pharmacy.latitude && pharmacy.longitude && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Map className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Map Location</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Coordinates</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{pharmacy.latitude}, {pharmacy.longitude}</p>
            </div>
            <a
              href={`https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0FD452]/10 text-[#0FD452] rounded-xl text-sm font-semibold hover:bg-[#0FD452]/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> View on Google Maps
            </a>
          </div>
        </div>
      )}

      {/* Subscription & Payment */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Subscription & Payment</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Plan</p>
            <p className="text-sm font-bold text-gray-900">{pharmacy.subscription_plan?.name || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Amount</p>
            <p className="text-sm font-bold text-[#0FD452]">
              {pharmacy.subscription_plan ? `TZS ${Number(pharmacy.subscription_plan.price).toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Payment</p>
            <Badge label={payCfg.label} color={payCfg.color} />
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Start Date</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(pharmacy.subscription_start_date)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">End Date</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(pharmacy.subscription_end_date)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Trial Ends</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(pharmacy.trial_ends_at)}</p>
          </div>
        </div>
      </div>

      {/* Rejection reason if rejected */}
      {pharmacy.application_status === 'rejected' && pharmacy.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-bold text-red-700">Rejection Reason</p>
          </div>
          <p className="text-sm text-red-600">{pharmacy.rejection_reason}</p>
        </div>
      )}

      {/* Action Buttons */}
      {showPaymentAction && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Actions</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 border border-red-300 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
            >
              <XCircle className="w-4 h-4" /> Reject Application
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all"
            >
              <CreditCard className="w-4 h-4" /> Confirm Payment & Activate Subscription
            </button>
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
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 resize-none"
              placeholder="e.g. Invalid license number, missing documents..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowPaymentModal(false); setNote('') }} />
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
              <p className="text-sm text-[#000F14]">Verify the payment has been received before confirming. This will activate the pharmacy's subscription immediately.</p>
            </div>
            {pharmacy.subscription_plan && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Plan</p>
                    <p className="text-sm font-bold text-gray-900">{pharmacy.subscription_plan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Amount</p>
                    <p className="text-sm font-bold text-[#0FD452]">TZS {Number(pharmacy.subscription_plan.price).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/30 resize-none"
              placeholder="e.g. Payment received via bank transfer, reference #12345..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowPaymentModal(false); setNote('') }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={actionLoading}
                className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

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
