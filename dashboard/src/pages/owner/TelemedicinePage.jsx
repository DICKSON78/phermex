import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, RefreshCw, Phone, Video, Bell, CheckCircle2, Timer, CalendarDays,
  Clock4, Stethoscope, FileText, PencilLine, User, PhoneCall,
  Play,
} from 'lucide-react'
import { toArray } from '../../utils/safeData'
import { telemedicine } from '../../services/api'
import Modal from '../../components/Modal'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return str }
}

function formatTime(str) {
  if (!str) return ''
  try {
    return new Date(str).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return str }
}

function StatusBadge({ status }) {
  const map = {
    requested: 'bg-amber-100 text-amber-700',
    scheduled: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
    ended: 'bg-gray-100 text-gray-600',
    missed: 'bg-orange-100 text-orange-600',
    cancelled: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function PatientInline({ item }) {
  const name = item.patient?.name || item.patient?.phone || 'Patient'
  const phone = item.patient?.phone
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-full bg-[#0FD452]/15 flex items-center justify-center shrink-0">
        <User className="w-4.5 h-4.5 text-[#0FD452]" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-[#000F14] truncate">{name}</p>
        {phone && <p className="text-xs text-gray-500">{phone}</p>}
      </div>
    </div>
  )
}

function SessionCard({ item, actions = [] }) {
  const roomUrl = item.room_url
  const notes = item.pharmacist_notes || item.patient_notes
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <PatientInline item={item} />
        <StatusBadge status={item.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        {item.scheduled_at && (
          <span className="inline-flex items-center gap-1.5">
            <Clock4 className="w-3.5 h-3.5" /> {formatDate(item.scheduled_at)}
          </span>
        )}
        {item.started_at && (
          <span className="inline-flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5" /> Started {formatTime(item.started_at)}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 font-mono text-gray-400">
          <Video className="w-3.5 h-3.5" /> {item.room_code}
        </span>
      </div>

      {(item.topic || item.patient_notes) && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          <span className="font-semibold">Patient note:</span> {item.patient_notes || item.topic}
        </p>
      )}

      {notes && (
        <p className="text-xs text-gray-600 bg-blue-50/60 rounded-lg px-3 py-2 line-clamp-2">
          <span className="font-semibold text-blue-700">Notes:</span> {notes}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap pt-1">
        {roomUrl && (item.status === 'live' || item.status === 'requested') && (
          <a
            href={roomUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0FD452] text-white text-xs font-semibold hover:opacity-90"
          >
            <Video className="w-3.5 h-3.5" /> Join Room
          </a>
        )}
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            disabled={a.disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 ${
              a.primary
                ? 'bg-[#0FD452] text-white border-transparent hover:opacity-90'
                : 'border-gray-200 text-[#000F14] hover:bg-gray-50'
            }`}
          >
            {a.icon && <a.icon className="w-3.5 h-3.5" />} {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Empty({ label, onRetry }) {
  return (
    <div className="text-center py-12 text-gray-400">
      {label}
      {onRetry && (
        <div className="mt-3">
          <button onClick={onRetry} className="btn-secondary">Refresh</button>
        </div>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, tint, badge, children }) {
  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${tint}`}>
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-sm font-semibold text-[#000F14]">{title}</span>
        {badge != null && badge > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/70 text-[10px] font-bold text-[#000F14]">{badge}</span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function NotesModal({ item, onClose, onSaved }) {
  const [notes, setNotes] = useState(item.pharmacist_notes || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await telemedicine.saveNotes(item.id, { pharmacist_notes: notes })
      if (onSaved) onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Consultation Notes & Prescription"
      subtitle={item ? `Patient: ${item.patient?.name || item.patient?.phone || 'Patient'} · ${item.room_code}` : ''}
      maxWidth="max-w-xl"
    >
      {item && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Status</p>
              <div className="mt-1"><StatusBadge status={item.status} /></div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Scheduled</p>
              <p className="text-sm font-semibold text-[#000F14] mt-1">{formatDate(item.scheduled_at)}</p>
            </div>
          </div>

          {item.topic && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Patient note</p>
              <p className="text-sm text-gray-700 mt-1">{item.topic}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#000F14] mb-1.5">
              Pharmacist notes / Prescription
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={7}
              placeholder="Diagnosis, prescribed medicines, dosage, follow-up instructions…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0FD452]/40 resize-y"
            />
          </div>

          {item.room_url && (
            <a
              href={item.room_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#0FD452] font-semibold hover:underline"
            >
              <Video className="w-4 h-4" /> Open video room in new tab
            </a>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000F14] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <SaveIcon /> {saving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function SaveIcon() {
  return <FileText className="w-4 h-4" />
}

function SlotSettings({ onSaved }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [opened, setOpened] = useState([])
  const [closed, setClosed] = useState([])
  const [min, setMin] = useState(20)
  const [gap, setGap] = useState(10)
  const [days, setDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await telemedicine.slotSettings()
      const d = res.data?.data || res.data || res
      setSettings(d)
      setDays(d.working_days || [])
      setMin(d.slot_minutes ?? 20)
      setGap(d.slot_gap_minutes ?? 10)
      const ws = d.working_hours || {}
      setOpened(ws.open || '08:00')
      setClosed(ws.close || '18:00')
    } catch (e) {
      // surface error below
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleDay = (d) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])

  const save = async () => {
    setSaving(true)
    try {
      await telemedicine.updateSlotSettings({
        working_days: days,
        working_hours: { open: opened, close: closed },
        slot_minutes: min,
        slot_gap_minutes: gap,
      })
      if (onSaved) onSaved()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#0FD452]" /></div>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-[#0FD452]" />
        <div>
          <h3 className="font-bold text-[#000F14]">Consultation Slots</h3>
          <p className="text-xs text-gray-500">Set the days and hours patients can book video consults.</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-semibold text-[#000F14] mb-2">Working days</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                days.includes(d) ? 'bg-[#0FD452] text-white border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Open</label>
          <input
            type="time"
            value={opened}
            onChange={(e) => setOpened(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0FD452]/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Close</label>
          <input
            type="time"
            value={closed}
            onChange={(e) => setClosed(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0FD452]/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Slot duration (min)</label>
          <input
            type="number"
            min="10"
            max="90"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0FD452]/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Gap (min)</label>
          <input
            type="number"
            min="0"
            max="30"
            value={gap}
            onChange={(e) => setGap(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0FD452]/40"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={() => load()} className="btn-secondary inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Reload
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000F14] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Save Slot Settings
        </button>
      </div>

      {settings?.slots?.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-[#0FD452]" />
            <p className="text-sm font-bold text-[#000F14]">Slot preview</p>
            <span className="text-xs text-gray-400">— patients book these slots</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {settings.slots.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
                  s.booked ? 'border-blue-200 bg-blue-50/70' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <Clock4 className={`w-4 h-4 shrink-0 ${s.booked ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#000F14] truncate">{s.date_label}</p>
                  <p className="text-xs text-gray-500">{s.time_label} · {s.end}</p>
                </div>
                {s.booked && <span className="ml-auto text-[10px] font-bold text-blue-600">BOOKED</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
            active === t.key
              ? 'border-[#0FD452] text-[#000F14]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          {t.icon && <t.icon className="w-4 h-4" />} {t.label}
          {t.count != null && t.count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#0FD452]/15 text-[10px] font-bold text-[#0FD452]">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export default function TelemedicinePage() {
  const [tab, setTab] = useState('slots')
  const [pending, setPending] = useState([])
  const [live, setLive] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [notesItem, setNotesItem] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, l, s, h] = await Promise.all([
        telemedicine.pending(),
        telemedicine.live(),
        telemedicine.scheduled(),
        telemedicine.history(),
      ])
      setPending(toArray(p.data))
      setLive(toArray(l.data))
      setScheduled(toArray(s.data))
      setHistory(toArray(h.data))
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not load consultations', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const run = async (fn, okMsg) => {
    try {
      await fn()
      if (okMsg) showToast(okMsg)
      load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Action failed', 'error')
    }
  }

  const accept = (id) => run(() => telemedicine.accept(id), 'Consultation is now LIVE')
  const notifySession = (id) => run(() => telemedicine.notify(id), 'Patient notified — join when ready')
  const endSession = (id) => run(() => telemedicine.end(id), 'Consultation ended')

  const totals = {
    pending: pending.length,
    live: live.length,
    scheduled: scheduled.length,
  }

  const tabs = [
    { key: 'slots', label: 'Slots & Schedule', icon: CalendarDays },
    { key: 'pending', label: 'Pending', icon: Timer, count: totals.pending },
    { key: 'live', label: 'Live Now', icon: Phone, count: totals.live },
    { key: 'scheduled', label: 'Scheduled', icon: Clock4, count: totals.scheduled },
    { key: 'history', label: 'History', icon: FileText, count: history.length },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#000F14]">Telemedicine</h1>
          <p className="text-sm text-gray-500 mt-1">Manage video consultation slots, join live calls, and write prescriptions.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); load() }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatTile label="Pending" value={totals.pending} color="bg-amber-50 text-amber-700" />
        <StatTile label="Live Now" value={totals.live} color="bg-green-50 text-green-700" />
        <StatTile label="Scheduled" value={totals.scheduled} color="bg-blue-50 text-blue-700" />
        <StatTile label="Completed" value={history.length} color="bg-gray-50 text-gray-600" />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-[#0FD452]" />
        </div>
      ) : (
        <>
          {tab === 'slots' && (
            <div className="space-y-5">
              <SlotSettings onSaved={() => { load(); showToast('Slot settings saved') }} />
            </div>
          )}

          {tab === 'pending' && (
            <Section title="Pending Requests" icon={Timer} tint="bg-amber-50" badge={totals.pending}>
              {pending.length === 0 ? <Empty label="No pending requests" onRetry={load} /> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {pending.map((item) => (
                    <SessionCard
                      key={item.id}
                      item={item}
                      actions={[
                        { label: 'Accept & Go Live', primary: true, icon: Play, onClick: () => accept(item.id) },
                        { label: 'Notes', icon: PencilLine, onClick: () => setNotesItem(item) },
                      ]}
                    />
                  ))}
                </div>
              )}
            </Section>
          )}

          {tab === 'live' && (
            <Section title="Live Now" icon={Phone} tint="bg-green-50" badge={totals.live}>
              {live.length === 0 ? <Empty label="No live consultations" onRetry={load} /> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {live.map((item) => (
                    <SessionCard
                      key={item.id}
                      item={item}
                      actions={[
                        { label: 'End Consult', icon: PhoneCall, onClick: () => endSession(item.id) },
                        { label: 'Notes', icon: PencilLine, onClick: () => setNotesItem(item) },
                      ]}
                    />
                  ))}
                </div>
              )}
            </Section>
          )}

          {tab === 'scheduled' && (
            <Section title="Scheduled Appointments" icon={Clock4} tint="bg-blue-50" badge={totals.scheduled}>
              {scheduled.length === 0 ? <Empty label="No scheduled appointments" onRetry={load} /> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {scheduled.map((item) => (
                    <SessionCard
                      key={item.id}
                      item={item}
                      actions={[
                        {
                          label: 'Accepts',
                          primary: true,
                          icon: CheckCircle2,
                          onClick: () => {
                            if (window.confirm('Accept this scheduled consult & go live now?')) accept(item.id)
                          },
                        },
                        { label: 'Notify', icon: Bell, onClick: () => notifySession(item.id) },
                        { label: 'Notes', icon: PencilLine, onClick: () => setNotesItem(item) },
                      ]}
                    />
                  ))}
                </div>
              )}
            </Section>
          )}

          {tab === 'history' && (
            <Section title="Consultation History" icon={FileText} tint="bg-gray-100">
              {history.length === 0 ? <Empty label="No completed consultations yet" onRetry={load} /> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <PatientInline item={item} />
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        {item.scheduled_at && <span className="inline-flex items-center gap-1.5"><Clock4 className="w-3.5 h-3.5" /> {formatDate(item.scheduled_at)}</span>}
                        <span className="inline-flex items-center gap-1.5 font-mono text-gray-400"><Video className="w-3.5 h-3.5" /> {item.room_code}</span>
                      </div>
                      {item.pharmacist_notes ? (
                        <p className="text-xs text-gray-600 bg-blue-50/60 rounded-lg px-3 py-2 whitespace-pre-wrap">
                          <span className="font-semibold text-blue-700">Notes:</span> {item.pharmacist_notes}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">No notes yet.</p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={() => setNotesItem(item)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-50">
                          <PencilLine className="w-3.5 h-3.5" /> {item.pharmacist_notes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                        {item.room_url && (
                          <a href={item.room_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-50">
                            <Video className="w-3.5 h-3.5" /> Join Room
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#000F14] text-white'}`}>
            {toast.msg}
          </div>
        </div>
      )}

      {notesItem && (
        <NotesModal
          item={notesItem}
          onClose={() => setNotesItem(null)}
          onSaved={() => { setNotesItem(null); showToast('Notes saved'); load() }}
        />
      )}
    </div>
  )
}

function StatTile({ label, value, color }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${color}`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
    </div>
  )
}