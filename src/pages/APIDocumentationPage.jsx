import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  Check,
  Clock,
  Code2,
  Copy,
  CreditCard,
  ExternalLink,
  FileJson,
  Gauge,
  Globe2,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Mail,
  Package,
  Pill,
  QrCode,
  Rocket,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Truck,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'quickstart', label: 'Quick start', icon: Rocket },
  { id: 'authentication', label: 'Authentication', icon: KeyRound },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'eprescriptions', label: 'e-Prescriptions', icon: Pill },
  { id: 'wholesale', label: 'Wholesale', icon: Building2 },
  { id: 'errors', label: 'Errors & limits', icon: ShieldCheck },
  { id: 'support', label: 'Support', icon: LifeBuoy },
]

const EPRE_ENDPOINTS = [
  { method: 'POST', path: '/eprescriptions/validate-key', desc: 'Validate an API key and return integration details.' },
  { method: 'POST', path: '/eprescriptions/submit', desc: 'Submit a prescription from a MoH or facility system.' },
  { method: 'GET', path: '/eprescriptions/{prescriptionId}', desc: 'Retrieve a prescription and its line items.' },
  { method: 'POST', path: '/eprescriptions/{prescriptionId}/fulfill', desc: 'Mark a prescription as dispensed by a pharmacy.' },
  { method: 'POST', path: '/eprescriptions/{prescriptionId}/wholesale-order', desc: 'Create a wholesale order from a prescription.' },
  { method: 'GET', path: '/eprescriptions/{prescriptionId}/delivery-status', desc: 'Track fulfillment and delivery in real time.' },
]

const WHOLESALE_ORDER_ENDPOINTS = [
  { method: 'POST', path: '/wholesale-orders/create', desc: 'Create a direct or prescription-backed order.' },
  { method: 'GET', path: '/wholesale-orders', desc: 'List orders for a pharmacy or wholesaler.' },
  { method: 'GET', path: '/wholesale-orders/{orderId}', desc: 'Retrieve an order with items and totals.' },
  { method: 'POST', path: '/wholesale-orders/{orderId}/status', desc: 'Update status: confirmed, packed, dispatched, delivered.' },
  { method: 'GET', path: '/wholesale-orders/pricing/list', desc: 'Get wholesale pricing for a list of drugs.' },
  { method: 'POST', path: '/wholesale-orders/{orderId}/payment', desc: 'Record a payment against an order.' },
]

const WHOLESALE_MGMT_ENDPOINTS = [
  { method: 'POST', path: '/wholesale/register', desc: 'Register a wholesaler and its operating details.' },
  { method: 'GET', path: '/wholesale/list', desc: 'List wholesalers, filterable by status and city.' },
  { method: 'POST', path: '/wholesale/{wholesalerId}/inventory/update', desc: 'Update stock levels and batch information.' },
  { method: 'GET', path: '/wholesale/{wholesalerId}/inventory', desc: 'Read inventory, including low-stock filters.' },
  { method: 'POST', path: '/wholesale/{wholesalerId}/pricing', desc: 'Set per-drug wholesale pricing.' },
  { method: 'POST', path: '/wholesale/{wholesalerId}/orders/{orderId}/fulfill', desc: 'Confirm and fulfill an incoming order.' },
  { method: 'POST', path: '/wholesale/{wholesalerId}/returns/create', desc: 'Request a return or refund for an order.' },
  { method: 'POST', path: '/wholesale/{wholesalerId}/returns/{returnId}/approve', desc: 'Approve or reject a return request.' },
  { method: 'POST', path: '/wholesale/{wholesalerId}/credit-terms', desc: 'Configure credit limits and payment terms.' },
  { method: 'GET', path: '/wholesale/{wholesalerId}/analytics', desc: 'Revenue, order volume, and fulfilment metrics.' },
]

const PLANS_RESPONSE = `{
  "data": [
    {
      "id": 1,
      "name": "STARTER",
      "price": 14.99,
      "price_monthly": 14.99
    },
    {
      "id": 2,
      "name": "PROFESSIONAL",
      "price": 19.99,
      "price_monthly": 19.99
    },
    {
      "id": 3,
      "name": "ENTERPRISE",
      "price": 29.99,
      "price_monthly": 29.99
    }
  ]
}`

