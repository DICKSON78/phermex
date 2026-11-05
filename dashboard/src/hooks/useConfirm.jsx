import { useCallback, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

export default function useConfirm() {
  const [options, setOptions] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        resolverRef.current = resolve
        setOptions(opts)
      }),
    []
  )

  const close = (result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }

  const dialog = options ? (
    <ConfirmDialog
      isOpen
      title={options.title}
      message={options.message}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null

  return [confirm, dialog]
}
