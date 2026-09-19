import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    textColor: 'text-green-800',
    progressColor: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-500',
    textColor: 'text-red-800',
    progressColor: 'bg-red-500',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    textColor: 'text-yellow-800',
    progressColor: 'bg-yellow-500',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800',
    progressColor: 'bg-blue-500',
  },
}

function Toast({ id, message, type = 'info', onClose, duration = 5000 }) {
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)
  const style = TOAST_STYLES[type] || TOAST_STYLES.info
  const Icon = style.icon

  useEffect(() => {
    if (duration <= 0) return
    const interval = 50
    const decrement = (interval / duration) * 100
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - decrement
      })
    }, interval)
    return () => clearInterval(timer)
  }, [duration])

  useEffect(() => {
    if (progress <= 0) {
      handleClose()
    }
  }, [progress])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 300)
  }

  return (
    <div
      className={`flex items-start gap-3 w-80 border rounded-xl p-4 shadow-lg transition-all duration-300 relative overflow-hidden ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0 animate-slideIn'
      } ${style.bg}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
      <p className={`text-sm font-medium flex-1 ${style.textColor}`}>{message}</p>
      <button onClick={handleClose} className={`shrink-0 ${style.textColor} hover:opacity-70`}>
        <X className="w-4 h-4" />
      </button>
      <div className="absolute bottom-0 left-0 h-1 transition-all duration-100" style={{ width: `${progress}%` }}>
        <div className={`h-full ${style.progressColor} opacity-40`} />
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      success: (msg) => console.log('Toast:', msg),
      error: (msg) => console.error('Toast:', msg),
      warning: (msg) => console.warn('Toast:', msg),
      info: (msg) => console.info('Toast:', msg),
    }
  }
  return ctx
}
