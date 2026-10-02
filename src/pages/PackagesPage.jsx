import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DASHBOARD_URL } from '../config'
import MainCta from '../components/MainCta'

// Shown while the API is unreachable, and if the endpoint ever returns nothing,
// so the pricing page is never blank.
const FALLBACK_PLANS = [
  {
    id: 1,
    name: 'STARTER',
    slug: 'starter',
    price: 150,
    currency: 'USD',
    duration_months: 12,
    description: 'Everything a single pharmacy needs to run inventory and sales.',
  },
  {
    id: 2,
    name: 'PROFESSIONAL',
    slug: 'professional',
    price: 200,
    currency: 'USD',
    duration_months: 12,
    description: 'Advanced reporting, financials and staff management for growing teams.',
  },
  {
    id: 3,
    name: 'ENTERPRISE',
    slug: 'enterprise',
    price: 250,
    currency: 'USD',
    duration_months: 12,
    description: 'Multi-branch control, consolidated reporting and priority support.',
  },
]

function formatPrice(plan) {
  const currency = plan.currency || 'USD'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(plan.price ?? 0))
  } catch {
    return `${currency} ${Number(plan.price ?? 0).toLocaleString()}`
  }
}

function periodLabel(plan) {
  const months = Number(plan.duration_months ?? 12)
  if (months === 1) return 'per month'
  if (months === 12) return 'per year'
  return `per ${months} months`
}

export default function PackagesPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/subscriptions/plans', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active) return
        const list = json?.data || json || []
        setPlans(Array.isArray(list) && list.length ? list : FALLBACK_PLANS)
      })
      .catch(() => {
        if (active) setPlans(FALLBACK_PLANS)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <section className="relative py-28 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold text-[#0FD452] uppercase tracking-[3px] mb-4">
              Packages
            </p>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-[#000F14]">
              Simple pricing that scales with your pharmacy
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Choose the package that matches your operation. Every plan includes
              inventory, point of sale, prescriptions and the Helix customer app.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-28 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3 items-start">
              {plans.map((plan, idx) => {
                const popular = plan.slug === 'professional' || idx === 1
                return (
                  <div
                    key={plan.id ?? plan.slug ?? idx}
                    className={
                      popular
                        ? 'relative rounded-3xl bg-[#000F14] text-white p-8 shadow-xl ring-2 ring-[#0FD452]'
                        : 'relative rounded-3xl bg-white border border-gray-200 p-8'
                    }
                  >
                    {popular && (
                      <span className="absolute -top-3 left-8 rounded-full bg-[#0FD452] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#000F14]">
                        Most Popular
                      </span>
                    )}

                    <h2
                      className={
                        popular
                          ? 'text-sm font-black tracking-widest text-[#0FD452]'
                          : 'text-sm font-black tracking-widest text-gray-500'
                      }
                    >
                      {plan.name}
                    </h2>

                    <p
                      className={
                        popular ? 'mt-4 text-4xl font-black' : 'mt-4 text-4xl font-black text-[#000F14]'
                      }
                    >
                      {formatPrice(plan)}
                      <span
                        className={
                          popular
                            ? 'ml-2 text-sm font-semibold text-gray-400'
                            : 'ml-2 text-sm font-semibold text-gray-500'
                        }
                      >
                        {periodLabel(plan)}
                      </span>
                    </p>

                    {plan.description && (
                      <p
                        className={
                          popular
                            ? 'mt-4 text-sm text-gray-300 leading-relaxed'
                            : 'mt-4 text-sm text-gray-600 leading-relaxed'
                        }
                      >
                        {plan.description}
                      </p>
                    )}

                    <Link
                      to={`${DASHBOARD_URL}/register/owner`}
                      className={
                        popular
                          ? 'mt-8 block w-full rounded-xl bg-[#0FD452] px-6 py-3 text-center text-sm font-black text-[#000F14] transition-colors hover:bg-[#0cb843]'
                          : 'mt-8 block w-full rounded-xl border border-[#000F14] px-6 py-3 text-center text-sm font-black text-[#000F14] transition-colors hover:bg-[#0FD452]'
                      }
                    >
                      Get Started
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          <p className="mt-10 text-center text-sm text-gray-500">
            Need a custom package for a chain?{' '}
            <Link to="/contact" className="font-bold text-[#0FD452] hover:text-[#0cb843]">
              Talk to our team
            </Link>
          </p>
        </div>
      </section>

      <MainCta />
    </>
  )
}
