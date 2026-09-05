import { useState, useEffect, useMemo } from 'react'
import { toArray } from '../../utils/safeData'
import {
  Stethoscope, Plus, Clock4, Timer, Phone, FileText, Search,
  MoreVertical, CheckCircle2, Bell, PencilLine, Trash2, Video, X, CalendarDays,
  User, PhoneCall, RefreshCw, ToggleLeft, ToggleRight, Filter,
} from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_CONFIG = {
  requested: { label: 'Pending', cls: 'bg-amber-100 text-amber-700', icon: Timer },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700', icon: Clock4 },
  live: { label: 'Live', cls: 'bg-green-100 text-green-700', icon: Phone },
  ended: { label: 'Ended', cls: 'bg-gray-100 text-gray-600', icon: FileText },
  missed: { label: 'Missed', cls: 'bg-orange-100 text-orange-600', icon: X },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-600', icon: X },
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ended
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  )
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return value }
}

function formatDay(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const EmptyRow = ({ colSpan, message }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-400">{message}</td>
  </tr>
)

export default function TelemedicinePage() {
  const [activeTab, setActiveTab] = useState('consults')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pending, setPending] = useState([])
  const [live, setLive] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [history, setHistory] = useState([])
  const [slots, setSlots] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [modal, setModal] = useState(null) // 'slot' | 'notes' | 'settings'
  const [modalItem, setModalItem] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const slotsResFn = (res) => {
    const d = res.data?.data || res.data || res
    return d && typeof d === 'object' ? d : null
  }

  const load = async () => {
    setLoading(true)
    try {
      const [p, l, s, h, slotsRes, settingsRes] = await Promise.all([
        api.get('/telemedicine/pending'),
        api.get('/telemedicine/live'),
        api.get('/telemedicine/scheduled'),
        api.get('/telemedicine/history'),
        api.get('/telemedicine/slots'),
        api.get('/telemedicine/slot-settings'),
      ])
      setPending(toArray(p.data))
      setLive(toArray(l.data))
      setScheduled(toArray(s.data))
      setHistory(toArray(h.data))
      setSlots(toArray(slotsRes.data))
      setSettings(slotsResFn(settingsRes))
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not load telemedicine data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const consultations = useMemo(() => {
    let all = [...pending.map((i) => ({ ...i, tab_group: 'pending' })), ...live.map((i) => ({ ...i, tab_group: 'live' })), ...scheduled.map((i) => ({ ...i, tab_group: 'scheduled' })), ...history.map((i) => ({ ...i, tab_group: 'history' }))]
    if (statusFilter) all = all.filter((i) => i.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      all = all.filter((i) =>
        (i.patient?.name || '').toLowerCase().includes(q) ||
        (i.patient?.phone || '').toLowerCase().includes(q) ||
        (i.room_code || '').toLowerCase().includes(q)
      )
    }
    return all
  }, [pending, live, scheduled, history, statusFilter, search])

  const stats = {
    pending: pending.length,
    live: live.length,
    scheduled: scheduled.length,
    completed: history.length,
  }

  const statCards = [
    { label: 'Pending Requests', value: stats.pending, icon: Timer, color: 'bg-amber-100 text-amber-600' },
    { label: 'Live Now', value: stats.live, icon: Phone, color: 'bg-green-100 text-green-600' },
    { label: 'Scheduled', value: stats.scheduled, icon: Clock4, color: 'bg-blue-100 text-blue-600' },
    { label: 'Completed', value: stats.completed, icon: FileText, color: 'bg-gray-100 text-gray-600' },
  ]

  // ---- Actions ----
  const startConsult = async (id) => {
    try {
      await api.post(`/telemedicine/${id}/accept`)
      showToast('Consultation is now LIVE')
      setActiveMenu(null); load()
    } catch (err) { showToast(err?.response?.data?.message || 'Could not start consult', 'error') }
  }

  const notifyPatient = async (id) => {
    try {
      await api.post(`/telemedicine/${id}/notify`)
      showToast('Patient notified — join when ready')
      setActiveMenu(null)
    } catch (err) { showToast(err?.response?.data?.message || 'Could not notify', 'error') }
  }

  const endConsult = async (id) => {
    try {
      await api.post(`/telemedicine/${id}/end`)
      showToast('Consultation ended')
      setActiveMenu(null); load()
    } catch (err) { showToast(err?.response?.data?.message || 'Could not end consult', 'error') }
  }

  const openNotes = (item) => { setModal('notes'); setModalItem(item) }

  // ---- Slot CRUD ----
  const saveSlot = async (form) => {
    try {
      if (form.id) {
        await api.put(`/telemedicine/slots/${form.id}`, form)
        showToast('Slot updated')
      } else {
        await api.post('/telemedicine/slots', form)
        showToast('Slot created')
      }
      setModal(null); setModalItem(null); load()
    } catch (err) { showToast(err?.response?.data?.message || 'Could not save slot', 'error') }
  }

  const deleteSlot = async () => {
    try {
      await api.delete(`/telemedicine/slots/${confirmDelete.id}`)
      showToast('Slot deleted')
      setConfirmDelete(null); load()
    } catch (err) { showToast(err?.response?.data?.message || 'Could not delete slot', 'error') }
  }

  const saveSettings = async (form) => {
    try {
      await api.put('/telemedicine/slot-settings', form)
      showToast('Slot settings saved')
      setModal(null); load()
    } catch (err) { showToast(err?.response?.data?.message || 'Could not save settings', 'error') }
  }

  // ---- Render ----
  const renderLoadRow = () => (
    <tr>
      <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </td>
    </tr>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Telemedicine</h1>
            <p className="text-sm text-gray-500">Manage consultation slots and video consultations.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {activeTab === 'slots' ? (
            <button
              onClick={() => { setModal('slot'); setModalItem(null) }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Add Slot
            </button>
          ) : (
            <button onClick={() => setModal('settings')} className="btn-primary">
              <CalendarDays className="w-5 h-5" />
              Slot Settings
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-5">
        <TabBtn active={activeTab === 'consults'} onClick={() => setActiveTab('consults')} label="Consultations" count={consultations.length} icon={Stethoscope} />
        <TabBtn active={activeTab === 'slots'} onClick={() => setActiveTab('slots')} label="Slots" count={slots.length} icon={CalendarDays} />
        {!loading && settings?.slots && (
          <span className="ml-auto hidden sm:flex items-center gap-2 text-xs text-gray-400 py-2.5">
            <Clock4 className="w-3.5 h-3.5" />
            Next {settings.slots.length} generated slots available
          </span>
        )}
      </div>

      {activeTab === 'consults' ? (
        /* ============ CONSULTATIONS ============ */
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, phone or room..."
                className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
              {['requested', 'live', 'scheduled', 'ended'].map((st) => {
                const cfg = STATUS_CONFIG[st]
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(statusFilter === st ? '' : st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === st ? 'bg-primary text-dark' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <TH icon={User}>Patient</TH>
                    <TH icon={Timer}>Status</TH>
                    <TH icon={Clock4}>Scheduled</TH>
                    <TH icon={PhoneCall}>Room</TH>
                    <TH icon={FileText}>Topic / Patient note</TH>
                    <TH icon={PencilLine}>Pharmacist notes</TH>
                    <TH align="right">Actions</TH>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    renderLoadRow()
                  ) : consultations.length === 0 ? (
                    <EmptyRow colSpan={7} message="No consultations found" />
                  ) : (
                    consultations.map((item, index) => {
                      const patientName = item.patient?.name || item.patient?.phone || 'Patient'
                      return (
                        <tr key={item.id} className="transition-colors hover:bg-[#0FD452]/5">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10 shrink-0">
                                <User className="h-4 w-4 text-[#0FD452]" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-gray-900 block truncate">{patientName}</span>
                                {item.patient?.phone && <span className="text-xs text-gray-400">{item.patient.phone}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><StatusPill status={item.status} /></td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.scheduled_at)}</td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">{item.room_code}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-[220px] truncate">{item.topic || item.patient_notes || '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-[220px] truncate">{item.pharmacist_notes || '—'}</td>
                          <td className="px-6 py-4 text-right relative">
                            <button onClick={() => setActiveMenu(activeMenu === index ? null : index)} className="btn-ghost">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {activeMenu === index && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                <div className="absolute right-6 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                                  {item.status === 'requested' && (
                                    <MenuBtn icon={CheckCircle2} color="text-green-600 hover:bg-green-50" label="Accept & Go Live" onClick={() => startConsult(item.id)} />
                                  )}
                                  {item.status === 'scheduled' && (
                                    <MenuBtn icon={CheckCircle2} color="text-green-600 hover:bg-green-50" label="Accept & Go Live" onClick={() => startConsult(item.id)} />
                                  )}
                                  {item.status === 'live' && (
                                    <MenuBtn icon={PhoneCall} color="text-red-600 hover:bg-red-50" label="End Consult" onClick={() => endConsult(item.id)} />
                                  )}
                                  {item.status === 'scheduled' && (
                                    <MenuBtn icon={Bell} label="Notify Patient" onClick={() => notifyPatient(item.id)} />
                                  )}
                                  {(item.status === 'live' || item.status === 'requested') && item.room_url && (
                                    <a href={item.room_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                      <Video className="w-4 h-4" /> Join Video Room
                                    </a>
                                  )}
                                  <MenuBtn icon={PencilLine} label={item.pharmacist_notes ? 'Edit Notes' : 'Add Notes'} onClick={() => openNotes(item)} />
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ============ SLOTS ============ */
        <>
          {/* Slot availability strip */}
          {!loading && settings && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays className="w-4 h-4 text-[#0FD452]" />
                <span className="font-medium text-gray-700">
                  {Array.isArray(settings.working_days) && settings.working_days.join(', ')}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {settings.working_hours?.open} – {settings.working_hours?.close} · {settings.slot_minutes}min slots · {settings.slot_gap_minutes}min gap
              </span>
              <button onClick={() => setModal('settings')} className="ml-auto text-xs font-semibold text-[#0FD452] hover:underline">
                Edit Slot Settings
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Slots</h3>
              {(slots.length > 40 || true) && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Search className="w-4 h-4" />
                  <span>{slots.length} slot{slots.length === 1 ? '' : 's'} managed</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <TH icon={CalendarDays}>Date</TH>
                    <TH icon={Clock4}>Start</TH>
                    <TH icon={Clock4}>End</TH>
                    <TH icon={ToggleRight}>Status</TH>
                    <TH align="right">Actions</TH>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : slots.length === 0 ? (
                    <EmptyRow colSpan={5} message="No slots yet — click Add Slot to create your first one" />
                  ) : (
                    slots.map((slot, index) => (
                      <tr key={slot.id} className="transition-colors hover:bg-[#0FD452]/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                              <CalendarDays className="h-4 w-4 text-[#0FD452]" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{formatDay(slot.slot_date)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{slot.start_time}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{slot.end_time}</td>
                        <td className="px-6 py-4">
                          {slot.is_available ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <ToggleRight className="w-3 h-3" /> Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                              <ToggleLeft className="w-3 h-3" /> Unavailable
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button onClick={() => setActiveMenu(activeMenu === `slot-${index}` ? null : `slot-${index}`)} className="btn-ghost">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {activeMenu === `slot-${index}` && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                              <div className="absolute right-6 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                                <MenuBtn icon={PencilLine} label="Edit" onClick={() => { setModal('slot'); setModalItem(slot); setActiveMenu(null) }} />
                                <button
                                  onClick={() => { setConfirmDelete(slot); setActiveMenu(null) }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Compact preview */}
            {!loading && settings?.slots && (
              <div className="border-t border-gray-100 px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Upcoming slots patients can book</p>
                  <span className="text-xs text-gray-400">{settings.slots.length} generated</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                  {settings.slots.slice(0, 12).map((s, i) => (
                    <span
                      key={i}
                      className={`shrink-0 inline-flex flex-col items-center px-3 py-1.5 rounded-lg text-xs border ${
                        s.booked ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-600'
                      }`}
                      title={s.booked ? 'Booked' : 'Available'}
                    >
                      <span className="font-semibold">{s.date_label}</span>
                      <span>{s.time_label}</span>
                      {s.booked && <span className="text-[9px] font-bold text-blue-600">BOOKED</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Slot modal */}
      {modal === 'slot' && (
        <SlotFormModal
          item={modalItem}
          onClose={() => { setModal(null); setModalItem(null) }}
          onSave={saveSlot}
        />
      )}

      {/* Notes modal */}
      {modal === 'notes' && modalItem && (
        <NotesModal
          item={modalItem}
          onClose={() => { setModal(null); setModalItem(null) }}
          onSaved={(msg) => { setModal(null); setModalItem(null); showToast(msg); load() }}
        />
      )}

      {/* Settings modal */}
      {modal === 'settings' && (
        <SettingsModal
          settings={settings}
          onClose={() => setModal(null)}
          onSave={saveSettings}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Slot"
        message="Are you sure you want to delete this slot? Patients will no longer be able to book it."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={deleteSlot}
        onCancel={() => setConfirmDelete(null)}
      />

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

// ---- small components ----

function TabBtn({ active, onClick, label, count, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active ? 'border-[#0FD452] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-[#0FD452]/15 text-[#0FD452]' : 'bg-gray-100 text-gray-400'}`}>
        {count}
      </span>
    </button>
  )
}

function TH({ icon: Icon, children, align }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${align === 'right' ? 'text-right' : ''}`}>
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
        {Icon && <Icon className="w-3.5 h-3.5 text-[#0FD452]" />}
        <span>{children}</span>
      </div>
    </th>
  )
}

function MenuBtn({ icon: Icon, label, onClick, color = 'text-gray-700 hover:bg-gray-50' }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${color}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  )
}

// ---- Slot form modal ----
function SlotFormModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    id: item?.id || null,
    slot_date: item?.slot_date || '',
    start_time: item?.start_time || '09:00',
    end_time: item?.end_time || '09:20',
    is_available: item?.is_available ?? true,
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.slot_date) { alert('Please choose a date'); return }
    setSaving(true)
    try {
      await onSave({ ...form, is_available: !!form.is_available })
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen onClose={onClose} title={item ? 'Edit Slot' : 'Add Slot'} subtitle="Create a consultation slot patients can book.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
          <input
            type="date"
            value={form.slot_date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setForm({ ...form, slot_date: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setForm({ ...form, is_available: !form.is_available })}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border w-full transition-colors ${
              form.is_available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            {form.is_available
              ? <ToggleRight className="w-5 h-5 text-green-600 shrink-0" />
              : <ToggleLeft className="w-5 h-5 text-red-600 shrink-0" />}
            <span className="text-sm font-medium text-gray-800">
              {form.is_available ? 'Available — patients can book this slot' : 'Unavailable — slot is blocked'}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3 pt-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : (item ? 'Save Changes' : 'Create Slot')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ---- Notes modal ----
function NotesModal({ item, onClose, onSaved }) {
  const [notes, setNotes] = useState(item.pharmacist_notes || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/telemedicine/${item.id}/notes`, { pharmacist_notes: notes })
      onSaved('Notes saved')
    } catch (err) {
      onSaved(err?.response?.data?.message || 'Could not save notes')
    } finally { setSaving(false) }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Consultation Notes & Prescription"
      subtitle={`${item.patient?.name || item.patient?.phone || 'Patient'} · ${item.room_code}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Status</p>
            <div className="mt-1"><StatusPill status={item.status} /></div>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Scheduled</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{formatDate(item.scheduled_at)}</p>
          </div>
        </div>

        {item.topic && (
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Patient note</p>
            <p className="text-sm text-gray-700 mt-1">{item.topic}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pharmacist notes / Prescription</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={7}
            placeholder="Diagnosis, prescribed medicines, dosage, follow-up instructions…"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-y"
          />
        </div>

        {item.room_url && (
          <a href={item.room_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#0FD452] font-semibold hover:underline">
            <Video className="w-4 h-4" /> Open video room in new tab
          </a>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Notes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ---- Settings modal ----
function SettingsModal({ settings, onClose, onSave }) {
  const [form, setForm] = useState({
    working_days: settings?.working_days && settings.working_days.length ? settings.working_days : [...DAYS],
    working_hours: {
      open: settings?.working_hours?.open || '08:00',
      close: settings?.working_hours?.close || '18:00',
    },
    slot_minutes: settings?.slot_minutes ?? 20,
    slot_gap_minutes: settings?.slot_gap_minutes ?? 10,
  })
  const [saving, setSaving] = useState(false)

  const toggleDay = (d) =>
    setForm((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(d) ? prev.working_days.filter((x) => x !== d) : [...prev.working_days, d],
    }))

  const submit = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <Modal isOpen onClose={onClose} title="Slot Settings" subtitle="Default hours used to generate patient-facing booking slots." maxWidth="max-w-xl">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Working days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                  form.working_days.includes(d) ? 'bg-[#0FD452] text-[#000F14] border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Open</label>
            <input
              type="time"
              value={form.working_hours.open}
              onChange={(e) => setForm({ ...form, working_hours: { ...form.working_hours, open: e.target.value } })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Close</label>
            <input
              type="time"
              value={form.working_hours.close}
              onChange={(e) => setForm({ ...form, working_hours: { ...form.working_hours, close: e.target.value } })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slot (min)</label>
            <input
              type="number"
              min="10"
              max="90"
              value={form.slot_minutes}
              onChange={(e) => setForm({ ...form, slot_minutes: Number(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gap (min)</label>
            <input
              type="number"
              min="0"
              max="30"
              value={form.slot_gap_minutes}
              onChange={(e) => setForm({ ...form, slot_gap_minutes: Number(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </Modal>
  )
}