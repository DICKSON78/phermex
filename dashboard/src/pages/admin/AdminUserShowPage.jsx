import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Shield,
  Calendar,
  Hash,
  Building2,
  Loader2,
  CheckCircle,
  User,
  Briefcase,
  DollarSign,
  Clock,
  Activity,
  MessageSquare,
  KeyRound,
  UserX,
  BarChart3,
  TrendingUp,
  FileText,
  Award,
  CreditCard,
  Heart,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'
import Modal from '../../components/Modal'
import { formatMoney } from '../../utils/currency'
import { useLanguage } from '../../contexts/LanguageContext'

const ROLE_STYLES = {
  admin: 'bg-red-100 text-red-700',
  owner: 'bg-blue-100 text-blue-700',
  pharmacist: 'bg-green-100 text-green-700',
  cashier: 'bg-purple-100 text-purple-700',
  delivery: 'bg-orange-100 text-orange-700',
  customer: 'bg-gray-100 text-gray-600',
}

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-600',
  pending: 'bg-yellow-100 text-yellow-700',
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

export default function AdminUserShowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState(null)
  const [acting, setActing] = useState(null)

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      const res = await api.get(`/admin/users/${id}`)
      setUser(res.data.data || res.data)
    } catch {
      setError(t('adminUsers.users.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${id}`)
    } catch {}
    setConfirmOpen(false)
    setSuccessMsg(t('adminUsers.users.deletedSuccess'))
    setSuccessModal(true)
    setTimeout(() => navigate('/dashboard/users'), 1500)
  }

  const handleSendMessage = async () => {
    const body = window.prompt(t('adminUsers.users.messagePrompt'))
    if (body === null || body.trim() === '') return
    setActing('message')
    try {
      await api.post(`/admin/users/${id}/message`, { message: body.trim() })
      toast.success(t('adminUsers.users.messageSent'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminUsers.users.messageFailed'))
    } finally {
      setActing(null)
    }
  }

  const handleResetPassword = async () => {
    setActing('password')
    try {
      await api.post('/forgot-password', { identifier: user.email })
      toast.success(t('adminUsers.users.passwordResetSent'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminUsers.users.passwordResetFailed'))
    } finally {
      setActing(null)
    }
  }

  const handleDeactivate = async () => {
    setActing('deactivate')
    try {
      await api.patch(`/admin/users/${id}`, { status: 'inactive' })
      setUser((prev) => (prev ? { ...prev, status: 'inactive', is_active: false } : prev))
      toast.success(t('adminUsers.users.deactivated'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminUsers.users.deactivateFailed'))
    } finally {
      setActing(null)
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => navigate('/dashboard/users')}
            className="text-[#0FD452] mt-2 text-sm font-medium hover:underline"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('adminUsers.users.notFound')}</p>
          <button
            onClick={() => navigate('/dashboard/users')}
            className="text-[#0FD452] mt-2 text-sm font-medium hover:underline"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  const pharmacyName = Array.isArray(user.pharmacy)
    ? user.pharmacy.map((p) => p.pharmacy_name || p.name).join(', ')
    : typeof user.pharmacy === 'object'
      ? user.pharmacy?.pharmacy_name || user.pharmacy?.name || '—'
      : user.pharmacy || '—'

  const userCode = user.code || user.user_code || '—'

  const accountAge = user.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const initials = (user.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/users" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              {user.email} — 
              {user.role
                ? t('role' + user.role.charAt(0).toUpperCase() + user.role.slice(1), user.role)
                : '—'}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-600'}`}>
                {user.role
                  ? t('role' + user.role.charAt(0).toUpperCase() + user.role.slice(1), user.role)
                  : '—'}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-600'}`}>
                {t(user.status, user.status)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/users/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> {t('common.edit')}
          </Link>
          <button onClick={() => setConfirmOpen(true)} className="btn-danger-outline">
            <Trash2 className="w-4 h-4" /> {t('common.delete')}
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
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{t('adminUsers.shared.role')}</p>
                <p className="text-sm font-bold text-[#000F14] capitalize">{user.role ? t('role' + user.role.charAt(0).toUpperCase() + user.role.slice(1), user.role) : '—'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{t('adminUsers.shared.pharmacy')}</p>
                <p className="text-sm font-bold text-[#000F14] truncate">{pharmacyName}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${user.status === 'active' ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={`w-3 h-3 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{t('common.status')}</p>
                <p className="text-sm font-bold text-[#000F14] capitalize">{t(user.status, user.status)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{t('adminUsers.users.lastActive')}</p>
                <p className="text-sm font-bold text-[#000F14]">{formatDate(user.last_active || user.created_at)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{t('adminUsers.users.joined')}</p>
                <p className="text-sm font-bold text-[#000F14]">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">{t('profile.personalInfo')}</h3>
                  <p className="text-xs text-gray-500">{t('adminUsers.users.personalDetails')}</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('common.name')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('common.email')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.email || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('common.phone')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.phone || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('adminUsers.shared.code')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14] font-mono">{userCode}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('adminUsers.shared.role')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14] capitalize">{user.role ? t('role' + user.role.charAt(0).toUpperCase() + user.role.slice(1), user.role) : '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : user.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <span className="text-xs text-gray-500">{t('common.status')}</span>
                  </div>
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-600'}`}>
                     {t(user.status, user.status)}
                   </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('adminUsers.users.dob')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{formatDate(user.date_of_birth) || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('adminUsers.users.gender')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.gender || '—'}</p>
                </div>
              </div>
            </div>

            {/* Employment Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">{t('adminUsers.users.employmentInfo')}</h3>
                  <p className="text-xs text-gray-500">{t('adminUsers.users.employmentInfoSub')}</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('adminUsers.shared.pharmacy')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{pharmacyName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('employees.position')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.position || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('employees.department')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.department || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('employees.employmentType')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.employment_type || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('employees.salary')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">
                    {user.salary ? formatMoney(user.salary, { decimals: 0 }) : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('adminUsers.users.hireDate')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{formatDate(user.created_at)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{t('adminUsers.users.manager')}</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.manager || '—'}</p>
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
                  <h3 className="text-sm font-semibold text-[#000F14]">{t('adminUsers.shared.quickStats')}</h3>
                  <p className="text-xs text-gray-500">{t('adminUsers.users.quickStatsSub')}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{t('adminUsers.users.accountAge')}</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{accountAge} {t('adminUsers.shared.days')}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{t('adminUsers.users.lastLogin')}</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{formatDate(user.last_active || user.created_at)}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{t('adminUsers.users.ordersProcessed')}</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{user.orders_processed || 0}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{t('nav.items.performance')}</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{user.performance_score || 0}%</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">{t('common.actions')}</h3>
                  <p className="text-xs text-gray-500">{t('dashboard.quickActions')}</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <Link
                  to={`/dashboard/users/${id}/activity`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#000F14]">{t('adminUsers.users.viewActivity')}</p>
                    <p className="text-xs text-gray-500">{t('adminUsers.users.browseActivity')}</p>
                  </div>
                </Link>
                <button onClick={handleSendMessage} disabled={acting === 'message'} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full disabled:opacity-50">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">{t('adminUsers.users.sendMessage')}</p>
                    <p className="text-xs text-gray-500">{t('adminUsers.users.messageThisUser')}</p>
                  </div>
                </button>
                <button onClick={handleResetPassword} disabled={acting === 'password'} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full disabled:opacity-50">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <KeyRound className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">{t('adminUsers.users.resetPassword')}</p>
                    <p className="text-xs text-gray-500">{t('adminUsers.users.generatePassword')}</p>
                  </div>
                </button>
                <button onClick={handleDeactivate} disabled={acting === 'deactivate'} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full disabled:opacity-50">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <UserX className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">{t('adminUsers.users.deactivate')}</p>
                    <p className="text-xs text-gray-500">{t('adminUsers.users.disableAccount')}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title={t('adminUsers.users.deleteUser')}
        message={`${t('adminUsers.users.deleteUserQuestion')}"${user.name}"? ${t('common.cannotBeUndone')}`}
        confirmText={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        variant="danger"
      />

      <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="" maxWidth="max-w-sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#0FD452]" />
          </div>
          <h3 className="text-lg font-bold text-[#000F14] mb-1">{t('adminUsers.shared.success')}</h3>
          <p className="text-sm text-gray-500">{successMsg}</p>
        </div>
      </Modal>
    </div>
  )
}
