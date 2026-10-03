import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { Pill, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import api from '../../services/api'

const PLANS_CACHE_KEY = 'pharmex_login_plans'

// Seed from the last successful load so the packages are on screen at first
// paint instead of popping in a beat later. The request below still refreshes
// them, so the database stays the only source of truth and prices cannot drift.
const readCachedPlans = () => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(PLANS_CACHE_KEY) || '[]')
    return Array.isArray(cached) ? cached : []
  } catch {
    return []
  }
}

export default function LoginPage() {
  const [credentials, setCredentials] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, loginWithGoogleAccount, subscription, pendingGoogleResult, clearPendingGoogleResult, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [plans, setPlans] = useState(readCachedPlans)

  // Same public endpoint the marketing /packages page uses, so pricing can
  // never drift between the two.
  useEffect(() => {
    let active = true
    api.get('/subscriptions/plans')
      .then((res) => {
        if (!active) return
        const list = res.data?.data || res.data || []
        if (!Array.isArray(list)) return
        setPlans(list)
        try {
          sessionStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(list))
        } catch {
          // A full or blocked sessionStorage just means the next load fetches again.
        }
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

  // A Google sign-in that fell back to a redirect comes back to this same page
  // with the session already stored, so route it the same way a popup sign-in
  // is routed.
  useEffect(() => {
    if (authLoading || !pendingGoogleResult?.user) return
    clearPendingGoogleResult()
    routeAfterLogin(pendingGoogleResult.user, subscription, pendingGoogleResult.emailVerified)
  }, [authLoading, pendingGoogleResult])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const result = await loginWithGoogleAccount()
      routeAfterLogin(result.user, result.subscription, result.emailVerified)
    } catch (err) {
      const data = err?.response?.data
      const code = err?.code
      // Only Firebase errors are named auth/*. Axios sets codes like
      // ERR_BAD_REQUEST on every 4xx from our own API, so testing for any
      // truthy code here would swallow the backend's own message, which is the
      // only thing that explains a 401 from /auth/google.
      const firebaseCode = typeof code === 'string' && code.startsWith('auth/') ? code : null
      if (firebaseCode === 'auth/popup-closed-by-user') {
        // User dismissed the Google chooser; not an error worth showing.
      } else if (data?.application_status === 'rejected') {
        setError('Your application has been rejected. ' + (data.rejection_reason || ''))
      } else if (firebaseCode) {
        // Surface the Firebase code, otherwise every Firebase-side problem
        // (unauthorized domain, provider disabled, blocked request) collapses
        // into the same generic message with no way to tell them apart.
        console.error('Google sign-in failed:', firebaseCode, err)
        setError(`Google sign-in failed (${firebaseCode}).`)
      } else {
        console.error('Google sign-in failed:', code, data, err)
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
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-5">
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

        <div className="relative my-6">
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

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[#0FD452] font-semibold hover:text-[#0cb843] transition-colors">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#0FD452]" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[3px]">
              Packages
            </p>
          </div>
          {plans.length > 0 ? (
            <>
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
            </>
          ) : (
            // Holds the space the cards will take so the page does not jump
            // when pricing arrives, and stays honest if the request fails.
            <div className="grid grid-cols-3 gap-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-100 p-4">
                  <div className="h-2 w-1/2 mx-auto rounded bg-gray-100" />
                  <div className="h-5 w-2/3 mx-auto mt-2 rounded bg-gray-100" />
                  <div className="h-2 w-1/4 mx-auto mt-2 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
