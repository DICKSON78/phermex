import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const TIMEOUT_MINUTES = 5
const WARNING_SECONDS = 30

export default function SessionTimeout() {
  const { user, logout } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [countdown, setCountdown] = useState(WARNING_SECONDS)
  const lastActivity = useRef(Date.now())
  const warningTimer = useRef(null)
  const logoutTimer = useRef(null)
  const countdownTimer = useRef(null)

  const clearAllTimers = useCallback(() => {
    clearTimeout(warningTimer.current)
    clearTimeout(logoutTimer.current)
    clearInterval(countdownTimer.current)
  }, [])

  const handleLogout = useCallback(() => {
    clearAllTimers()
    logout()
  }, [clearAllTimers, logout])

  const handleStay = useCallback(() => {
    clearAllTimers()
    setShowModal(false)
    lastActivity.current = Date.now()
    startTimers()
  }, [clearAllTimers])

  const startTimers = useCallback(() => {
    const msUntilWarning = TIMEOUT_MINUTES * 60 * 1000
    warningTimer.current = setTimeout(() => {
      setShowModal(true)
      setCountdown(WARNING_SECONDS)

      countdownTimer.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer.current)
            handleLogout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, msUntilWarning)
  }, [handleLogout])

  useEffect(() => {
    if (!user) return

    const resetTimer = () => {
      if (showModal) return
      lastActivity.current = Date.now()
      clearAllTimers()
      startTimers()
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }))
    startTimers()

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetTimer))
      clearAllTimers()
    }
  }, [user, showModal, clearAllTimers, startTimers])

  if (!user || !showModal) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      <div className="absolute inset-0 bg-black/50" onClick={handleStay} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#000F14] to-[#0a1f28] px-6 py-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Session Timeout</h3>
            <p className="text-sm text-gray-300">You've been inactive</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Auto-logout in {countdown}s</p>
              <p className="text-xs text-amber-600 mt-1">Your session will expire automatically if no action is taken.</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            You've been inactive for {TIMEOUT_MINUTES} minutes. Would you like to stay signed in?
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <button
              onClick={handleStay}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0FD452] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0cb843]"
            >
              <RefreshCw className="h-4 w-4" />
              Stay Signed In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
