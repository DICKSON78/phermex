import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom'
import {
  Clock, Eye, AlertTriangle, Search, ChevronLeft, ChevronRight, X,
  FolderOpen, Tag, Package,
} from 'lucide-react'
import api from '../../services/api'
import { currentBase } from '../../utils/roles'
import { useLanguage } from '../../contexts/LanguageContext'

const TODAY = new Date()

function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  const exp = new Date(dateStr)
  const diff = Math.ceil((exp - TODAY) / (1000 * 60 * 60 * 24))
  return diff
}



export default function ExpiringSoonPage() {
  const navigate = useNavigate()
  const base = currentBase()
  const { t } = useLanguage()
  const FILTER_TABS = [
    { key: '7', label: t('inventory.expiring.days7') },
    { key: '30', label: t('inventory.expiring.days30') },
    { key: '90', label: t('inventory.expiring.days90') },
    { key: 'expired', label: t('inventory.expiring.alreadyExpired') },
  ]
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
      setDrugs([])
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
    { label: t('inventory.expiring.expiring7'), value: expiring7, color: 'bg-red-100 text-red-600', iconColor: 'text-red-500' },
    { label: t('inventory.expiring.expiring30'), value: expiring30, color: 'bg-yellow-100 text-yellow-600', iconColor: 'text-yellow-500' },
    { label: t('inventory.expiring.expiring90'), value: expiring90, color: 'bg-orange-100 text-orange-600', iconColor: 'text-orange-500' },
    { label: t('inventory.expiring.valueAtRisk'), value: `TZS ${totalValueAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'bg-purple-100 text-purple-600', iconColor: 'text-purple-500' },
  ]

  const handleMarkExpired = (drug) => {
    setDrugs((prev) => prev.filter((d) => d.id !== drug.id))
    setMarkExpiredModal(null)
  }

  const getDaysBadge = (days) => {
    if (days < 0) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{t('inventory.drugs.expired')}</span>
    if (days <= 7) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{days}{t('inventory.expiring.daysSuffix')}</span>
    if (days <= 30) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{days}{t('inventory.expiring.daysSuffix')}</span>
    if (days <= 90) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{days}{t('inventory.expiring.daysSuffix')}</span>
    return <span className="text-sm text-gray-600">{days}{t('inventory.expiring.daysSuffix')}</span>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('inventory.expiring.title')}</h1>
            <p className="text-sm text-gray-500">{t('inventory.expiring.subtitle')}</p>
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
              placeholder={t('inventory.expiring.searchPlaceholder')}
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('products.drugName')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell"><div className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('products.category')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell"><div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.expiring.batch')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('products.stock')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('products.expiryDate')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.expiring.daysLeft')}</span></div></th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell"><div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('inventory.expiring.value')}</span></div></th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"><div className="flex items-center gap-1.5 justify-end"><Eye className="w-3.5 h-3.5 text-[#0FD452]" /><span>{t('common.actions')}</span></div></th>
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
                    <p>{t('inventory.expiring.noDrugsInRange')}</p>
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
                            title={t('inventory.expiring.markExpiredTitle')}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`${base}/drugs/${drug.id}`)}
                            className="btn-icon-primary"
                            title={t('inventory.expiring.viewDrug')}
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
              {t('inventory.pagination.showing')} {(currentPage - 1) * pageSize + 1} {t('inventory.pagination.to')}{' '}
              {Math.min(currentPage * pageSize, filtered.length)} {t('inventory.pagination.of')} {filtered.length}
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
                <h3 className="text-lg font-semibold text-[#000F14]">{t('inventory.expiring.markExpiredTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {t('inventory.expiring.markPrefix')} <strong>{markExpiredModal.name}</strong> (Batch: {markExpiredModal.batch_number}) {t('inventory.expiring.markAsExpired')}? {t('inventory.expiring.markWillAdjust')} ({markExpiredModal.quantity} {t('inventory.expiring.units')}).
              </p>
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 mb-4">
                {t('inventory.expiring.stockAdjustedNote')}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setMarkExpiredModal(null)}
                  className="btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleMarkExpired(markExpiredModal)}
                  className="btn-danger"
                >
                  {t('inventory.expiring.markExpiredButton')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
