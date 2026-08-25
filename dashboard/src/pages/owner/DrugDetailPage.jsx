import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Barcode from 'react-barcode'
import {
  ArrowLeft,
  Edit,
  Pill,
  Package,
  DollarSign,
  BarChart3,
  Tag,
  Hash,
  Calendar,
  Building2,
  Barcode as BarcodeIcon,
  AlertTriangle,
  Settings,
  FileText,
  Image,
  Printer,
} from 'lucide-react'
import api from '../../services/api'
import { toObject, toArray } from '../../utils/safeData'
import { currentBase } from '../../utils/roles'

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DrugDetailPage() {
  const navigate = useNavigate()
  const base = currentBase()
  const { id } = useParams()
  const [drug, setDrug] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDrug = useCallback(async () => {
    try {
      const response = await api.get(`/drugs/${id}`)
      const res = response.data
      const raw = res.drug || res.data?.drug || res.data || res
      setDrug(toObject(raw) || null)
    } catch {
      setDrug(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDrug()
  }, [fetchDrug])

  if (loading) return <LoadingSkeleton />
  if (!drug) return <div className="text-center text-gray-500 py-20">Drug not found</div>

  const movements = toArray(drug.movements)
  const profitMargin = Number(drug.selling_price) - Number(drug.buying_price)
  const profitPercent = Number(drug.buying_price) > 0 ? ((profitMargin / Number(drug.buying_price)) * 100).toFixed(1) : 0

  const getMovementBadge = (type) => {
    const styles = {
      purchase: 'bg-green-100 text-green-700',
      sale: 'bg-blue-100 text-blue-700',
      adjustment: 'bg-yellow-100 text-yellow-700',
      expiry: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
        {(type || 'Unknown').charAt(0).toUpperCase() + (type || 'Unknown').slice(1)}
      </span>
    )
  }

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  )

  const categoryName = typeof drug.category === 'object' ? drug.category?.name : drug.category

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`${base}/drugs`)}
          className="btn-ghost"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
          <Pill className="w-5 h-5 text-[#0FD452]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{drug.name || 'Drug Details'}</h1>
          <p className="text-sm text-gray-500">{categoryName || 'Uncategorized'} &middot; {drug.unit || 'Unit'}</p>
        </div>
        <button
          onClick={() => navigate(`${base}/drugs/${id}/edit`)}
          className="btn-primary shrink-0"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Stock</p>
          <p className={`text-2xl font-bold ${drug.quantity === 0 ? 'text-red-600' : drug.quantity <= drug.reorder_level ? 'text-yellow-600' : 'text-gray-900'}`}>
            {Number(drug.quantity) || 0}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{drug.unit || 'units'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Selling Price</p>
          <p className="text-2xl font-bold text-gray-900">TZS {Number(drug.selling_price || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">per {drug.unit || 'unit'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Buying Price</p>
          <p className="text-2xl font-bold text-gray-900">TZS {Number(drug.buying_price || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">cost per unit</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Profit Margin</p>
          <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitPercent}%
          </p>
          <p className="text-xs text-gray-500 mt-0.5">TZS {Number(profitMargin).toFixed(2)} / unit</p>
        </div>
      </div>

      {/* Drug Info + Stock Info — Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drug Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Pill className="w-5 h-5 text-[#0FD452]" />
            <h2 className="text-lg font-semibold text-gray-900">Drug Information</h2>
          </div>
          {drug.image_url && (
            <div className="mb-4">
              <img
                src={`/storage/${drug.image_url}`}
                alt={drug.name}
                className="w-full h-48 rounded-xl object-cover border border-gray-200"
              />
            </div>
          )}
          {!drug.image_url && (
            <div className="mb-4 w-full h-48 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
              <Image className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">No image uploaded</p>
            </div>
          )}
          <div className="space-y-1 divide-y divide-gray-50">
            <InfoRow label="Drug Name" value={drug.name} icon={Pill} />
            <InfoRow label="Generic Name" value={drug.generic_name} />
            <InfoRow label="Manufacturer" value={drug.manufacturer} icon={Building2} />
            <InfoRow label="Barcode" value={drug.barcode} icon={BarcodeIcon} />
            <InfoRow label="NAFDAC Number" value={drug.nafdac_number} icon={Tag} />
            <InfoRow label="Category" value={categoryName} icon={Tag} />
            <InfoRow label="Batch Number" value={drug.batch_number} icon={Hash} />
            <InfoRow
              label="Expiry Date"
              value={drug.expiry_date ? new Date(drug.expiry_date).toLocaleDateString() : null}
              icon={Calendar}
            />
          </div>
          {drug.description && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-900">{drug.description}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
            {drug.requires_prescription && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                Prescription Required
              </span>
            )}
            {drug.is_generic && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Generic
              </span>
            )}
            {!drug.requires_prescription && !drug.is_generic && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                OTC
              </span>
            )}
          </div>
        </div>

        {/* Stock Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Package className="w-5 h-5 text-[#0FD452]" />
            <h2 className="text-lg font-semibold text-gray-900">Stock & Pricing</h2>
          </div>
          <div className="space-y-1 divide-y divide-gray-50">
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-gray-500 text-sm">
                <Package className="w-4 h-4" />
                Current Stock
              </span>
              <span className={`text-sm font-semibold ${drug.quantity === 0 ? 'text-red-600' : drug.quantity <= drug.reorder_level ? 'text-yellow-600' : 'text-green-600'}`}>
                {Number(drug.quantity) || 0} {drug.unit}
              </span>
            </div>
            <InfoRow label="Reorder Level" value={drug.reorder_level} icon={AlertTriangle} />
            <div className="h-px bg-gray-100 my-2" />
            <InfoRow label="Buying Price" value={`TZS ${Number(drug.buying_price || 0).toFixed(2)}`} icon={DollarSign} />
            <InfoRow label="Selling Price" value={`TZS ${Number(drug.selling_price || 0).toFixed(2)}`} icon={DollarSign} />
            <InfoRow label="Wholesale Price" value={drug.wholesale_price ? `TZS ${Number(drug.wholesale_price).toFixed(2)}` : null} icon={DollarSign} />
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-gray-500 text-sm">
                <DollarSign className="w-4 h-4" />
                Profit Margin
              </span>
              <span className={`text-sm font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                TZS {Number(profitMargin).toFixed(2)} ({profitPercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement History — Full Width */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <BarChart3 className="w-5 h-5 text-[#0FD452]" />
          <h2 className="text-lg font-semibold text-gray-900">Stock Movement History</h2>
          {movements.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{movements.length} records</span>
          )}
        </div>
        <div className="overflow-x-auto">
          {movements.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No stock movements</p>
              <p className="text-xs text-gray-400">Stock changes will appear here once you start selling or restocking.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Date</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Type</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Quantity</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Unit Cost</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Reference</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Notes</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-[#0FD452]/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                          <Calendar className="h-4 w-4 text-[#0FD452]" />
                        </div>
                        <span className="text-sm text-gray-900">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : m.date ? new Date(m.date).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getMovementBadge(m.movement_type || m.type)}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className={Number(m.quantity) > 0 ? 'text-green-600' : 'text-red-600'}>
                        {Number(m.quantity) > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">TZS {Number(m.unit_cost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{m.reference_number || m.reference || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Barcode Card */}
      {drug.barcode && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <BarcodeIcon className="w-5 h-5 text-[#0FD452]" />
            <h2 className="text-lg font-semibold text-gray-900">Barcode</h2>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div id="barcode-printable">
              <Barcode value={drug.barcode} format="CODE128" width={1.5} height={60} displayValue={true} fontSize={12} />
            </div>
            <button
              onClick={() => {
                const printWindow = window.open('', '_blank')
                printWindow.document.write(`
                  <html><head><title>Barcode - ${drug.name}</title>
                  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
                  </head><body style="text-align:center;padding:40px;font-family:sans-serif">
                  <h2>${drug.name}</h2>
                  <p>${drug.barcode}</p>
                  <svg id="bc"></svg>
                  <script>JsBarcode("#bc","${drug.barcode}",{format:"CODE128",width:2,height:50,displayValue:true,fontSize:14});<\/script>
                  </body></html>
                `)
                printWindow.document.close()
                printWindow.onload = () => { printWindow.print() }
              }}
              className="btn-secondary"
            >
              <Printer className="w-4 h-4" />
              Print Barcode
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[#0FD452]" />
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">
            <Settings className="w-4 h-4" />
            Adjust Stock
          </button>
          <button className="btn-secondary">
            <BarcodeIcon className="w-4 h-4" />
            Print Barcode
          </button>
          <button
          onClick={() => navigate(`${base}/drugs/${id}/edit`)}
            className="btn-secondary"
          >
            <Edit className="w-4 h-4" />
            Edit Drug
          </button>
        </div>
      </div>
    </div>
  )
}
