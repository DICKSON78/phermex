import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { formatUsdPrice } from '../../utils/currency'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  Clock,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCcw,
  Sparkles,
  CreditCard as Card,
  Shield,
  AlertCircle,
} from 'lucide-react'

const PLAN_META = {
  starter: { icon: Sparkles, accent: 'from-emerald-500 to-green-600', ring: 'ring-emerald-200', check: 'text-emerald-500' },
  professional: { icon: Card, accent: 'from-blue-500 to-indigo-600', ring: 'ring-blue-200', check: 'text-blue-500' },
  enterprise: { icon: Shield, accent: 'from-amber-400 to-orange-500', ring: 'ring-amber-200', check: 'text-amber-500' },
}

const PLAN_META_FALLBACK = { icon: CreditCard, accent: 'from-slate-500 to-slate-600', ring: 'ring-slate-200', check: 'text-slate-500' }

function statusBadge(status) {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold '
  switch (status) {
    case 'paid': return base + 'bg-emerald-50 text-emerald-700'
    case 'pending': return base + 'bg-amber-50 text-amber-700'
    case 'trial': return base + 'bg-blue-50 text-blue-700'
    case 'failed': return base + 'bg-red-50 text-red-700'
    case 'refunded': return base + 'bg-red-50 text-red-700'
    default: return base + 'bg-gray-100 text-gray-600'
  }
}

export default function SubscriptionsPage() {
  const { t } = useLanguage()
  const [status, setStatus] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activationLoading, setActivationLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statusRes, plansRes] = await Promise.all([
        api.get('/subscriptions/status'),
        api.get('/subscriptions/plans'),
      ])
      setStatus(statusRes.data)
      setPlans(plansRes.data?.data || plansRes.data || [])
    } catch {
      setError(t('reports.subscriptions.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  const isPaidUp = status?.payment_status === 'paid' && status?.subscription_type === 'subscription'
  const onTrial = status?.plan === 'trial'
  const planName = status?.plan_name || status?.plan || '—'
  const featureSections = status?.plan_features || []
  const featureCount = featureSections.reduce(
    (total, section) => total + ((section?.rows || []).length || 0),
    0,
  )

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#0FD452]" />
            {t('subscription.billing')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('reports.subscriptions.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/subscribe')}
          className="px-5 py-2.5 bg-[#0FD452] text-[#000F14] rounded-xl text-sm font-bold hover:bg-[#0cb843] transition-all active:scale-95 flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          {t('reports.subscriptions.upgradeRenew')}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Current status card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#000F14] to-[#123] text-white p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-green-300/70 font-bold mb-2">{t('reports.subscriptions.currentPlanStatus')}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black">
                {status?.has_pharmacy ? status.pharmacy_name || t('reports.subscriptions.yourPharmacy') : t('reports.subscriptions.noPharmacy')}
              </h2>
              <span className={statusBadge(status?.subscription_type)}>
                {status?.subscription_type === 'subscription' ? t('reports.subscriptions.typeSubscription').toUpperCase() : (status?.subscription_type || '—').toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">{t('reports.subscriptions.paymentStatus')}</p>
            <span className={statusBadge(status?.payment_status)}>
              {(status?.payment_status || '—').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs font-bold text-white/50 mb-1">{t('reports.subscriptions.daysRemaining')}</p>
            <p className="text-xl font-black">{status?.days_remaining ?? '—'}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs font-bold text-white/50 mb-1">{t('reports.subscriptions.trialEnds')}</p>
            <p className="text-xl font-black">{status?.trial_ends_at ? new Date(status.trial_ends_at).toLocaleDateString() : '—'}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 col-span-2 sm:col-span-1">
            <p className="text-xs font-bold text-white/50 mb-1">{t('reports.subscriptions.subscriptionEnds')}</p>
            <p className="text-xl font-black">{status?.subscription_end_date ? new Date(status.subscription_end_date).toLocaleDateString() : '—'}</p>
          </div>
        </div>

        {/* The package whose features are switched on right now. */}
        <div className="mt-6 rounded-xl bg-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white/50 mb-1">{t('reports.subscriptions.activePackage')}</p>
            <p className="text-lg font-black uppercase">{planName}</p>
          </div>
          {onTrial && (
            <span className="px-3 py-1.5 rounded-full bg-[#0FD452] text-[#000F14] text-xs font-bold uppercase tracking-wider">
              {t('reports.subscriptions.fullAccess', 'Full access')}
            </span>
          )}
        </div>

        {onTrial && (
          <p className="mt-3 text-xs text-white/70 leading-relaxed">
            {t('reports.subscriptions.trialFullAccessNote')}
          </p>
        )}
      </div>

      {/* What this package includes right now */}
      {featureSections.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {t('reports.subscriptions.includedFeatures')}
            </h2>
            <span className="text-xs font-bold text-gray-400">
              {featureCount} {t('reports.subscriptions.featuresCount', 'features')}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {featureSections.map((section) => (
              <div key={section.section}>
                <p className="text-xs font-black text-[#000F14] uppercase tracking-wider mb-2">{section.section}</p>
                <ul className="space-y-1">
                  {(section.rows || []).map((row) => (
                    <li key={row.name} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0FD452] shrink-0 mt-0.5" />
                      <span>{row.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment / activation manual confirm */}
      {status?.payment_status === 'pending' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-8">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm mb-1">{t('reports.subscriptions.paymentPending')}</p>
              <p className="text-amber-700 text-xs leading-relaxed mb-3">
                {t('reports.subscriptions.paymentPendingBody')}
              </p>
              <button
                onClick={() => navigate('/subscribe')}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all"
              >
                {t('reports.subscriptions.completePayment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The payment did not go through, so it can be tried again. */}
      {status?.payment_status === 'failed' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-800 text-sm mb-1">
                {t('reports.subscriptions.paymentFailed', 'Payment failed')}
              </p>
              <p className="text-red-700 text-xs leading-relaxed mb-3">
                {status?.payment_failure_reason
                  || t('reports.subscriptions.paymentFailedBody', 'The payment did not go through. Please try again.')}
              </p>
              <button
                onClick={() => navigate('/subscribe')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all"
              >
                {t('reports.subscriptions.tryAgain', 'Try again')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plans overview */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t('reports.subscriptions.availablePlans')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const meta = PLAN_META[plan.slug] || PLAN_META_FALLBACK
          const Icon = meta.icon
          return (
            <div key={plan.id} className="rounded-2xl bg-white border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.accent} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-black text-gray-900 mt-2">
                {formatUsdPrice(plan.price, { decimals: 0 })}
                <span className="text-sm text-gray-400 font-medium">{t('reports.subscriptions.perYear')}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{plan.description}</p>
              <button
                onClick={() => navigate('/subscribe')}
                className="mt-4 w-full py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 text-sm font-bold hover:border-[#0FD452]/50 hover:text-[#0FD452] transition-all"
              >
                {isPaidUp ? t('reports.subscriptions.renewUpgrade') : t('subscription.subscribe')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}