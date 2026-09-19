import { useState, useEffect, useCallback } from 'react'
import {
  Download,
  FileText,
  ShoppingCart,
  Users,
  ClipboardList,
  DollarSign,
  Package,
  Loader2,
  CheckCircle,
  Calendar,
  FileSpreadsheet,
  File,
} from 'lucide-react'
import api from '../../services/api'


function exportToCSV(data, filename) {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => `"${v === null || v === undefined ? '' : v}"`)
      .join(',')
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const EXPORT_OPTIONS = [
  {
    id: 'drugs',
    title: 'Drugs Inventory',
    description: 'Export all drugs with stock levels, prices, and expiry dates',
    icon: Package,
    color: 'bg-primary/10 text-primary',
    dataKey: 'drugs',
    filename: 'drugs_inventory.csv',
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'Export complete order history with items and payment details',
    icon: ShoppingCart,
    color: 'bg-blue-500/10 text-blue-500',
    dataKey: 'orders',
    filename: 'orders_history.csv',
  },
  {
    id: 'customers',
    title: 'Customers',
    description: 'Export customer list with contact info and purchase history',
    icon: Users,
    color: 'bg-purple-500/10 text-purple-500',
    dataKey: 'customers',
    filename: 'customers.csv',
  },
  {
    id: 'prescriptions',
    title: 'Prescriptions',
    description: 'Export prescriptions with items, dosage, and dispense status',
    icon: ClipboardList,
    color: 'bg-orange-500/10 text-orange-500',
    dataKey: 'prescriptions',
    filename: 'prescriptions.csv',
  },
  {
    id: 'expenses',
    title: 'Expenses',
    description: 'Export all expense records with categories and dates',
    icon: DollarSign,
    color: 'bg-red-500/10 text-red-500',
    dataKey: 'expenses',
    filename: 'expenses.csv',
  },
  {
    id: 'movements',
    title: 'Stock Movements',
    description: 'Export all stock movements including purchases, sales, and adjustments',
    icon: FileText,
    color: 'bg-cyan-500/10 text-cyan-500',
    dataKey: 'movements',
    filename: 'stock_movements.csv',
  },
]

export default function ExportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        api.get('/drugs'),
        api.get('/orders'),
        api.get('/customers'),
        api.get('/prescriptions'),
        api.get('/expenses'),
        api.get('/drug-movements'),
      ])
      setData({
        drugs: results[0].status === 'fulfilled' ? results[0].value.data.data || results[0].value.data : [],
        orders: results[1].status === 'fulfilled' ? results[1].value.data.data || results[1].value.data : [],
        customers: results[2].status === 'fulfilled' ? results[2].value.data.data || results[2].value.data : [],
        prescriptions: results[3].status === 'fulfilled' ? results[3].value.data.data || results[3].value.data : [],
        expenses: results[4].status === 'fulfilled' ? results[4].value.data.data || results[4].value.data : [],
        movements: results[5].status === 'fulfilled' ? results[5].value.data.data || results[5].value.data : [],
      })
    } catch {
      setData({})
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (option) => {
    setExporting(option.id)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      let exportData = data?.[option.dataKey] || []

      if (dateFrom) {
        exportData = exportData.filter((item) => {
          const date = item.created_at || item.date || item.expiry_date
          return date && date >= dateFrom
        })
      }
      if (dateTo) {
        exportData = exportData.filter((item) => {
          const date = item.created_at || item.date || item.expiry_date
          return date && date <= dateTo
        })
      }

      exportToCSV(exportData, option.filename)

      setToast({ type: 'success', message: `Export Complete! ${option.title} downloaded successfully.` })
      setTimeout(() => setToast(null), 3000)
    } catch {
      setToast({ type: 'error', message: 'Export failed. Please try again.' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setExporting(null)
    }
  }

  const getCount = (dataKey) => {
    return data?.[dataKey]?.length || 0
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse mb-4" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="flex gap-2">
                <div className="h-9 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-9 flex-1 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
            <p className="text-sm text-gray-500">Export reports and data in various formats.</p>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((option) => {
          const Icon = option.icon
          const count = getCount(option.dataKey)
          const isExporting = exporting === option.id

          return (
            <div
              key={option.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${option.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-dark">{option.title}</h3>
                  <p className="text-xs text-gray-400">{count} records</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{option.description}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(option)}
                  disabled={isExporting || count === 0}
                  className="btn-primary"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
                <button
                  disabled={isExporting || count === 0}
                  className="btn-secondary"
                >
                  <File className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
