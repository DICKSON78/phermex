import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { Clock, AlertTriangle, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

// A trial runs for 30 days and hands over every feature in the meantime.
const TRIAL_DAYS = 30

export default function SubscriptionBanner() {
  const { subscription, user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  if (!subscription || user?.role !== 'owner') return null

  const { subscription_type, days_remaining, application_status, plan } = subscription

  if (application_status === 'pending') return null

  const totalDays = subscription_type === 'trial' ? TRIAL_DAYS : 30
  const progress = Math.min((days_remaining / totalDays) * 100, 100)
  const daysLeft = `${days_remaining} ${t('subscription.daysLeftSuffix', 'days left')}`

  if (subscription_type === 'trial') {
    const isUrgent = days_remaining <= 2
    const isWarning = days_remaining <= 5
    // A trial with no package chosen yet runs on the full feature set. Once
    // the owner picks a package the features follow that package even if
    // trial days are still left, so the banner has to say which it is.
    const onFullAccess = plan === 'trial' || !plan

    return (
      <div className={`relative overflow-hidden rounded-2xl mb-4 ${
        isUrgent ? 'bg-gradient-to-r from-red-500 to-red-600'
        : isWarning ? 'bg-gradient-to-r from-amber-400 to-orange-500'
        : 'bg-gradient-to-r from-[#0FD452] to-emerald-500'
      }`}>
        <div className="relative z-10 flex items-center gap-4 px-5 py-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-white/90 text-sm font-bold">{t('subscription.freeTrial', 'Free Trial')}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                {daysLeft}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                {onFullAccess
                  ? t('subscription.trialFullAccessShort', 'Full access')
                  : String(plan).toUpperCase()}
              </span>
            </div>
            <p className="text-white/80 text-[11px] mb-1.5">
              {onFullAccess
                ? t('subscription.trialFullAccess', 'Full access to every feature')
                : t('subscription.trialPlanLimited', 'Your access follows the package you chose')}
            </p>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => navigate('/subscribe')}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-white/90 transition-all active:scale-95"
          >
            {t('subscription.subscribe', 'Subscribe')}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (subscription_type === 'subscription') {
    const isUrgent = days_remaining <= 3
    const isWarning = days_remaining <= 7

    return (
      <div className={`relative overflow-hidden rounded-2xl mb-4 ${
        isUrgent ? 'bg-gradient-to-r from-red-500 to-red-600'
        : isWarning ? 'bg-gradient-to-r from-amber-400 to-orange-500'
        : 'bg-gradient-to-r from-[#0FD452] to-emerald-500'
      }`}>
        <div className="relative z-10 flex items-center gap-4 px-5 py-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {isUrgent ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <CheckCircle className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-white/90 text-sm font-bold">
                {t('subscription.activeSubscription', 'Active Subscription')}
              </span>
              {plan && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                  {plan}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                {daysLeft}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {isWarning && (
            <button
              onClick={() => navigate('/subscribe')}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-white/90 transition-all active:scale-95"
            >
              {t('subscription.renew', 'Renew')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (subscription_type === 'expired') {
    return (
      <div className="relative overflow-hidden rounded-2xl mb-4 bg-gradient-to-r from-red-500 to-red-600">
        <div className="relative z-10 flex items-center gap-4 px-5 py-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-white/90 text-sm font-bold">
              {t('subscription.subscriptionExpired', 'Subscription Expired')}
            </span>
            <p className="text-white/70 text-xs mt-0.5">
              {t('subscription.renewToKeepUsing', 'Renew to continue using Helix')}
            </p>
          </div>
          <button
            onClick={() => navigate('/subscribe')}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-white/90 transition-all active:scale-95"
          >
            {t('subscription.subscribeNow', 'Subscribe Now')}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return null
}
