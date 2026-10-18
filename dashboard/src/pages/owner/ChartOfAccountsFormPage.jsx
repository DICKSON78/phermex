import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, X, Loader2, BookOpen, Hash, Layers, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { accounts } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const ACCOUNT_TYPES = [
  { id: 'asset', label: 'Assets' },
  { id: 'liability', label: 'Liabilities' },
  { id: 'equity', label: 'Equity' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'expense', label: 'Expenses' },
]

export default function ChartOfAccountsFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pharmacyId } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ account_code: '', account_name: '', account_type: 'asset', parent_id: '', description: '', currency: 'TZS' })
  const [parentAccounts, setParentAccounts] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    loadParentAccounts()
    if (isEdit) fetchAccount()
  }, [id])

  const loadParentAccounts = async () => {
    try {
      const res = await accounts.getAll({ per_page: 200 })
      setParentAccounts(res.data.data || [])
    } catch { setParentAccounts([]) }
  }

  const fetchAccount = async () => {
    try {
      const res = await accounts.getById(id)
      const a = res.data.account
      setForm({
        account_code: a.account_code || '',
        account_name: a.account_name || '',
        account_type: a.account_type || 'asset',
        parent_id: a.parent_id ? String(a.parent_id) : '',
        description: a.description || '',
        currency: a.currency || 'TZS',
      })
    } catch {
      toast.error('Failed to load account')
    } finally { setFetching(false) }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!isEdit && !form.account_code.trim()) errs.account_code = 'Account code is required'
    if (!form.account_name.trim()) errs.account_name = 'Account name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit) {
        const payload = {
          account_name: form.account_name,
          account_type: form.account_type,
          parent_id: form.parent_id || null,
          description: form.description || null,
        }
        delete payload.parent_id
        await accounts.update(id, payload)
      } else {
        const payload = { ...form, pharmacy_id: pharmacyId }
        if (!payload.parent_id) delete payload.parent_id
        await accounts.create(payload)
      }
      toast.success(isEdit ? 'Account updated' : 'Account created')
      navigate('/dashboard/chart-of-accounts')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save account')
    } finally { setLoading(false) }
  }

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/chart-of-accounts" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Account' : 'New Account'}</h1>
          </div>
          <p className="text-gray-600">{isEdit ? 'Update this account' : 'Add a new account to the chart'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <BookOpen className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Account Information</h3>
                <p className="text-sm text-gray-600">Code, name and type</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Account Code {!isEdit && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.account_code}
                    disabled={isEdit}
                    onChange={(e) => handleChange('account_code', e.target.value)}
                    placeholder="e.g. 1000"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                {errors.account_code && <p className="text-xs text-red-500 mt-1">{errors.account_code}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Account Type <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Layers className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.account_type}
                    onChange={(e) => handleChange('account_type', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {ACCOUNT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Account Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.account_name}
                    onChange={(e) => handleChange('account_name', e.target.value)}
                    placeholder="e.g. Cash in Hand"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.account_name && <p className="text-xs text-red-500 mt-1">{errors.account_name}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Parent Account</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => handleChange('parent_id', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                >
                  <option value="">None (Top Level)</option>
                  {parentAccounts.filter((a) => a.id !== Number(id)).map((a) => (
                    <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/chart-of-accounts" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Account' : 'Create Account'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}