import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import {
  Clock, Eye, AlertTriangle, Search, ChevronLeft, ChevronRight, X,
  FolderOpen, Tag, Package,
} from 'lucide-react'
import api from '../../services/api'

const TODAY = new Date()

function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  const exp = new Date(dateStr)
  const diff = Math.ceil((exp - TODAY) / (1000 * 60 * 60 * 24))
  return diff
}

const SAMPLE_EXPIRING = [
  { id: 1, name: 'Omeprazole 20mg', category: 'Antacids', batch_number: 'BATCH-006', quantity: 120, expiry_date: '2026-07-30', buying_price: 3.50 },
  { id: 2, name: 'Cetirizine 10mg', category: 'Antihistamines', batch_number: 'BATCH-005', quantity: 200, expiry_date: '2026-08-10', buying_price: 2.00 },
  { id: 3, name: 'Metformin 850mg', category: 'Antidiabetics', batch_number: 'BATCH-003', quantity: 8, expiry_date: '2026-08-05', buying_price: 4.00 },
  { id: 4, name: 'Amoxicillin 500mg', category: 'Antibiotics', batch_number: 'BATCH-001', quantity: 150, expiry_date: '2026-07-25', buying_price: 5.00 },
  { id: 5, name: 'Azithromycin 250mg', category: 'Antibiotics', batch_number: 'BATCH-008', quantity: 5, expiry_date: '2026-10-05', buying_price: 8.00 },
  { id: 6, name: 'Insulin Glargine', category: 'Antidiabetics', batch_number: 'BATCH-011', quantity: 10, expiry_date: '2026-07-22', buying_price: 25.00 },
  { id: 7, name: 'Vitamin C 1000mg', category: 'Supplements', batch_number: 'BATCH-010', quantity: 250, expiry_date: '2026-09-10', buying_price: 3.00 },
  { id: 8, name: 'Paracetamol 500mg', category: 'Analgesics', batch_number: 'BATCH-002', quantity: 300, expiry_date: '2026-07-19', buying_price: 1.50 },
  { id: 9, name: 'Ibuprofen 400mg', category: 'Analgesics', batch_number: 'BATCH-007', quantity: 180, expiry_date: '2026-12-15', buying_price: 2.50 },
]

const FILTER_TABS = [
  { key: '7', label: '7 Days' },
  { key: '30', label: '30 Days' },
  { key: '90', label: '90 Days' },
  { key: 'expired', label: 'Already Expired' },
]

export default function ExpiringSoonPage() {
  const navigate = useNavigate()
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState('30')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [markExpiredModal, setMarkExpiredModal] = useState(null)
  const pageSize = 10

  useEffect(() => {
    fetchDrugs()
  }, [])

  const fetchDrugs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/drugs', { params: { expiry: 'expiring_soon' } })
      setDrugs(toArray(res.data))
    } catch {
      setDrugs(SAMPLE_EXPIRING)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredByTab = (list) => {
    if (filterTab === 'expired') return list.filter((d) => daysUntil(d.expiry_date) < 0)
    const maxDays = parseInt(filterTab, 10)
    return list.filter((d) => {
      const days = daysUntil(d.expiry_date)
      return days >= 0 && days <= maxDays
    })
  }

  const filtered = getFilteredByTab(drugs).filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.category && d.category.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const expiring7 = drugs.filter((d) => { const days = daysUntil(d.expiry_date); return days >= 0 && days <= 7 }).length
  const expiring30 = drugs.filter((d) => { const days = daysUntil(d.expiry_date); return days >= 0 && days <= 30 }).length
  const expiring90 = drugs.filter((d) => { const days = daysUntil(d.expiry_date); return days >= 0 && days <= 90 }).length
  const totalValueAtRisk = drugs
    .filter((d) => daysUntil(d.expiry_date) <= 90)
    .reduce((sum, d) => sum + (d.quantity || 0) * (d.buying_price || 0), 0)

  const statCards = [
    { label: 'Expiring 7 Days', value: expiring7, color: 'bg-red-100 text-red-600', iconColor: 'text-red-500' },
    { label: 'Expiring 30 Days', value: expiring30, color: 'bg-yellow-100 text-yellow-600', iconColor: 'text-yellow-500' },
    { label: 'Expiring 90 Days', value: expiring90, color: 'bg-orange-100 text-orange-600', iconColor: 'text-orange-500' },
    { label: 'Total Value at Risk', value: `TZS ${totalValueAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'bg-purple-100 text-purple-600', iconColor: 'text-purple-500' },
  ]

  const handleMarkExpired = (drug) => {
    setDrugs((prev) => prev.filter((d) => d.id !== drug.id))
    setMarkExpiredModal(null)
  }

  const getDaysBadge = (days) => {
    if (days < 0) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>
    if (days <= 7) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{days}d</span>
    if (days <= 30) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{days}d</span>
    if (days <= 90) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{days}d</span>
    return <span className="text-sm text-gray-600">{days}d</span>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expiring Soon</h1>
            <p className="text-sm text-gray-500">Drugs approaching expiration date.</p>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <Clock className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-[#000F14]">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 px-4 py-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search by drug name or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#000F14] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setFilterTab(tab.key); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterTab === tab.key
                    ? 'bg-[#0FD452] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Drug Name</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell"><div className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-[#0FD452]" /><span>Category</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell"><div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#0FD452]" /><span>Batch</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Stock</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#0FD452]" /><span>Expiry Date</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-[#0FD452]" /><span>Days Left</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>Value</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Eye className="w-3.5 h-3.5 text-[#0FD452]" /><span>Actions</span></div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-[#0FD452] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No expiring drugs in this range</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((drug) => {
                  const days = daysUntil(drug.expiry_date)
                  const value = (drug.quantity || 0) * (drug.buying_price || 0)
                  return (
                    <tr
                      key={drug.id}
                      className={`transition-colors hover:bg-[#0FD452]/5 ${days < 0 ? 'bg-red-50/50' : days <= 7 ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10"><Package className="h-4 w-4 text-[#0FD452]" /></div>
                          <p className="text-sm font-medium text-[#000F14]">{drug.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{typeof drug.category === 'object' ? drug.category?.name : (drug.category || '—')}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-500 hidden lg:table-cell">{drug.batch_number || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{drug.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{drug.expiry_date}</td>
                      <td className="px-6 py-4">{getDaysBadge(days)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#000F14] hidden md:table-cell">TZS {value.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setMarkExpiredModal(drug)}
                            className="btn-icon-red"
                            title="Mark as Expired"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/owner/drugs/${drug.id}`)}
                            className="btn-icon-primary"
                            title="View Drug"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

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

      {markExpiredModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMarkExpiredModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ margin: 0, padding: '16px', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#000F14]">Mark as Expired</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to mark <strong>{markExpiredModal.name}</strong> (Batch: {markExpiredModal.batch_number}) as expired? This will adjust the stock quantity ({markExpiredModal.quantity} units).
              </p>
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 mb-4">
                Stock will be adjusted to 0 for this batch.
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setMarkExpiredModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMarkExpired(markExpiredModal)}
                  className="btn-danger"
                >
                  Mark Expired
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
