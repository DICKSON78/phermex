import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../services/api'

const emptyRow = () => ({
  name: '',
  generic_name: '',
  buying_price: '',
  selling_price: '',
  wholesale_price: '',
  quantity: '',
  unit: 'tablets',
  expiry_date: '',
  category_id: '',
  status: 'idle',
  message: '',
})

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim())
    const obj = {}
    header.forEach((h, i) => {
      obj[h] = cols[i] ?? ''
    })
    return obj
  })
}

export default function DrugBulkImportPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const base = '/dashboard'

  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()])
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [summary, setSummary] = useState(null)

  const addRow = () => setRows((r) => [...r, emptyRow()])
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i))
  const updateRow = (i, field, value) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))

  const loadFromCsv = () => {
    const parsed = parseCsv(csvText)
    if (!parsed.length) return
    setRows(parsed.map((p) => ({ ...emptyRow(), ...p })))
  }

  const importAll = async () => {
    setImporting(true)
    setSummary(null)
    let ok = 0
    let fail = 0
    const next = [...rows]
    for (let i = 0; i < next.length; i++) {
      const r = next[i]
      if (!r.name || !r.buying_price || !r.selling_price || !r.quantity || !r.expiry_date) {
        next[i] = { ...r, status: 'error', message: 'Missing required fields' }
        fail++
        continue
      }
      try {
        await api.post('/drugs', {
          name: r.name,
          generic_name: r.generic_name || undefined,
          buying_price: Number(r.buying_price),
          selling_price: Number(r.selling_price),
          wholesale_price: r.wholesale_price ? Number(r.wholesale_price) : undefined,
          quantity: Number(r.quantity),
          unit: r.unit || 'tablets',
          expiry_date: r.expiry_date,
          category_id: r.category_id ? Number(r.category_id) : undefined,
        })
        next[i] = { ...r, status: 'success', message: 'Imported' }
        ok++
      } catch (e) {
        next[i] = { ...r, status: 'error', message: e?.response?.data?.message || 'Failed' }
        fail++
      }
      setRows([...next])
    }
    setImporting(false)
    setSummary({ ok, fail })
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-dark">Bulk Drug Import</h1>
        <button onClick={() => navigate(`${base}/drugs`)} className="text-sm text-gray-500 hover:text-dark">
          Back to Drugs
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <h2 className="font-semibold text-dark text-sm mb-2">Import from CSV</h2>
        <p className="text-xs text-gray-500 mb-2">
          Paste CSV with header row: name, generic_name, buying_price, selling_price, wholesale_price, quantity, unit, expiry_date, category_id
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full h-32 border border-gray-200 rounded p-2 text-sm font-mono"
          placeholder="name,buying_price,selling_price,quantity,expiry_date"
        />
        <button
          onClick={loadFromCsv}
          className="mt-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
        >
          Load into table
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-dark text-sm">Manual entry ({rows.length} rows)</h2>
          <button onClick={addRow} className="px-3 py-1.5 bg-primary text-dark rounded text-sm font-medium">
            + Add row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-2">Name *</th>
                <th className="py-2 pr-2">Generic</th>
                <th className="py-2 pr-2">Buy *</th>
                <th className="py-2 pr-2">Sell *</th>
                <th className="py-2 pr-2">Wholesale</th>
                <th className="py-2 pr-2">Qty *</th>
                <th className="py-2 pr-2">Unit</th>
                <th className="py-2 pr-2">Expiry *</th>
                <th className="py-2 pr-2">Cat ID</th>
                <th className="py-2 pr-2">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {['name', 'generic_name', 'buying_price', 'selling_price', 'wholesale_price', 'quantity', 'unit', 'expiry_date', 'category_id'].map((f) => (
                    <td key={f} className="py-1 pr-2">
                      <input
                        type={f.includes('price') || f === 'quantity' || f === 'category_id' ? 'number' : f === 'expiry_date' ? 'date' : 'text'}
                        value={r[f]}
                        onChange={(e) => updateRow(i, f, e.target.value)}
                        className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs"
                      />
                    </td>
                  ))}
                  <td className="py-1 pr-2">
                    <span
                      className={`text-[10px] font-medium ${
                        r.status === 'success' ? 'text-green-600' : r.status === 'error' ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {r.message || r.status}
                    </span>
                  </td>
                  <td className="py-1">
                    <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={importAll}
            disabled={importing}
            className="px-4 py-2 bg-primary text-dark rounded text-sm font-bold disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import all'}
          </button>
          {summary && (
            <span className="text-sm text-gray-600">
              Imported {summary.ok}, failed {summary.fail}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