const CURL_PLANS = `curl https://helix.co.tz/api/subscriptions/plans \\
  -H "Accept: application/json"`

const AUTH_HEADER = `Authorization: Bearer $HELIX_API_KEY
Content-Type: application/json`

const CURL_AUTH = `curl -X POST https://helix.co.tz/api/eprescriptions/validate-key \\
  -H "Authorization: Bearer $HELIX_API_KEY" \\
  -H "Content-Type: application/json"`

const CURL_SUBMIT = `curl -X POST https://helix.co.tz/api/eprescriptions/submit \\
  -H "Authorization: Bearer $HELIX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prescription_id": "MOH-2026-000123",
    "patient": {
      "name": "Amina Juma",
      "phone": "+255700000000"
    },
    "facility": {
      "name": "Muhimbili National Hospital",
      "code": "MNH-001"
    },
    "items": [
      {
        "drug_code": "AMOX500",
        "name": "Amoxicillin 500mg",
        "quantity": 21
      }
    ]
  }'`

const SUBMIT_RESPONSE = `{
  "success": true,
  "data": {
    "prescription_id": "MOH-2026-000123",
    "status": "pending",
    "qr_url": "https://helix.co.tz/api/prescription/MOH-2026-000123",
    "valid_until": "2026-12-05T23:59:59Z"
  }
}`

const CURL_ORDER = `curl -X POST https://helix.co.tz/api/wholesale-orders/create \\
  -H "Authorization: Bearer $HELIX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pharmacy_id": "PHARM001",
    "wholesaler_id": "WHOLE-ABC123",
    "items": [
      { "drug_id": "drug_12345", "quantity": 50 }
    ]
  }'`

const ERROR_RESPONSE = `{
  "message": "The given data was invalid.",
  "errors": {
    "patient.phone": [
      "The patient phone field is required."
    ]
  }
}`

const STATUS_CODES = [
  { code: '200', label: 'OK', desc: 'Request succeeded.' },
  { code: '201', label: 'Created', desc: 'Resource created successfully.' },
  { code: '400', label: 'Bad request', desc: 'Malformed request body.' },
  { code: '401', label: 'Unauthorized', desc: 'Missing or invalid API key.' },
  { code: '403', label: 'Forbidden', desc: 'Key lacks the required scope.' },
  { code: '404', label: 'Not found', desc: 'The resource does not exist.' },
  { code: '422', label: 'Validation', desc: 'Payload failed validation.' },
  { code: '429', label: 'Rate limited', desc: 'Too many requests in the window.' },
  { code: '500', label: 'Server error', desc: 'Unexpected server failure.' },
]

const PLANS = [
  { name: 'Starter', price: '14.99', note: 'Growing pharmacies' },
  { name: 'Professional', price: '19.99', note: 'Multi-branch operations' },
  { name: 'Enterprise', price: '29.99', note: 'Chains and networks' },
]

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

const METHOD_STYLES = {
  GET: 'bg-sky-50 text-sky-700 ring-sky-200',
  POST: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PUT: 'bg-amber-50 text-amber-700 ring-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 ring-rose-200',
}

function MethodBadge({ method }) {
  return (
    <span
      className={`inline-flex w-[52px] shrink-0 items-center justify-center rounded-md px-2 py-1 font-mono text-[10px] font-bold tracking-wider ring-1 ring-inset ${
        METHOD_STYLES[method] || 'bg-gray-50 text-gray-600 ring-gray-200'
      }`}
    >
      {method}
    </span>
  )
}

function CopyButton({ value, label = 'Copy', tone = 'dark' }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  const styles =
    tone === 'dark'
      ? 'text-white/50 hover:text-white hover:bg-white/10'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${styles}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  )
}

function CodeBlock({ title, code, language = 'bash' }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#000F14]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 truncate font-mono text-[10px] uppercase tracking-[1.5px] text-white/35">
            {title || language}
          </span>
        </div>
        <CopyButton value={code} label="Copy" />
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-6 text-slate-200">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#0a8f3c]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">{description}</p>}
      <div className="mt-6 h-px w-full bg-gradient-to-r from-[#0FD452]/60 via-gray-200 to-transparent" />
    </div>
  )
}

