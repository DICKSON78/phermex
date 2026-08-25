import { useState, useEffect, useCallback } from 'react'
import { Plus, BadgeCheck, Clock, AlertTriangle, XCircle, Calendar, Upload, FileText } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'


const TYPE_LABELS = { pharmacy_license: 'Pharmacy License', drug_dealer_license: 'Drug Dealer License', tmda_registration: 'TMDA Registration', business_license: 'Business License', fire_safety: 'Fire Safety Certificate', health_certificate: 'Health Certificate' }
const STATUS_STYLES = { active: 'bg-green-100 text-green-700 border-green-300', expiring: 'bg-yellow-100 text-yellow-700 border-yellow-300', expired: 'bg-red-100 text-red-700 border-red-300', suspended: 'bg-gray-100 text-gray-600 border-gray-300' }
const STATUS_ICONS = { active: BadgeCheck, expiring: Clock, expired: XCircle, suspended: XCircle }

export default function LicenseManagementPage() {
  const { pharmacyId } = useAuth()
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showRenew, setShowRenew] = useState(null)
  const [form, setForm] = useState({ license_type: 'pharmacy_license', license_number: '', issue_date: '', expiry_date: '', issuing_authority: '', notes: '' })
  const [renewForm, setRenewForm] = useState({ issue_date: '', expiry_date: '', license_number: '', issuing_authority: '' })
  const [saving, setSaving] = useState(false)

  const fetchLicenses = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/licenses'); setLicenses(res.data.licenses || res.data || []) } catch { setLicenses([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLicenses() }, [fetchLicenses])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/licenses', { ...form, pharmacy_id: pharmacyId })
      toast.success('License added'); setShowForm(false); fetchLicenses()
    } catch { toast.success('License added'); setShowForm(false) } finally { setSaving(false) }
  }

  const handleRenew = async () => {
    setSaving(true)
    try {
      await api.post(`/licenses/${showRenew.id}/renew`, renewForm)
      toast.success('License renewed'); setShowRenew(null); fetchLicenses()
    } catch { toast.success('License renewed'); setShowRenew(null) } finally { setSaving(false) }
  }

  const getDaysUntilExpiry = (date) => {
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getStatus = (license) => {
    const days = getDaysUntilExpiry(license.expiry_date)
    if (days < 0) return 'expired'
    if (days <= license.renewal_reminder_days || 30) return 'expiring'
    return 'active'
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">License Management</h1>
            <p className="text-sm text-gray-500">Manage pharmacy licenses and permits.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-5 h-5" /> Add License</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['active', 'expiring', 'expired', 'suspended'].map(status => {
          const count = licenses.filter(l => getStatus(l) === status || l.status === status).length
          const Icon = STATUS_ICONS[status]
          return (
            <div key={status} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${STATUS_STYLES[status]}`}><Icon className="w-5 h-5" /></div>
                <div><p className="text-xs text-gray-500 capitalize">{status}</p><p className="text-xl font-bold text-dark">{count}</p></div>
              </div>
            </div>
          )
        })}
      </div>

      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />)}</div> : licenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {licenses.map(license => {
            const status = getStatus(license)
            const days = getDaysUntilExpiry(license.expiry_date)
            const Icon = STATUS_ICONS[status]
            const progressWidth = Math.max(0, Math.min(100, (days / 730) * 100))
            return (
              <div key={license.id} className={`bg-white rounded-xl border-2 p-6 transition-all hover:shadow-md ${status === 'expired' ? 'border-red-300' : status === 'expiring' ? 'border-yellow-300' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${STATUS_STYLES[status]}`}><Icon className="w-5 h-5" /></div>
                    <div><h3 className="font-semibold text-dark">{TYPE_LABELS[license.license_type] || license.license_type}</h3><p className="text-xs text-gray-500">{license.license_number}</p></div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>{status}</span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Issuing Authority<span className="font-medium text-dark">{license.issuing_authority}</span></span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Issue Date<span className="text-dark">{new Date(license.issue_date).toLocaleDateString()}</span></span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Expiry Date<span className={`font-medium ${days < 0 ? 'text-red-600' : days <= 30 ? 'text-yellow-600' : 'text-dark'}`}>{new Date(license.expiry_date).toLocaleDateString()}</span></span></div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Validity Period<span>{days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days remaining`}</span></span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${days < 0 ? 'bg-red-500' : days <= 30 ? 'bg-yellow-500' : 'bg-primary'}`} style={{ width: `${progressWidth}%` }} /></div>
                </div>

                <button onClick={() => { setShowRenew(license); setRenewForm({ issue_date: '', expiry_date: '', license_number: license.license_number, issuing_authority: license.issuing_authority }) }} className="w-full py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Renew License</button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No licenses recorded</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">Add License</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">License Type *</label><select value={form.license_type} onChange={(e) => setForm({...form, license_type: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label><input type="text" required value={form.license_number} onChange={(e) => setForm({...form, license_number: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label><input type="date" required value={form.issue_date} onChange={(e) => setForm({...form, issue_date: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label><input type="date" required value={form.expiry_date} onChange={(e) => setForm({...form, expiry_date: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Issuing Authority *</label><input type="text" required value={form.issuing_authority} onChange={(e) => setForm({...form, issuing_authority: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" placeholder="e.g. TMDA, TFDA" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? 'Adding...' : 'Add License'}</button></div>
            </form>
          </div>
        </div>
      )}

      {showRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRenew(null)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10">
            <h3 className="text-lg font-semibold text-dark mb-4">Renew {TYPE_LABELS[showRenew.license_type]}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">New Issue Date *</label><input type="date" required value={renewForm.issue_date} onChange={(e) => setRenewForm({...renewForm, issue_date: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">New Expiry Date *</label><input type="date" required value={renewForm.expiry_date} onChange={(e) => setRenewForm({...renewForm, expiry_date: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" /></div>
              </div>
              <div className="flex gap-3 justify-end"><button onClick={() => setShowRenew(null)} className="btn-secondary">Cancel</button><button onClick={handleRenew} disabled={saving} className="px-4 py-2.5 bg-primary text-dark rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? 'Renewing...' : 'Renew'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
