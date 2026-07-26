import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Pill,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Loader2,
  AlertTriangle,
  Hash,
  User,
  Building,
  Package,
  Activity,
  Calendar,
} from 'lucide-react'


const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  dispensed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_FILTERS = ['All', 'Pending', 'Dispensed', 'Cancelled']

export default function PrescriptionListPage() {
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await api.get('/prescriptions')
        const raw = toArray(res.data)
        setPrescriptions(raw.map((rx) => ({
          id: rx.id,
          code: rx.rx_code || rx.code || `RX-${rx.id}`,
          doctor: rx.doctor_name || rx.doctor || '—',
          hospital: rx.hospital_name || rx.hospital || '—',
          patient: rx.patient_name || rx.patient || '—',
          itemsCount: Array.isArray(rx.items) ? rx.items.length : (rx.itemsCount ?? rx.items_count ?? 0),
          status: rx.status || 'pending',
          date: rx.created_at || rx.date || '—',
        })))
      } catch {
        setPrescriptions([])
      } finally {
        setLoading(false)
      }
    }
    fetchPrescriptions()
  }, [])

  const filtered = prescriptions.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.doctor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === 'All' || p.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter((p) => p.status === 'pending').length,
    dispensedToday: prescriptions.filter(
      (p) => p.status === 'dispensed' && p.date === new Date().toISOString().split('T')[0]
    ).length,
    cancelled: prescriptions.filter((p) => p.status === 'cancelled').length,
  }

  const statCards = [
    { label: 'Total', value: stats.total, icon: FileText, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500/10 text-yellow-600' },
    { label: 'Dispensed Today', value: stats.dispensedToday, icon: CheckCircle, color: 'bg-green-500/10 text-green-600' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'bg-red-500/10 text-red-500' },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
            <p className="text-sm text-gray-500">Manage patient prescriptions and dispensing.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/owner/prescriptions/new')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Prescription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{s.label}</p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 px-4 py-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              placeholder="Search by RX code, doctor, or patient..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452] transition"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === f
                    ? 'bg-[#0FD452] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>RX Code</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Doctor</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Hospital</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Patient</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Items</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Date</span>
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No prescriptions found</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((rx) => (
                  <tr key={rx.id} className="transition-colors hover:bg-[#0FD452]/5 cursor-pointer" onClick={() => navigate(`/owner/prescriptions/${rx.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <FileText className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="font-medium text-gray-900">{rx.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700">{rx.doctor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{rx.hospital}</td>
                    <td className="px-6 py-4 text-gray-700">{rx.patient}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium text-gray-900">
                        {rx.itemsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_STYLES[rx.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 hidden lg:table-cell">{rx.date}</td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/owner/prescriptions/${rx.id}`)}
                          className="btn-icon-primary"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {rx.status === 'pending' && (
                          <button
                            onClick={() => navigate(`/owner/prescriptions/${rx.id}`)}
                            className="btn-icon-primary"
                            title="Dispense"
                          >
                            <Pill className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-ghost"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page
                if (totalPages <= 5) page = i + 1
                else if (currentPage <= 3) page = i + 1
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                else page = currentPage - 2 + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded text-xs font-medium transition ${
                      currentPage === page
                        ? 'bg-[#0FD452] text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-ghost"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
