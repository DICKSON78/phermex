import { useAuth } from '../contexts/AuthContext'
import { Lock, ArrowUpRight } from 'lucide-react'
import { planLevel, PLAN_LABELS } from '../utils/planConfig'

export default function PlanGate({ requiredPlan = 'professional', children, featureName }) {
  const { subscription, user } = useAuth()

  const activePlan = subscription?.plan || subscription?.subscription_plan || user?.subscription?.plan || user?.current_pharmacy?.subscription_plan || user?.pharmacy?.[0]?.subscription_plan
  const unlocked = planLevel(activePlan) >= planLevel(requiredPlan)

  if (unlocked) return children

  const requiredLabel = PLAN_LABELS[requiredPlan] || requiredPlan
  const currentLabel = activePlan ? (PLAN_LABELS[String(activePlan).toLowerCase()] || activePlan) : 'Trial'

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#000F14] mb-6">
        <Lock className="w-8 h-8 text-[#0FD452]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {featureName ? `${featureName} is a ${requiredLabel} feature` : `This is a ${requiredLabel} feature`}
      </h1>
      <p className="text-gray-500 mb-2">
        Your current plan is <span className="font-semibold text-gray-800">{currentLabel}</span>.
      </p>
      <p className="text-gray-500 mb-8">
        {requiredLabel === 'Enterprise'
          ? `This feature is available on the Enterprise plan. Upgrade to unlock it for all your pharmacies.`
          : `This feature is available on the ${requiredLabel} plan and above. Upgrade to unlock it for all your pharmacies.`}
      </p>
      <a
        href="/subscribe"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#000F14] text-white font-semibold rounded-xl hover:bg-[#0a2015]"
      >
        Upgrade to {requiredLabel} <ArrowUpRight className="w-4 h-4" />
      </a>
    </div>
  )
}