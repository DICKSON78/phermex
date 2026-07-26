import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, DollarSign, Edit, Trash2, Loader2, Calendar, Clock,
  CreditCard, Hash, FileText, BarChart3, Send, AlertCircle, CheckCircle2,
  Building2, Receipt, ArrowUpRight, Zap, AlertTriangle, StickyNote,
  Globe, Shield, Ban,
} from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const STATUS_STYLES = {
  Paid: 'badge badge-green',
  Pending: 'badge badge-yellow',
  Overdue: 'badge badge-red',
  Void: 'badge badge-gray',
}

function formatCurrency(amount) {
  if (amount == null) return '\u2014'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

function invoiceAge(createdAt) {
  if (!createdAt) return '\u2014'
  const created = new Date(createdAt)
  const now = new Date()
  const days = Math.floor((now - created) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export default function AdminRevenueShowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await api.get(`/admin/revenue/${id}`)
      setInvoice(res.data.data || res.data)
    } catch {
      setInvoice(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/revenue/${id}`)
    } catch {}
    navigate('/admin/revenue')
  }

  const handleMarkPaid = async () => {
    if (!invoice) return
    setMarkingPaid(true)
    try {
      await api.patch(`/admin/revenue/${id}`, {
        status: 'Paid',
        paidDate: new Date().toISOString().split('T')[0],
      })
      setInvoice({
        ...invoice,
        status: 'Paid',
        paidDate: new Date().toISOString().split('T')[0],
      })
    } catch {} finally {
      setMarkingPaid(false)
    }
  }

  const handleSendReminder = async () => {
    try {
      await api.post(`/admin/revenue/${id}/reminder`)
    } catch {}
  }

  const handleVoidInvoice = async () => {
    if (!invoice) return
    try {
      await api.patch(`/admin/revenue/${id}`, { status: 'Void' })
      setInvoice({ ...invoice, status: 'Void' })
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  if (!invoice) return null

  const daysToDue = daysUntil(invoice.dueDate)
  const age = invoiceAge(invoice.createdAt)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/revenue" className="btn-ghost">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">{invoice.pharmacy} — Due {invoice.dueDate} <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[invoice.status] || 'bg-gray-100 text-gray-600'}`}>{invoice.status}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/admin/revenue/${id}/edit`} className="btn-secondary">
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
              <DollarSign className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
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
              <span className={STATUS_STYLES[invoice.status] || 'badge badge-gray'}>{invoice.status}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Date</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid Date</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(invoice.paidDate)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Method</p>
              <p className="text-sm font-bold text-gray-900">{invoice.paymentMethod || '\u2014'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Invoice Information</h3>
                <p className="text-xs text-gray-500">Billing details and amounts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Hash className="w-3.5 h-3.5" />
                  Invoice Number
                </div>
                <p className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Pharmacy
                </div>
                <p className="text-sm font-semibold text-gray-900">{invoice.pharmacy}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Amount
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  Currency
                </div>
                <p className="text-sm font-semibold text-gray-900">{invoice.currency || 'TZS'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status
                </div>
                <span className={STATUS_STYLES[invoice.status] || 'badge badge-gray'}>{invoice.status}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Receipt className="w-3.5 h-3.5" />
                  Tax
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.tax || 0)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Total
                </div>
                <p className="text-sm font-bold text-[#0FD452]">{formatCurrency(invoice.total || invoice.amount)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Billing Period
                </div>
                <p className="text-sm font-semibold text-gray-900">{invoice.billingPeriod || '\u2014'}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Payment Information</h3>
                <p className="text-xs text-gray-500">Transaction and payment details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  Payment Method
                </div>
                <p className="text-sm font-semibold text-gray-900">{invoice.paymentMethod || '\u2014'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Hash className="w-3.5 h-3.5" />
                  Transaction ID
                </div>
                <p className="text-sm font-semibold text-gray-900 font-mono">{invoice.transactionId || '\u2014'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  Paid Date
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.paidDate)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Due Date
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  Payment Gateway
                </div>
                <p className="text-sm font-semibold text-gray-900">{invoice.paymentGateway || '\u2014'}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-lg flex items-center justify-center">
                  <StickyNote className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Notes</h3>
                  <p className="text-xs text-gray-500">Additional notes for this invoice</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
              </div>
            </div>
          )}
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
                <p className="text-xs text-gray-500">Invoice insights</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Days Until Due</span>
                <span className="text-sm font-semibold text-gray-900">
                  {daysToDue != null
                    ? invoice.status === 'Paid'
                      ? 'Paid'
                      : daysToDue > 0
                        ? `${daysToDue} days`
                        : 'Overdue'
                    : '\u2014'}
                </span>
                
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Payment Status</span>
                <span className={STATUS_STYLES[invoice.status] || 'badge badge-gray'}>{invoice.status}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Invoice Age</span>
                <span className="text-sm font-semibold text-gray-900">{age}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Billing Period</span>
                <span className="text-sm font-semibold text-gray-900">{invoice.billingPeriod || '\u2014'}</span>
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
                <p className="text-xs text-gray-500">Manage this invoice</p>
              </div>
            </div>
            <div className="space-y-3">
              {invoice.status !== 'Paid' && invoice.status !== 'Void' && (
                <button
                  onClick={handleMarkPaid}
                  disabled={markingPaid}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#0FD452]/10 hover:bg-[#0FD452]/20 rounded-lg text-sm font-medium text-[#0FD452] transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {markingPaid ? 'Marking...' : 'Mark as Paid'}
                </button>
              )}
              {invoice.status !== 'Paid' && invoice.status !== 'Void' && (
                <button
                  onClick={handleSendReminder}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  <Send className="w-4 h-4 text-blue-500" />
                  Send Reminder
                </button>
              )}
              <button
                onClick={() => navigate(`/admin/revenue/${id}/edit`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 text-[#0FD452]" />
                Edit Invoice
              </button>
              {invoice.status !== 'Void' && (
                <button
                  onClick={handleVoidInvoice}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  <Ban className="w-4 h-4 text-amber-500" />
                  Void Invoice
                </button>
              )}
              <button
                onClick={() => setShowDelete(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${invoice.invoiceNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
