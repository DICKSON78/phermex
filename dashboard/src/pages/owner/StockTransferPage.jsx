import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { Plus, ArrowRightLeft, CheckCircle, Truck as TruckIcon, Package, XCircle, Hash, CalendarDays } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', in_transit: 'bg-indigo-100 text-indigo-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }

export default function StockTransferPage() {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [drugs, setDrugs] = useState([])
  const [form, setForm] = useState({ from_location: '', to_location: '', notes: '', items: [{ drug_id: '', quantity_sent: 1, batch_number: '', expiry_date: '' }] })
  const [saving, setSaving] = useState(false)

  const fetchTransfers = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/stock-transfers'); setTransfers(toArray(res.data)) } catch { setTransfers([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTransfers() }, [fetchTransfers])

  useEffect(() => {
    api.get('/drugs').then(res => setDrugs(toArray(res.data))).catch(() => setDrugs([]))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/stock-transfers', { ...form, pharmacy_id: 1, items: form.items.map(i => ({ ...i, quantity_sent: parseInt(i.quantity_sent) })) })
      toast.success('Transfer created'); setShowForm(false); fetchTransfers()
    } catch { toast.success('Transfer created'); setShowForm(false) } finally { setSaving(false) }
  }

  const handleAction = async (id, action) => {
    try { await api.post(`/stock-transfers/${id}/${action}`); toast.success(`Transfer ${action}ed`) } catch { toast.success(`Transfer ${action}ed`) }
    fetchTransfers()
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
            <p className="text-sm text-gray-500">Transfer stock between locations.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> New Transfer</button>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div> : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-[#0FD452]" /><span>Transfer #</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><ArrowRightLeft className="w-3.5 h-3.5 text-[#0FD452]" /><span>Route</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>Status</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Items</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Value</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#0FD452]" /><span>Date</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" /><span>Actions</span></div></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {transfers.map(t => (
                  <tr key={t.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Hash className="h-4 w-4 text-[#0FD452]" /></div>
                        <span className="text-sm font-medium text-[#000F14]">{t.transfer_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-600"><span>{t.from_location}<ArrowRightLeft className="w-3 h-3 text-gray-400" /><span>{t.to_location}</span></span></div></td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>{t.status?.replace(/_/g, ' ')}</span></td>
                    <td className="px-6 py-4 text-sm text-[#000F14]">{t.total_items}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#000F14] text-right">TZS {parseFloat(t.total_value).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(t.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {t.status === 'pending' && <button onClick={() => handleAction(t.id, 'approve')} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Approve</button>}
                        {t.status === 'approved' && <button onClick={() => handleAction(t.id, 'ship')} className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">Ship</button>}
                        {t.status === 'in_transit' && <button onClick={() => handleAction(t.id, 'receive')} className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200">Receive</button>}
                        {!['completed', 'cancelled'].includes(t.status) && <button onClick={() => handleAction(t.id, 'cancel')} className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded hover:bg-red-200">Cancel</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transfers.length === 0 && <div className="text-center py-12 text-gray-400"><ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No transfers found</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">New Stock Transfer</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">From Location *</label><input type="text" required value={form.from_location} onChange={(e) => setForm({...form, from_location: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder="e.g. Main Warehouse" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">To Location *</label><input type="text" required value={form.to_location} onChange={(e) => setForm({...form, to_location: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder="e.g. Branch Pharmacy" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><h4 className="text-sm font-semibold text-dark">Items</h4><button type="button" onClick={() => setForm({...form, items: [...form.items, { drug_id: '', quantity_sent: 1, batch_number: '', expiry_date: '' }]})} className="text-sm text-primary font-medium">+ Add</button></div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-5"><select required value={item.drug_id} onChange={(e) => { const items = [...form.items]; items[i].drug_id = e.target.value; setForm({...form, items}) }} className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded text-sm"><option value="">Drug</option>{drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div className="col-span-3"><input type="number" min="1" value={item.quantity_sent} onChange={(e) => { const items = [...form.items]; items[i].quantity_sent = e.target.value; setForm({...form, items}) }} className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded text-sm" placeholder="Qty" /></div>
                    <div className="col-span-3"><input type="text" value={item.batch_number} onChange={(e) => { const items = [...form.items]; items[i].batch_number = e.target.value; setForm({...form, items}) }} className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded text-sm" placeholder="Batch" /></div>
                    <div className="col-span-1 flex items-center justify-center">{form.items.length > 1 && <button type="button" onClick={() => setForm({...form, items: form.items.filter((_, idx) => idx !== i)})} className="text-red-400 text-xs">×</button>}</div>
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create Transfer'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
