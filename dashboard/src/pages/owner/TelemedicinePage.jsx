import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Phone, Video, Bell, CheckCircle2, Timer } from 'lucide-react'
import { toArray } from '../../utils/safeData'
import { telemedicine } from '../../services/api'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function StatusBadge({ status }) {
  const map = {
    requested: 'bg-amber-100 text-amber-700',
    scheduled: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
    ended: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function empty(state, onRetry) {
  return (
    <div className="text-center py-14 text-gray-400">
      {state}
      <div className="mt-4">
        <button onClick={onRetry} className="btn-secondary">Refresh</button>
      </div>
    </div>
  )
}

function SessionCard({ item, onAction, actionLabel, actionIcon: ActionIcon, onClick }) {
  const roomUrl = item.room_url
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
            {item.scheduled_at && (
              <span className="text-xs text-gray-400">at {formatDate(item.scheduled_at)}</span>
            )}
          </div>
          <p className="mt-2 font-semibold text-sm text-[#000F14] truncate">
            {(item.patient && (item.patient.name || item.patient.phone)) || 'Patient'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {item.topic || item.patient_notes || 'Pharmaceutical consultation'}
          </p>
          <p className="text-xs text-gray-400">Room: {item.room_code}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {roomUrl && (
          <a
            href={roomUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0FD452] text-white text-xs font-semibold hover:opacity-90"
          >
            <Video className="w-3.5 h-3.5" /> Join Room
          </a>
        )}
        {onAction && (
          <button onClick={onAction} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-50">
            {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />} {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default function TelemedicinePage() {
  const [pending, setPending] = useState([])
  const [live, setLive] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, l, s] = await Promise.all([
        telemedicine.pending(),
        telemedicine.live(),
        telemedicine.scheduled(),
      ])
      setPending(toArray(p.data))
      setLive(toArray(l.data))
      setScheduled(toArray(s.data))
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not load consultations', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAccept = async (id) => {
    try {
      await telemedicine.accept(id)
      showToast('Consultation is now LIVE')
      load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not start consult', 'error')
    }
  }

  const handleNotify = async (id) => {
    try {
      await telemedicine.notify(id)
      showToast('Patient notified — join when ready')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not notify', 'error')
    }
  }

  const handleEnd = async (id) => {
    try {
      await telemedicine.end(id)
      showToast('Consultation ended')
      load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not end consult', 'error')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#000F14]">Telemedicine</h1>
          <p className="text-sm text-gray-500 mt-1">Video consultations with patients</p>
        </div>
        <button onClick={load} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#0FD452]" />
        </div>
      ) : (
        <>
          {/* Live now */}
          <Section title="Live Now" icon={<Phone className="w-4 h-4 text-green-600" />} tint="bg-green-50">
            {live.length === 0 ? empty('No live consultations', load) : (
              <div className="grid gap-3 md:grid-cols-2">
                {live.map((item) => (
                  <SessionCard
                    key={item.id}
                    item={item}
                    onAction={() => handleEnd(item.id)}
                    actionLabel="End Consult"
                    actionIcon={Phone}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Pending requests */}
          <Section title="Pending Requests" icon={<Timer className="w-4 h-4 text-amber-600" />} tint="bg-amber-50">
            {pending.length === 0 ? empty('No pending requests', load) : (
              <div className="grid gap-3 md:grid-cols-2">
                {pending.map((item) => (
                  <SessionCard
                    key={item.id}
                    item={item}
                    onAction={() => handleAccept(item.id)}
                    actionLabel="Accept & Go Live"
                    actionIcon={CheckCircle2}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Scheduled appointments */}
          <Section title="Scheduled Appointments" icon={<Timer className="w-4 h-4 text-blue-600" />} tint="bg-blue-50">
            {scheduled.length === 0 ? empty('No scheduled appointments', load) : (
              <div className="grid gap-3 md:grid-cols-2">
                {scheduled.map((item) => (
                  <SessionCard
                    key={item.id}
                    item={item}
                    onAction={async () => {
                      if (window.confirm('Notify the patient that you are ready now?')) {
                        await handleNotify(item.id)
                      }
                    }}
                    actionLabel="Notify / Join"
                    actionIcon={Bell}
                  />
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#000F14] text-white'}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}

// Section wrapper
function Section({ title, icon, tint, children }) {
  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${tint}`}>
        {icon}
        <span className="text-sm font-semibold text-[#000F14]">{title}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}
