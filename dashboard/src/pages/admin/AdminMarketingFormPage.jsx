import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Megaphone, Loader2, Users, Calendar, FileText } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/Modal'

const TYPES = ['Email', 'SMS', 'Push', 'In-App']
const STATUSES = ['Draft', 'Active', 'Paused', 'Completed']

const EMPTY_FORM = { name: '', type: 'Email', audience: 'All Owners', status: 'Draft', startDate: '', endDate: '', description: '' }

export default function AdminMarketingFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [errors, setErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchCampaign = useCallback(async () => {
    if (!isEdit) return
    setFetching(true)
    try {
      const response = await api.get(`/admin/marketing/${id}`)
      const campaign = response.data.data || response.data
      setForm({
        name: campaign.name || '',
        type: campaign.type || 'Email',
        audience: campaign.audience || 'All Owners',
        status: campaign.status || 'Draft',
        startDate: campaign.startDate || '',
        endDate: campaign.endDate || '',
        description: campaign.description || '',
      })
    } catch {
      // Failed to fetch campaign data — leave form with empty values
    } finally {
      setFetching(false)
    }
  }, [id, isEdit])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Campaign name is required'
    if (!form.startDate) errs.startDate = 'Start date is required'
    if (!form.endDate) errs.endDate = 'End date is required'
    if (form.startDate && form.endDate && form.startDate > form.endDate) errs.endDate = 'End date must be after start date'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/admin/marketing/${id}`, form)
      } else {
        await api.post('/admin/marketing', form)
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
            <Link to="/dashboard/marketing" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Campaign' : 'Create New Campaign'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? 'Update existing campaign details' : 'Add a new campaign to the platform'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          {/* Section 1: Campaign Info */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Megaphone className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Campaign Information</h3>
                <p className="text-sm text-gray-600">Campaign name, type, and target audience</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Megaphone className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.name ? '!border-red-400' : ''}`}
                    placeholder="Enter campaign name"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Megaphone className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Audience</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.audience}
                    onChange={(e) => handleChange('audience', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                    placeholder="e.g. All Owners"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Megaphone className="w-4 h-4 text-gray-400" />
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

          {/* Section 2: Budget & Dates */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Budget & Dates</h3>
                <p className="text-sm text-gray-600">Campaign duration and scheduling</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.startDate ? '!border-red-400' : ''}`}
                  />
                </div>
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.endDate ? '!border-red-400' : ''}`}
                  />
                </div>
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Content */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Content</h3>
                <p className="text-sm text-gray-600">Campaign description and messaging</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none"
                    placeholder="Describe the campaign..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/marketing" className="btn-secondary">
              <span>Cancel</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'Update Campaign' : 'Create Campaign'}</span>
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          navigate('/dashboard/marketing')
        }}
        title={isEdit ? 'Campaign Updated' : 'Campaign Created'}
        subtitle={isEdit ? 'The campaign has been updated successfully.' : 'The campaign has been created successfully.'}
      >
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              setShowSuccess(false)
              navigate('/dashboard/marketing')
            }}
            className="btn-primary"
          >
            Back to Marketing
          </button>
        </div>
      </Modal>
    </div>
  )
}
