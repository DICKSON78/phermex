import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  Phone,
  Pill,
  ShoppingCart,
  Smartphone,
  X,
} from 'lucide-react'

const PLAN_META = [
  { key: 's', popular: false, capLabel: 'pharmacies', capValue: 'Up to 3' },
  { key: 'p', popular: true, capLabel: 'pharmacies', capValue: 'Unlimited' },
  { key: 'e', popular: false, capLabel: 'pharmacies', capValue: 'Unlimited' },
]

const COLUMNS = [
  { key: 's', name: 'STARTER', price: '$150/year' },
  { key: 'p', name: 'PROFESSIONAL', price: '$200/year' },
  { key: 'e', name: 'ENTERPRISE', price: '$250/year' },
]

const CHECK_COLOR = 'text-[#0FD452]'

const MAX_BULLETS = 6

function CellValue({ value }) {
  if (value === true) return <Check className={`w-4 h-4 mx-auto ${CHECK_COLOR}`} strokeWidth={3} />
  if (value === false) return <span className="block w-2.5 h-px bg-gray-300 mx-auto" />
  return <span className="text-xs font-bold text-gray-700">{value}</span>
}

function normalizePhone(phone) {
  let p = (phone || '').replace(/[^\d]/g, '')
  if (p.startsWith('0')) p = '255' + p.slice(1)
  if (!p.startsWith('255')) p = '255' + p
  return p
}

