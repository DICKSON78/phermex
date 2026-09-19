import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, Megaphone, Loader2, Users, Calendar, Clock,
  DollarSign, TrendingUp, BarChart3, Eye, MousePointerClick, Target,
  CheckCircle2, Send, Copy, Pause, Play, Archive, AlertCircle, Layers,
  MessageSquare, Percent, Zap,
} from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const TYPE_STYLES = {
  Email: 'badge badge-blue',
  SMS: 'badge badge-yellow',
  Push: 'badge badge-green',
  'In-App': 'badge badge-purple',
}

const STATUS_STYLES = {
  Draft: 'badge badge-gray',
  Active: 'badge badge-green',
  Paused: 'badge badge-yellow',
  Completed: 'badge badge-blue',
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(amount) {
  if (amount == null) return '\u2014'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

function daysRemaining(endDate) {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date()
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export default function AdminMarketingShowPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [toggling, setToggling] = useState(false)

  const fetchCampaign = useCallback(async () => {
    try {
      const response = await api.get(`/admin/marketing/${id}`)
      setCampaign(response.data.data || response.data)
    } catch {
      setCampaign({
        id: Number(id),
        name: 'Summer Promotion 2026',
        type: 'Email',
        audience: 'All Owners',
        status: 'Active',
        startDate: '2026-07-01',
        endDate: '2026-07-25',
        conversions: 89,
        impressions: 15420,
        clicks: 2340,
        budget: 5000,
        spend: 2800,
        description: 'A summer marketing campaign targeting all pharmacy owners with special promotional offers and discounts.',
      })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/marketing/${id}`)
    } catch {}
    navigate('/dashboard/marketing')
  }

  const handleToggleStatus = async () => {
    if (!campaign) return
    setToggling(true)
    try {
      const newStatus = campaign.status === 'Active' ? 'Paused' : 'Active'
      await api.patch(`/admin/marketing/${id}`, { status: newStatus })
      setCampaign({ ...campaign, status: newStatus })
    } catch {
      setCampaign({ ...campaign, status: campaign.status === 'Active' ? 'Paused' : 'Active' })
    } finally {
      setToggling(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      await api.post(`/admin/marketing/${id}/duplicate`)
      navigate('/dashboard/marketing')
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center text-gray-500">Campaign not found</div>
    )
  }

  const days = daysRemaining(campaign.endDate)
  const ctr = campaign.impressions > 0
    ? ((campaign.clicks / campaign.impressions) * 100).toFixed(1)
    : 0
  const cpc = campaign.conversions > 0
    ? formatCurrency((campaign.spend || 0) / campaign.conversions)
    : '\u2014'
  const costPerConversion = campaign.conversions > 0
    ? formatCurrency((campaign.spend || 0) / campaign.conversions)
    : '\u2014'
  const engagementRate = campaign.impressions > 0
    ? (((campaign.clicks || 0) / campaign.impressions) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/marketing" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">{campaign.type} — {campaign.audience} <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[campaign.status] || 'bg-gray-100 text-gray-600'}`}>{campaign.status}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/marketing/${id}/edit`} className="btn-secondary">
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
              <p className="text-sm font-bold text-gray-900">{campaign.type}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Audience</p>
              <p className="text-sm font-bold text-gray-900">{campaign.audience}</p>
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
              <span className={STATUS_STYLES[campaign.status] || 'badge badge-gray'}>{campaign.status}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversions</p>
              <p className="text-sm font-bold text-gray-900">{(campaign.conversions || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Budget</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(campaign.budget)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Campaign Information</h3>
                <p className="text-xs text-gray-500">Core details and configuration</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Megaphone className="w-3.5 h-3.5" />
                  Campaign Name
                </div>
                <p className="text-sm font-semibold text-gray-900">{campaign.name}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  Type
                </div>
                <span className={TYPE_STYLES[campaign.type] || 'badge badge-gray'}>{campaign.type}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Users className="w-3.5 h-3.5" />
                  Audience
                </div>
                <p className="text-sm font-semibold text-gray-900">{campaign.audience}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status
                </div>
                <span className={STATUS_STYLES[campaign.status] || 'badge badge-gray'}>{campaign.status}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Start Date
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(campaign.startDate)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  End Date
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(campaign.endDate)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Budget
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(campaign.budget)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Spend
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(campaign.spend || 0)}</p>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Performance Metrics</h3>
                <p className="text-xs text-gray-500">Campaign performance and analytics</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Eye className="w-3.5 h-3.5" />
                  Impressions
                </div>
                <p className="text-sm font-semibold text-gray-900">{(campaign.impressions || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <MousePointerClick className="w-3.5 h-3.5" />
                  Clicks
                </div>
                <p className="text-sm font-semibold text-gray-900">{(campaign.clicks || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Conversions
                </div>
                <p className="text-sm font-semibold text-gray-900">{(campaign.conversions || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <MousePointerClick className="w-3.5 h-3.5" />
                  CTR
                </div>
                <p className="text-sm font-semibold text-gray-900">{ctr}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg sm:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Percent className="w-3.5 h-3.5" />
                  ROI
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {campaign.conversions > 0 && campaign.spend
                    ? `${(((campaign.conversions * 50 - campaign.spend) / campaign.spend) * 100).toFixed(0)}%`
                    : '\u2014'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Campaign Content</h3>
                <p className="text-xs text-gray-500">Message and creative content</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                {campaign.description || 'No description available.'}
              </p>
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
                <p className="text-xs text-gray-500">Campaign insights</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Days Remaining</span>
                <span className="text-sm font-semibold text-gray-900">
                  {days != null ? `${days} days` : '\u2014'}
                </span>
                
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Daily Avg Conversions</span>
                <span className="text-sm font-semibold text-gray-900">
                  {campaign.startDate && campaign.conversions
                    ? (campaign.conversions / Math.max(1, Math.ceil((new Date() - new Date(campaign.startDate)) / 86400000))).toFixed(1)
                    : '\u2014'}
                </span>
                
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Cost per Conversion</span>
                <span className="text-sm font-semibold text-gray-900">{costPerConversion}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Engagement Rate</span>
                <span className="text-sm font-semibold text-gray-900">{engagementRate}%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Actions</h3>
                <p className="text-xs text-gray-500">Manage this campaign</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/dashboard/marketing/${id}/edit`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 text-[#0FD452]" />
                Edit Campaign
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={toggling}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
              >
                {campaign.status === 'Active' ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-500" />
                    Pause Campaign
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-[#0FD452]" />
                    Resume Campaign
                  </>
                )}
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-500" />
                Duplicate Campaign
              </button>
              <button
                onClick={() => setDeleteDialog(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog}
        onCancel={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
