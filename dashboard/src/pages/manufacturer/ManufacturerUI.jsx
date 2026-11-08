import { X, Loader2, Inbox, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-[#000F14] sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'text-[#0a8f3c]' }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1.5 text-2xl font-bold ${tone}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0a8f3c]">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'max-w-2xl' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-full ${size} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-[#000F14]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Field({ label, required, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#000F14] outline-none transition-colors placeholder:text-gray-400 focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20'

export function PrimaryButton({ children, loading, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#0FD452] px-4 py-2.5 text-sm font-semibold text-[#000F14] transition-all hover:bg-[#0cb843] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function DangerButton({ children, loading, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'gray' }) {
  const tones = {
    green: 'bg-[#0FD452]/10 text-[#0a8f3c]',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-14 text-center shadow-sm">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-gray-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0FD452] border-t-transparent" />
    </div>
  )
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatMoney(amount) {
  const value = Number(amount || 0)
  return `TZS ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export function formatPercent(value) {
  const number = Number(value || 0)
  const sign = number > 0 ? '+' : ''
  return `${sign}${number.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
}

export function GrowthBadge({ value }) {
  const number = Number(value || 0)
  const Icon = number > 0 ? TrendingUp : number < 0 ? TrendingDown : Minus
  const tone = number > 0
    ? 'bg-[#0FD452]/10 text-[#0a8f3c]'
    : number < 0
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-500'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {formatPercent(number)}
    </span>
  )
}

export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-bold text-[#000F14]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function ProgressBar({ value, tone = 'bg-[#0FD452]' }) {
  const clamped = Math.max(0, Math.min(100, Number(value || 0)))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function TrendChart({ data, xKey = 'month', series, height = 260, type = 'area' }) {
  if (!data || data.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">No data for this period.</div>
  }

  const lines = series || [{ key: 'units', label: 'Units', color: '#0FD452' }]
  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#eef1f0" vertical={false} />
      <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#8a9491' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: '#8a9491' }} axisLine={false} tickLine={false} width={44} />
      <Tooltip
        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        labelStyle={{ fontWeight: 600 }}
      />
      {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
    </>
  )

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        {type === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            {common}
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2.5}
                dot={false}
                strokeDasharray={line.dashed ? '5 4' : undefined}
              />
            ))}
          </LineChart>
        ) : type === 'bar' ? (
          <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            {common}
            {lines.map((line) => (
              <Bar key={line.key} dataKey={line.key} name={line.label} fill={line.color} radius={[6, 6, 0, 0]} maxBarSize={42} />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {lines.map((line) => (
                <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={line.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={line.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {common}
            {lines.map((line) => (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2.5}
                fill={`url(#grad-${line.key})`}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export function DataBar({ label, value, max, hint, color = 'bg-[#0FD452]' }) {
  const width = max > 0 ? Math.max(2, (Number(value || 0) / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium text-[#000F14]">{label}</span>
        <span className="shrink-0 text-gray-500">{hint ?? formatNumber(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export function DateRangeFilter({ from, to, onChange, children }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-gray-500">From</span>
        <input
          type="date"
          value={from}
          onChange={(event) => onChange({ from: event.target.value, to })}
          className={`${inputClass} sm:w-40`}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-gray-500">To</span>
        <input
          type="date"
          value={to}
          onChange={(event) => onChange({ from, to: event.target.value })}
          className={`${inputClass} sm:w-40`}
        />
      </label>
      {children}
    </div>
  )
}
