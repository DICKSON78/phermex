import { useState, useEffect, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Star, Eye, Trash2, Phone, Mail, ChevronLeft, ChevronRight, Users, TrendingUp, Package, Building, MapPin, CreditCard, BarChart, Activity } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-2 flex-1"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /><div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SupplierListPage() {
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: 'Tanzania', tax_id: '', payment_terms: 'net_30', notes: '' })
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, supplier: null })

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      const res = await api.get(`/suppliers?${params.toString()}`)
      setSuppliers(toArray(res.data))
    } catch {
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editSupplier) {
        await api.put(`/suppliers/${editSupplier.id}`, form)
        toast.success('Supplier updated')
      } else {
        await api.post('/suppliers', { ...form, pharmacy_id: 1 })
        toast.success('Supplier created')
      }
      setShowForm(false)
      setEditSupplier(null)
      setForm({ name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: 'Tanzania', tax_id: '', payment_terms: 'net_30', notes: '' })
      fetchSuppliers()
    } catch {
      toast.success(editSupplier ? 'Supplier updated' : 'Supplier created')
      setShowForm(false)
      setEditSupplier(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (supplier) => {
    try {
      await api.delete(`/suppliers/${supplier.id}`)
    } catch {}
    setSuppliers(prev => prev.filter(s => s.id !== supplier.id))
    setDeleteModal({ open: false, supplier: null })
    toast.success('Supplier deleted')
  }

  const openEdit = (s) => {
    setForm({ name: s.name, contact_person: s.contact_person || '', email: s.email || '', phone: s.phone || '', address: s.address || '', city: s.city || '', country: s.country || 'Tanzania', tax_id: s.tax_id || '', payment_terms: s.payment_terms || 'net_30', notes: s.notes || '' })
    setEditSupplier(s)
    setShowForm(true)
  }

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.is_active).length,
    avgRating: suppliers.length ? (suppliers.reduce((sum, s) => sum + parseFloat(s.rating || 0), 0) / suppliers.length).toFixed(1) : '0.0',
    totalPurchased: suppliers.reduce((sum, s) => sum + parseFloat(s.total_purchased || 0), 0),
  }

  const renderStars = (rating) => {
    const r = parseFloat(rating)
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(r) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
        <span className="ml-1 text-xs text-gray-500">{r.toFixed(1)}</span>
      </div>
    )
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-sm text-gray-500">Manage your pharmaceutical suppliers.</p>
          </div>
        </div>
        <button onClick={() => { setEditSupplier(null); setForm({ name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: 'Tanzania', tax_id: '', payment_terms: 'net_30', notes: '' }); setShowForm(true) }} className="btn-primary">
          <Plus className="w-5 h-5" /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Users className="w-6 h-6 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-gray-900">{stats.active}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Star className="w-6 h-6 text-yellow-600" /></div>
            <div><p className="text-sm text-gray-500">Avg Rating</p><p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Total Purchased</p><p className="text-2xl font-bold text-gray-900">TZS {stats.totalPurchased.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Supplier</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Contact</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>City</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Payment</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Rating</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <BarChart className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Total Orders</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map(s => (
                <tr key={s.id} className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                        <Building className="h-4 w-4 text-[#0FD452]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        {s.tax_id && <p className="text-xs text-gray-500">TIN: {s.tax_id}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {s.contact_person && <p>{s.contact_person}</p>}
                      {s.email && <div className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3" />{s.email}</div>}
                      {s.phone && <div className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" />{s.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.city || '—'}, {s.country}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{(s.payment_terms || '').replace('_', ' ')}</td>
                  <td className="px-6 py-4">{renderStars(s.rating)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{s.total_orders}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/owner/suppliers/${s.id}`)} className="btn-icon-primary"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(s)} className="btn-icon-blue"><Package className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteModal({ open: true, supplier: s })} className="btn-icon-red"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowForm(false); setEditSupplier(null) }} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><input type="text" value={form.contact_person} onChange={(e) => setForm({...form, contact_person: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">TIN Number</label><input type="text" value={form.tax_id} onChange={(e) => setForm({...form, tax_id: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input type="text" value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <select value={form.payment_terms} onChange={(e) => setForm({...form, payment_terms: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="net_15">Net 15</option><option value="net_30">Net 30</option><option value="net_60">Net 60</option><option value="cod">Cash on Delivery</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditSupplier(null) }} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-gray-900 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? 'Saving...' : editSupplier ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteModal({ open: false, supplier: null })} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Supplier</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{deleteModal.supplier?.name}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteModal({ open: false, supplier: null })} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteModal.supplier)} className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
