import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Send,
  SendHorizontal,
  Megaphone,
  Wrench,
  AlertTriangle,
  Info,
  Plus,
  Tag,
  Users,
  Calendar,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import api from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'

const TYPE_STYLES = {
  banner: 'badge badge-blue',
  announcement: 'badge badge-yellow',
  promotion: 'badge badge-green',
  blog: 'badge badge-red',
}

const STATUS_STYLES = {
  draft: 'badge badge-gray',
  active: 'badge badge-green',
  archived: 'badge badge-red',
}

const TYPE_ICONS = {
  banner: Megaphone,
  announcement: Wrench,
  promotion: Info,
  blog: AlertTriangle,
}

const TYPES = ['banner', 'announcement', 'promotion', 'blog']
const STATUSES = ['draft', 'active', 'archived']
const TARGETS = ['All', 'Pharmacists', 'Owners', 'Admins']

function StatCard({ label, value, icon, iconColor, bg, suffix }) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 truncate">{label}</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {suffix && <p className="text-xs text-gray-500 mt-1.5">{suffix}</p>}
        </div>
        {icon && (
          <div className={`stat-icon group-hover:scale-110 transition-transform duration-300 ${bg || 'bg-gray-100'}`}>
            <span className={iconColor || 'text-gray-600'}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminContentPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

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

  useEffect(() => {
    fetchContent()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, typeFilter, statusFilter])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/content')
      setData(response.data || {})
    } catch (err) {
      console.warn('Failed to fetch content:', err.message)
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (post) => {
    const newStatus = post.status === 'active' ? 'draft' : 'active'
    try {
      await api.patch(`/admin/content/${post.id}`, { status: newStatus })
    } catch {}
    setData((prev) => ({
      ...prev,
      posts: (prev.posts || []).map((p) => (p.id === post.id ? { ...p, status: newStatus } : p)),
    }))
  }

  const handleDelete = async (post) => {
    try {
      await api.delete(`/admin/content/${post.id}`)
    } catch {}
    setData((prev) => ({
      ...prev,
      posts: (prev.posts || []).filter((p) => p.id !== post.id),
    }))
  }

  const filtered = (data?.posts || []).filter((p) => {
    if (search) {
      const q = search.toLowerCase()
      if (!p.title.toLowerCase().includes(q)) return false
    }
    if (typeFilter && p.type !== typeFilter) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = data?.stats || { totalPosts: 0, published: 0, drafts: 0, announcementsActive: 0 }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-16 bg-white rounded-2xl animate-pulse" />
        <div className="h-96 bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {t('adminContent.content.loadFailed')}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.items.content')}</h1>
            <p className="text-sm text-gray-500">{t('adminContent.content.pageDesc')}</p>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard/content/new')} className="btn-primary">
          <Plus className="h-4 w-4" />
          {t('adminContent.content.newPost')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label={t('adminContent.content.totalPosts')} value={stats.totalPosts} icon={<FileText className="w-5 h-5" />} iconColor="text-primary" bg="bg-primary-light" suffix={t('adminContent.content.allContent')} />
        <StatCard label={t('adminContent.content.published')} value={stats.published} icon={<Send className="w-5 h-5" />} iconColor="text-green-600" bg="bg-green-100" suffix={t('adminContent.content.livePosts')} />
        <StatCard label={t('adminContent.content.drafts')} value={stats.drafts} icon={<Edit className="w-5 h-5" />} iconColor="text-yellow-600" bg="bg-yellow-100" suffix={t('dashboard.awaitingReview')} />
        <StatCard label={t('adminContent.content.announcementsActive')} value={stats.announcementsActive} icon={<Megaphone className="w-5 h-5" />} iconColor="text-blue-600" bg="bg-blue-100" suffix={t('adminContent.content.currentlyLive')} />
      </div>

      <div className="card">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('adminContent.content.searchTitle')}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">{t('adminContent.content.allTypes')}</option>
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>{typeLabels[ty]}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
            >
              <option value="">{t('adminContent.content.allStatuses')}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <FileText className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">{t('adminContent.content.noContent')}</h3>
          <p className="text-sm text-gray-500">{t('adminContent.content.adjustFilters')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('adminContent.content.title')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('adminContent.content.type')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('adminContent.content.target')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('common.status')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('common.date')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Zap className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('common.actions')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((post) => {
                  const TypeIcon = TYPE_ICONS[post.type] || FileText
                  return (
                    <tr key={post.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <TypeIcon className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-medium text-[#000F14]">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={TYPE_STYLES[post.type] || 'badge badge-gray'}>{typeLabels[post.type] || post.type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{targetLabels[post.target] || post.target}</td>
                      <td className="px-6 py-4">
                        <span className={STATUS_STYLES[post.status] || 'badge badge-gray'}>{statusLabels[post.status] || post.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{post.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate('/dashboard/content/' + post.id)}
                            className="btn-icon-primary"
                            title={t('common.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate('/dashboard/content/' + post.id + '/edit')}
                            className="btn-icon-blue"
                            title={t('common.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePublish(post)}
                            className="btn-ghost"
                            title={post.status === 'active' ? t('adminContent.content.unpublish') : t('adminContent.content.publish')}
                          >
                            {post.status === 'active' ? <SendHorizontal className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(post)}
                            className="btn-icon-red"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">
                {t('adminContent.pagination.showing')} {(currentPage - 1) * pageSize + 1} {t('adminContent.pagination.to')}{' '}
                {Math.min(currentPage * pageSize, filtered.length)} {t('adminContent.pagination.of')} {filtered.length} {t('adminContent.pagination.entries')}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-ghost"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page
                  if (totalPages <= 5) page = i + 1
                  else if (currentPage <= 3) page = i + 1
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                  else page = currentPage - 2 + i
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#0FD452] text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-ghost"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
