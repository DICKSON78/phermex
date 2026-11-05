import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Cloud,
  Headphones,
  Minus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { DASHBOARD_URL } from '../config'
import { useLanguage } from '../contexts/LanguageContext'
import MainCta from '../components/MainCta'
import {
  COLUMN_KEY_BY_SLUG,
  FALLBACK_FEATURES,
  FALLBACK_PLANS,
  PLAN_HIGHLIGHTS,
  PLAN_TAGLINES,
} from '../data/subscriptionPlans'

const COLUMN_KEYS = ['s', 'p', 'e']

// Plans are sold as monthly subscriptions. The API sends price_monthly for new
// records and price for older ones; both are monthly amounts.
function monthlyPrice(plan) {
  const value = Number(plan.price_monthly ?? plan.price ?? 0)
  return Number.isFinite(value) ? value : 0
}

function formatPrice(plan) {
  const currency = plan.currency || 'USD'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monthlyPrice(plan))
  } catch {
    return `${currency} ${monthlyPrice(plan).toFixed(2)}`
  }
}

function planTagline(plan) {
  return PLAN_TAGLINES[plan.slug] || plan.tagline || ''
}

function planHighlights(plan) {
  const curated = PLAN_HIGHLIGHTS[plan.slug]
  if (curated?.length) return curated

  const key = COLUMN_KEY_BY_SLUG[plan.slug]
  if (!key) return []
  return FALLBACK_FEATURES.flatMap((section) => section.rows)
    .filter((row) => row[key] === true)
    .slice(0, 6)
    .map((row) => row.name)
}

function columnKey(plan, index) {
  return COLUMN_KEY_BY_SLUG[plan.slug] || COLUMN_KEYS[index] || 's'
}

function FeatureCell({ value }) {
  if (value === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0FD452]/15">
        <Check className="h-3.5 w-3.5 text-[#0a8f3c]" strokeWidth={3} aria-label="Included" />
      </span>
    )
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-gray-300" aria-label="Not included" />
  }
  return <span className="text-xs font-bold text-gray-700">{value}</span>
}

