import { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Check,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  Loader2,
  Filter,
} from 'lucide-react'
import api from '../../services/api'

const TABS = ['All', 'Unread', 'Alerts', 'Info']

const TYPE_CONFIG = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  danger: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true)
      const response = await api.get(`/notifications?page=${pageNum}&limit=20`)
      const data = response.data
      if (pageNum === 1) {
        setNotifications(data.notifications || data)
      } else {
        setNotifications((prev) => [...prev, ...(data.notifications || data)])
      }
      setHasMore(data.has_more ?? (data.notifications?.length >= 20))
    } catch {
      if (pageNum === 1) setNotifications([])
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(1)
  }, [fetchNotifications])

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'Unread') return !n.is_read
    if (activeTab === 'Alerts') return n.type === 'warning' || n.type === 'danger'
    if (activeTab === 'Info') return n.type === 'info' || n.type === 'success'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    try {
      await api.put(`/notifications/${id}/read`)
    } catch {}
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await api.put('/notifications/read-all')
    } catch {}
  }

  const deleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      await api.delete(`/notifications/${id}`)
    } catch {}
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    setLoadingMore(true)
    fetchNotifications(nextPage)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">View and manage your notifications.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0FD452]/10 text-[#0FD452] text-sm font-medium hover:bg-[#0FD452]/20 transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-[#000F14] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-[#0FD452] text-white rounded-full">
                {unreadCount}
              </span>
              
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#0FD452]" />
          </div>
          <h3 className="text-lg font-semibold text-[#000F14] mb-1">You're all caught up!</h3>
          <p className="text-sm text-gray-500">No notifications to show right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
            const NIcon = config.icon

            return (
              <div
                key={notification.id}
                onClick={() => {
                  markAsRead(notification.id)
                  if (notification.link) window.location.href = notification.link
                }}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                  notification.is_read
                    ? 'bg-white border-gray-200 hover:border-gray-300'
                    : 'bg-[#0FD452]/[0.03] border-[#0FD452]/20 hover:border-[#0FD452]/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                  <NIcon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm ${notification.is_read ? 'font-medium text-gray-700' : 'font-bold text-[#000F14]'}`}>
                      {notification.title}
                    </h4>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#0FD452] shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{timeAgo(notification.created_at)}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotification(notification.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && filteredNotifications.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
