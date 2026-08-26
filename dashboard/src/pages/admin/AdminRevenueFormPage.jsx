import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, DollarSign, Building2, Calendar, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/Modal'

const INITIAL_FORM = { pharmacy_id: '', amount: '', dueDate: '', notes: '' }

export default function AdminRevenueFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pharmacies, setPharmacies] = useState([])

  useEffect(() => {
    fetchPharmacies()
    if (isEdit) fetchInvoice()
  }, [id])

  const fetchPharmacies = async () => {
    try {
      const res = await api.get('/admin/pharmacies')
      setPharmacies(res.data?.data || res.data || [])
    } catch {
      setPharmacies([])
    }
  }

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/admin/revenue/${id}`)
      const data = res.data.data || res.data
      setForm({
        pharmacy_id: data.pharmacy_id || '',
        amount: data.amount?.toString() || '',
        dueDate: data.dueDate || '',
        notes: data.notes || '',
      })
    } catch {
      // Failed to fetch invoice data — leave form with empty values
    } finally {
      setFetching(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.pharmacy_id) errs.pharmacy_id = 'Pharmacy is required'
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Valid amount is required'
    if (!form.dueDate) errs.dueDate = 'Due date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/admin/revenue/${id}`, { ...form, amount: Number(form.amount) })
      } else {
        await api.post('/admin/revenue', { ...form, amount: Number(form.amount) })
      }
      setShowSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/revenue" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? 'Update existing invoice details' : 'Add a new invoice to the platform'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          {/* Section 1: Invoice Info */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invoice Information</h3>
                <p className="text-sm text-gray-600">Pharmacy, amount, and due date details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Pharmacy <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.pharmacy_id}
                    onChange={(e) => handleChange('pharmacy_id', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.pharmacy_id ? '!border-red-400' : ''}`}
                  >
                    <option value="">Select a pharmacy</option>
                    {pharmacies.map((p) => (
                      <option key={p.id} value={p.id}>{p.pharmacy_name || p.name}</option>
                    ))}
                  </select>
                </div>
                {errors.pharmacy_id && <p className="text-xs text-red-500 mt-1">{errors.pharmacy_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Amount (TZS) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.amount ? '!border-red-400' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.dueDate ? '!border-red-400' : ''}`}
                  />
                </div>
                {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Payment & Notes */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment & Notes</h3>
                <p className="text-sm text-gray-600">Additional notes and payment references</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/revenue" className="btn-secondary">
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Invoice' : 'Create Invoice'}</span>
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showSuccess}
        onClose={() => { setShowSuccess(false); navigate('/dashboard/revenue') }}
        title={isEdit ? 'Invoice Updated' : 'Invoice Created'}
        subtitle="The invoice has been saved successfully"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 mb-6">
            {isEdit ? 'Invoice details have been updated.' : 'New invoice has been created and is pending payment.'}
          </p>
          <button
            onClick={() => { setShowSuccess(false); navigate('/dashboard/revenue') }}
            className="btn-primary"
          >
            Back to Revenue
          </button>
        </div>
      </Modal>
    </div>
  )
}
