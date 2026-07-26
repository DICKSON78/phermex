import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  X,
  Pill,
  DollarSign,
  Package,
  FileText,
  Loader2,
} from 'lucide-react'
import api from '../../services/api'

const UNITS = ['Tablets', 'Capsules', 'Bottles', 'Tubes', 'Vials', 'Sachets', 'Syrup']

const INITIAL_FORM = {
  name: '',
  generic_name: '',
  category_id: '',
  description: '',
  buying_price: '',
  selling_price: '',
  wholesale_price: '',
  quantity: '',
  unit: 'Tablets',
  reorder_level: '10',
  batch_number: '',
  expiry_date: '',
  manufacturer: '',
  nafdac_number: '',
  barcode: '',
  requires_prescription: false,
  is_generic: false,
  is_published: true,
}

function generateBarcode() {
  const chars = '0123456789'
  let code = ''
  for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function DrugFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ ...INITIAL_FORM, barcode: generateBarcode() })
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/drug-categories')
      setCategories(Array.isArray(response.data.data) ? response.data.data : [])
    } catch {
      setCategories([])
    }
  }, [])

  const fetchDrug = useCallback(async () => {
    if (!isEdit) return
    setFetching(true)
    try {
      const response = await api.get(`/drugs/${id}`)
      const drug = response.data.data || response.data
      setForm({
        name: drug.name || '',
        generic_name: drug.generic_name || '',
        category_id: drug.category_id || '',
        description: drug.description || '',
        buying_price: drug.buying_price?.toString() || '',
        selling_price: drug.selling_price?.toString() || '',
        wholesale_price: drug.wholesale_price?.toString() || '',
        quantity: drug.quantity?.toString() || '',
        unit: drug.unit || 'Tablets',
        reorder_level: drug.reorder_level?.toString() || '10',
        batch_number: drug.batch_number || '',
        expiry_date: drug.expiry_date || '',
        manufacturer: drug.manufacturer || '',
        nafdac_number: drug.nafdac_number || '',
        barcode: drug.barcode || generateBarcode(),
        requires_prescription: drug.requires_prescription || false,
        is_generic: drug.is_generic || false,
        is_published: drug.is_published !== false,
      })
    } catch {
      // Drug fetch failed — form stays at initial empty state
    } finally {
      setFetching(false)
    }
  }, [id, isEdit])

  useEffect(() => {
    fetchCategories()
    fetchDrug()
  }, [fetchCategories, fetchDrug])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Drug name is required'
    if (!form.buying_price || Number(form.buying_price) <= 0) errs.buying_price = 'Valid buying price is required'
    if (!form.selling_price || Number(form.selling_price) <= 0) errs.selling_price = 'Valid selling price is required'
    if (!form.quantity || Number(form.quantity) < 0) errs.quantity = 'Valid quantity is required'
    if (Number(form.selling_price) < Number(form.buying_price)) errs.selling_price = 'Selling price should be higher than buying price'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const payload = {
      ...form,
      buying_price: Number(form.buying_price),
      selling_price: Number(form.selling_price),
      wholesale_price: form.wholesale_price ? Number(form.wholesale_price) : null,
      quantity: Number(form.quantity),
      reorder_level: Number(form.reorder_level),
      category_id: form.category_id ? Number(form.category_id) : null,
    }

    try {
      if (isEdit) {
        await api.put(`/drugs/${id}`, payload)
      } else {
        await api.post('/drugs', payload)
      }
      navigate('/owner/drugs')
    } catch {
      navigate('/owner/drugs')
    } finally {
      setSubmitting(false)
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/owner/drugs" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Drug' : 'Create New Drug'}</h1>
          </div>
          <p className="text-gray-600">{isEdit ? 'Update existing drug details' : 'Add a new drug to inventory'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Drug Info Section */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Pill className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Drug Information</h3>
                <p className="text-sm text-gray-600">Basic details about the medication</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Drug Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Pill className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Generic Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Pill className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.generic_name}
                    onChange={(e) => handleChange('generic_name', e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.category_id}
                    onChange={(e) => handleChange('category_id', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Manufacturer</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    placeholder="e.g. PharmaCorp"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pricing</h3>
                <p className="text-sm text-gray-600">Set buying and selling prices</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Buying Price (TZS) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.buying_price}
                    onChange={(e) => handleChange('buying_price', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.buying_price && <p className="text-xs text-red-500 mt-1">{errors.buying_price}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Selling Price (TZS) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.selling_price}
                    onChange={(e) => handleChange('selling_price', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.selling_price && <p className="text-xs text-red-500 mt-1">{errors.selling_price}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Wholesale Price (TZS)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.wholesale_price}
                    onChange={(e) => handleChange('wholesale_price', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
            </div>
            {form.buying_price && form.selling_price && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">
                  Profit Margin:{' '}
                  <span className="font-semibold text-[#0FD452]">
                    TZS {((Number(form.selling_price) - Number(form.buying_price)).toFixed(2))}
                  </span>
                  <span className="text-gray-400 ml-2">
                    ({((Number(form.selling_price) - Number(form.buying_price)) / Number(form.buying_price) * 100).toFixed(1)}%)
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Stock Section */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Package className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Stock</h3>
                <p className="text-sm text-gray-600">Inventory and batch information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    placeholder="0"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Unit</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Reorder Level</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={(e) => handleChange('reorder_level', e.target.value)}
                    placeholder="10"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Batch Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.batch_number}
                    onChange={(e) => handleChange('batch_number', e.target.value)}
                    placeholder="e.g. BATCH-001"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Expiry Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => handleChange('expiry_date', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Additional Details</h3>
                <p className="text-sm text-gray-600">Description, identifiers and flags</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Drug description..."
                    rows={3}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Side Effects</label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <textarea
                    placeholder="List any known side effects..."
                    rows={3}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">NAFDAC Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.nafdac_number}
                    onChange={(e) => handleChange('nafdac_number', e.target.value)}
                    placeholder="e.g. A1-12345"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Barcode</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.barcode}
                    readOnly
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Auto-generated barcode</p>
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requires_prescription}
                      onChange={(e) => handleChange('requires_prescription', e.target.checked)}
                      className="w-4 h-4 text-[#0FD452] bg-gray-100 border-gray-300 rounded focus:ring-[#0FD452]"
                    />
                    <span className="text-sm font-semibold text-gray-900">Requires Prescription</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_generic}
                      onChange={(e) => handleChange('is_generic', e.target.checked)}
                      className="w-4 h-4 text-[#0FD452] bg-gray-100 border-gray-300 rounded focus:ring-[#0FD452]"
                    />
                    <span className="text-sm font-semibold text-gray-900">Is Generic</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(e) => handleChange('is_published', e.target.checked)}
                      className="w-4 h-4 text-[#0FD452] bg-gray-100 border-gray-300 rounded focus:ring-[#0FD452]"
                    />
                    <span className="text-sm font-semibold text-gray-900">Is Published</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/owner/drugs" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Drug' : 'Create Drug'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
