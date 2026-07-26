import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Save,
  CheckCircle,
  Loader2,
  User,
  Stethoscope,
  Building2,
  FileText,
  Pill,
  X,
} from 'lucide-react'


const FREQUENCIES = ['1x daily', '2x daily', '3x daily', '4x daily', 'Once', 'As needed', 'Every 8 hours', 'Every 12 hours']

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 2,
  }).format(amount)
}

function createEmptyItem() {
  return {
    id: Date.now() + Math.random(),
    drugId: null,
    drugName: '',
    quantity: 1,
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  }
}

export default function PrescriptionFormPage() {
  const navigate = useNavigate()

  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    patientId: null,
    doctorName: '',
    hospital: '',
    diagnosis: '',
    notes: '',
  })

  const [items, setItems] = useState([createEmptyItem()])
  const [drugSearchIndex, setDrugSearchIndex] = useState(null)
  const [drugSearchQuery, setDrugSearchQuery] = useState('')

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await api.get('/drugs')
        setDrugs(toArray(res.data))
      } catch {
        setDrugs([])
      } finally {
        setLoading(false)
      }
    }
    fetchDrugs()
  }, [])

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()])
  }

  const removeItem = (index) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const selectDrug = (index, drug) => {
    updateItem(index, 'drugId', drug.id)
    updateItem(index, 'drugName', drug.name)
    setDrugSearchIndex(null)
    setDrugSearchQuery('')
  }

  const filteredDrugResults =
    drugSearchQuery.trim() && drugSearchIndex !== null
      ? drugs.filter(
          (d) =>
            d.name.toLowerCase().includes(drugSearchQuery.toLowerCase()) && d.stock > 0
        )
      : []

  const totalEstimate = items.reduce((sum, item) => {
    const drug = drugs.find((d) => d.id === item.drugId)
    return sum + (drug ? drug.price * item.quantity : 0)
  }, 0)

  const canSubmit = form.patientName.trim() && form.doctorName.trim() && items.some((i) => i.drugId)

  const submit = async (dispense = false) => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const payload = {
        patient_name: form.patientName,
        patient_phone: form.patientPhone,
        doctor_name: form.doctorName,
        hospital: form.hospital,
        diagnosis: form.diagnosis,
        notes: form.notes,
        status: dispense ? 'dispensed' : 'pending',
        items: items
          .filter((i) => i.drugId)
          .map((i) => ({
            drug_id: i.drugId,
            quantity: i.quantity,
            dosage: i.dosage,
            frequency: i.frequency,
            duration: i.duration,
            notes: i.notes,
          })),
      }
      await api.post('/prescriptions', payload)
      navigate('/owner/prescriptions')
    } catch {
      navigate('/owner/prescriptions')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/owner/prescriptions" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Prescription</h1>
          </div>
          <p className="text-gray-600">Create a new prescription for a patient</p>
        </div>
      </div>

      {/* Patient & Doctor Info Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Patient & Doctor Information</h3>
              <p className="text-sm text-gray-600">Patient details and prescriber info</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Patient Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(e) => updateForm('patientName', e.target.value)}
                  placeholder="e.g. Alice Mwamba"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={form.patientPhone}
                  onChange={(e) => updateForm('patientPhone', e.target.value)}
                  placeholder="e.g. +260 97 123 4567"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Doctor Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={form.doctorName}
                  onChange={(e) => updateForm('doctorName', e.target.value)}
                  placeholder="e.g. Dr. Mwamba"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Hospital / Clinic</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={form.hospital}
                  onChange={(e) => updateForm('hospital', e.target.value)}
                  placeholder="e.g. Central Hospital"
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Diagnosis</label>
              <div className="relative">
                <div className="absolute top-3 left-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <textarea
                  rows={3}
                  value={form.diagnosis}
                  onChange={(e) => updateForm('diagnosis', e.target.value)}
                  placeholder="Enter diagnosis..."
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Items Section */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Pill className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Medications</h3>
                <p className="text-sm text-gray-600">Add prescribed medications</p>
              </div>
            </div>
            <button
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0FD452] hover:bg-[#0FD452]/10 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 border border-gray-200 relative"
              >
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  {/* Drug Search */}
                  <div className="md:col-span-2 relative">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Drug *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={drugSearchIndex === index ? drugSearchQuery : item.drugName}
                        onFocus={() => { setDrugSearchIndex(index); setDrugSearchQuery(item.drugName || '') }}
                        onChange={(e) => { setDrugSearchIndex(index); setDrugSearchQuery(e.target.value); if (item.drugId) updateItem(index, 'drugId', null) }}
                        placeholder="Search drug..."
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                      />
                    </div>
                    {drugSearchIndex === index && filteredDrugResults.length > 0 && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setDrugSearchIndex(null)} />
                        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredDrugResults.map((drug) => (
                            <button
                              key={drug.id}
                              onClick={() => selectDrug(index, drug)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition"
                            >
                              <span className="text-gray-900">{drug.name}</span>
                              <span className="text-xs text-gray-400">{formatCurrency(drug.price)}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Dosage */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Dosage</label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Frequency</label>
                    <select
                      value={item.frequency}
                      onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    >
                      <option value="">Select...</option>
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Duration</label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => updateItem(index, 'duration', e.target.value)}
                      placeholder="e.g. 7 days"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                </div>

                {/* Item Notes */}
                <div className="mt-3">
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    placeholder="Item notes (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-xs placeholder-gray-400"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-end border-t border-gray-200 pt-3">
            <span className="text-sm text-gray-500 mr-3">Estimated Total:</span>
            <span className="text-lg font-bold text-[#0FD452]">{formatCurrency(totalEstimate)}</span>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
              <FileText className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Additional Notes</h3>
              <p className="text-sm text-gray-600">Any extra notes for the prescription</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
              <div className="relative">
                <div className="absolute top-3 left-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder="Additional notes..."
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
          <Link to="/owner/prescriptions" className="btn-secondary">
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Link>
          <button
            onClick={() => submit(false)}
            disabled={!canSubmit || submitting}
            className="btn-secondary"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Prescription</span>
          </button>
          <button
            onClick={() => submit(true)}
            disabled={!canSubmit || submitting}
            className="btn-primary"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>Save & Dispense</span>
          </button>
        </div>
      </div>
    </div>
  )
}
