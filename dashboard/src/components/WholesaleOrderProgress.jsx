import OrderFlowProgress, {
  WHOLESALE_FLOW,
  WHOLESALE_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  flowStatusIndex,
} from './OrderFlowProgress'

// Kept for existing imports; the shared component owns the implementation.
export const WHOLESALE_STEPS = WHOLESALE_FLOW
export { WHOLESALE_STATUS_LABELS, PAYMENT_STATUS_STYLES }
export const WHOLESALE_STATUS_STYLES = ORDER_STATUS_STYLES

export function statusIndex(status) {
  return flowStatusIndex('wholesale', status)
}

export default function WholesaleOrderProgress({ status, compact = false, timestamps, showTimestamps }) {
  return (
    <OrderFlowProgress
      type="wholesale"
      status={status}
      compact={compact}
      timestamps={timestamps}
      showTimestamps={showTimestamps}
    />
  )
}
