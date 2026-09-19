import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Briefcase, Loader2, MapPin, Tag, Eye, FileText, DollarSign } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/Modal'

const TYPES = ['full_time', 'part_time', 'contract', 'internship', 'remote']
const STATUSES = ['active', 'closed', 'draft']
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Operations', 'Customer Success', 'Finance', 'HR', 'Compliance', 'Quality Assurance', 'Data Science', 'DevOps', 'Security', 'Legal']
const LOCATIONS = ['Dar es Salaam', 'Arusha', 'Mwanza', 'Remote', 'Dodoma', 'Nairobi', 'Lagos', 'Remote (Africa)']

const TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
}

const EMPTY_FORM = {
  title: '', department: 'Engineering', location: 'Dar es Salaam', type: 'full_time',
  description: '', requirements: '', responsibilities: '', salary_range: '',
  status: 'active', is_hot: false, is_new: false, closes_at: '',
}

export default function AdminJobFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [errors, setErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchJob = useCallback(async () => {
    if (!isEdit) return
    setFetching(true)
    try {
      const response = await api.get(`/admin/jobs/${id}`)
      const job = response.data.data || response.data
      setForm({
        title: job.title || '',
        department: job.department || 'Engineering',
        location: job.location || 'Dar es Salaam',
        type: job.type || 'full_time',
        description: job.description || '',
        requirements: job.requirements || '',
        responsibilities: job.responsibilities || '',
        salary_range: job.salary_range || '',
        status: job.status || 'active',
        is_hot: job.is_hot || false,
        is_new: job.is_new || false,
        closes_at: job.closes_at ? job.closes_at.split('T')[0] : '',
      })
    } catch {} finally {
      setFetching(false)
    }
  }, [id, isEdit])

  useEffect(() => { fetchJob() }, [fetchJob])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.department) errs.department = 'Department is required'
    if (!form.location.trim()) errs.location = 'Location is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/admin/jobs/${id}`, form)
      } else {
        await api.post('/admin/jobs', form)
      }
      setShowSuccess(true)
    } catch {} finally {
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
            <Link to="/dashboard/jobs" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Job Listing' : 'Create New Job Listing'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? 'Update job listing details' : 'Post a new job opening on the careers page'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          {/* Section 1: Job Info */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Briefcase className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Job Information</h3>
                <p className="text-sm text-gray-600">Title, department, and basic details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.title ? '!border-red-400' : ''}`}
                    placeholder="e.g. Senior Full-Stack Developer"
                  />
                </div>
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Department <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.department ? '!border-red-400' : ''}`}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Location <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.location ? '!border-red-400' : ''}`}
                    placeholder="e.g. Dar es Salaam"
                  />
                </div>
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Employment Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Salary Range</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.salary_range}
                    onChange={(e) => handleChange('salary_range', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    placeholder="e.g. TZS 1,500,000 - 3,000,000/mo"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Description */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Job Description</h3>
                <p className="text-sm text-gray-600">Detailed description, requirements, and responsibilities</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={5}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none ${errors.description ? '!border-red-400' : ''}`}
                  placeholder="Describe the role, what they will be doing, and why it matters..."
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Requirements</label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                  placeholder="List the qualifications and experience required..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Responsibilities</label>
                <textarea
                  value={form.responsibilities}
                  onChange={(e) => handleChange('responsibilities', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                  placeholder="List the key responsibilities..."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Publishing */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Eye className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Publishing</h3>
                <p className="text-sm text-gray-600">Status, badges, and closing date</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Closes On</label>
                <input
                  type="date"
                  value={form.closes_at}
                  onChange={(e) => handleChange('closes_at', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_hot}
                    onChange={(e) => handleChange('is_hot', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0FD452] focus:ring-[#0FD452]"
                  />
                  <span className="text-sm font-semibold text-gray-900">Mark as HOT</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={(e) => handleChange('is_new', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0FD452] focus:ring-[#0FD452]"
                  />
                  <span className="text-sm font-semibold text-gray-900">Mark as NEW</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/jobs" className="btn-secondary">
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Job' : 'Create Job'}</span>
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showSuccess}
        onClose={() => { setShowSuccess(false); navigate('/dashboard/jobs') }}
        title={isEdit ? 'Job Updated' : 'Job Created'}
        subtitle={isEdit ? 'The job listing has been updated successfully.' : 'The job listing has been created and is now visible on the careers page.'}
      >
        <div className="flex justify-end pt-2">
          <button onClick={() => { setShowSuccess(false); navigate('/dashboard/jobs') }} className="btn-primary">
            Back to Jobs
          </button>
        </div>
      </Modal>
    </div>
  )
}
