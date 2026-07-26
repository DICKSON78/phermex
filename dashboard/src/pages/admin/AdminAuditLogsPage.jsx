import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Clock,
  User,
  FileText,
  Tag,
  Globe,
  Zap,
  Hash,
} from 'lucide-react'
import api from '../../services/api'

const MODEL_TYPES = ['User', 'Pharmacy', 'Drug', 'Order', 'Prescription', 'Customer']

const ACTION_STYLES = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-gray-100 text-gray-600',
}

const ROLE_STYLES = {
  admin: 'bg-red-100 text-red-700',
  owner: 'bg-primary/10 text-primary',
  pharmacist: 'bg-blue-100 text-blue-700',
  cashier: 'bg-purple-100 text-purple-700',
  delivery: 'bg-orange-100 text-orange-700',
  customer: 'bg-gray-100 text-gray-600',
}

function DiffView({ oldValues, newValues }) {
  const allKeys = [
    ...new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]),
  ]

  if (allKeys.length === 0) {
    return <p className="text-xs text-gray-400 italic">No changes recorded</p>
  }

  return (
    <div className="space-y-1">
      {allKeys.map((key) => {
        const oldVal = oldValues?.[key]
        const newVal = newValues?.[key]
        const isRemoved = oldVal !== undefined && newVal === undefined
        const isAdded = oldVal === undefined && newVal !== undefined
        const isChanged = oldVal !== undefined && newVal !== undefined && oldVal !== newVal

        return (
          <div key={key} className="flex items-start gap-2 text-xs font-mono">
            <span className="text-gray-500 min-w-[80px] shrink-0">{key}:</span>
            {isRemoved && (
              <span className="text-red-600 line-through bg-red-50 px-1 rounded">
                {String(oldVal)}
              </span>
              
            )}
            {isAdded && (
              <span className="text-green-600 bg-green-50 px-1 rounded">
                {String(newVal)}
              </span>
              
            )}
            {isChanged && (
              <>
                <span className="text-red-600 line-through bg-red-50 px-1 rounded">
                  {String(oldVal)}
                </span>
                
                <span className="text-gray-400">{'\u2192'}</span>
                <span className="text-green-600 bg-green-50 px-1 rounded">
                  {String(newVal)}
                </span>
                
              </>
            )}
            {!isRemoved && !isAdded && !isChanged && (
              <span className="text-gray-600 bg-gray-50 px-1 rounded">{String(newVal)}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function exportAuditToCSV(logs) {
  const headers = 'ID,Timestamp,User,Role,Action,Model Type,Model ID,IP Address'
  const rows = logs.map((log) =>
    [
      log.id,
      new Date(log.created_at).toISOString(),
      `"${log.user?.name || ''}"`,
      log.user?.role || '',
      log.action,
      log.model_type,
      log.model_id,
      log.ip_address || '',
    ].join(',')
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'audit_logs.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState(null)
  const pageSize = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('action', search)
      if (userFilter) params.append('user_id', userFilter)
      if (modelFilter) params.append('model_type', modelFilter)
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)

      const response = await api.get(`/admin/audit-logs?${params.toString()}`)
      setLogs(response.data.data || response.data || [])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [search, userFilter, modelFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, userFilter, modelFilter, dateFrom, dateTo])

  const uniqueUsers = [...new Set(logs.map((l) => l.user?.name).filter(Boolean))]

  const filteredLogs = logs.filter((log) => {
    if (search && !log.action.toLowerCase().includes(search.toLowerCase())) return false
    if (userFilter && log.user?.name !== userFilter) return false
    if (modelFilter && log.model_type !== modelFilter) return false
    return true
  })

  const totalPages = Math.ceil(filteredLogs.length / pageSize)
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const formatTimestamp = (ts) => {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500">Track all system activities and user actions.</p>
          </div>
        </div>
        <button
          onClick={() => exportAuditToCSV(filteredLogs)}
          className="btn-secondary"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Users</option>
            {uniqueUsers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Model Types</option>
            {MODEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Timestamp</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>User</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Action</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Model Type</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Model ID</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Changes</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>IP Address</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLogs.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  isExpanded={expandedRow === log.id}
                  onToggle={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  formatTimestamp={formatTimestamp}
                />
              ))}
            </tbody>
          </table>
        </div>

        {paginatedLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">No audit logs found</h3>
            <p className="text-gray-500 text-center max-w-sm">
              No logs match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
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
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
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

function LogRow({ log, isExpanded, onToggle, formatTimestamp }) {
  const hasChanges = log.old_values || log.new_values

  return (
    <>
      <tr className="hover:bg-[#0FD452]/5 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {formatTimestamp(log.created_at)}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-dark">{log.user?.name}</p>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  ROLE_STYLES[log.user?.role] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {log.user?.role}
              </span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {log.action}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-dark font-medium">{log.model_type}</td>
        <td className="px-6 py-4 text-sm text-gray-600 font-mono">#{log.model_id}</td>
        <td className="px-6 py-4">
          {hasChanges ? (
            <button className="text-xs text-primary hover:text-primary-600 font-medium flex items-center gap-1">
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              View changes
            </button>
          ) : (
            <span className="text-xs text-gray-400">--</span>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.ip_address || '--'}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="ml-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase">Change Details</span>
              </div>
              <DiffView oldValues={log.old_values} newValues={log.new_values} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
