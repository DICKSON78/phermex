import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Loader2, DollarSign, FileText, CreditCard, StickyNote } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const defaultCategories = ['Rent', 'Utilities', 'Supplies', 'Salaries', 'Transport', 'Other']


export default function ExpenseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0], receipt_number: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [categories, setCategories] = useState(defaultCategories)
  const [customCategory, setCustomCategory] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    if (isEdit) fetchExpense()
    loadCategories()
  }, [id])

  const loadCategories = async () => {
    try {
      const res = await api.get('/expenses/categories')
      if (res.data?.categories?.length) setCategories(res.data.categories)
    } catch (e) { /* use defaults */ }
  }

  const fetchExpense = async () => {
    try {
      const res = await api.get(`/expenses/${id}`)
      const data = toArray(res.data)
      const cat = data.category || ''
      const known = categories.includes(cat)
      setForm({
        category: known ? cat : '',
        description: data.description || '',
        amount: data.amount || '',
        date: data.date || '',
        receipt_number: data.receipt_number || '',
        notes: data.notes || '',
      })
      if (cat && !known) {
        setShowCustom(true)
        setCustomCategory(cat)
      }
    } catch {
      setForm({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0], receipt_number: '', notes: '' })
    } finally {
      setFetching(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.category && !customCategory.trim()) errs.category = 'Category is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Valid amount is required'
    if (!form.date) errs.date = 'Date is required'
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
    const payload = { ...form, category: customCategory.trim() ? customCategory.trim() : form.category }
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/expenses/${id}`, payload)
      } else {
        await api.post('/expenses', payload)
      }
      navigate('/dashboard/expenses')
    } catch {
      toast.error('Failed to save expense')
      navigate('/dashboard/expenses')
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/expenses" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Expense' : 'Create New Expense'}</h1>
          </div>
          <p className="text-gray-600">{isEdit ? 'Update existing expense details' : 'Record a new expense'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Expense Info Section */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Expense Information</h3>
                <p className="text-sm text-gray-600">What was the expense for</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="What was this expense for?"
                    rows={3}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                  />
                </div>
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Category <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={showCustom ? '__new__' : form.category}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowCustom(true)
                        setCustomCategory('')
                        setForm((prev) => ({ ...prev, category: '' }))
                      } else {
                        setShowCustom(false)
                        setCustomCategory('')
                        setForm((prev) => ({ ...prev, category: e.target.value }))
                      }
                    }}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__new__">+ New category...</option>
                  </select>
                </div>
                {showCustom && (
                  <div className="relative mt-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter new category name"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                )}
                {!showCustom && errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Amount (TZS) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <CreditCard className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
                <p className="text-sm text-gray-600">Date and receipt information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Receipt Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.receipt_number}
                    onChange={(e) => handleChange('receipt_number', e.target.value)}
                    placeholder="REC-XXX"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <StickyNote className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Notes</h3>
                <p className="text-sm text-gray-600">Any additional notes about this expense</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <StickyNote className="w-4 h-4 text-gray-400" />
                  </div>
                  <textarea
                    value={form.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Additional notes about this expense..."
                    rows={3}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/expenses" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Expense' : 'Create Expense'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
