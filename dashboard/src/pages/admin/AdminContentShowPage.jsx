import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, FileText, Loader2, Tag, Target, Eye, Calendar,
  Clock, Users, Copy, BarChart3, BookOpen, Hash, PenTool, CheckCircle2,
  Archive, Send, AlertCircle, Layers,
} from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

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

function formatDate(dateStr) {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function wordCount(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

function readTime(text) {
  const words = wordCount(text)
  const minutes = Math.ceil(words / 200)
  return `${minutes} min read`
}

export default function AdminContentShowPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [toggling, setToggling] = useState(false)

  const fetchPost = useCallback(async () => {
    try {
      const response = await api.get(`/admin/content/${id}`)
      setPost(response.data.data || response.data)
    } catch {
      setPost({
        id: Number(id),
        title: 'Sample Content Post',
        type: 'announcement',
        target: 'All',
        status: 'active',
        date: '2026-07-15',
        updatedAt: '2026-07-18',
        author: 'Admin',
        tags: ['pharmacy', 'update'],
        content: 'This is a sample content post used for demonstration purposes. It contains important information for all pharmacy owners and managers.',
        views: 1247,
        engagement: 89,
      })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/content/${id}`)
    } catch {}
    navigate('/dashboard/content')
  }

  const handleTogglePublish = async () => {
    if (!post) return
    setToggling(true)
    try {
      const newStatus = post.status === 'active' ? 'draft' : 'active'
      await api.patch(`/admin/content/${id}`, { status: newStatus })
      setPost({ ...post, status: newStatus })
    } catch {
      setPost({ ...post, status: post.status === 'active' ? 'draft' : 'active' })
    } finally {
      setToggling(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      await api.post(`/admin/content/${id}/duplicate`)
      navigate('/dashboard/content')
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-6 text-center text-gray-500">Post not found</div>
    )
  }

  const wc = wordCount(post.content)
  const rt = readTime(post.content)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/content" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">{post.type} — {post.target} <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[post.status] || 'bg-gray-100 text-gray-600'}`}>{post.status}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/content/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={() => setDeleteDialog(true)} className="btn-danger-outline">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</p>
              <p className="text-sm font-bold text-gray-900">{post.type}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target</p>
              <p className="text-sm font-bold text-gray-900">{post.target}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
              <span className={STATUS_STYLES[post.status] || 'badge badge-gray'}>{post.status}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Views</p>
              <p className="text-sm font-bold text-gray-900">{(post.views || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Engagement</p>
              <p className="text-sm font-bold text-gray-900">{post.engagement || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Content Information</h3>
                <p className="text-xs text-gray-500">Details and metadata for this content</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  Title
                </div>
                <p className="text-sm font-semibold text-gray-900">{post.title}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  Type
                </div>
                <span className={TYPE_STYLES[post.type] || 'badge badge-gray'}>{post.type}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Target className="w-3.5 h-3.5" />
                  Target Audience
                </div>
                <p className="text-sm font-semibold text-gray-900">{post.target}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status
                </div>
                <span className={STATUS_STYLES[post.status] || 'badge badge-gray'}>{post.status}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <PenTool className="w-3.5 h-3.5" />
                  Author
                </div>
                <p className="text-sm font-semibold text-gray-900">{post.author || 'Admin'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Date Created
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(post.date || post.createdAt)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  Date Updated
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDateTime(post.updatedAt || post.date)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(post.tags || []).length > 0 ? post.tags.map((t, i) => (
                    <span key={i} className="badge badge-gray text-xs">{t}</span>
                  )) : (
                    <span className="text-sm text-gray-400">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Content Body</h3>
                <p className="text-xs text-gray-500">Full content text and body</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                {post.content || 'No content available.'}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {wc} words</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {rt}</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Quick Stats</h3>
                <p className="text-xs text-gray-500">Performance overview</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Word Count</span>
                <span className="text-sm font-semibold text-gray-900">{wc.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Read Time</span>
                <span className="text-sm font-semibold text-gray-900">{rt}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Last Edited</span>
                <span className="text-sm font-semibold text-gray-900">{formatDate(post.updatedAt || post.date)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Published Status</span>
                <span className={STATUS_STYLES[post.status] || 'badge badge-gray'}>{post.status}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Actions</h3>
                <p className="text-xs text-gray-500">Manage this content</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/dashboard/content/${id}/edit`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 text-[#0FD452]" />
                Edit Content
              </button>
              <button
                onClick={handleTogglePublish}
                disabled={toggling}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
              >
                {post.status === 'active' ? (
                  <>
                    <Archive className="w-4 h-4 text-amber-500" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#0FD452]" />
                    Publish
                  </>
                )}
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-500" />
                Duplicate
              </button>
              <button
                onClick={() => setDeleteDialog(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Content
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog}
        onCancel={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
