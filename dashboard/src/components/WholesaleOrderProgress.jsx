import { Check, Clock, PackageCheck, Truck, Home, XCircle } from 'lucide-react'

export const WHOLESALE_STEPS = [
  { key: 'pending', label: 'Order placed', short: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', short: 'Confirmed', icon: Check },
  { key: 'packed', label: 'Prepared & packed', short: 'Prepared', icon: PackageCheck },
  { key: 'dispatched', label: 'On the way', short: 'On the way', icon: Truck },
  { key: 'delivered', label: 'Delivered', short: 'Delivered', icon: Home },
]

const ORDER = WHOLESALE_STEPS.map((step) => step.key)

export function statusIndex(status) {
  if (status === 'cancelled') return -1
  const index = ORDER.indexOf(status)
  return index === -1 ? 0 : index
}

export const WHOLESALE_STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  dispatched: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export const WHOLESALE_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  dispatched: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const PAYMENT_STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  credit: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
}

export default function WholesaleOrderProgress({ status, compact = false }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
        <XCircle className="h-4 w-4" />
        Order cancelled
      </div>
    )
  }

  const current = statusIndex(status)

  return (
    <div className="flex w-full items-center">
      {WHOLESALE_STEPS.map((step, index) => {
        const done = index < current
        const active = index === current
        const Icon = step.icon

        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
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
                className={`whitespace-nowrap text-[10px] font-medium ${
                  active ? 'text-[#0a8f3c]' : done ? 'text-gray-600' : 'text-gray-400'
                } ${compact ? 'hidden sm:block' : ''}`}
              >
                {compact ? step.short : step.label}
              </span>
            </div>
            {index < WHOLESALE_STEPS.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 rounded-full sm:mx-2 ${index < current ? 'bg-[#0FD452]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
