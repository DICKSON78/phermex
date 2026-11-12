import { Check, CheckCircle2, Clock, Home, Package, PackageCheck, Truck, XCircle } from 'lucide-react'

/**
 * Shared order-progress definitions.
 *
 * Three order legs run through the platform and all of them need the same
 * stepwise presentation, even though their status vocabularies differ:
 *
 *  - customer  → pharmacy       pending → confirmed → preparing → ready → out_for_delivery → delivered
 *  - pharmacy  → wholesaler     pending → confirmed → packed → dispatched → delivered
 *  - wholesaler→ manufacturer   pending → confirmed → packed → dispatched → delivered
 *
 * Keeping the flows here means a status rename only has to happen once.
 */

export const CUSTOMER_FLOW = [
  { key: 'pending', label: 'Order placed', short: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', short: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', short: 'Preparing', icon: Package },
  { key: 'ready', label: 'Ready', short: 'Ready', icon: PackageCheck },
  { key: 'out_for_delivery', label: 'Out for delivery', short: 'On the way', icon: Truck },
  { key: 'delivered', label: 'Delivered', short: 'Delivered', icon: Home },
]

export const WHOLESALE_FLOW = [
  { key: 'pending', label: 'Order placed', short: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', short: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Prepared & packed', short: 'Packed', icon: PackageCheck },
  { key: 'dispatched', label: 'On the way', short: 'On the way', icon: Truck },
  { key: 'delivered', label: 'Delivered', short: 'Delivered', icon: Home },
]

export const ORDER_FLOWS = {
  customer: CUSTOMER_FLOW,
  wholesale: WHOLESALE_FLOW,
  manufacturer: WHOLESALE_FLOW,
}

// A dispensed pharmacy order is finished, exactly like a delivered one.
const STATUS_ALIASES = { dispensed: 'delivered' }

export const CUSTOMER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  dispensed: 'Dispensed',
  cancelled: 'Cancelled',
}

export const WHOLESALE_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  dispatched: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-sky-100 text-sky-700',
  ready: 'bg-teal-100 text-teal-700',
  packed: 'bg-indigo-100 text-indigo-700',
  dispatched: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  dispensed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export const PAYMENT_STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  credit: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  unpaid: 'bg-gray-100 text-gray-600',
}

export function flowFor(type) {
  return ORDER_FLOWS[type] || WHOLESALE_FLOW
}

export function normalizeFlowStatus(type, status) {
  if (!status) return 'pending'
  const mapped = STATUS_ALIASES[status] || status
  return flowFor(type).some((step) => step.key === mapped) ? mapped : 'pending'
}

export function flowStatusIndex(type, status) {
  if (status === 'cancelled') return -1
  return flowFor(type).findIndex((step) => step.key === normalizeFlowStatus(type, status))
}

export function orderStatusLabel(type, status) {
  if (type === 'customer') return CUSTOMER_STATUS_LABELS[status] || status || '—'
  return WHOLESALE_STATUS_LABELS[status] || status || '—'
}

export function orderStatusStyle(status) {
  return ORDER_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
}

function formatStamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderFlowProgress({
  type = 'wholesale',
  status,
  timestamps = {},
  compact = false,
  showTimestamps = false,
  className = '',
}) {
  const steps = flowFor(type)

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
        <XCircle className="h-4 w-4" />
        Order cancelled
      </div>
    )
  }

  const current = flowStatusIndex(type, status)

  return (
    <div className={`flex w-full items-start ${className}`}>
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        const Icon = step.icon
        const stamp = showTimestamps ? formatStamp(timestamps[step.key]) : ''

        return (
          <div key={step.key} className="flex flex-1 items-start last:flex-none">
            <div className="flex min-w-0 flex-col items-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? 'border-[#0FD452] bg-[#0FD452] text-[#000F14]'
                    : active
                      ? 'border-[#0FD452] bg-white text-[#0FD452] ring-4 ring-[#0FD452]/15'
                      : 'border-gray-200 bg-white text-gray-300'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`mt-1.5 text-center text-[11px] font-semibold leading-tight ${
                  active ? 'text-[#0a8f3c]' : done ? 'text-gray-600' : 'text-gray-400'
                } ${compact ? 'hidden sm:block' : ''}`}
              >
                {compact ? step.short : step.label}
              </span>
              {stamp && (
                <span className="mt-0.5 hidden text-center text-[10px] text-gray-400 sm:block">{stamp}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-1 mt-[18px] h-0.5 flex-1 rounded-full sm:mx-2 ${
                  index < current ? 'bg-[#0FD452]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