function buildBullets(plan, idx, features) {
  if (!features?.length) return []
  const key = PLAN_META[idx]?.key || 's'
  const lessKey = key === 'p' ? 's' : key === 'e' ? 'p' : null

  const differs = []
  const common = []
  features.forEach((section) => {
    section.rows.forEach((row) => {
      if (row[key] !== true) return
      if (lessKey && row[lessKey] === false) differs.push(row.name)
      else common.push(row.name)
    })
  })

  const picked = differs.slice(0, Math.min(4, MAX_BULLETS)).concat(common)
  const chain = idx === 0 ? 'Everything you need to run a modern pharmacy:' : `Everything in ${plan.chainFrom || 'the previous plan'}, plus:`
  return { head: chain, items: picked.slice(0, MAX_BULLETS) }
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentStep, setPaymentStep] = useState(null)
  const [pushResult, setPushResult] = useState(null)
  const [error, setError] = useState('')
  const pollRef = useRef(null)
  const navigate = useNavigate()

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/subscriptions/plans')
      setPlans(res.data.data || res.data || [])
    } catch {
      setError('Failed to load plans.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  useEffect(() => () => clearInterval(pollRef.current), [])

  const openCart = (plan) => {
    setSelectedPlan(plan)
    setError('')
    setCartOpen(true)
    setPaymentStep(null)
    setPushResult(null)
    setPhone('')
  }

  const handlePay = async () => {
    if (!selectedPlan) return
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      setError('Please enter a valid M-PESA phone number.')
      return
    }
    setPaying(true)
    setError('')
    try {
      const res = await api.post('/subscriptions/checkout', {
        plan_id: selectedPlan.id,
        phone: normalizePhone(phone),
        payment_method: 'mobile',
      })
      const data = res.data
      setPushResult(data)
      if (data.push_initiated && data.reference) {
        setPaymentStep('waiting')
        startPolling(data.reference)
      } else {
        setPaymentStep('manual')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start payment. Please try again.')
      setPaymentStep(null)
    } finally {
      setPaying(false)
    }
  }

  const startPolling = (reference) => {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/subscriptions/payment-status', {
          params: { reference },
        })
        if (res.data?.status === 'paid' || res.data?.paid) {
          clearInterval(pollRef.current)
          setPaymentStep('success')
          setTimeout(() => navigate('/dashboard/subscriptions'), 1500)
        } else if (res.data?.gateway_status?.includes('FAILED')) {
          clearInterval(pollRef.current)
          setPaymentStep('manual')
          setError('The payment was not completed. You can retry or contact support.')
        }
      } catch {
        // keep polling; transient network errors are expected
      }
    }, 4000)
  }

  const handleManualConfirm = async () => {
    try {
      await api.post('/subscriptions/confirm-payment', {
        payment_ref: pushResult?.reference || undefined,
        payment_method: 'manual',
      })
      setPaymentStep('success')
      setTimeout(() => navigate('/dashboard/subscriptions'), 1200)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  const matrix = plans[0]?.features || []

  const renderCart = () => {
    if (!cartOpen || !selectedPlan) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!paying && paymentStep !== 'success') setCartOpen(false) }} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {paymentStep === 'waiting' ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                <Smartphone className="w-8 h-8 text-emerald-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Check Your Phone</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                We sent a payment prompt to <strong>{pushResult?.subscription?.phone || phone}</strong>.
                Enter your M-PESA PIN to pay{' '}
                <strong className="text-gray-900">
                  TZS {Number(pushResult?.subscription?.amount_tzs || 0).toLocaleString()}
                </strong>.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
                <Loader2 className="w-4 h-4 animate-spin text-[#0FD452]" />
                Waiting for payment confirmation…
              </div>
              <button
                onClick={() => setPaymentStep('manual')}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 underline"
              >
                Payment not received? I paid already
              </button>
            </div>
          ) : paymentStep === 'manual' ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Complete Your Payment</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Reference: <span className="font-mono text-gray-900 font-bold">{pushResult?.reference || '—'}</span>
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-left">
                <p className="text-amber-800 text-xs leading-relaxed">
                  If the push prompt didn't arrive, re-enter your number and pay again, or contact our support team.
                  Once paid we will activate your subscription.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleManualConfirm}
                  disabled={paying}
                  className="w-full py-3 bg-[#0FD452] text-[#000F14] rounded-xl font-bold text-sm hover:bg-[#0cb843] transition-all disabled:opacity-50"
                >
                  {paying ? 'Confirming…' : 'I Have Paid — Activate My Plan'}
                </button>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : paymentStep === 'success' ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-500 text-sm mb-6">
                Your <strong>{selectedPlan.name}</strong> subscription is now active.
                Taking you to your dashboard…
              </p>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#0FD452]" /> Checkout
                </h3>
                <button
                  onClick={() => setCartOpen(false)}
                  disabled={paying}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-4xl font-black text-gray-900">${Number(selectedPlan.price).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">/{selectedPlan.duration_months} month{selectedPlan.duration_months > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-gray-900 text-sm">{selectedPlan.name} Plan</p>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedPlan.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 mt-4 pt-4">
                  <span className="text-sm font-bold text-gray-600">Total Due</span>
                  <span className="text-lg font-black text-gray-900">${Number(selectedPlan.price).toLocaleString()}</span>
                </div>
              </div>

              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-gray-400" /> M-PESA Phone Number
              </label>
              <div className="relative mb-4">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  disabled={paying}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] text-gray-900 text-sm disabled:bg-gray-50"
                  inputMode="numeric"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-600 text-xs font-medium">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                <Lock className="w-3.5 h-3.5" />
                Secure mobile money payment via ClickPesa
              </div>

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-3.5 bg-[#0FD452] text-[#000F14] rounded-xl font-bold text-sm hover:bg-[#0cb843] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending Payment Prompt…</>
                ) : (
                  <>Pay ${Number(selectedPlan.price).toLocaleString()} <CreditCard className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] overflow-y-auto bg-[#F5F7F5] px-4 sm:px-6 py-8 sm:py-12" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0FD452] rounded-2xl mb-4">
            <Pill className="w-9 h-9 text-[#000F14]" />
          </div>
          <p className="text-[10px] font-bold text-[#0FD452] uppercase tracking-[3px] mb-3">Choose Your Plan</p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Subscription Plans</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            Pick a plan, add it to your cart and pay securely via M-PESA. Your subscription activates instantly.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-10">
          {plans.map((plan, idx) => {
            const meta = PLAN_META[idx] || { key: 's', popular: false, capLabel: 'pharmacies', capValue: 'Unlimited' }
            const popular = meta.popular || plan.slug === 'professional'
            const chainPlan = plans[idx - 1]
            const bullets = buildBullets({ chainFrom: chainPlan?.name }, idx, matrix)
            const capRow = matrix.flatMap((s) => s.rows).find((r) => r.name === 'Manage Multiple Pharmacies')
            const capValue = capRow ? capRow[meta.key] : meta.capValue
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${
                  popular
                    ? 'bg-[#000F14] text-white shadow-2xl shadow-[#0FD452]/10 ring-1 ring-[#0FD452]/40'
                    : 'bg-white ring-1 ring-gray-200 shadow-sm hover:shadow-xl hover:ring-[#0FD452]/50'
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0FD452] px-3 py-1 text-xs font-bold text-[#000F14]">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-extrabold tracking-tight">{plan.name}</h3>
                <p className={`mt-1 min-h-[2.5rem] text-sm leading-relaxed ${popular ? 'text-white/55' : 'text-gray-500'}`}>
                  {plan.description}
                </p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className={`text-sm font-bold ${popular ? 'text-white/55' : 'text-gray-400'}`}>
                    {plan.currency === 'USD' ? '$' : plan.currency || ''}
                  </span>
                  <span className="rp-plan-price text-4xl font-black tabular-nums tracking-tight">
                    {Number(plan.price).toLocaleString()}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${popular ? 'text-white/55' : 'text-gray-400'}`}>
                  / {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                </p>

                <div className={`mt-5 rounded-xl px-4 py-3 text-sm ${popular ? 'bg-white/10' : 'bg-gray-50 border border-gray-100'}`}>
                  <span className={`font-bold tabular-nums ${popular ? 'text-[#0FD452]' : 'text-gray-900'}`}>{capValue}</span>
                  <span className={popular ? 'text-white/55' : 'text-gray-500'}> {meta.capLabel}</span>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  <li className="flex items-start gap-3 text-sm font-bold">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-[#0FD452]' : CHECK_COLOR}`} strokeWidth={3} />
                    <span>{bullets.head}</span>
                  </li>
                  {bullets.items.map((label, fi) => (
                    <li key={fi} className="flex items-start gap-3 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-[#0FD452]' : CHECK_COLOR}`} strokeWidth={3} />
                      <span className={popular ? 'text-white/70' : 'text-gray-600'}>{label}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => openCart(plan)}
                  className={`mt-8 flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                    popular
                      ? 'bg-[#0FD452] text-[#000F14] hover:bg-[#0cb843]'
                      : 'border border-[#0FD452]/60 text-[#0FD452] hover:bg-[#0FD452] hover:text-[#000F14]'
                  }`}
                >
                  Choose Plan <ShoppingCart className="w-4 h-4" />
                </button>
              </article>
            )
          })}
        </div>

        <p className="mx-auto max-w-3xl text-center text-sm leading-7 text-gray-500">
          All plans are billed yearly and activated instantly via secure M-PESA payment (ClickPesa). No hidden fees —
          upgrade or renew anytime from your dashboard.
        </p>

        {/* Feature comparison matrix */}
        {matrix.length > 0 && (
          <details className="group mt-8 rounded-2xl bg-white ring-1 ring-gray-200 overflow-hidden">
            <summary className="flex items-center justify-center gap-2 px-5 py-4 cursor-pointer font-extrabold text-sm text-gray-800 list-none hover:bg-gray-50">
              Compare all features
              <ChevronDown className="w-4 h-4 text-[#0FD452] transition-transform group-open:rotate-180" />
            </summary>
            <div className="p-6 sm:p-7 border-t border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left px-6 py-4 font-bold text-gray-800 text-xs uppercase tracking-wider w-1/2">Feature</th>
                      {COLUMNS.map((col) => (
                        <th key={col.key} className="px-3 py-4 text-center">
                          <span className="text-xs font-black text-gray-900 block">{col.name}</span>
                          <span className="text-xs text-[#0FD452] font-extrabold block mt-1">{col.price}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((section, si) => (
                      <SectionRows
                        key={si}
                        section={section}
                        sectionIndex={si}
                        startIndex={matrix.slice(0, si).reduce((acc, s) => acc + s.rows.length, 0)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        )}

        {plans.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-500 text-sm">No plans available yet.</div>
        )}
      </div>

      {renderCart()}
    </div>
  )
}

function SectionRows({ section, sectionIndex, startIndex }) {
  return (
    <>
      <tr>
        <td colSpan={4} className="px-6 py-2.5 bg-[#000F14]">
          <p className="text-[11px] font-extrabold text-green-300 uppercase tracking-[2px]">{section.section}</p>
        </td>
      </tr>
      {section.rows.map((row, ri) => (
        <tr key={ri} className={(startIndex + ri) % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
          <td className="px-6 py-2.5 text-gray-700 font-medium">{row.name}</td>
          {COLUMNS.map((col) => (
            <td key={col.key} className="px-3 py-2.5 text-center">
              <CellValue value={row[col.key]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}