import { useEffect, useState } from 'react'
import { CreditCard, Edit, Loader2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/subscription-plans')
      setPlans(res.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = (plan) => {
    setEditing({
      id: plan.id,
      name: plan.name || '',
      description: plan.description || '',
      duration_months: plan.duration_months ?? 1,
      price: plan.price ?? 0,
      currency: plan.currency || 'TZS',
      grace_period_days: plan.grace_period_days ?? 0,
      sort_order: plan.sort_order ?? 0,
      is_active: plan.is_active !== false,
    })
  }

  const save = async (e) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    try {
      await api.put(`/admin/subscription-plans/${editing.id}`, {
        name: editing.name,
        description: editing.description || null,
        duration_months: Number(editing.duration_months) || 1,
        price: Number(editing.price) || 0,
        currency: editing.currency,
        grace_period_days: Number(editing.grace_period_days) || 0,
        sort_order: Number(editing.sort_order) || 0,
        is_active: Boolean(editing.is_active),
      })
      toast.success('Subscription plan updated')
      setEditing(null)
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not save plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <CreditCard className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-sm text-gray-500">Manage plan pricing, duration, grace period and availability.</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Grace</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">Loading plans…</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No subscription plans found.</td></tr>
            ) : plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-400">{plan.description || '—'}</p>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {plan.price === 0 ? 'Free' : `${plan.currency || 'TZS'} ${Number(plan.price).toLocaleString()}`}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{plan.duration_months} month(s)</td>
                <td className="px-6 py-4 text-sm text-gray-600">{plan.grace_period_days ?? 0} days</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(plan)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-[#0FD452] hover:text-[#0FD452]" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Plan</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Name</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Description</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Price</label>
                  <input type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Currency</label>
                  <select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20">
                    <option value="TZS">TZS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Duration (months)</label>
                  <input type="number" min="1" value={editing.duration_months} onChange={(e) => setEditing({ ...editing, duration_months: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Grace (days)</label>
                  <input type="number" min="0" value={editing.grace_period_days} onChange={(e) => setEditing({ ...editing, grace_period_days: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Sort order</label>
                  <input type="number" min="0" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-[#0FD452] focus:ring-[#0FD452]" />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#0FD452] px-5 py-2.5 text-sm font-bold text-[#000F14] hover:bg-[#0cb843] disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}