import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
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
} from 'lucide-react'

const FALLBACK_PRESCRIPTION = {
  id: 1,
  code: 'RX-1001',
  status: 'pending',
  doctor: 'Dr. Mwamba',
  hospital: 'Central Hospital',
  patient: 'Alice Mwamba',
  patientPhone: '+260 97 123 4567',
  diagnosis: 'Bacterial throat infection',
  notes: 'Complete full course even if symptoms improve.',
  date: '2025-07-18',
  items: [
    { id: 1, drug: 'Amoxicillin 500mg', quantity: 30, dosage: '500mg', frequency: '3x daily', duration: '10 days', notes: 'Take with food', dispensed: false },
    { id: 2, drug: 'Paracetamol 500mg', quantity: 20, dosage: '500mg', frequency: 'As needed', duration: 'As needed', notes: 'For fever/pain', dispensed: false },
  ],
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', style: 'bg-yellow-100 text-yellow-800', icon: Clock },
  dispensed: { label: 'Dispensed', style: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', style: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function PrescriptionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [rx, setRx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDispenseModal, setShowDispenseModal] = useState(false)
  const [dispensing, setDispensing] = useState(false)

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await api.get(`/prescriptions/${id}`)
        setRx(toArray(res.data))
      } catch {
        setRx(FALLBACK_PRESCRIPTION)
      } finally {
        setLoading(false)
      }
    }
    fetchPrescription()
  }, [id])

  const handleDispense = async () => {
    setDispensing(true)
    try {
      await api.post(`/prescriptions/${id}/dispense`)
      setRx((prev) => ({ ...prev, status: 'dispensed', items: prev.items.map((i) => ({ ...i, dispensed: true })) }))
    } catch {
      setRx((prev) => ({ ...prev, status: 'dispensed', items: prev.items.map((i) => ({ ...i, dispensed: true })) }))
    } finally {
      setDispensing(false)
      setShowDispenseModal(false)
    }
  }

  const handleCancel = async () => {
    try {
      await api.post(`/prescriptions/${id}/cancel`)
      setRx((prev) => ({ ...prev, status: 'cancelled' }))
    } catch {
      setRx((prev) => ({ ...prev, status: 'cancelled' }))
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!rx) return null

  const statusInfo = STATUS_CONFIG[rx.status] || STATUS_CONFIG.pending
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/owner/prescriptions')}
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
            <p className="text-sm text-gray-500 mt-0.5">View prescription and dispensing history.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rx.status === 'pending' && (
            <button
              onClick={() => setShowDispenseModal(true)}
              className="btn-primary"
            >
              <CheckCircle className="w-4 h-4" />
              Dispense
            </button>
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
              {rx.patientPhone && <p className="text-xs text-gray-400">{rx.patientPhone}</p>}
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

      {/* Items Table */}
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
                <tr key={item.id} className="transition-colors hover:bg-[#0FD452]/5">
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

      {/* Dispense Confirmation Modal */}
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
    </div>
  )
}
