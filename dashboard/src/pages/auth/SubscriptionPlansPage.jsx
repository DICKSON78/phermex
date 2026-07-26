import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { Pill, Check, Loader2, ArrowRight, Clock, CreditCard, Shield, Star, Zap, Users, Headphones, Package, BarChart3, Globe, Award } from 'lucide-react'

const PLAN_DATA = [
  {
    icon: Clock,
    accent: 'from-gray-400 to-gray-500',
    ring: 'ring-gray-200',
    checkColor: 'text-gray-400',
  },
  {
    icon: Zap,
    accent: 'from-[#0FD452] to-emerald-500',
    ring: 'ring-[#0FD452]/30',
    checkColor: 'text-[#0FD452]',
    popular: true,
  },
  {
    icon: Shield,
    accent: 'from-blue-500 to-blue-600',
    ring: 'ring-blue-200',
    checkColor: 'text-blue-500',
  },
  {
    icon: Award,
    accent: 'from-amber-400 to-orange-500',
    ring: 'ring-amber-200',
    checkColor: 'text-amber-500',
  },
]

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [subscribing, setSubscribing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { subscription } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscriptions/plans')
        setPlans(res.data.data || res.data)
      } catch {
        setPlans([])
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const handleSubscribe = async () => {
    if (!selectedPlan) return
    setSubscribing(true)
    setError('')
    try {
      await api.post('/subscriptions/subscribe', { plan_id: selectedPlan.id })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to subscribe. Please try again.')
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0FD452] rounded-2xl mb-4">
              <Pill className="w-9 h-9 text-[#000F14]" />
            </div>
            <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">Choose Your Plan</p>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Subscription Plans</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 opacity-30 pointer-events-none">
            {plans.map((plan, idx) => {
              const meta = PLAN_DATA[idx % PLAN_DATA.length]
              const Icon = meta.icon
              return (
                <div key={plan.id} className="relative rounded-2xl bg-white border-2 border-gray-100 p-6 sm:p-7 flex flex-col">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.accent} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-5">{plan.description}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-black text-gray-900">TZS {Number(plan.price).toLocaleString()}</span>
                    <span className="text-sm text-gray-400 ml-1">/ {plan.duration_months}mo</span>
                  </div>
                  <div className="w-full py-3 rounded-xl text-sm font-bold text-center bg-gray-50 text-gray-400 border border-gray-100">Choose Plan</div>
                </div>
              )
            })}
          </div>

          {/* Success Modal Overlay */}
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => { setSuccess(false); setSelectedPlan(null) }} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-fadeIn z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#0FD452]/10 mb-5">
                <Check className="w-10 h-10 text-[#0FD452]" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Subscription Selected!</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your <strong>{selectedPlan?.name}</strong> plan has been selected. Complete payment of <strong className="text-gray-900">TZS {Number(selectedPlan?.price).toLocaleString()}</strong> to activate.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 text-sm font-bold mb-1">Pending Payment</p>
                    <p className="text-amber-700 text-xs leading-relaxed">Contact our support team to complete payment. Your subscription activates once payment is confirmed.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setSuccess(false); setSelectedPlan(null) }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Back to Plans
                </button>
                <button
                  onClick={() => navigate('/owner')}
                  className="flex-1 py-3 bg-[#0FD452] text-[#000F14] rounded-xl font-bold text-sm hover:bg-[#0cb843] transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7F5] px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0FD452] rounded-2xl mb-4">
            <Pill className="w-9 h-9 text-[#000F14]" />
          </div>
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">Choose Your Plan</p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Subscription Plans</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            {subscription?.days_remaining > 0
              ? `Your trial ends in ${subscription.days_remaining} day${subscription.days_remaining === 1 ? '' : 's'}. Choose a plan to keep using Pharmex.`
              : 'Your trial has expired. Choose a plan to continue using Pharmex.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 max-w-lg mx-auto">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {plans.map((plan, idx) => {
            const meta = PLAN_DATA[idx % PLAN_DATA.length]
            const Icon = meta.icon
            const isSelected = selectedPlan?.id === plan.id
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative cursor-pointer rounded-2xl bg-white border-2 p-6 sm:p-7 transition-all duration-200 hover:shadow-xl active:scale-[0.97] flex flex-col ${
                  isSelected
                    ? `border-[#0FD452] shadow-xl shadow-[#0FD452]/10 ${meta.ring}`
                    : 'border-gray-100 hover:border-[#0FD452]/40 hover:shadow-lg'
                } ${meta.popular ? 'lg:scale-[1.03] lg:z-10' : ''}`}
              >
                {meta.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#0FD452] text-[#000F14] text-[10px] font-extrabold px-4 py-1 rounded-full uppercase tracking-widest shadow-sm">Most Popular</span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.accent} flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-extrabold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-5 leading-relaxed">{plan.description}</p>

                <div className="mb-5">
                  <span className="text-3xl font-black text-gray-900">TZS {Number(plan.price).toLocaleString()}</span>
                  <span className="text-sm text-gray-400 ml-1">/ {plan.duration_months}mo</span>
                </div>

                {plan.features && (
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className={`w-4 h-4 ${meta.checkColor} shrink-0 mt-0.5`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan) }}
                  className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${
                    isSelected
                      ? 'bg-[#0FD452] text-[#000F14] shadow-md'
                      : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-[#0FD452]/40 hover:text-[#0FD452]'
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Choose Plan'}
                </button>
              </div>
            )
          })}
        </div>

        {selectedPlan && (
          <div className="mt-10 text-center">
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="px-12 py-4 bg-[#0FD452] text-[#000F14] rounded-2xl font-bold text-sm hover:bg-[#0cb843] transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-[#0FD452]/20 active:scale-[0.97]"
            >
              {subscribing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <>Subscribe to {selectedPlan.name} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
