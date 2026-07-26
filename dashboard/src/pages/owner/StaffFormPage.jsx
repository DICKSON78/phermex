import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, X, Loader2, Shield, Users, Briefcase, DollarSign } from 'lucide-react'
import api from '../../services/api'

const permissionModules = [
  { key: 'inventory', label: 'Inventory', permissions: ['View', 'Add', 'Edit', 'Delete'] },
  { key: 'orders', label: 'Orders', permissions: ['View', 'Create', 'Cancel'] },
  { key: 'prescriptions', label: 'Prescriptions', permissions: ['View', 'Dispense'] },
  { key: 'customers', label: 'Customers', permissions: ['View', 'Add', 'Edit'] },
  { key: 'reports', label: 'Reports', permissions: ['View'] },
  { key: 'settings', label: 'Settings', permissions: ['View', 'Edit'] },
]

const defaultPermissions = {
  inventory: [],
  orders: [],
  prescriptions: [],
  customers: [],
  reports: [],
  settings: [],
}

export default function StaffFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (isEdit) fetchStaff()
  }, [id])

  const fetchStaff = async () => {
    try {
      const res = await api.get(`/staff/${id}`)
      const data = toArray(res.data)
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        license_number: data.license_number || '',
        position: data.position || 'pharmacist',
        salary: data.salary || '',
        active: data.active !== false,
        permissions: data.permissions || { ...defaultPermissions },
      })
    } catch {
      setForm({})
    } finally {
      setFetching(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    if (!form.position) errs.position = 'Position is required'
    if (!form.salary || Number(form.salary) <= 0) errs.salary = 'Valid salary is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const togglePermission = (module, perm) => {
    setForm((prev) => {
      const current = prev.permissions[module] || []
      const updated = current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm]
      return {
        ...prev,
        permissions: { ...prev.permissions, [module]: updated },
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/staff/${id}`, form)
      } else {
        await api.post('/staff', form)
      }
      navigate('/owner/staff')
    } catch {
      navigate('/owner/staff')
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
            <Link to="/owner/staff" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Staff' : 'Create New Staff'}</h1>
          </div>
          <p className="text-gray-600">{isEdit ? 'Update existing staff details' : 'Add a new staff member'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Personal Info Section */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                <p className="text-sm text-gray-600">Name and contact details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+256..."
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Employment Section */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Briefcase className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Employment</h3>
                <p className="text-sm text-gray-600">Role, license and status</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    <option value="pharmacist">Pharmacist</option>
                    <option value="technician">Technician</option>
                    <option value="cashier">Cashier</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                {errors.position && <p className="text-xs text-red-500 mt-1">{errors.position}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">License Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.license_number}
                    onChange={(e) => handleChange('license_number', e.target.value)}
                    placeholder="PH-XXXX-XXX"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <label className="flex items-center gap-3 cursor-pointer p-3">
                  <button
                    type="button"
                    onClick={() => handleChange('active', !form.active)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-[#0FD452]' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${form.active ? 'translate-x-5' : ''}`} />
                  </button>
                   <span className="text-sm font-semibold text-gray-900">
                     {form.active ? 'Active' : 'Inactive'}
                   </span>
                </label>
              </div>
            </div>
          </div>

          {/* Salary Section */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Salary</h3>
                <p className="text-sm text-gray-600">Compensation details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Salary (TZS) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={form.salary}
                    onChange={(e) => handleChange('salary', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  />
                </div>
                {errors.salary && <p className="text-xs text-red-500 mt-1">{errors.salary}</p>}
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Permissions</h3>
                <p className="text-sm text-gray-600">Control access to modules</p>
              </div>
            </div>
            <div className="space-y-5">
              {permissionModules.map((mod) => (
                <div key={mod.key}>
                  <p className="text-sm font-semibold text-gray-900 mb-2">{mod.label}</p>
                  <div className="flex flex-wrap gap-2 ml-1">
                    {mod.permissions.map((perm) => {
                      const permLower = perm.toLowerCase()
                      const isChecked = form.permissions[mod.key]?.includes(permLower)
                      return (
                        <label
                          key={perm}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#0FD452]/10 border-[#0FD452]/30 text-[#0FD452]'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(mod.key, permLower)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isChecked ? 'bg-[#0FD452] border-[#0FD452]' : 'border-gray-300'
                          }`}>
                            {isChecked && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          {perm}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/owner/staff" className="btn-secondary">
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Staff' : 'Create Staff'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
