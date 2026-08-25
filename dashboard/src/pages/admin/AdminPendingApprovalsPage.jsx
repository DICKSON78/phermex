import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
  CheckCircle2, XCircle, Clock, Building2, User, MapPin, Phone, Mail,
  CreditCard, ArrowLeft, Loader2, RefreshCw, Eye, AlertTriangle,
  Search, Filter, Calendar, ShieldCheck, Hash, ChevronDown,
  ChevronLeft, ChevronRight, Zap, FileText, ExternalLink, X,
} from 'lucide-react'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try { return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return dateStr }
}

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
}
const PAY_STATUS = {
  unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-600' },
  pending: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  confirmed: { label: 'Paid', color: 'bg-green-100 text-green-700' },
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-medium text-[#000F14]">{value || '—'}</p>
    </div>
  )
}

export default function AdminPendingApprovalsPage() {
  const navigate = useNavigate()
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const [paymentPharmacy, setPaymentPharmacy] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveComment, setApproveComment] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [toast, setToast] = useState(null)
  const pageSize = 15

  const fetchPharmacies = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, per_page: pageSize })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await api.get(`/admin/pending-pharmacies?${params}`)
      const data = res.data
      setPharmacies(data.data || [])
      setCurrentPage(data.current_page || 1)
      setTotalPages(data.last_page || 1)
      setTotalCount(data.total || 0)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { fetchPharmacies(1) }, [statusFilter])
  useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter])

  const stats = useMemo(() => ({
    total: totalCount,
    pending: pharmacies.filter((p) => p.application_status === 'pending').length,
    approved: pharmacies.filter((p) => p.application_status === 'approved').length,
    rejected: pharmacies.filter((p) => p.application_status === 'rejected').length,
  }), [pharmacies, totalCount])

  const filteredPharmacies = useMemo(() => {
    if (!searchQuery.trim()) return pharmacies
    const q = searchQuery.toLowerCase()
    return pharmacies.filter((p) =>
      p.pharmacy_name?.toLowerCase().includes(q) || p.owner?.name?.toLowerCase().includes(q) ||
      p.pharmacy_code?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q)
    )
  }, [pharmacies, searchQuery])

  const paginated = filteredPharmacies.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = async () => {
    if (!selectedPharmacy) return
    try {
      setActionLoading(selectedPharmacy.id)
      await api.patch(`/admin/pharmacies/${selectedPharmacy.id}/approve`)
      setPharmacies((prev) => prev.map((p) => (p.id === selectedPharmacy.id ? { ...p, application_status: 'approved' } : p)))
      if (selectedPharmacy) setSelectedPharmacy((s) => s ? { ...s, application_status: 'approved' } : null)
      setShowApproveModal(false)
      setApproveComment('')
      showToast('Pharmacy approved')
    } catch (err) { console.error(err) } finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!selectedPharmacy || !rejectReason.trim()) return
    try {
      setActionLoading(selectedPharmacy.id)
      await api.patch(`/admin/pharmacies/${selectedPharmacy.id}/reject`, { rejection_reason: rejectReason })
      setPharmacies((prev) => prev.map((p) => (p.id === selectedPharmacy.id ? { ...p, application_status: 'rejected', rejection_reason: rejectReason } : p)))
      if (selectedPharmacy) setSelectedPharmacy((s) => s ? { ...s, application_status: 'rejected', rejection_reason: rejectReason } : null)
      setShowRejectModal(false)
      setRejectReason('')
      showToast('Pharmacy rejected')
    } catch (err) { console.error(err) } finally { setActionLoading(null) }
  }

  const handleConfirmPayment = async () => {
    if (!selectedPharmacy) return
    try {
      setActionLoading(selectedPharmacy.id)
      await api.patch(`/admin/pharmacies/${selectedPharmacy.id}/confirm-payment`)
      setPharmacies((prev) => prev.map((p) => (p.id === selectedPharmacy.id ? { ...p, payment_status: 'confirmed' } : p)))
      if (selectedPharmacy) setSelectedPharmacy((s) => s ? { ...s, payment_status: 'confirmed' } : null)
      setShowPaymentModal(false)
      setPaymentNote('')
      showToast('Payment confirmed. Subscription activated!')
    } catch (err) { console.error(err) } finally { setActionLoading(null) }
  }

  const selectRow = (p) => {
    setSelectedPharmacy((prev) => prev?.id === p.id ? null : p)
  }

  const appCfg = selectedPharmacy ? (STATUS_CONFIG[selectedPharmacy.application_status] || STATUS_CONFIG.pending) : STATUS_CONFIG.pending
  const payCfg = selectedPharmacy ? (PAY_STATUS[selectedPharmacy.payment_status] || PAY_STATUS.unpaid) : PAY_STATUS.unpaid

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pharmacy Approvals</h1>
            <p className="text-sm text-gray-500">Review and manage pharmacy applications</p>
          </div>
        </div>
        <button onClick={() => fetchPharmacies(currentPage)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Total', value: stats.total, color: 'text-[#000F14]', bg: 'bg-gray-100' },
          { icon: Clock, label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: CheckCircle2, label: 'Approved', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: XCircle, label: 'Rejected', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`mt-0.5 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedPharmacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedPharmacy(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl z-10">
            {/* Detail header */}
            <div className="bg-gradient-to-r from-[#0FD452] to-[#0cb843] px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPharmacy.pharmacy_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70 font-mono">{selectedPharmacy.pharmacy_code}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-0.5 ${appCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${appCfg.dot}`} />
                      {appCfg.label}
                    </span>
                    <span className={`inline-flex rounded-full text-[10px] font-semibold px-2 py-0.5 ${payCfg.color}`}>{payCfg.label}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPharmacy(null)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Owner */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Owner Information</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoItem icon={User} label="Name" value={selectedPharmacy.owner?.name} />
                    <InfoItem icon={Phone} label="Phone" value={selectedPharmacy.owner?.phone} />
                    <InfoItem icon={Mail} label="Email" value={selectedPharmacy.owner?.email} />
                    <InfoItem icon={Hash} label="Code" value={selectedPharmacy.pharmacy_code} />
                  </div>
                </div>

                {/* Pharmacy */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Pharmacy Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoItem icon={Building2} label="Type" value={selectedPharmacy.pharmacy_type} />
                    <InfoItem icon={FileText} label="License No." value={selectedPharmacy.license_number} />
                    <InfoItem icon={MapPin} label="District" value={selectedPharmacy.district} />
                    <InfoItem icon={MapPin} label="Region" value={selectedPharmacy.region} />
                    <InfoItem icon={MapPin} label="Ward" value={selectedPharmacy.ward} />
                    <InfoItem icon={MapPin} label="Street" value={selectedPharmacy.street} />
                  </div>
                </div>
              </div>

              {/* Subscription & Payment */}
              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Subscription & Payment</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <InfoItem icon={CreditCard} label="Plan" value={selectedPharmacy.subscription_plan?.name || '—'} />
                  <InfoItem icon={CreditCard} label="Amount" value={selectedPharmacy.subscription_plan ? `TZS ${Number(selectedPharmacy.subscription_plan.price).toLocaleString()}` : '—'} />
                  <InfoItem icon={Calendar} label="Trial Ends" value={formatDate(selectedPharmacy.trial_ends_at)} />
                  <InfoItem icon={Calendar} label="Created" value={formatDate(selectedPharmacy.created_at)} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <Link to={`/dashboard/pharmacies/${selectedPharmacy.id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                  <Eye className="w-4 h-4" /> View Full Profile
                </Link>
                {selectedPharmacy.latitude && selectedPharmacy.longitude && (
                  <a href={`https://www.google.com/maps?q=${selectedPharmacy.latitude},${selectedPharmacy.longitude}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                    <ExternalLink className="w-4 h-4" /> Google Maps
                  </a>
                )}
                <div className="flex-1" />
                {selectedPharmacy.application_status === 'pending' && (
                  <>
                    <button onClick={() => setShowApproveModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl text-sm font-bold transition-all">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => setShowRejectModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {selectedPharmacy.application_status === 'approved' && selectedPharmacy.payment_status !== 'confirmed' && selectedPharmacy.payment_status !== 'paid' && (
                  <button onClick={() => { setPaymentPharmacy(selectedPharmacy); setShowPaymentModal(true) }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl text-sm font-bold transition-all">
                    <CreditCard className="w-4 h-4" /> Confirm Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, owner, code, email, phone..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-8 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 appearance-none cursor-pointer">
              <option value="all">All Applications</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl bg-white py-16 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
          <p className="text-sm text-gray-500 mt-2">Loading...</p>
        </div>
      ) : filteredPharmacies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <CheckCircle2 className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">No applications found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    { icon: Building2, label: 'Pharmacy' },
                    { icon: User, label: 'Owner', hide: 'md' },
                    { icon: MapPin, label: 'Location', hide: 'lg' },
                    { icon: ShieldCheck, label: 'Status' },
                    { icon: CreditCard, label: 'Payment', hide: 'sm' },
                    { icon: Calendar, label: 'Date', hide: 'lg' },
                  ].map((col) => (
                    <th key={col.label} className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${col.hide ? `hidden ${col.hide}:table-cell` : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <col.icon className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>{col.label}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Zap className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((p) => {
                  const initials = (p.pharmacy_name || 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                  const isSelected = selectedPharmacy?.id === p.id
                  return (
                    <tr key={p.id}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#0FD452]/10 border-l-4 border-l-[#0FD452]' : 'hover:bg-[#0FD452]/5'}`}
                      onClick={() => selectRow(p)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isSelected ? 'bg-[#0FD452]/20' : 'bg-[#000F14]/10'}`}>
                            <span className={`text-xs font-semibold ${isSelected ? 'text-[#0FD452]' : 'text-[#000F14]'}`}>{initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#000F14]">{p.pharmacy_name}</p>
                            <p className="text-xs text-gray-400 font-mono">{p.pharmacy_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-gray-600">{p.owner?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{p.owner?.email || ''}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-gray-600">{[p.district, p.region].filter(Boolean).join(', ') || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${(STATUS_CONFIG[p.application_status] || STATUS_CONFIG.pending).color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_CONFIG[p.application_status] || STATUS_CONFIG.pending).dot}`} />
                          {(STATUS_CONFIG[p.application_status] || STATUS_CONFIG.pending).label}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${(PAY_STATUS[p.payment_status] || PAY_STATUS.unpaid).color}`}>
                          {(PAY_STATUS[p.payment_status] || PAY_STATUS.unpaid).label}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-gray-500">{formatDate(p.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); selectRow(p) }}
                            className="btn-icon-primary" title="View details">
                            <Eye className="h-4 w-4" />
                          </button>
                          {p.application_status === 'pending' && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setSelectedPharmacy(p); setShowApproveModal(true) }}
                                className="btn-icon-primary" title="Approve">
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setSelectedPharmacy(p); setShowRejectModal(true) }}
                                className="btn-icon-red" title="Reject">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {p.application_status === 'approved' && p.payment_status !== 'confirmed' && p.payment_status !== 'paid' && (
                            <button onClick={(e) => { e.stopPropagation(); setPaymentPharmacy(p); setShowPaymentModal(true) }}
                              className="btn-icon-green" title="Confirm payment">
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredPharmacies.length > pageSize && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredPharmacies.length)} of {filteredPharmacies.length} entries
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-ghost">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page
                  if (totalPages <= 5) page = i + 1
                  else if (currentPage <= 3) page = i + 1
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                  else page = currentPage - 2 + i
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#0FD452] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {page}
                    </button>
                  )
                })}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-ghost">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
                <p className="text-xs text-gray-500">{selectedPharmacy?.pharmacy_name}</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-800">This will approve the pharmacy application and start their 7-day free trial. The owner will be notified.</p>
            </div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Comment (optional)</label>
            <textarea value={approveComment} onChange={(e) => setApproveComment(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/30 resize-none"
              placeholder="Any notes for this approval..." />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowApproveModal(false); setApproveComment('') }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleApprove} disabled={actionLoading}
                className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
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
                <p className="text-xs text-gray-500">{selectedPharmacy?.pharmacy_name}</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-800">This will reject the pharmacy application. The owner will be notified with the reason below.</p>
            </div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reason for rejection *</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 resize-none"
              placeholder="e.g. Invalid license number, missing documents..." />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showPaymentModal && paymentPharmacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowPaymentModal(false); setPaymentPharmacy(null); setPaymentNote('') }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Payment</h3>
                <p className="text-xs text-gray-500">{paymentPharmacy.pharmacy_name}</p>
              </div>
            </div>
            <div className="bg-[#0FD452]/5 border border-[#0FD452]/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-[#000F14]">Verify the payment has been received before confirming. This will activate the pharmacy's subscription immediately.</p>
            </div>
            {paymentPharmacy.subscription_plan && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Plan</p>
                    <p className="text-sm font-bold text-gray-900">{paymentPharmacy.subscription_plan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Amount</p>
                    <p className="text-sm font-bold text-[#0FD452]">TZS {Number(paymentPharmacy.subscription_plan.price).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Note (optional)</label>
            <textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/30 resize-none"
              placeholder="e.g. Payment received via bank transfer, reference #12345..." />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowPaymentModal(false); setPaymentPharmacy(null); setPaymentNote('') }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleConfirmPayment} disabled={actionLoading}
                className="flex-1 py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
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
