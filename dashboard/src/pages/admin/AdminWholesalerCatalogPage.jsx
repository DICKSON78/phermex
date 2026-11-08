import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Boxes,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Package,
  DollarSign,
  X,
  Save,
  Warehouse,
  Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/Modal'
import useConfirm from '../../hooks/useConfirm'

const UNIT_SUGGESTIONS = [
  'piece',
  'pack (10)',
  'box (100)',
  'carton (1000)',
  'bottle',
  'tube',
  'sachet',
  'vial',
  'ampoule',
]

const STATUS_STYLES = {
  available: 'bg-green-100 text-green-700',
  low_stock: 'bg-yellow-100 text-yellow-700',
  out_of_stock: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-600',
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-[#000F14] placeholder-gray-400 outline-none transition-all focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20'

const emptyForm = {
  drug_name: '',
  unit: 'pack (10)',
  pack_size: 10,
  category: '',
  batch_number: '',
  quantity_in_stock: 0,
  minimum_stock_level: 10,
  reorder_quantity: 50,
  unit_price: 0,
  expiry_date: '',
  manufacture_date: '',
  location: '',
  status: '',
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </label>
  )
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AdminWholesalerCatalogPage() {
  const { id } = useParams()
  const [confirm, confirmDialog] = useConfirm()

  const [wholesaler, setWholesaler] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchCatalog = async () => {
    try {
      const res = await api.get(`/admin/wholesalers/${id}/inventory`)
      setWholesaler(res.data?.wholesaler || null)
      setItems(Array.isArray(res.data?.items) ? res.data.items : [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load supplier catalog')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalog()
  }, [id])

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false
      if (!q) return true
      return [item.drug_name, item.unit, item.batch_number, item.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [items, search, categoryFilter])

  const grouped = useMemo(() => {
    const map = new Map()
    filtered.forEach((item) => {
      const key = item.drug_name
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    })
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const stats = useMemo(() => {
    const low = items.filter((item) => item.status === 'low_stock').length
    const out = items.filter((item) => item.quantity_in_stock <= 0 || item.status === 'out_of_stock').length
    const value = items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity_in_stock), 0)
    return { total: items.length, low, out, value }
  }, [items])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      drug_name: item.drug_name || '',
      unit: item.unit || 'unit',
      pack_size: item.pack_size || 1,
      category: item.category || '',
      batch_number: item.batch_number || '',
      quantity_in_stock: item.quantity_in_stock || 0,
      minimum_stock_level: item.minimum_stock_level || 0,
      reorder_quantity: item.reorder_quantity || 0,
      unit_price: item.unit_price || 0,
      expiry_date: item.expiry_date || '',
      manufacture_date: item.manufacture_date || '',
      location: item.location || '',
      status: item.status || '',
    })
    setFormError('')
    setShowForm(true)
  }

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        pack_size: Number(form.pack_size) || 1,
        quantity_in_stock: Number(form.quantity_in_stock) || 0,
        minimum_stock_level: Number(form.minimum_stock_level) || 0,
        reorder_quantity: Number(form.reorder_quantity) || 0,
        unit_price: Number(form.unit_price) || 0,
        manufacture_date: form.manufacture_date || null,
        status: form.status || undefined,
      }

      if (editing) {
        await api.put(`/admin/wholesaler-inventory/${editing.id}`, payload)
        toast.success('Inventory item updated')
      } else {
        await api.post(`/admin/wholesalers/${id}/inventory`, payload)
        toast.success('Inventory item added')
      }

      setShowForm(false)
      setEditing(null)
      await fetchCatalog()
    } catch (error) {
      const errors = error.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setFormError(first || error.response?.data?.message || 'Could not save inventory item.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    const ok = await confirm({
      title: 'Remove catalog item?',
      message: `${item.drug_name} (${item.unit}) will no longer be orderable from this supplier.`,
      confirmText: 'Remove',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await api.delete(`/admin/wholesaler-inventory/${item.id}`)
      toast.success('Inventory item removed')
      await fetchCatalog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove inventory item')
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="h-96 animate-pulse rounded-xl bg-white" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/wholesalers" className="rounded-xl p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Boxes className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Catalog</h1>
            <p className="text-sm text-gray-500">
              {wholesaler?.name || 'Wholesaler'} · manage units, stock and prices pharmacies can order
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add catalog item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-gray-500"><Package className="h-4 w-4 text-[#0FD452]" /> Variants</p>
          <p className="mt-1 text-2xl font-bold text-[#000F14]">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-gray-500"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Low stock</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.low}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-gray-500"><Warehouse className="h-4 w-4 text-gray-400" /> Out of stock</p>
          <p className="mt-1 text-2xl font-bold text-gray-600">{stats.out}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-gray-500"><DollarSign className="h-4 w-4 text-[#0FD452]" /> Stock value</p>
          <p className="mt-1 text-2xl font-bold text-[#000F14]">{formatMoney(stats.value)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-10`}
              placeholder="Search medicine, unit, batch or category..."
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClass}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Boxes className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">No catalog items</h3>
          <p className="text-sm text-gray-500">Add medicines in the units pharmacies can order.</p>
          <button onClick={openCreate} className="btn-primary mt-5">
            <Plus className="h-4 w-4" />
            Add catalog item
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([drugName, variants]) => (
            <div key={drugName} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#000F14]">{drugName}</h3>
                  <p className="text-xs text-gray-500">{variants[0]?.category || 'Uncategorised'}</p>
                </div>
                <span className="rounded-full bg-[#0FD452]/10 px-2.5 py-0.5 text-xs font-medium text-[#0a8f3c]">
                  {variants.length} unit{variants.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-2.5">Unit</th>
                      <th className="px-5 py-2.5">Pack size</th>
                      <th className="px-5 py-2.5">Batch</th>
                      <th className="px-5 py-2.5">Stock</th>
                      <th className="px-5 py-2.5">Unit price</th>
                      <th className="px-5 py-2.5">Expiry</th>
                      <th className="px-5 py-2.5">Status</th>
                      <th className="px-5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variants.map((item) => (
                      <tr key={item.id} className="hover:bg-[#0FD452]/5">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-[#000F14]">{item.unit}</p>
                          {item.location && <p className="text-[11px] text-gray-400">{item.location}</p>}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">{item.pack_size}</td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-600">{item.batch_number}</td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-[#000F14]">{item.quantity_in_stock}</p>
                          <p className="text-[11px] text-gray-400">min {item.minimum_stock_level}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{formatMoney(item.unit_price)}</td>
                        <td className="px-5 py-3 text-xs text-gray-600">{item.expiry_date || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[item.status] || STATUS_STYLES.out_of_stock}`}>
                            {String(item.status || '').replaceAll('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(item)} className="btn-icon-blue" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => remove(item)} className="btn-ghost hover:!text-red-600" title="Remove">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => { if (!saving) setShowForm(false) }}
        title={editing ? 'Edit catalog item' : 'Add catalog item'}
        subtitle={editing ? `${editing.drug_name} · ${editing.unit}` : `Add a unit variant to ${wholesaler?.name || 'the supplier'}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={submit} className="space-y-4">
          {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Medicine name" required>
              <input required value={form.drug_name} onChange={(e) => updateField('drug_name', e.target.value)} className={inputClass} placeholder="e.g. Paracetamol 500mg" />
            </Field>
            <Field label="Category">
              <input value={form.category} onChange={(e) => updateField('category', e.target.value)} className={inputClass} placeholder="e.g. Pain & Fever" />
            </Field>
            <Field label="Unit" required hint="How pharmacies order: piece, pack, box, carton...">
              <input required list="unit-suggestions" value={form.unit} onChange={(e) => updateField('unit', e.target.value)} className={inputClass} placeholder="pack (10)" />
              <datalist id="unit-suggestions">
                {UNIT_SUGGESTIONS.map((unit) => <option key={unit} value={unit} />)}
              </datalist>
            </Field>
            <Field label="Pack size" hint="Number of pieces in this unit.">
              <input type="number" min="1" value={form.pack_size} onChange={(e) => updateField('pack_size', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Batch number" required>
              <input required value={form.batch_number} onChange={(e) => updateField('batch_number', e.target.value)} className={inputClass} placeholder="e.g. PARA-500-PK" />
            </Field>
            <Field label="Unit price" required>
              <input required type="number" min="0" step="0.01" value={form.unit_price} onChange={(e) => updateField('unit_price', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Quantity in stock" required>
              <input required type="number" min="0" value={form.quantity_in_stock} onChange={(e) => updateField('quantity_in_stock', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Minimum stock level">
              <input type="number" min="0" value={form.minimum_stock_level} onChange={(e) => updateField('minimum_stock_level', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Reorder quantity">
              <input type="number" min="0" value={form.reorder_quantity} onChange={(e) => updateField('reorder_quantity', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Storage location">
              <input value={form.location} onChange={(e) => updateField('location', e.target.value)} className={inputClass} placeholder="e.g. Warehouse A" />
            </Field>
            <Field label="Manufacture date">
              <input type="date" value={form.manufacture_date} onChange={(e) => updateField('manufacture_date', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Expiry date" required>
              <input required type="date" value={form.expiry_date} onChange={(e) => updateField('expiry_date', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Status" hint="Leave blank to set automatically from stock.">
              <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={inputClass}>
                <option value="">Automatic</option>
                <option value="available">Available</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="expired">Expired</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setShowForm(false)} disabled={saving} className="btn-secondary">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </Modal>

      {confirmDialog}
    </div>
  )
}
