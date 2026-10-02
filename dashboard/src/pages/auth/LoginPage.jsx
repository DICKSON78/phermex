import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { Pill, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import api from '../../services/api'

export default function LoginPage() {
  const [credentials, setCredentials] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, loginWithGoogleAccount } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])

  // Same public endpoint the marketing /packages page uses, so pricing can
  // never drift between the two.
  useEffect(() => {
    let active = true
    api.get('/subscriptions/plans')
      .then((res) => {
        if (!active) return
        const list = res.data?.data || res.data || []
        setPlans(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const formatPrice = (plan) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: plan.currency || 'USD',
        maximumFractionDigits: 0,
      }).format(Number(plan.price ?? 0))
    } catch {
      return `${plan.currency || 'USD'} ${Number(plan.price ?? 0).toLocaleString()}`
    }
  }

  const [googleLoading, setGoogleLoading] = useState(false)

  // Routes a finished sign-in the same way as the password flow.
  const routeAfterLogin = (userData, subData, emailVerified) => {
    if (subData?.application_status === 'rejected') {
      setError('Your application has been rejected. ' + (subData.rejection_reason || ''))
      return
    }
    if (subData?.application_status === 'pending') {
      navigate('/pending-approval')
      return
    }
    if (emailVerified === false) {
      navigate('/verify-email')
      return
    }
    navigate(userData.role === 'customer' ? '/app' : '/dashboard')
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const result = await loginWithGoogleAccount()
      routeAfterLogin(result.user, result.subscription, result.emailVerified)
    } catch (err) {
      const data = err?.response?.data
      const code = err?.code
      if (code === 'auth/popup-closed-by-user') {
        // User dismissed the Google chooser; not an error worth showing.
      } else if (data?.application_status === 'rejected') {
        setError('Your application has been rejected. ' + (data.rejection_reason || ''))
      } else {
        setError(data?.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login({ login: credentials, password })
      const userData = result.user
      const subData = result.subscription

      routeAfterLogin(userData, subData, result.email_verified)
    } catch (err) {
      const data = err.response?.data
      if (data?.application_status === 'rejected') {
        setError('Your application has been rejected. ' + (data.rejection_reason || ''))
      } else {
        setError(data?.message || t('auth.invalidCredentials'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#0FD452] rounded-xl flex items-center justify-center">
              <Pill className="w-7 h-7 text-[#000F14]" />
            </div>
            <span className="text-gray-600 font-black text-3xl">HELIX</span>
          </div>
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">{t('auth.login')}</p>
          <h1 className="text-4xl font-black text-gray-600 mb-3">{t('auth.loginTitle')}</h1>
          <p className="text-gray-500 text-lg">{t('auth.loginSubtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-4 mb-5">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">or</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('auth.email')} / {t('common.phone')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
                placeholder="example@gmail.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm text-[#0FD452] hover:text-[#0cb843] font-medium transition-colors">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loading ? `${t('common.loading')}` : t('auth.signIn').toUpperCase()}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-400">or continue with</span>
          </div>
        </div>

                <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {plans.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#0FD452]" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[3px]">
                Packages
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {plans.map((plan) => (
                <Link
                  key={plan.id ?? plan.slug}
                  to="/register/owner"
                  className="rounded-2xl border border-gray-200 p-4 text-center transition-all duration-200 hover:border-[#0FD452] hover:shadow-md"
                >
                  <p className="text-[10px] font-black tracking-widest text-gray-500 truncate">
                    {plan.name}
                  </p>
                  <p className="mt-1.5 text-lg font-black text-[#000F14]">
                    {formatPrice(plan)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    /{Number(plan.duration_months ?? 12) === 1 ? 'mo' : 'yr'}
                  </p>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Start your pharmacy on any package
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
{t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[#0FD452] font-semibold hover:text-[#0cb843] transition-colors">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
