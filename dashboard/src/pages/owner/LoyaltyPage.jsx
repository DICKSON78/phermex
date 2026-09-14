import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData'
import { Loader2, Settings2, Search, Plus, Minus, X, RefreshCcw, Users, Award, Repeat, CheckCircle2 } from 'lucide-react'
import { loyalty } from '../../services/api'

export default function LoyaltyPage() {
  const [settings, setSettings] = useState({ enabled: false, points_per_tsh: 0.001, redeem_tsh_per_point: 20, summary: {} })
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  const [selected, setSelected] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [transactionsBalance, setTransactionsBalance] = useState(0)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [modal, setModal] = useState(null) // 'adjust' | 'redeem'
  const [formPoints, setFormPoints] = useState('')
  const [formReason, setFormReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [settingsRes, membersRes] = await Promise.all([
        loyalty.settings(),
        loyalty.members(),
      ])
      const settingsData = settingsRes.data?.data || settingsRes.data || {}
      setSettings({
        enabled: !!settingsData.enabled,
        points_per_tsh: Number(settingsData.points_per_tsh ?? 0.001),
        redeem_tsh_per_point: Number(settingsData.redeem_tsh_per_point ?? 20),
        summary: settingsData.summary || {},
      })
      setMembers(toArray(membersRes.data))
    } catch {
      showToast('Could not load loyalty data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = members.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (m.name || '').toLowerCase().includes(q) || (m.phone || '').includes(search) || (m.email || '').toLowerCase().includes(q)
  })

  const saveSettings = async () => {
    setSaving(true)
    try {
      await loyalty.updateSettings({
        enabled: settings.enabled,
        points_per_tsh: settings.points_per_tsh,
        redeem_tsh_per_point: settings.redeem_tsh_per_point,
      })
      showToast('Loyalty program settings updated')
    } catch {
      showToast('Could not save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openTransactions = async (member) => {
    setSelected(member)
    setLoadingTransactions(true)
    try {
      const res = await loyalty.transactions(member.user_id)
      const data = res.data?.data || res.data || {}
      setTransactions(data.transactions || [])
      setTransactionsBalance(Number(data.balance ?? member.points ?? 0))
    } catch {
      setTransactions([])
      setTransactionsBalance(member.points || 0)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const submitAction = async () => {
    const points = parseInt(formPoints, 10)
    if (!points || points === 0 || !selected) return

    setSubmitting(true)
    try {
      if (modal === 'adjust') {
        const res = await loyalty.adjust({ user_id: selected.user_id, points, reason: formReason || null })
        showToast(res.data?.message || 'Points adjusted')
      } else {
        const res = await loyalty.redeem({ user_id: selected.user_id, points: Math.abs(points), reason: formReason || null })
        showToast(res.data?.message || 'Points redeemed')
      }
      setModal(null); setFormPoints(''); setFormReason('')
      setSaving(true)
      await load()
      if (selected) {
        const memberRes = await loyalty.members()
        const updatedMembers = toArray(memberRes.data)
        setMembers(updatedMembers)
        const updatedMember = updatedMembers.find((m) => m.user_id === selected.user_id)
        if (updatedMember) await openTransactions(updatedMember)
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Action failed', 'error')
    } finally {
      setSubmitting(false)
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-[#0FD452]" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-gray-500 text-sm mt-1">Reward customers with points on every purchase</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Members', value: settings.summary?.active_members ?? 0, icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Points Earned', value: (settings.summary?.total_earned ?? 0).toLocaleString(), icon: Award, color: 'text-green-600 bg-green-100' },
          { label: 'Points Redeemed', value: (settings.summary?.total_redeemed ?? 0).toLocaleString(), icon: Repeat, color: 'text-purple-600 bg-purple-100' },
          { label: 'Value Redeemed', value: Number(settings.summary?.redeemed_value ?? 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' }), icon: CheckCircle2, color: 'text-amber-600 bg-amber-100' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Settings2 className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Program Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enable Program</label>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enabled ? 'bg-[#0FD452]' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Earn Rate (points per 1,000 TSH)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1000"
              value={settings.points_per_tsh * 1000}
              onChange={(e) => setSettings({ ...settings, points_per_tsh: (parseFloat(e.target.value) || 0) / 1000 })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Customers earn {settings.points_per_tsh * 1000} point{(settings.points_per_tsh * 1000) === 1 ? '' : 's'} for every 1,000 TSH spent</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Redeem Value (TSH per point)</label>
            <input
              type="number"
              step="1"
              min="1"
              value={settings.redeem_tsh_per_point}
              onChange={(e) => setSettings({ ...settings, redeem_tsh_per_point: parseFloat(e.target.value) || 20 })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Each point is worth {Number(settings.redeem_tsh_per_point).toLocaleString()} TSH</p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2.5 bg-[#000F14] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2015] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, phone, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 w-72"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Phone</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Orders</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Total Spent</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Points</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No customers found</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.user_id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{m.name || 'Unknown'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{m.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-center text-gray-600">{m.orders_count}</td>
                  <td className="px-5 py-3.5 text-right text-gray-900 font-medium">{Number(m.total_value).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#0FD452]">{m.points}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openTransactions(m)} className="text-sm text-[#0FD452] hover:underline font-medium">View</button>
                      <button onClick={() => { setSelected(m); setModal('adjust'); setFormPoints(''); setFormReason('') }} className="text-sm text-gray-600 hover:text-[#0FD452] font-medium">Adjust</button>
                      <button onClick={() => { setSelected(m); setModal('redeem'); setFormPoints(''); setFormReason('') }} className="text-sm text-gray-600 hover:text-purple-600 font-medium">Redeem</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions panel */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.phone || selected.email || ''}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">Current Balance</div>
              <div className="text-2xl font-bold text-[#0FD452]">{transactionsBalance}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => { setModal('adjust'); setFormPoints(''); setFormReason('') }}
                className="py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              ><Plus className="w-4 h-4" /> Adjust Points</button>
              <button
                onClick={() => { setModal('redeem'); setFormPoints(''); setFormReason('') }}
                className="py-2.5 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#0a2015] flex items-center justify-center gap-2"
              ><Minus className="w-4 h-4" /> Redeem Points</button>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Transaction History</h3>
            {loadingTransactions ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#0FD452]" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{tx.description || 'Transaction'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tx.type === 'earn' ? 'Earned' : tx.type === 'redeem' ? 'Redeemed' : 'Adjusted'} · {tx.created_at}</p>
                    </div>
                    <div className={`text-sm font-bold ml-4 ${tx.points >= 0 ? 'text-[#0FD452]' : 'text-red-500'}`}>{tx.points >= 0 ? '+' : ''}{tx.points}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjust / Redeem modal */}
      {modal && selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{modal === 'adjust' ? 'Adjust Points' : 'Redeem Points'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{modal === 'adjust' ? 'Points (+ to add, - to subtract)' : 'Points to redeem'}</label>
                <input
                  type="number"
                  value={formPoints}
                  onChange={(e) => setFormPoints(e.target.value)}
                  placeholder={modal === 'adjust' ? 'e.g. 50 or -50' : 'e.g. 100'}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Goodwill credit, correction"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={submitAction}
                  disabled={!formPoints || parseInt(formPoints, 10) === 0 || submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#000F14] text-white text-sm font-semibold hover:bg-[#0a2015] disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}