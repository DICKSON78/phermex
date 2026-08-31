import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { currentBase } from '../../utils/roles'
import {
  ArrowLeft,
  FileText,
  Stethoscope,
  Building2,
  User,
  Pill,
  CheckCircle,
  XCircle,
  Printer,
  Clock,
  Loader2,
  AlertTriangle,
  Package,
  Calendar,
  Search,
  Plus,
  Trash2,
  Hash,
  Phone,
  Image as ImageIcon,
  DollarSign,
} from 'lucide-react'


const STATUS_CONFIG = {
  pending: { label: 'Pending', style: 'bg-yellow-100 text-yellow-800', icon: Clock },
  dispensed: { label: 'Dispensed', style: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', style: 'bg-red-100 text-red-800', icon: XCircle },
}

function normalizeItems(items) {
  return toArray(items).map((item) => ({
    ...item,
    key: item.id ?? Math.random(),
    drug: typeof item.drug === 'object' && item.drug ? item.drug.name : (item.drug || 'Unknown'),
    drug_id: item.drug_id || (typeof item.drug === 'object' && item.drug ? item.drug.id : null),
    quantity: item.quantity ?? 0,
    dosage: item.dosage || '',
    frequency: item.frequency || '',
    duration: item.duration || '',
    notes: item.notes || '',
    dispensed: !!item.is_dispensed,
  }))
}

function normalizeRx(raw) {
  if (!raw) return null
  const customer = raw.customer && typeof raw.customer === 'object' ? raw.customer : null
  const items = normalizeItems(raw.items)
  return {
    ...raw,
    id: raw.id,
    code: raw.prescription_code || raw.code || raw.id || 'N/A',
    doctor: raw.doctor_name || raw.doctor || 'N/A',
    hospital: raw.hospital_name || raw.hospital || 'N/A',
    diagnosis: raw.diagnosis || '',
    notes: raw.notes || '',
    photo: raw.photo || null,
    status: raw.status || 'pending',
    dispenser: raw.dispenser || null,
    patient: customer?.full_name || customer?.name || (typeof raw.patient === 'string' ? raw.patient : 'N/A'),
    patientPhone: customer?.phone || (raw.patientPhone || ''),
    customer,
    items,
  }
}

export default function PrescriptionDetailPage() {
  const navigate = useNavigate()
  const base = currentBase()
  const { id } = useParams()
  const { pharmacyId } = useAuth()
  const [rx, setRx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDispenseModal, setShowDispenseModal] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [dispensing, setDispensing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState(null)

  // Process & Dispense (photo prescription) state
  const [allDrugs, setAllDrugs] = useState([])
  const [drugsLoading, setDrugsLoading] = useState(false)
  const [drugSearch, setDrugSearch] = useState('')
  const [selectedDrugs, setSelectedDrugs] = useState([])

  const fetchPrescription = async () => {
    try {
      const res = await api.get(`/prescriptions/${id}`)
      const data = res.data?.prescription || toArray(res.data)[0] || res.data
      setRx(normalizeRx(data))
    } catch {
      setRx(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrescription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const isPhotoPrescription = rx && rx.items.length === 0 && !!rx.photo

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDispense = async () => {
    setDispensing(true)
    try {
      await api.post(`/prescriptions/${id}/dispense`)
      showToast('Prescription dispensed successfully')
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to dispense', 'error')
    }
    setRx((prev) => ({ ...prev, status: 'dispensed', items: (prev.items || []).map((i) => ({ ...i, dispensed: true })) }))
    setDispensing(false)
    setShowDispenseModal(false)
  }

  const handleCancel = async () => {
    try {
      await api.post(`/prescriptions/${id}/cancel`)
      showToast('Prescription cancelled')
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to cancel', 'error')
    }
    setRx((prev) => ({ ...prev, status: 'cancelled' }))
  }

  const openProcessModal = async () => {
    setSelectedDrugs([])
    setDrugSearch('')
    setShowProcessModal(true)
    setDrugsLoading(true)
    try {
      const params = new URLSearchParams()
      if (pharmacyId) params.set('pharmacy_id', pharmacyId)
      params.set('per_page', 200)
      const res = await api.get(`/drugs?${params.toString()}`)
      setAllDrugs(toArray(res.data, res.data?.data || []))
    } catch {
      setAllDrugs([])
    } finally {
      setDrugsLoading(false)
    }
  }

  const filteredDrugs = allDrugs.filter((d) => {
    if (!drugSearch.trim()) return true
    const q = drugSearch.toLowerCase()
    return (d.name || '').toLowerCase().includes(q) ||
      (d.generic_name || '').toLowerCase().includes(q) ||
      (d.barcode || '').toLowerCase().includes(q)
  })

  const addDrug = (drug) => {
    if (selectedDrugs.some((s) => s.drug_id === drug.id)) {
      showToast('Drug already added', 'error')
      return
    }
    setSelectedDrugs((prev) => [...prev, { drug_id: drug.id, name: drug.name, price: Number(drug.selling_price) || 0, quantity: 1, drug }])
  }

  const removeDrug = (drugId) => {
    setSelectedDrugs((prev) => prev.filter((s) => s.drug_id !== drugId))
  }

  const setQty = (drugId, qty) => {
    const q = Math.max(1, Number(qty) || 1)
    setSelectedDrugs((prev) => prev.map((s) => (s.drug_id === drugId ? { ...s, quantity: q } : s)))
  }

  const processTotal = selectedDrugs.reduce((sum, s) => sum + (s.price * s.quantity), 0)

  const handleProcess = async () => {
    if (selectedDrugs.length === 0) {
      showToast('Add at least one drug', 'error')
      return
    }
    setProcessing(true)
    try {
      const payload = {
        items: selectedDrugs.map((s) => ({ drug_id: s.drug_id, quantity: s.quantity })),
        total: processTotal,
      }
      const res = await api.post(`/prescriptions/${id}/process`, payload)
      showToast(res.data?.message || 'Prescription processed successfully')
      setShowProcessModal(false)
      await fetchPrescription()
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to process prescription', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!rx) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Prescription not found</p>
          <button onClick={() => navigate(`${base}/prescriptions`)} className="text-[#0FD452] mt-2 text-sm font-medium hover:underline">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = STATUS_CONFIG[rx.status] || STATUS_CONFIG.pending
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${base}/prescriptions`)}
            className="btn-ghost"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{rx.code}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.style}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {isPhotoPrescription ? 'Customer-uploaded prescription — process to dispense.' : 'View prescription and dispensing history.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {rx.status === 'pending' && (
            <>
              {isPhotoPrescription ? (
                <button
                  onClick={openProcessModal}
                  className="btn-primary"
                >
                  <Pill className="w-4 h-4" />
                  Process &amp; Dispense
                </button>
              ) : (
                <button
                  onClick={() => setShowDispenseModal(true)}
                  className="btn-primary"
                >
                  <CheckCircle className="w-4 h-4" />
                  Dispense
                </button>
              )}
            </>
          )}
          <button
            onClick={() => window.print()}
            className="btn-secondary"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          {rx.status === 'pending' && (
            <button
              onClick={handleCancel}
              className="btn-danger-outline"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Stethoscope className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Doctor</p>
              <p className="text-sm font-medium text-dark">{rx.doctor}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 className="w-4.5 h-4.5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Hospital / Clinic</p>
              <p className="text-sm font-medium text-dark">{rx.hospital || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4.5 h-4.5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Patient</p>
              <p className="text-sm font-medium text-dark">{rx.patient}</p>
              {rx.patientPhone && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {rx.patientPhone}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-4.5 h-4.5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Diagnosis</p>
              <p className="text-sm font-medium text-dark">{rx.diagnosis || 'N/A'}</p>
            </div>
          </div>
        </div>
        {rx.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-dark">{rx.notes}</p>
          </div>
        )}
      </div>

      {/* Photo prescription: customer info + photo */}
      {isPhotoPrescription && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-[#0FD452]" />
              Prescription Photo
            </h2>
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ minHeight: '260px' }}>
              {rx.photo ? (
                <img src={rx.photo} alt="Prescription" className="max-h-[420px] w-full object-contain" />
              ) : (
                <span className="text-sm text-gray-400">No photo available</span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-[#0FD452]" />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0FD452]/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#0FD452]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Name</p>
                    <p className="text-sm font-medium text-dark">{rx.patient}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-dark">{rx.patientPhone || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-[#0FD452]" />
                No Items Yet
              </h2>
              <p className="text-sm text-gray-500">
                This prescription was uploaded by the customer as a photo. Use the
                <strong> Process &amp; Dispense</strong> button to select the drugs and quantities
                required, then submit to create the order.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Items Table (pharmacy-created prescriptions) */}
      {!isPhotoPrescription && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Prescription Items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Drug</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Qty</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Dosage</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Frequency</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Duration</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Status</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rx.items.map((item) => (
                  <tr key={item.key} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Pill className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.drug}</p>
                          {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{item.dosage}</td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{item.frequency}</td>
                    <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">{item.duration}</td>
                    <td className="px-6 py-4">
                      {item.dispensed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Dispensed
                        </span>
                      ) : rx.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispense Confirmation Modal (pharmacy-created) */}
      {showDispenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDispenseModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-[90%] max-w-sm text-center z-10">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-lg font-bold text-dark mb-1">Dispense Prescription?</h2>
            <p className="text-sm text-gray-400 mb-1">
              This will mark all items as dispensed and create an order.
            </p>
            <p className="text-xs text-gray-400 mb-5">
              {rx.items.length} item(s) &mdash; {rx.code}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDispenseModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDispense}
                disabled={dispensing}
                className="btn-primary"
              >
                {dispensing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Dispense
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process & Dispense Modal (photo prescription) */}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProcessModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-xl z-10 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Process &amp; Dispense</h2>
                <p className="text-xs text-gray-500">Select drugs and quantities to dispense for {rx.code}</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Drug search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={drugSearch}
                  onChange={(e) => setDrugSearch(e.target.value)}
                  placeholder="Search drugs by name..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </div>

              {/* Available drugs */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Drugs</p>
                {drugsLoading ? (
                  <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading drugs...
                  </div>
                ) : filteredDrugs.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400">
                    {allDrugs.length === 0 ? 'No drugs found for this pharmacy.' : 'No drugs match your search.'}
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                    {filteredDrugs.map((d) => {
                      const inCart = selectedDrugs.some((s) => s.drug_id === d.id)
                      return (
                        <button
                          key={d.id}
                          disabled={inCart}
                          onClick={() => addDrug(d)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                            inCart ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#0FD452]/5'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{d.name}</p>
                            <p className="text-xs text-gray-400">Stock: {d.quantity || 0}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#0FD452]">
                              {Number(d.selling_price || 0).toLocaleString()}
                            </span>
                            <Plus className="w-4 h-4 text-[#0FD452]" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Selected items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Selected Items</p>
                {selectedDrugs.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-xl">
                    No drugs selected yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDrugs.map((s) => (
                      <div key={s.drug_id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                          <p className="text-xs text-gray-400">{Number(s.price).toLocaleString()} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Qty</span>
                          <input
                            type="number"
                            min="1"
                            value={s.quantity}
                            onChange={(e) => setQty(s.drug_id, e.target.value)}
                            className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-center outline-none focus:border-[#0FD452]"
                          />
                          <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                            {(s.price * s.quantity).toLocaleString()}
                          </span>
                          <button
                            onClick={() => removeDrug(s.drug_id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-[#0FD452]/5 border border-[#0FD452]/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#0FD452]" />
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{processTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowProcessModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleProcess}
                disabled={processing || selectedDrugs.length === 0}
                className="btn-primary"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Process &amp; Dispense
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#000F14] text-white'}`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
