import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Pill, Mail, KeyRound, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import api from '../../services/api'

export default function VerifyEmailPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState('input')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const sendCode = async () => {
    setSending(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/email/verify/send')
      const debugCode = res.data?.debug_code
      if (debugCode) {
        setSuccess(`Verification code sent. Debug: ${debugCode}`)
      } else {
        setSuccess('Verification code sent. Check your email.')
      }
      setCooldown(60)
      setStep('input')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code.')
    } finally {
      setSending(false)
    }
  }

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Code must be 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/email/verify', { code })
      setStep('done')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-[#0FD452] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified</h1>
          <p className="text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-gray-600 font-black text-3xl">PHARMEX</span>
          </div>
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-500">
            We sent a 6-digit code to <strong>{user?.email || 'your email'}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Verification Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 6)); setError('') }}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-center tracking-[0.3em] font-mono text-lg"
                placeholder="ABCDEF"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
              />
            </div>
          </div>

          <button
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
            Verify Email
          </button>

          <button
            onClick={sendCode}
            disabled={sending || cooldown > 0}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
          >
            {sending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
