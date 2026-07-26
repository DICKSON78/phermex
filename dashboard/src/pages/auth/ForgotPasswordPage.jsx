import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react'
import api from '../../services/api'

const CODE_LENGTH = 6

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const codeRefs = useRef([])

  useEffect(() => {
    if (step === 2 && codeRefs.current[0]) {
      codeRefs.current[0].focus()
    }
  }, [step])

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      await api.post('/forgot-password', { identifier })
      setSuccessMsg('Reset code sent! Check your email/phone')
      setTimeout(() => {
        setStep(2)
        setSuccessMsg('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    if (value && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    const newCode = [...code]
    pasted.split('').forEach((char, i) => {
      newCode[i] = char
    })
    setCode(newCode)
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1)
    codeRefs.current[focusIndex]?.focus()
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/reset-password', {
        identifier,
        code: code.join(''),
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Stethoscope className="w-9 h-9 text-dark" />
          </div>
          <h1 className="text-2xl font-bold text-white">PHARMEX</h1>
          <p className="text-gray-400 text-sm mt-1">Pharmacy Management System</p>
        </div>

        {/* Step 1: Enter Email/Phone */}
        {step === 1 && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">Forgot Password?</h2>
              <p className="text-gray-400 text-sm mt-2">
                Enter your email or phone number and we'll send you a reset code
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-6">
                <p className="text-green-400 text-sm">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email or Phone</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter email or phone number"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-600 disabled:bg-primary/50 text-dark font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>

            <p className="text-center mt-6">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Enter Code + New Password */}
        {step === 2 && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">Enter Reset Code</h2>
              <p className="text-gray-400 text-sm mt-2">
                We sent a 6-digit code to <span className="text-white font-medium">{identifier}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Verification Code</label>
                <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (codeRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-14 text-center text-lg font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.some((d) => !d)}
                className="w-full bg-primary hover:bg-primary-600 disabled:bg-primary/50 text-dark font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <p className="text-center mt-6">
              <button
                onClick={() => { setStep(1); setError(''); setCode(Array(CODE_LENGTH).fill('')) }}
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </p>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-[#0FD452]/20 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10 text-[#0FD452]" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">Password Reset Successful!</h2>
            <p className="text-gray-400 text-sm mb-8">
              You can now login with your new password
            </p>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-dark font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20"
            >
              <ShieldCheck className="w-5 h-5" />
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
