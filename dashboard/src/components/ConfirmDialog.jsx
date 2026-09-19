import { useEffect, useCallback } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'

const VARIANT_STYLES = {
  danger: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    Icon: AlertTriangle,
    confirmBg: 'bg-red-600 hover:bg-red-700',
    title: 'text-red-600',
  },
  warning: {
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
    Icon: AlertTriangle,
    confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
    title: 'text-yellow-600',
  },
  info: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    Icon: Info,
    confirmBg: 'bg-blue-600 hover:bg-blue-700',
    title: 'text-blue-600',
  },
}

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.danger
  const { Icon: VIcon, iconBg, iconColor, confirmBg, title: titleColor } = style

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onCancel()
    },
    [onCancel]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <VIcon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${titleColor}`}>{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${confirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
