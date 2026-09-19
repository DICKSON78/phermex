import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    setOffline(!navigator.onLine)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 shadow-sm">
      <WifiOff className="w-4 h-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-700">
        You are offline — showing the last saved data.
      </span>
    </div>
  )
}