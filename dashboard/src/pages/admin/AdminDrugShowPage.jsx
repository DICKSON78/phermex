import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Pill, Edit, Trash2, Loader2, Grid3X3, Building2, Users,
  Calendar, FileText, BarChart3, Shield, AlertTriangle, Package,
  CheckCircle2, Send, Copy, Archive, Tag, Globe, Hash, Layers, Zap,
  AlertCircle, Clock, Info,
} from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const STATUS_STYLES = {
  Active: 'badge badge-green',
  Discontinued: 'badge badge-gray',
  Recalled: 'badge badge-red',
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminDrugShowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drug, setDrug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)

  const fetchDrug = useCallback(async () => {
    try {
      const res = await api.get(`/admin/drug-database/${id}`)
      setDrug(res.data.data || res.data)
    } catch {
      setDrug(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDrug()
  }, [fetchDrug])

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/drug-database/${id}`)
    } catch {}
    navigate('/dashboard/drug-database')
  }

  const handleArchive = async () => {
    if (!drug) return
    try {
      const newStatus = drug.status === 'Discontinued' ? 'Active' : 'Discontinued'
      await api.patch(`/admin/drug-database/${id}`, { status: newStatus })
      setDrug({ ...drug, status: newStatus })
    } catch {}
  }

  const handleRecall = async () => {
    if (!drug) return
    try {
      await api.patch(`/admin/drug-database/${id}`, { status: 'Recalled' })
      setDrug({ ...drug, status: 'Recalled' })
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (!drug) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/drug-database" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Pill className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{drug.name}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">{drug.generic} — {drug.category} <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[drug.status] || 'bg-gray-100 text-gray-600'}`}>{drug.status}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/drug-database/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={() => setShowDelete(true)} className="btn-danger-outline">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</p>
              <p className="text-sm font-bold text-gray-900">{drug.category}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Manufacturer</p>
              <p className="text-sm font-bold text-gray-900">{drug.manufacturer}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
              <span className={STATUS_STYLES[drug.status] || 'badge badge-gray'}>{drug.status}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Used By</p>
              <p className="text-sm font-bold text-gray-900">{drug.usedBy || 0} <span className="text-xs font-normal text-gray-500">pharmacies</span></p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Form / Type</p>
              <p className="text-sm font-bold text-gray-900">{drug.form || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drug Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Drug Information</h3>
                <p className="text-xs text-gray-500">Core details and specifications</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Pill className="w-3.5 h-3.5" />
                  Name
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.name}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  Generic Name
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.generic}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Category
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.category}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  Form
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.form || '\u2014'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Info className="w-3.5 h-3.5" />
                  Strength
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.strength || '\u2014'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Manufacturer
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.manufacturer}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status
                </div>
                <span className={STATUS_STYLES[drug.status] || 'badge badge-gray'}>{drug.status}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg sm:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  Description
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{drug.description || 'No description available.'}</p>
              </div>
            </div>
          </div>

          {/* Regulatory Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Regulatory Information</h3>
                <p className="text-xs text-gray-500">Compliance and regulatory data</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  Controlled Status
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.controlledStatus || 'Non-Controlled'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  DEA Schedule
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.deaSchedule || 'None'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Hash className="w-3.5 h-3.5" />
                  NDC Number
                </div>
                <p className="text-sm font-semibold text-gray-900 font-mono">{drug.ndcNumber || '\u2014'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Approval Date
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(drug.approvalDate)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  Country of Origin
                </div>
                <p className="text-sm font-semibold text-gray-900">{drug.countryOfOrigin || '\u2014'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Quick Stats</h3>
                <p className="text-xs text-gray-500">Drug usage overview</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Pharmacies Using</span>
                <span className="text-sm font-semibold text-gray-900">{drug.usedBy || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Stock Status</span>
                <span className={`badge ${drug.status === 'Active' ? 'badge-green' : drug.status === 'Recalled' ? 'badge-red' : 'badge-gray'}`}>
                  {drug.status === 'Active' ? 'In Stock' : drug.status === 'Recalled' ? 'Recalled' : 'Unavailable'}
                </span>
                
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Form</span>
                <span className="text-sm font-semibold text-gray-900">{drug.form || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Recall History</span>
                <span className={`badge ${drug.status === 'Recalled' ? 'badge-red' : 'badge-green'}`}>
                  {drug.status === 'Recalled' ? 'Recalled' : 'None'}
                </span>
                
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Actions</h3>
                <p className="text-xs text-gray-500">Manage this drug entry</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/dashboard/drug-database/${id}/edit`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 text-[#0FD452]" />
                Edit Drug
              </button>
              <button
                onClick={handleArchive}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Archive className="w-4 h-4 text-amber-500" />
                {drug.status === 'Discontinued' ? 'Reactivate' : 'Archive'}
              </button>
              {drug.status !== 'Recalled' && (
                <button
                  onClick={handleRecall}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Recall Drug
                </button>
              )}
              <button
                onClick={() => navigate(`/dashboard/drug-database/${id}/pharmacies`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Users className="w-4 h-4 text-blue-500" />
                View Pharmacies
              </button>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-500" />
                Print Label
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Drug
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Drug"
        message={`Are you sure you want to delete "${drug.name}" from the database? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
