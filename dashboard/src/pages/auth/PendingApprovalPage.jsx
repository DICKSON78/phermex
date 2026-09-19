import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Pill,
  LogOut,
  RefreshCw,
} from 'lucide-react'

export default function PendingApprovalPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await api.get('/subscriptions/status')
      setStatus(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (status?.application_status === 'approved' && status?.payment_status === 'paid') {
      navigate('/dashboard')
    }
  }, [status, navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isRejected = status?.application_status === 'rejected'
  const isPending = !status?.application_status || status?.application_status === 'pending'

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-xl font-bold text-gray-600">HELIX</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {loading && !status ? (
            <div className="space-y-4">
              <RefreshCw className="w-12 h-12 text-[#0FD452] animate-spin mx-auto" />
              <p className="text-gray-500">Checking your application status...</p>
            </div>
          ) : isRejected ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Rejected</h2>
              <p className="text-gray-500 text-sm mb-4">Unfortunately, your application was not approved.</p>
              {status?.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-red-700 mb-1">Reason:</p>
                  <p className="text-sm text-red-600">{status.rejection_reason}</p>
                </div>
              )}
              <div className="space-y-3">
                <Link to="/register" className="block w-full py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all">
                  Reapply
                </Link>
                <button onClick={handleLogout} className="block w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h2>
              <p className="text-gray-500 text-sm mb-6">
                Thank you for registering <span className="font-semibold text-gray-700">{status?.pharmacy_name || 'your pharmacy'}</span>.
                Our team is reviewing your application. You'll receive an email once it's approved.
              </p>

              <div className="bg-[#0FD452]/5 border border-[#0FD452]/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#0FD452]" />
                  <span className="text-sm font-semibold text-gray-700">What happens next?</span>
                </div>
                <ol className="text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-[#0FD452] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-[#000F14]">1</span>
                    </span>
                    Our team reviews your pharmacy details and license
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-[#0FD452] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-[#000F14]">2</span>
                    </span>
                    Once approved, you can complete your payment
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-[#0FD452] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-[#000F14]">3</span>
                    </span>
                    After payment confirmation, your pharmacy goes live!
                  </li>
                </ol>
              </div>

              {status?.payment_status === 'unpaid' && status?.subscription_plan_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-blue-700 text-sm font-medium">7-Day Free Trial Active</p>
                  <p className="text-blue-600 text-xs mt-1">You can use the system during your trial period while we review your application.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={fetchStatus} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </button>
                <button onClick={handleLogout} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">Need help? Contact us</p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> support@pharmex.co.tz</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +255 625 460 081</span>
          </div>
        </div>
      </div>
    </div>
  )
}
