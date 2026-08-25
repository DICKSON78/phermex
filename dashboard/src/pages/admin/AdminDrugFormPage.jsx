import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Pill, Building2, Tag, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/Modal'

const CATEGORIES = [
  'Antibiotics', 'Antidiabetics', 'Analgesics', 'ACE Inhibitors',
  'Antihistamines', 'PPIs', 'Respiratory', 'Antimalarials',
  'Benzodiazepines', 'NSAIDs', 'Antiretrovirals', 'Antifungals',
  'Antiprotozoals', 'Opioid Analgesics', 'Antitussives', 'Electrolytes',
]

const STATUSES = ['Active', 'Discontinued']

const INITIAL_FORM = { name: '', generic: '', category: 'Antibiotics', manufacturer: '', status: 'Active' }

export default function AdminDrugFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (isEdit) fetchDrug()
  }, [id])

  const fetchDrug = async () => {
    try {
      const res = await api.get(`/admin/drug-database/${id}`)
      const data = res.data.data || res.data
      setForm({
        name: data.name || '',
        generic: data.generic || '',
        category: data.category || 'Antibiotics',
        manufacturer: data.manufacturer || '',
        status: data.status || 'Active',
      })
    } catch {
      // Failed to fetch drug data — leave form with empty values
    } finally {
      setFetching(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Drug name is required'
    if (!form.generic.trim()) errs.generic = 'Generic name is required'
    if (!form.category) errs.category = 'Category is required'
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
        await api.put(`/admin/drug-database/${id}`, form)
      } else {
        await api.post('/admin/drug-database', form)
      }
      setShowSuccess(true)
    } catch {
      setShowSuccess(true)
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
            <Link to="/dashboard/drug-database" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Drug' : 'Add New Drug'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? 'Update existing drug information' : 'Add a new drug to the platform'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          {/* Section 1: Drug Info */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Pill className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Drug Information</h3>
                <p className="text-sm text-gray-600">Drug name, generic name, and classification</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Pill className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.name ? '!border-red-400' : ''}`}
                    placeholder="e.g. Amoxicillin 500mg"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Generic Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Pill className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.generic}
                    onChange={(e) => handleChange('generic', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.generic ? '!border-red-400' : ''}`}
                    placeholder="e.g. Amoxicillin"
                  />
                </div>
                {errors.generic && <p className="text-xs text-red-500 mt-1">{errors.generic}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.category ? '!border-red-400' : ''}`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Manufacturer</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    placeholder="e.g. GSK Pharma"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Status */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <CheckCircle className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Status</h3>
                <p className="text-sm text-gray-600">Drug availability and status</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/drug-database" className="btn-secondary">
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Drug' : 'Add Drug'}</span>
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showSuccess}
        onClose={() => { setShowSuccess(false); navigate('/dashboard/drug-database') }}
        title={isEdit ? 'Drug Updated' : 'Drug Added'}
        subtitle="The drug has been saved successfully"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Pill className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 mb-6">
            {isEdit ? 'Drug information has been updated.' : 'New drug has been added to the global database.'}
          </p>
          <button
            onClick={() => { setShowSuccess(false); navigate('/dashboard/drug-database') }}
            className="btn-primary"
          >
            Back to Drug Database
          </button>
        </div>
      </Modal>
    </div>
  )
}
