import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Mail, Phone, MapPin, Building, CreditCard, Package, TrendingUp } from 'lucide-react'
import api from '../../services/api'

export default function SupplierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await api.get(`/suppliers/${id}`)
        setSupplier(res.data.supplier || res.data)
      } catch {
        setSupplier(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSupplier()
  }, [id])

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-200 rounded-xl animate-pulse" /></div>
  if (!supplier) return <div className="p-6 text-center text-gray-500">Supplier not found</div>

  const s = supplier
  const renderStars = (r) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} className={`w-5 h-5 ${i <= Math.round(r) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}
      <span className="ml-2 text-lg font-medium text-dark">{parseFloat(r).toFixed(1)}</span>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/owner/suppliers')} className="btn-ghost">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#0FD452]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Details</h1>
          <p className="text-sm text-gray-500">View supplier profile and order history.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-dark">{s.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.is_active ? 'Active' : 'Inactive'}
              </span>
              
            </div>
            {renderStars(s.rating)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-dark mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><Building className="w-4 h-4 text-primary" /></div><div><p className="text-xs text-gray-500">Contact Person</p><p className="text-sm font-medium text-dark">{s.contact_person || '—'}</p></div></div>
              <div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><Mail className="w-4 h-4 text-primary" /></div><div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium text-dark">{s.email || '—'}</p></div></div>
              <div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><Phone className="w-4 h-4 text-primary" /></div><div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-dark">{s.phone || '—'}</p></div></div>
              <div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><MapPin className="w-4 h-4 text-primary" /></div><div><p className="text-xs text-gray-500">Location</p><p className="text-sm font-medium text-dark">{s.city || '—'}, {s.country}</p></div></div>
              <div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><CreditCard className="w-4 h-4 text-primary" /></div><div><p className="text-xs text-gray-500">TIN / Tax ID</p><p className="text-sm font-medium text-dark">{s.tax_id || '—'}</p></div></div>
              <div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><CreditCard className="w-4 h-4 text-primary" /></div><div><p className="text-xs text-gray-500">Payment Terms</p><p className="text-sm font-medium text-dark capitalize">{(s.payment_terms || '').replace('_', ' ')}</p></div></div>
            </div>
            {s.address && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-xs text-gray-500 mb-1">Address</p><p className="text-sm text-dark">{s.address}</p></div>}
            {s.notes && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-sm text-dark">{s.notes}</p></div>}
          </div>

          {s.purchaseOrders && s.purchaseOrders.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-dark mb-4">Recent Purchase Orders</h2>
              <div className="space-y-3">
                {s.purchaseOrders.map(po => (
                  <div key={po.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div><p className="text-sm font-medium text-dark">{po.order_number}</p><p className="text-xs text-gray-500">{po.order_date}</p></div>
                    <div className="text-right"><p className="text-sm font-medium text-dark">TZS {parseFloat(po.total).toFixed(2)}</p><span className={`text-xs px-2 py-0.5 rounded-full ${po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{po.status}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-dark mb-4">Purchase Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">Total Orders<span className="text-lg font-bold text-dark">{s.total_orders}</span></span></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">Total Purchased<span className="text-lg font-bold text-dark">${parseFloat(s.total_purchased || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">Avg Order Value<span className="text-lg font-bold text-dark">${s.total_orders > 0 ? (parseFloat(s.total_purchased || 0) / s.total_orders).toFixed(2) : '0.00'}</span></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
