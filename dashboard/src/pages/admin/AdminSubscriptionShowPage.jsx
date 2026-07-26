import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  FileText,
  XCircle,
  BarChart3,
  Users,
  HardDrive,
  Activity,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../services/api'

const PLAN_STYLES = {
  Trial: 'badge badge-gray',
  Basic: 'badge badge-green',
  Pro: 'badge badge-blue',
  Enterprise: 'badge badge-yellow',
}

const STATUS_STYLES = {
  active: 'badge badge-green',
  expired: 'badge badge-gray',
  suspended: 'badge badge-red',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function AdminSubscriptionShowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [id])

  const fetchSubscription = async () => {
    try {
      const res = await api.get(`/admin/subscriptions/${id}`)
      setSubscription(res.data.data || res.data)
    } catch {
      toast.error('Failed to load subscription')
      navigate('/admin/subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/admin/subscriptions/${id}`)
      toast.success('Subscription deleted')
      navigate('/admin/subscriptions')
    } catch {
      toast.error('Failed to delete subscription')
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-200 animate-pulse" />
        <div className="px-4 md:px-6 lg:px-8 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm h-96 animate-pulse" />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-96 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Subscription not found</p>
          <button
            onClick={() => navigate('/admin/subscriptions')}
            className="text-[#0FD452] mt-2 text-sm font-medium hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const daysRemaining = subscription.expiryDate
    ? Math.max(0, Math.floor((new Date(subscription.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const monthsActive = subscription.startDate
    ? Math.floor((Date.now() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0

  const totalPaid = (subscription.amount || 0) * monthsActive

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/subscriptions" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{subscription.pharmacy}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">{subscription.plan} plan — {subscription.pharmacy} <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[subscription.status] || 'bg-gray-100 text-gray-600'}`}>{subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/admin/subscriptions/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={() => setShowDelete(true)} className="btn-danger-outline">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 pb-10">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Plan</p>
                <p className="text-sm font-bold text-[#000F14]">{subscription.plan}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Amount/Month</p>
                <p className="text-lg font-bold text-[#000F14]">
                  {subscription.amount === 0 ? 'Free' : formatCurrency(subscription.amount)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${subscription.status === 'active' ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={`w-3 h-3 rounded-full ${subscription.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Status</p>
                <p className="text-sm font-bold text-[#000F14] capitalize">{subscription.status}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Days Remaining</p>
                <p className="text-xl font-bold text-[#000F14]">{daysRemaining}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Payment Method</p>
                <p className="text-sm font-bold text-[#000F14]">{subscription.payment_method || 'Card'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">Subscription Information</h3>
                  <p className="text-xs text-gray-500">Plan and billing details</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Pharmacy</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{subscription.pharmacy}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Plan</span>
                  </div>
                  <span className={PLAN_STYLES[subscription.plan]}>{subscription.plan}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Status</span>
                  </div>
                  <span className={STATUS_STYLES[subscription.status]}>
                    {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
                  </span>
                  
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Amount</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">
                    {subscription.amount === 0 ? 'Free' : formatCurrency(subscription.amount)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Billing Cycle</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{subscription.billing_cycle || 'Monthly'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Payment Method</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{subscription.payment_method || 'Card'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Start Date</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{formatDate(subscription.startDate)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Expiry Date</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{formatDate(subscription.expiryDate)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Auto-Renew</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">
                    {subscription.auto_renew !== false ? (
                      <span className="text-green-600">Enabled</span>
                    ) : (
                      <span className="text-gray-500">Disabled</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">Usage Information</h3>
                  <p className="text-xs text-gray-500">Resource consumption and limits</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">API Calls Used</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{subscription.api_calls_used || '0 / 10,000'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Storage Used</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{subscription.storage_used || '0 / 5 GB'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Users Limit</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{subscription.users_limit || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Users Active</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{subscription.users_active || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Feature Access</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{subscription.feature_access || subscription.plan + ' Features'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">Quick Stats</h3>
                  <p className="text-xs text-gray-500">Financial overview</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Total Paid</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Months Active</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{monthsActive} months</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Next Billing</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{formatDate(subscription.expiryDate)}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Plan Value</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">
                    {subscription.amount === 0 ? 'Free' : formatCurrency(subscription.amount) + '/mo'}
                  </span>
                  
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">Actions</h3>
                  <p className="text-xs text-gray-500">Manage subscription</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">Upgrade Plan</p>
                    <p className="text-xs text-gray-500">Move to a higher plan</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">Change Status</p>
                    <p className="text-xs text-gray-500">Modify subscription status</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">View Invoices</p>
                    <p className="text-xs text-gray-500">Browse payment history</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">Cancel Subscription</p>
                    <p className="text-xs text-gray-500">End this subscription</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Subscription"
        message={`Are you sure you want to delete the subscription for "${subscription.pharmacy}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
