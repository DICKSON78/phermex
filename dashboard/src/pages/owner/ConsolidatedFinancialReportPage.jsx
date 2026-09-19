import { useState, useEffect } from 'react'
import { Loader2, Building2, TrendingUp, TrendingDown, Percent, ShoppingBag, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reports } from '../../services/api'

function fmt(amount) {
  return Number(amount || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })
}

export default function ConsolidatedFinancialReportPage() {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ totals: {}, pharmacies: [] })
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await reports.consolidatedFinancial({ date_from: dateFrom, date_to: dateTo })
      setData({
        totals: res.data?.totals || {},
        pharmacies: res.data?.pharmacies || [],
      })
    } catch {
      showToast('Could not load consolidated report', 'error')
      setData({ totals: {}, pharmacies: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const t = data.totals
  const chartData = data.pharmacies.map((p) => ({
    name: p.pharmacy_name.length > 14 ? p.pharmacy_name.slice(0, 14) + '…' : p.pharmacy_name,
    Revenue: p.revenue,
    Expenses: p.expenses,
  }))

  const statCards = [
    { label: 'Total Revenue', value: fmt(t.revenue), icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'Total Expenses', value: fmt(t.expenses), icon: TrendingDown, color: 'text-red-600 bg-red-100' },
    { label: 'Net Profit', value: fmt(t.net_profit), icon: Building2, color: 'text-blue-600 bg-blue-100' },
    { label: 'Profit Margin', value: `${t.profit_margin ?? 0}%`, icon: Percent, color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{toast.msg}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consolidated Financial Report</h1>
          <p className="text-gray-500 text-sm mt-1">Revenue, expenses and profit across all your pharmacies</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <button onClick={fetchData} disabled={loading} className="px-5 py-2.5 bg-[#000F14] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2015] disabled:opacity-50">
            {loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#0FD452]" /></div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><ShoppingBag className="w-4 h-4 text-gray-400" /> {t.pharmacies_count} pharmacies</div>
            <div className="flex items-center gap-2 text-gray-600"><ShoppingBag className="w-4 h-4 text-gray-400" /> {t.orders_count} paid orders</div>
            <div className="flex items-center gap-2 text-gray-600"><Users className="w-4 h-4 text-gray-400" /> {t.customers_count} customers</div>
          </div>

          {data.pharmacies.length >= 2 && chartData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Revenue vs Expenses by Pharmacy</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`)} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="Revenue" fill="#0FD452" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Pharmacy</th>
                    <th className="text-center px-5 py-3 font-medium text-gray-500">Orders</th>
                    <th className="text-center px-5 py-3 font-medium text-gray-500">Customers</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Expenses</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Revenue</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Net Profit</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pharmacies.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No paid activity in this period</td></tr>
                  ) : data.pharmacies.map((p) => (
                    <tr key={p.pharmacy_id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{p.pharmacy_name}</td>
                      <td className="px-5 py-3.5 text-center text-gray-600">{p.orders_count}</td>
                      <td className="px-5 py-3.5 text-center text-gray-600">{p.customers_count}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600">{fmt(p.expenses)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-900 font-medium">{fmt(p.revenue)}</td>
                      <td className={`px-5 py-3.5 text-right font-bold ${p.net_profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(p.net_profit)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600">{p.profit_margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}