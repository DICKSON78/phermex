import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, FileText, Loader2, Tag, Globe, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/Modal'
import { useLanguage } from '../../contexts/LanguageContext'

const TYPES = ['banner', 'announcement', 'promotion', 'blog']
const TARGETS = ['All', 'Pharmacists', 'Owners', 'Admins']
const STATUSES = ['draft', 'active', 'archived']

const EMPTY_FORM = { title: '', type: 'announcement', target: 'All', content: '', status: 'draft' }

export default function AdminContentFormPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [errors, setErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)

  const typeLabels = {
    banner: t('adminContent.content.typeLabels.banner'),
    announcement: t('adminContent.content.typeLabels.announcement'),
    promotion: t('adminContent.content.typeLabels.promotion'),
    blog: t('adminContent.content.typeLabels.blog'),
  }
  const targetLabels = {
    All: t('adminContent.content.targetLabels.All'),
    Pharmacists: t('adminContent.content.targetLabels.Pharmacists'),
    Owners: t('adminContent.content.targetLabels.Owners'),
    Admins: t('adminContent.content.targetLabels.Admins'),
  }
  const statusLabels = {
    draft: t('adminContent.content.statusLabels.draft'),
    active: t('adminContent.content.statusLabels.active'),
    archived: t('adminContent.content.statusLabels.archived'),
  }

  const fetchPost = useCallback(async () => {
    if (!isEdit) return
    setFetching(true)
    try {
      const response = await api.get(`/admin/content/${id}`)
      const post = response.data.data || response.data
      setForm({
        title: post.title || '',
        type: post.type || 'announcement',
        target: post.target || 'All',
        content: post.content || '',
        status: post.status || 'draft',
      })
    } catch {
      // Failed to fetch post data — leave form with empty values
    } finally {
      setFetching(false)
    }
  }, [id, isEdit])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = t('adminContent.content.titleRequired')
    if (!form.content.trim()) errs.content = t('adminContent.content.contentRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/admin/content/${id}`, form)
      } else {
        await api.post('/admin/content', form)
      }
      setShowSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminContent.content.saveFailed'))
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
            <Link to="/dashboard/content" className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? t('adminContent.content.editPost') : t('adminContent.content.createNewPost')}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? t('adminContent.content.updatePostDesc') : t('adminContent.content.addPostDesc')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          {/* Section 1: Content Info */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('adminContent.content.infoTitle')}</h3>
                <p className="text-sm text-gray-600">{t('adminContent.content.infoDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('adminContent.content.title')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm ${errors.title ? '!border-red-400' : ''}`}
                    placeholder={t('adminContent.content.titlePlaceholder')}
                  />
                </div>
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('adminContent.content.type')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>{typeLabels[ty]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('adminContent.content.targetAudience')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.target}
                    onChange={(e) => handleChange('target', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {TARGETS.map((tg) => (
                      <option key={tg} value={tg}>{targetLabels[tg]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Publishing */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <Eye className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('adminContent.content.publishing')}</h3>
                <p className="text-sm text-gray-600">{t('adminContent.content.publishingDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('common.status')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Body */}
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('adminContent.content.body')}</h3>
                <p className="text-sm text-gray-600">{t('adminContent.content.bodyDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('adminContent.content.contentLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <textarea
                    value={form.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    rows={6}
                    className={`pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm resize-none ${errors.content ? '!border-red-400' : ''}`}
                    placeholder={t('adminContent.content.contentPlaceholder')}
                  />
                </div>
                {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
              </div>
            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-gray-200 flex justify-end space-x-4">
            <Link to="/dashboard/content" className="btn-secondary">
              <span>{t('common.cancel')}</span>
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? t('adminContent.content.updatePost') : t('adminContent.content.createPost')}</span>
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          navigate('/dashboard/content')
        }}
        title={isEdit ? t('adminContent.content.postUpdated') : t('adminContent.content.postCreated')}
        subtitle={isEdit ? t('adminContent.content.postUpdatedDesc') : t('adminContent.content.postCreatedDesc')}
      >
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              setShowSuccess(false)
              navigate('/dashboard/content')
            }}
            className="btn-primary"
          >
            {t('adminContent.content.backToContent')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
