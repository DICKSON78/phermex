import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope,
  Mail,
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-gray-600 font-black text-3xl">PHARMEX</span>
          </div>
        </div>

        {/* Step 1: Enter Email/Phone */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">Password Recovery</p>
              <h1 className="text-4xl font-black text-gray-600 mb-3">Forgot Password?</h1>
              <p className="text-gray-500 text-lg">
                Enter your email or phone number and we'll send you a reset code
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <p className="text-green-600 text-sm font-medium">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email or Phone</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="johndoe@gmail.com"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0FD452] font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </p>
          </>
        )}

        {/* Step 2: Enter Code + New Password */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">Verification</p>
              <h1 className="text-4xl font-black text-gray-600 mb-3">Enter Reset Code</h1>
              <p className="text-gray-500 text-sm">
                We sent a 6-digit code to <span className="text-gray-700 font-semibold">{identifier}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Code Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-3">Verification Code</label>
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
                      className="w-12 h-14 text-center text-lg font-bold border border-gray-200 rounded-xl text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.some((d) => !d)}
                className="w-full py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0FD452] font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </p>
          </>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-[#0FD452]/20 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10 text-[#0FD452]" />
              </div>
            </div>

            <h1 className="text-4xl font-black text-gray-600 mb-3">Password Reset!</h1>
            <p className="text-gray-500 text-lg mb-8">
              You can now login with your new password
            </p>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] font-bold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
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
