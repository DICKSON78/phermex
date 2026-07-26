import { useState, useEffect, useCallback } from 'react'
import {
  Barcode,
  Search,
  X,
  Printer,
  Eye,
  Settings,
  FileText,
  Plus,
  Minus,
  Loader2,
  Trash2,
} from 'lucide-react'
import api from '../../services/api'

const LABEL_FORMATS = [
  { value: 'name_only', label: 'Drug Name' },
  { value: 'name_price', label: 'Drug Name + Price' },
  { value: 'custom', label: 'Custom' },
]

const BARCODE_TYPES = [
  { value: 'code128', label: 'Code128' },
  { value: 'ean13', label: 'EAN-13' },
]

const PAPER_SIZES = [
  { value: 'a4', label: 'A4', width: 210, height: 297 },
  { value: 'letter', label: 'Letter', width: 216, height: 279 },
  { value: 'custom', label: 'Custom', width: 210, height: 297 },
]

function BarcodeStrip({ width = 120, height = 50, text = '' }) {
  const bars = []
  const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  let pos = 0
  let i = 0
  while (pos < width - 8) {
    const w = ((seed * (i + 1) * 7) % 3) + 1
    const isBlack = i % 2 === 0
    bars.push(
      <div
        key={i}
        style={{
          width: `${w}px`,
          height: `${height - 16}px`,
          backgroundColor: isBlack ? '#000F14' : 'transparent',
          flexShrink: 0,
        }}
      />
    )
    pos += w
    i++
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end" style={{ width: `${width}px`, height: `${height - 14}px` }}>
        {bars}
      </div>
      {text && (
        <p className="text-[8px] font-mono text-dark tracking-wider truncate max-w-full" style={{ width: `${width}px` }}>
          {text}
        </p>
      )}
    </div>
  )
}

export default function BarcodePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedDrugs, setSelectedDrugs] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const [labelFormat, setLabelFormat] = useState('name_only')
  const [barcodeType, setBarcodeType] = useState('code128')
  const [paperSize, setPaperSize] = useState('a4')
  const [labelsPerRow, setLabelsPerRow] = useState(4)
  const [copies, setCopies] = useState(1)
  const [showPreview, setShowPreview] = useState(false)

  const searchDrugs = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const response = await api.get(`/drugs/search?q=${encodeURIComponent(query)}`)
      setSearchResults(response.data.data || response.data || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => searchDrugs(searchQuery), 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, searchDrugs])

  const addDrug = (drug) => {
    if (!selectedDrugs.find((d) => d.id === drug.id)) {
      setSelectedDrugs([...selectedDrugs, drug])
    }
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const removeDrug = (drugId) => {
    setSelectedDrugs(selectedDrugs.filter((d) => d.id !== drugId))
  }

  const handlePrint = () => {
    window.print()
  }

  const getLabelContent = (drug) => {
    switch (labelFormat) {
      case 'name_price':
        return `${drug.name} - TZS ${Number(drug.selling_price).toFixed(2)}`
      case 'custom':
        return drug.name
      default:
        return drug.name
    }
  }

  const totalLabels = selectedDrugs.length * copies

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
              <Barcode className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Barcode Generator</h1>
              <p className="text-sm text-gray-500">Generate and print barcodes for products.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 no-print">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary"
            >
              <Printer className="w-4 h-4" />
              Print Labels
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Drug Search & Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drug Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 no-print">
              <h3 className="text-sm font-semibold text-dark mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Drugs
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by drug name or barcode..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}

                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {searchResults.map((drug) => (
                      <button
                        key={drug.id}
                        onClick={() => addDrug(drug)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-dark">{drug.name}</p>
                          <p className="text-xs text-gray-400">{drug.barcode}</p>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          TZS {Number(drug.selling_price).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Drugs */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-dark flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Selected Drugs ({selectedDrugs.length})
                </h3>
                {selectedDrugs.length > 0 && (
                  <button
                    onClick={() => setSelectedDrugs([])}
                    className="text-xs text-red-500 hover:text-red-700 font-medium no-print"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedDrugs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Barcode className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No drugs selected. Search above to add drugs.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedDrugs.map((drug) => (
                    <span
                      key={drug.id}
                      className="inline-flex items-center gap-1.5 bg-primary/10 text-dark text-sm font-medium px-3 py-1.5 rounded-lg"
                    >
                      {drug.name}
                      <button
                        onClick={() => removeDrug(drug.id)}
                        className="w-4 h-4 rounded-full bg-dark/10 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors no-print"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Section */}
            {showPreview && selectedDrugs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-dark mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Barcode Preview
                </h3>
                <div className="print-area border border-gray-200 rounded-lg p-4">
                  <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${labelsPerRow}, 1fr)` }}
                  >
                    {Array.from({ length: Math.min(totalLabels, 20) }).map((_, i) => {
                      const drug = selectedDrugs[i % selectedDrugs.length]
                      return (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-lg p-3 flex flex-col items-center gap-1"
                        >
                          <BarcodeStrip
                            width={100}
                            height={40}
                            text={drug.barcode || `PHX-${String(drug.id).padStart(3, '0')}`}
                          />
                          <p className="text-[10px] font-medium text-dark text-center leading-tight mt-1">
                            {getLabelContent(drug)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  {totalLabels > 20 && (
                    <p className="text-xs text-gray-400 text-center mt-4">
                      Showing 20 of {totalLabels} labels
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 no-print">
              <h3 className="text-sm font-semibold text-dark mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Barcode Settings
              </h3>

              <div className="space-y-4">
                {/* Label Format */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Label Format</label>
                  <select
                    value={labelFormat}
                    onChange={(e) => setLabelFormat(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {LABEL_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barcode Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Barcode Type</label>
                  <select
                    value={barcodeType}
                    onChange={(e) => setBarcodeType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {BARCODE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Paper Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Paper Size</label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {PAPER_SIZES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Labels Per Row */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Labels Per Row</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setLabelsPerRow(n)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                          labelsPerRow === n
                            ? 'bg-primary text-dark border-primary'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Copies */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Copies</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCopies(Math.max(1, copies - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <input
                      type="number"
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max="100"
                      className="w-20 text-center py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      onClick={() => setCopies(Math.min(100, copies + 1))}
                      className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-dark mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Drugs selected</span>
                  <span className="font-medium text-dark">{selectedDrugs.length}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Copies per drug</span>
                  <span className="font-medium text-dark">{copies}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Labels per row</span>
                  <span className="font-medium text-dark">{labelsPerRow}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-dark">Total labels</span>
                    <span className="font-bold text-primary">{totalLabels}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={selectedDrugs.length === 0}
              className="btn-primary"
            >
              <Printer className="w-5 h-5" />
              Print Preview
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
