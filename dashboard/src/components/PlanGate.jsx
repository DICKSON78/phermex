import { useAuth } from '../contexts/AuthContext'
import { Lock, ArrowUpRight } from 'lucide-react'

const PLAN_LEVELS = { trial: 0, basic: 1, starter: 2, pro: 3, professional: 3, enterprise: 4 }

function planLevel(plan) {
  return plan ? PLAN_LEVELS[plan] ?? 0 : 1
}

export default function PlanGate({ requiredPlan, children }) {
  const { subscription, user } = useAuth()

  const activePlan = subscription?.plan || user?.subscription?.plan || user?.current_pharmacy?.subscription_plan
  const unlocked = planLevel(activePlan) >= planLevel(requiredPlan)

  if (unlocked) return children

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#000F14] mb-6">
        <Lock className="w-8 h-8 text-[#0FD452]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">This is a Professional feature</h1>
      <p className="text-gray-500 mb-8">
        Advanced analytics & reports are available on the <span className="font-semibold text-gray-800">Professional</span> plan and above.
        Upgrade to unlock them for all your pharmacies.
      </p>
      <a
        href="/subscribe"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#000F14] text-white font-semibold rounded-xl hover:bg-[#0a2015]"
      >
        Upgrade Plan <ArrowUpRight className="w-4 h-4" />
      </a>
    </div>
  )
}