function EndpointTable({ items }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li
            key={`${item.method}-${item.path}`}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-gray-50/80 sm:flex-row sm:items-center sm:gap-4"
          >
            <MethodBadge method={item.method} />
            <code className="break-all font-mono text-[12.5px] font-semibold text-gray-900 sm:w-[340px] sm:shrink-0">
              {item.path}
            </code>
            <p className="text-sm leading-6 text-gray-500">{item.desc}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#0a8f3c]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-500">{children}</p>
    </div>
  )
}

function Callout({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#0a8f3c]" />
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <div className="mt-1 text-sm leading-6 text-gray-600">{children}</div>
      </div>
    </div>
  )
}

function GroupLabel({ icon: Icon, children }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
      <Icon className="h-4 w-4 text-[#0a8f3c]" />
      {children}
    </h3>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function APIDocumentationPage() {
  const [active, setActive] = useState('overview')

  useEffect(() => {
    const sections = SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean)
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-140px 0px -55% 0px', threshold: [0, 1] }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#000F14]">
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#000F14]/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000F14] via-[#000F14]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000F14] via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0FD452]/30 bg-[#0FD452]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[2px] text-[#0FD452]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0FD452] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0FD452]" />
              </span>
              API v1 · Operational
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Build on the <span className="text-[#0FD452]">Helix</span> platform
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
              REST APIs for subscription billing, MoH e-prescription integration and wholesale
              operations. JSON in, JSON out — designed to plug into the systems you already run.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#quickstart"
                className="inline-flex items-center gap-2 bg-[#0FD452] px-6 py-3 text-xs font-bold tracking-wider text-[#000F14] transition-colors hover:bg-emerald-500"
              >
                Quick start
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="mailto:api@helix.co.tz?subject=Helix%20API%20key%20request"
                className="inline-flex items-center gap-2 border border-white/15 px-6 py-3 text-xs font-bold tracking-wider text-white/80 transition-colors hover:border-white/40 hover:text-white"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Request an API key
              </a>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                ['3', 'Product APIs'],
                ['24', 'Endpoints'],
                ['1,000', 'Requests / hour'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-[1.5px] text-white/40">{label}</dt>
                  <dd className="mt-1 text-2xl font-extrabold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Mobile section nav */}
      <div className="sticky top-[73px] z-30 border-b border-gray-200 bg-white/95 backdrop-blur md:top-[118px] lg:hidden">
        <nav aria-label="API documentation sections" className="hide-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={() => setActive(section.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active === section.id ? 'bg-[#000F14] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Docs shell */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:grid lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-12 lg:py-16">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-36">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-gray-400">
              Documentation
            </p>
            <nav aria-label="API documentation" className="space-y-1">
              {SECTIONS.map((section) => {
                const Icon = section.icon
                const isActive = active === section.id
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => setActive(section.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-[#0a8f3c]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#0FD452]' : 'text-gray-400'}`} />
                    {section.label}
                  </a>
                )
              })}
            </nav>

            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[2px] text-gray-400">
                <Globe2 className="h-3 w-3" />
                Base URL
              </p>
              <code className="mt-2 block break-all font-mono text-[11px] leading-5 text-gray-700">
                https://helix.co.tz/api
              </code>
              <div className="mt-2">
                <CopyButton value="https://helix.co.tz/api" label="Copy URL" tone="light" />
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {/* Overview */}
          <section id="overview" className="scroll-mt-32 pb-16">
            <SectionHeading
              eyebrow="Getting started"
              title="Overview"
              description="The Helix API exposes the same platform powering the Helix dashboard. Use it to sync prescriptions from ministry systems, automate wholesale ordering, or read your subscription plan programmatically."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: CreditCard,
                  title: 'Subscriptions',
                  desc: 'Plan catalogue, monthly pricing and trial metadata for every Helix plan.',
                  href: '#subscriptions',
                },
                {
                  icon: Pill,
                  title: 'e-Prescriptions',
                  desc: 'Submit, fulfil, track and dispense prescriptions across the pharmacy network.',
                  href: '#eprescriptions',
                },
                {
                  icon: Building2,
                  title: 'Wholesale',
                  desc: 'Register wholesalers, manage inventory, pricing, orders, returns and credit.',
                  href: '#wholesale',
                },
              ].map((card) => {
                const Icon = card.icon
                return (
                  <a
                    key={card.title}
                    href={card.href}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#0FD452]/60 hover:shadow-[0_10px_35px_rgba(15,212,82,0.08)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#0a8f3c]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 flex items-center gap-1.5 text-sm font-bold text-gray-900">
                      {card.title}
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0FD452]" />
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{card.desc}</p>
                  </a>
                )
              })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <InfoCard icon={Globe2} title="Base URL">
                All endpoints live under <code className="font-mono text-[12px] text-gray-700">https://helix.co.tz/api</code>.
              </InfoCard>
              <InfoCard icon={FileJson} title="Content type">
                Send and receive <code className="font-mono text-[12px] text-gray-700">application/json</code>. UTF-8 encoded.
              </InfoCard>
              <InfoCard icon={LockKeyhole} title="Authentication">
                Bearer API keys for e-prescription and wholesale routes. Subscription plans are public.
              </InfoCard>
            </div>
          </section>

          {/* Quick start */}
          <section id="quickstart" className="scroll-mt-32 pb-16">
            <SectionHeading
              eyebrow="Five minutes"
              title="Quick start"
              description="Make a public request, then authenticate to reach the prescription and wholesale APIs."
            />

            <ol className="mt-8 space-y-6">
              <li className="grid gap-4 sm:grid-cols-[40px_minmax(0,1fr)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#000F14] font-mono text-xs font-bold text-[#0FD452]">
                  01
                </span>
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <KeyRound className="h-4 w-4 text-[#0a8f3c]" />
                    Get an API key
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Email{' '}
                    <a href="mailto:api@helix.co.tz" className="font-semibold text-[#0a8f3c] hover:underline">
                      api@helix.co.tz
                    </a>{' '}
                    with your system type and integration scope. Keys are sent through a secure channel.
                  </p>
                </div>
              </li>

              <li className="grid gap-4 sm:grid-cols-[40px_minmax(0,1fr)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#000F14] font-mono text-xs font-bold text-[#0FD452]">
                  02
                </span>
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Terminal className="h-4 w-4 text-[#0a8f3c]" />
                    Call a public endpoint
                  </h3>
                  <p className="mt-1 mb-3 text-sm leading-6 text-gray-500">
                    The plan catalogue is open — no key required.
                  </p>
                  <CodeBlock title="list-plans.sh" code={CURL_PLANS} />
                </div>
              </li>

              <li className="grid gap-4 sm:grid-cols-[40px_minmax(0,1fr)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#000F14] font-mono text-xs font-bold text-[#0FD452]">
                  03
                </span>
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Code2 className="h-4 w-4 text-[#0a8f3c]" />
                    Authenticate your requests
                  </h3>
                  <p className="mt-1 mb-3 text-sm leading-6 text-gray-500">
                    Add your key as a Bearer token on every protected request.
                  </p>
                  <CodeBlock title="request-headers.http" code={AUTH_HEADER} language="http" />
                </div>
              </li>
            </ol>
          </section>

          {/* Authentication */}
          <section id="authentication" className="scroll-mt-32 pb-16">
            <SectionHeading
              eyebrow="Security"
              title="Authentication"
              description="Helix uses hashed API keys with per-integration scopes. Treat keys as secrets — never expose them in client-side code or public repositories."
            />

            <div className="mt-8 space-y-6">
              <CodeBlock title="validate-key.sh" code={CURL_AUTH} />

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={KeyRound} title="Key format">
                  Keys are long-lived Bearer tokens. Rotate them from the dashboard or by contacting
                  the API team if a key is compromised.
                </InfoCard>
                <InfoCard icon={ShieldCheck} title="Scopes">
                  Each key is scoped to <code className="font-mono text-[12px] text-gray-700">eprescription</code>,{' '}
                  <code className="font-mono text-[12px] text-gray-700">wholesale</code>, or both. Requests
                  outside a scope return <code className="font-mono text-[12px] text-gray-700">403</code>.
                </InfoCard>
              </div>

              <Callout icon={AlertTriangle} title="Keep keys server-side">
                Never embed an API key in a browser bundle, mobile app, or public repository. Proxy
                requests through your backend and rotate keys regularly.
              </Callout>
            </div>
          </section>

          {/* Subscriptions */}
          <section id="subscriptions" className="scroll-mt-32 pb-16">
            <SectionHeading
              eyebrow="Billing"
              title="Subscriptions"
              description="Read the plan catalogue and monthly pricing. Plans are billed annually, include a 30-day free trial, and keep a 3-day grace period before suspension."
            />

            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <MethodBadge method="GET" />
                  <code className="font-mono text-[13px] font-semibold text-gray-900">/subscriptions/plans</code>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Public
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Returns every active plan with its annual price and the derived monthly price.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {PLANS.map((plan) => (
                  <div key={plan.name} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">{plan.name}</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-900">
                      ${plan.price}
                      <span className="ml-1 text-xs font-medium text-gray-400">/mo</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{plan.note}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-2.5 rounded-lg border border-gray-200 p-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#0a8f3c]" />
                  <p className="text-xs leading-5 text-gray-600">30-day free trial on new pharmacies.</p>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-gray-200 p-3">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-[#0a8f3c]" />
                  <p className="text-xs leading-5 text-gray-600">3-day grace period after plan end date.</p>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-gray-200 p-3">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#0a8f3c]" />
                  <p className="text-xs leading-5 text-gray-600">Annual billing via card or mobile money.</p>
                </div>
              </div>

              <CodeBlock title="GET /subscriptions/plans" code={CURL_PLANS} />
              <CodeBlock title="200 OK · application/json" code={PLANS_RESPONSE} language="json" />
            </div>
          </section>

          {/* e-Prescriptions */}
          <section id="eprescriptions" className="scroll-mt-32 pb-16">
            <SectionHeading
              eyebrow="Ministry of Health integration"
              title="e-Prescriptions"
              description="Digitise the prescription journey from facility to patient. Submit from any MoH system, let a pharmacy dispense, and track delivery with a public QR lookup."
            />

            <div className="mt-8 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[#0a8f3c]" />
                <p className="text-xs font-semibold text-gray-600">
                  Bearer token required · scope <code className="font-mono text-[11px] text-gray-900">eprescription</code>
                </p>
              </div>

              <EndpointTable items={EPRE_ENDPOINTS} />

              <Callout icon={QrCode} title="Public QR lookup">
                <code className="font-mono text-[12px] text-gray-800">GET /api/prescription/{'{prescriptionId}'}</code>{' '}
                is intentionally unauthenticated so a QR code can resolve to the prescription status
                for the patient. It returns no clinical history.
              </Callout>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Terminal className="h-4 w-4 text-[#0a8f3c]" />
                  Submit a prescription
                </h3>
                <CodeBlock title="submit-prescription.sh" code={CURL_SUBMIT} />
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <FileJson className="h-4 w-4 text-[#0a8f3c]" />
                  Example response
                </h3>
                <CodeBlock title="200 OK · application/json" code={SUBMIT_RESPONSE} language="json" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={Truck} title="Delivery tracking">
                  The delivery-status endpoint returns the current stage, estimated window, and
                  location history for the fulfilling pharmacy.
                </InfoCard>
                <InfoCard icon={Pill} title="Dispensing">
                  Pharmacies call the fulfill endpoint once drugs are handed over. Status then moves
                  from pending to dispensed.
                </InfoCard>
              </div>

              <a
                href="/docs/eprescription-api.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-gray-300 px-5 py-2.5 text-xs font-bold tracking-wider text-gray-800 transition-colors hover:border-[#0FD452] hover:text-[#0a8f3c]"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Full e-Prescription guide
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>

          {/* Wholesale */}
          <section id="wholesale" className="scroll-mt-32 pb-16">
            <SectionHeading
              eyebrow="Supply chain"
              title="Wholesale"
              description="Connect retail pharmacies and wholesalers end to end: inventory, pricing, ordering, fulfilment, returns, credit terms and analytics."
            />

            <div className="mt-8 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[#0a8f3c]" />
                <p className="text-xs font-semibold text-gray-600">
                  Bearer token required · scope <code className="font-mono text-[11px] text-gray-900">wholesale</code>
                </p>
              </div>

              <div>
                <GroupLabel icon={Package}>Ordering</GroupLabel>
                <EndpointTable items={WHOLESALE_ORDER_ENDPOINTS} />
              </div>

              <div>
                <GroupLabel icon={Boxes}>Wholesaler management</GroupLabel>
                <EndpointTable items={WHOLESALE_MGMT_ENDPOINTS} />
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Terminal className="h-4 w-4 text-[#0a8f3c]" />
                  Create an order
                </h3>
                <CodeBlock title="create-wholesale-order.sh" code={CURL_ORDER} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard icon={Boxes} title="Inventory">
                  Batch-level stock, low-stock alerts and expiry windows per wholesaler.
                </InfoCard>
                <InfoCard icon={RotateCcw} title="Returns">
                  Request, approve or reject returns with full order traceability.
                </InfoCard>
                <InfoCard icon={BarChart3} title="Analytics">
                  Revenue, order volume and fulfilment performance per wholesaler.
                </InfoCard>
              </div>

              <a
                href="/docs/wholesale-system.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-gray-300 px-5 py-2.5 text-xs font-bold tracking-wider text-gray-800 transition-colors hover:border-[#0FD452] hover:text-[#0a8f3c]"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Full wholesale guide
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>

          {/* Errors & limits */}
          <section id="errors" className="scroll-mt-32 pb-16">
            <SectionHeading
              eyebrow="Reliability"
              title="Errors & limits"
              description="Every response includes a JSON body and a conventional HTTP status code. Handle 429 with backoff and validate payloads before sending."
            />

            <div className="mt-8 space-y-6">
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <ul className="divide-y divide-gray-100">
                  {STATUS_CODES.map((status) => (
                    <li key={status.code} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/80">
                      <code className="w-10 shrink-0 font-mono text-[12px] font-bold text-gray-900">{status.code}</code>
                      <span className="w-28 shrink-0 text-xs font-semibold text-gray-700">{status.label}</span>
                      <span className="text-sm text-gray-500">{status.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#0a8f3c]">
                    <Gauge className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-gray-900">Rate limits</h3>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-lg font-extrabold text-gray-900">1,000</p>
                    <p className="text-xs text-gray-500">requests per hour</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-lg font-extrabold text-gray-900">429</p>
                    <p className="text-xs text-gray-500">when the limit is exceeded</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-lg font-extrabold text-gray-900">60s</p>
                    <p className="text-xs text-gray-500">recommended backoff</p>
                  </div>
                </div>
              </div>

              <CodeBlock title="422 Unprocessable Entity · application/json" code={ERROR_RESPONSE} language="json" />
            </div>
          </section>

          {/* Support */}
          <section id="support" className="scroll-mt-32 pb-4">
            <SectionHeading
              eyebrow="Help"
              title="Support"
              description="Need an API key, a sandbox environment, or help mapping a MoH payload? The platform team is here."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <a
                href="mailto:api@helix.co.tz"
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-[#0FD452]/60"
              >
                <Mail className="h-5 w-5 text-[#0a8f3c]" />
                <p className="mt-3 text-sm font-bold text-gray-900">Email the team</p>
                <p className="mt-1 text-sm text-gray-500">api@helix.co.tz</p>
              </a>
              <a
                href="/docs/eprescription-api.md"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-[#0FD452]/60"
              >
                <BookOpen className="h-5 w-5 text-[#0a8f3c]" />
                <p className="mt-3 text-sm font-bold text-gray-900">Integration guides</p>
                <p className="mt-1 text-sm text-gray-500">e-Prescription and wholesale</p>
              </a>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <Activity className="h-5 w-5 text-[#0a8f3c]" />
                <p className="mt-3 text-sm font-bold text-gray-900">Platform status</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#0FD452]" />
                  All systems operational
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl bg-[#000F14] p-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-white">Ready to integrate?</p>
                <p className="mt-1 text-sm text-white/50">
                  Request a key and we will help you ship your first request.
                </p>
              </div>
              <a
                href="mailto:api@helix.co.tz?subject=Helix%20API%20key%20request"
                className="inline-flex shrink-0 items-center gap-2 bg-[#0FD452] px-6 py-3 text-xs font-bold tracking-wider text-[#000F14] transition-colors hover:bg-emerald-500"
              >
                Request an API key
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