export default function PackagesPage() {
  const { t } = useLanguage()
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

  const matrix = useMemo(() => {
    const withFeatures = plans.find(
      (plan) => Array.isArray(plan.features) && plan.features.some((section) => section?.rows?.length)
    )
    return withFeatures?.features?.length ? withFeatures.features : FALLBACK_FEATURES
  }, [plans])

  const columns = useMemo(
    () => plans.map((plan, index) => ({ plan, key: columnKey(plan, index) })),
    [plans]
  )

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-[#0FD452]/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0FD452]/30 bg-[#0FD452]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[#0a8f3c]">
              <Sparkles className="h-3 w-3" />
              {t('site.pages.packages.badge', 'Transparent pricing · Billed monthly')}
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-[#000F14] lg:text-6xl">
              {t('site.pages.packages.title')}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              {t('site.pages.packages.body')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#compare"
                className="inline-flex items-center gap-2 rounded-full bg-[#000F14] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-[#0FD452] hover:text-[#000F14]"
              >
                {t('site.pages.packages.compareCta', 'Compare plans')}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <span className="text-xs font-semibold text-gray-500">
                {t('site.pages.packages.trialNote', '30-day free trial · No card required')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[34rem] animate-pulse rounded-3xl bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid items-stretch gap-6 md:grid-cols-3">
              {plans.map((plan, idx) => {
                const popular = plan.slug === 'professional' || idx === 1
                const tagline = planTagline(plan)
                const highlights = planHighlights(plan)

                return (
                  <div
                    key={plan.id ?? plan.slug ?? idx}
                    className={
                      popular
                        ? 'relative flex h-full flex-col rounded-3xl bg-[#000F14] p-8 text-white shadow-xl ring-2 ring-[#0FD452]'
                        : 'relative flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-8'
                    }
                  >
                    {popular && (
                      <span className="absolute -top-3 left-8 rounded-full bg-[#0FD452] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#000F14]">
                        {t('site.pages.packages.mostPopular', 'Most popular')}
                      </span>
                    )}

                    {tagline && (
                      <p
                        className={
                          popular
                            ? 'text-[10px] font-black uppercase tracking-[2px] text-[#0FD452]'
                            : 'text-[10px] font-black uppercase tracking-[2px] text-[#0a8f3c]'
                        }
                      >
                        {tagline}
                      </p>
                    )}

                    <h2
                      className={
                        popular
                          ? 'mt-2 text-sm font-black tracking-widest text-white'
                          : 'mt-2 text-sm font-black tracking-widest text-gray-500'
                      }
                    >
                      {plan.name}
                    </h2>

                    <p className="mt-4 flex items-baseline">
                      <span
                        className={
                          popular
                            ? 'text-4xl font-black tracking-tight text-white'
                            : 'text-4xl font-black tracking-tight text-[#000F14]'
                        }
                      >
                        {formatPrice(plan)}
                      </span>
                      <span
                        className={
                          popular
                            ? 'text-sm font-bold text-gray-400'
                            : 'text-sm font-bold text-gray-500'
                        }
                      >
                        /mo
                      </span>
                    </p>
                    <p
                      className={
                        popular
                          ? 'mt-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-gray-500'
                          : 'mt-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-gray-400'
                      }
                    >
                      {t('site.pages.packages.billedMonthly', 'Billed monthly · Cancel anytime')}
                    </p>

                    {plan.description && (
                      <p
                        className={
                          popular
                            ? 'mt-4 text-sm leading-relaxed text-gray-300'
                            : 'mt-4 text-sm leading-relaxed text-gray-600'
                        }
                      >
                        {plan.description}
                      </p>
                    )}

                    {highlights.length > 0 && (
                      <div
                        className={
                          popular
                            ? 'mt-6 border-t border-white/10 pt-5'
                            : 'mt-6 border-t border-gray-100 pt-5'
                        }
                      >
                        <p
                          className={
                            popular
                              ? 'text-[10px] font-black uppercase tracking-[2px] text-gray-400'
                              : 'text-[10px] font-black uppercase tracking-[2px] text-gray-400'
                          }
                        >
                          {t('site.pages.packages.whatsIncluded', "What's included")}
                        </p>
                        <ul className="mt-3 space-y-2.5">
                          {highlights.map((item) => {
                            const isLeadIn = /plus:$/i.test(item)
                            return (
                              <li
                                key={item}
                                className={
                                  isLeadIn
                                    ? popular
                                      ? 'pt-1 text-xs font-bold text-white/70'
                                      : 'pt-1 text-xs font-bold text-gray-500'
                                    : 'flex items-start gap-2.5 text-sm leading-6'
                                }
                              >
                                {isLeadIn ? (
                                  item
                                ) : (
                                  <>
                                    <Check
                                      className={
                                        popular
                                          ? 'mt-1 h-3.5 w-3.5 shrink-0 text-[#0FD452]'
                                          : 'mt-1 h-3.5 w-3.5 shrink-0 text-[#0a8f3c]'
                                      }
                                      strokeWidth={3}
                                    />
                                    <span
                                      className={
                                        popular ? 'text-gray-300' : 'text-gray-600'
                                      }
                                    >
                                      {item}
                                    </span>
                                  </>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="mt-auto pt-8">
                      <Link
                        to={`${DASHBOARD_URL}/register/owner`}
                        className={
                          popular
                            ? 'block w-full rounded-xl bg-[#0FD452] px-6 py-3 text-center text-sm font-black text-[#000F14] transition-colors hover:bg-[#0cb843]'
                            : 'block w-full rounded-xl border border-[#000F14] px-6 py-3 text-center text-sm font-black text-[#000F14] transition-colors hover:bg-[#0FD452]'
                        }
                      >
                        {t('site.cta.getStarted')}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <p className="mt-10 text-center text-sm text-gray-500">
            {t('site.pages.packages.customNote', 'Need a custom package for a chain?')}{' '}
            <Link to="/contact" className="font-bold text-[#0FD452] hover:text-[#0cb843]">
              {t('site.cta.talkToTeam')}
            </Link>
          </p>
        </div>
      </section>

      {/* Everything included */}
      <section className="border-y border-gray-100 bg-gray-50/60 py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: t('site.pages.packages.perkTrialTitle', '30-day free trial'),
              body: t(
                'site.pages.packages.perkTrialBody',
                'Full access to every feature while you evaluate Helix.'
              ),
            },
            {
              icon: Cloud,
              title: t('site.pages.packages.perkCloudTitle', 'Cloud hosted'),
              body: t(
                'site.pages.packages.perkCloudBody',
                'Secure, backed-up data with no servers to manage.'
              ),
            },
            {
              icon: RefreshCw,
              title: t('site.pages.packages.perkUpdatesTitle', 'Free updates'),
              body: t(
                'site.pages.packages.perkUpdatesBody',
                'New features and improvements included in every plan.'
              ),
            },
            {
              icon: Headphones,
              title: t('site.pages.packages.perkSupportTitle', 'Human support'),
              body: t(
                'site.pages.packages.perkSupportBody',
                'Onboarding and support from the team that builds Helix.'
              ),
            },
          ].map((perk) => {
            const Icon = perk.icon
            return (
              <div key={perk.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0a8f3c] ring-1 ring-gray-200">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#000F14]">{perk.title}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{perk.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Comparison matrix */}
      <section id="compare" className="scroll-mt-24 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-[#0FD452]">
              {t('site.pages.packages.compareKicker', 'Compare')}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#000F14] lg:text-4xl">
              {t('site.pages.packages.compareTitle', 'Every feature, side by side')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              {t(
                'site.pages.packages.compareBody',
                'See exactly what each package includes. Scroll the table sideways on smaller screens to compare all three plans.'
              )}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5 text-xs font-semibold text-gray-500">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0FD452]/15">
                <Check className="h-3 w-3 text-[#0a8f3c]" strokeWidth={3} />
              </span>
              {t('site.pages.packages.legendIncluded', 'Included')}
            </span>
            <span className="inline-flex items-center gap-2">
              <Minus className="h-4 w-4 text-gray-300" />
              {t('site.pages.packages.legendNotIncluded', 'Not included')}
            </span>
            <span className="text-gray-400">
              {t('site.pages.packages.legendPrices', 'All prices in USD, billed monthly.')}
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <caption className="sr-only">
                  {t(
                    'site.pages.packages.compareCaption',
                    'Helix plan feature comparison for Starter, Professional and Enterprise'
                  )}
                </caption>
                <thead>
                  <tr className="bg-[#000F14] text-white">
                    <th
                      scope="col"
                      className="w-[42%] px-6 py-5 text-left text-[10px] font-black uppercase tracking-[2px] text-gray-400"
                    >
                      {t('site.pages.packages.featureColumn', 'Features')}
                    </th>
                    {columns.map(({ plan }) => {
                      const popular = plan.slug === 'professional'
                      return (
                        <th
                          key={plan.id ?? plan.slug}
                          scope="col"
                          className={
                            popular
                              ? 'px-4 py-4 text-center ring-1 ring-inset ring-[#0FD452]/40'
                              : 'px-4 py-4 text-center'
                          }
                        >
                          {popular && (
                            <span className="mb-1 block text-[9px] font-black uppercase tracking-[1.5px] text-[#0FD452]">
                              {t('site.pages.packages.mostPopular', 'Most popular')}
                            </span>
                          )}
                          <span className="block text-xs font-black tracking-widest text-white">
                            {plan.name}
                          </span>
                          <span className="mt-1 block text-sm font-black text-[#0FD452]">
                            {formatPrice(plan)}
                            <span className="text-[10px] font-bold text-gray-400">/mo</span>
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((section, sectionIndex) => (
                    <FeatureSection
                      key={section.section ?? sectionIndex}
                      section={section}
                      columns={columns}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-6 text-xs leading-6 text-gray-500">
            {t('site.pages.packages.compareFootnote', 'Plan features are updated as Helix ships.')}{' '}
            <Link to="/contact" className="font-bold text-[#0FD452] hover:text-[#0cb843]">
              {t('site.pages.packages.compareFootnoteLink', 'Ask us about a specific requirement')}
            </Link>
            .
          </p>
        </div>
      </section>

      <MainCta />
    </>
  )
}

function FeatureSection({ section, columns }) {
  const rows = Array.isArray(section?.rows) ? section.rows : []

  return (
    <>
      <tr>
        <th
          scope="colgroup"
          colSpan={columns.length + 1}
          className="bg-[#000F14] px-6 py-2.5 text-left"
        >
          <span className="text-[10px] font-black uppercase tracking-[2px] text-[#0FD452]">
            {section.section}
          </span>
        </th>
      </tr>
      {rows.map((row, rowIndex) => (
        <tr
          key={`${section.section}-${row.name ?? rowIndex}`}
          className={
            rowIndex % 2 === 0
              ? 'bg-white transition-colors hover:bg-gray-50/80'
              : 'bg-gray-50/60 transition-colors hover:bg-gray-100/70'
          }
        >
          <th
            scope="row"
            className="px-6 py-3 text-left text-sm font-medium text-gray-700"
          >
            {row.name}
          </th>
          {columns.map(({ plan, key }) => (
            <td
              key={`${plan.slug}-${key}`}
              className={
                plan.slug === 'professional'
                  ? 'bg-[#0FD452]/[0.04] px-3 py-3 text-center'
                  : 'px-3 py-3 text-center'
              }
            >
              <FeatureCell value={row[key]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
