import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Loader2, Save, User, Briefcase, DollarSign, AlertCircle, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { employees } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const STEPS = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Employment', icon: Briefcase },
  { id: 3, label: 'Emergency Contact', icon: AlertCircle },
]

export default function EmployeeFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pharmacyId } = useAuth()
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', date_of_birth: '',
    gender: 'male', national_id: '', position: '', department: 'pharmacy',
    employment_type: 'full_time', hire_date: '', contract_end_date: '',
    basic_salary: '', allowances: '', tax_id: '', bank_name: '',
    bank_account_number: '', emergency_contact_name: '', emergency_contact_phone: '',
    emergency_contact_relationship: '',
    pharmacy_id: pharmacyId,
  })

  useEffect(() => {
    if (isEdit) fetchEmployee()
  }, [id])

  const fetchEmployee = async () => {
    try {
      const res = await employees.getById(id)
      const emp = res.data.employee
      setForm({
        first_name: emp.first_name || '', last_name: emp.last_name || '',
        email: emp.email || '', phone: emp.phone || '',
        date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
        gender: emp.gender || 'male', national_id: emp.national_id || '',
        position: emp.position || '', department: emp.department || 'pharmacy',
        employment_type: emp.employment_type || 'full_time',
        hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
        contract_end_date: emp.contract_end_date ? emp.contract_end_date.split('T')[0] : '',
        basic_salary: emp.basic_salary || '', allowances: emp.allowances || '',
        tax_id: emp.tax_id || '', bank_name: emp.bank_name || '',
        bank_account_number: emp.bank_account_number || '',
        emergency_contact_name: emp.emergency_contact_name || '',
        emergency_contact_phone: emp.emergency_contact_phone || '',
        emergency_contact_relationship: emp.emergency_contact_relationship || '',
        pharmacy_id: emp.pharmacy_id || 1,
      })
    } catch {
      toast.error('Failed to load employee data')
    } finally { setFetching(false) }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateStep = (s) => {
    const errs = {}
    if (s === 1) {
      if (!form.first_name.trim()) errs.first_name = 'Required'
      if (!form.last_name.trim()) errs.last_name = 'Required'
      if (!form.email.trim()) errs.email = 'Required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
      if (!form.phone.trim()) errs.phone = 'Required'
    }
    if (s === 2) {
      if (!form.position.trim()) errs.position = 'Required'
      if (!form.department) errs.department = 'Required'
      if (!form.employment_type) errs.employment_type = 'Required'
      if (!form.hire_date) errs.hire_date = 'Required'
    }
    if (s === 3) {
      if (!form.basic_salary || Number(form.basic_salary) <= 0) errs.basic_salary = 'Required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => { if (validateStep(step)) setStep(s => Math.min(3, s + 1)) }
  const prevStep = () => setStep(s => Math.max(1, s - 1))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const data = { ...form }
      if (data.basic_salary) data.basic_salary = Number(data.basic_salary)
      if (data.allowances) data.allowances = Number(data.allowances)
      else data.allowances = 0

      if (isEdit) {
        await employees.update(id, data)
        toast.success('Employee updated')
      } else {
        await employees.create(data)
        toast.success('Employee created')
      }
      navigate('/dashboard/employees')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
        toast.error('Validation failed')
      } else {
        toast.error(err.response?.data?.message || 'Failed to save employee')
      }
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/employees" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Employee' : 'Create New Employee'}</h1>
          </div>
          <p className="text-gray-600">{isEdit ? 'Update existing employee details' : 'Register a new team member'}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <button onClick={() => s.id < step ? setStep(s.id) : null} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${step === s.id ? 'bg-[#0FD452]/10 text-[#0FD452]' : step > s.id ? 'text-green-600 cursor-pointer hover:bg-green-50' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${step === s.id ? 'bg-[#0FD452] text-white' : step > s.id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className="text-sm font-medium hidden md:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.id ? 'bg-green-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="divide-y divide-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-600">Name, email and contact details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">First Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                  {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                  {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Phone *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+255..."
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Gender</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <select
                      value={form.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">National ID (NIDA)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.national_id}
                      onChange={(e) => handleChange('national_id', e.target.value)}
                      placeholder="Tanzania NIDA number"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Employment */}
          {step === 2 && (
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                  <Briefcase className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Employment</h3>
                  <p className="text-sm text-gray-600">Role, department and salary</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Position *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                      placeholder="e.g. Pharmacist"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                  {errors.position && <p className="text-xs text-red-500 mt-1">{errors.position}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Department *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                    </div>
                    <select
                      value={form.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    >
                      <option value="pharmacy">Pharmacy</option>
                      <option value="management">Management</option>
                      <option value="finance">Finance</option>
                      <option value="operations">Operations</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>
                  {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Employment Type *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                    </div>
                    <select
                      value={form.employment_type}
                      onChange={(e) => handleChange('employment_type', e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  {errors.employment_type && <p className="text-xs text-red-500 mt-1">{errors.employment_type}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Hire Date *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={form.hire_date}
                      onChange={(e) => handleChange('hire_date', e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                  {errors.hire_date && <p className="text-xs text-red-500 mt-1">{errors.hire_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Basic Salary (TZS) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={form.basic_salary}
                      onChange={(e) => handleChange('basic_salary', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                  {errors.basic_salary && <p className="text-xs text-red-500 mt-1">{errors.basic_salary}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Allowances (TZS)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={form.allowances}
                      onChange={(e) => handleChange('allowances', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact */}
          {step === 3 && (
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                  <AlertCircle className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Emergency Contact</h3>
                  <p className="text-sm text-gray-600">Contact person in case of emergency</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.emergency_contact_name}
                      onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                      placeholder="Contact person name"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Phone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={form.emergency_contact_phone}
                      onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                      placeholder="+255..."
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Relationship</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.emergency_contact_relationship}
                      onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                      placeholder="e.g. Spouse, Parent"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-between">
            <button type="button" onClick={() => navigate('/dashboard/employees')} className="btn-secondary">
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="btn-secondary">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={nextStep} className="btn-primary">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isEdit ? 'Update Employee' : 'Create Employee'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
