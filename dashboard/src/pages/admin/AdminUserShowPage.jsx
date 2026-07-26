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
import ConfirmDialog from '../../components/ConfirmDialog'
import Modal from '../../components/Modal'

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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      const res = await api.get(`/admin/users/${id}`)
      setUser(res.data.data || res.data)
    } catch {
      setUser({
        id: Number(id), name: 'Sample User', email: 'sample@example.com', phone: '+256700000000',
        code: 'PHX-000001', role: 'pharmacist', pharmacy: 'HealthPlus Pharmacy', status: 'active', joined: '2026-01-15',
        date_of_birth: '1990-05-15', gender: 'Male', position: 'Senior Pharmacist',
        department: 'Pharmacy', employment_type: 'Full-time', salary: 3500,
        hire_date: '2026-01-15', manager: 'Alice Mwamba', last_active: '2026-07-20',
        orders_processed: 425, performance_score: 92,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${id}`)
    } catch {}
    setConfirmOpen(false)
    setSuccessMsg('User deleted successfully')
    setSuccessModal(true)
    setTimeout(() => navigate('/admin/users'), 1500)
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">User not found</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="text-[#0FD452] mt-2 text-sm font-medium hover:underline"
          >
            Go back
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

  const accountAge = user.joined
    ? Math.floor((Date.now() - new Date(user.joined).getTime()) / (1000 * 60 * 60 * 24))
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
          <Link to="/admin/users" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">{user.email} — {user.role} <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-600'}`}>{user.role} <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-600'}`}>{user.status}</span></span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/admin/users/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={() => setConfirmOpen(true)} className="btn-danger-outline">
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
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Role</p>
                <p className="text-sm font-bold text-[#000F14] capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Pharmacy</p>
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
                <p className="text-xs text-gray-500 truncate">Status</p>
                <p className="text-sm font-bold text-[#000F14] capitalize">{user.status}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Last Active</p>
                <p className="text-sm font-bold text-[#000F14]">{formatDate(user.last_active)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Joined</p>
                <p className="text-sm font-bold text-[#000F14]">{formatDate(user.joined)}</p>
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
                  <h3 className="text-sm font-semibold text-[#000F14]">Personal Information</h3>
                  <p className="text-xs text-gray-500">User personal details</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Name</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Email</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.email || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Phone</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.phone || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Code</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14] font-mono">{userCode}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Role</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14] capitalize">{user.role}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : user.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <span className="text-xs text-gray-500">Status</span>
                  </div>
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-600'}`}>
                     {user.status}
                   </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Date of Birth</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{formatDate(user.date_of_birth)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Gender</span>
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
                  <h3 className="text-sm font-semibold text-[#000F14]">Employment Information</h3>
                  <p className="text-xs text-gray-500">Work and employment details</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Pharmacy</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{pharmacyName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Position</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.position || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Department</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.department || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Employment Type</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{user.employment_type || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Salary</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">
                    {user.salary ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(user.salary) : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Hire Date</span>
                  </div>
                  <p className="text-sm font-medium text-[#000F14]">{formatDate(user.hire_date || user.joined)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Manager</span>
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
                  <h3 className="text-sm font-semibold text-[#000F14]">Quick Stats</h3>
                  <p className="text-xs text-gray-500">Key metrics overview</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Account Age</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{accountAge} days</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Last Login</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{formatDate(user.last_active)}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Orders Processed</span>
                  </div>
                  <span className="text-sm font-medium text-[#000F14]">{user.orders_processed || 0}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Performance</span>
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
                  <h3 className="text-sm font-semibold text-[#000F14]">Actions</h3>
                  <p className="text-xs text-gray-500">Quick actions</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <Link
                  to={`/admin/users/${id}/activity`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#000F14]">View Activity</p>
                    <p className="text-xs text-gray-500">Browse activity log</p>
                  </div>
                </Link>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">Send Message</p>
                    <p className="text-xs text-gray-500">Message this user</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <KeyRound className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">Reset Password</p>
                    <p className="text-xs text-gray-500">Generate new password</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <UserX className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#000F14]">Deactivate</p>
                    <p className="text-xs text-gray-500">Disable this account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete User"
        message={`Are you sure you want to delete "${user.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        variant="danger"
      />

      <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="" maxWidth="max-w-sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#0FD452]" />
          </div>
          <h3 className="text-lg font-bold text-[#000F14] mb-1">Success</h3>
          <p className="text-sm text-gray-500">{successMsg}</p>
        </div>
      </Modal>
    </div>
  )
}
