import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Pill,
  Pencil,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import {
  PageHeader,
  Modal,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  Badge,
  EmptyState,
  Spinner,
  formatDate,
  formatMoney,
} from './ManufacturerUI'

export default function ManufacturerDrugsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [modal, setModal] = useState(null) // { type, product }
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/manufacturer-portal/drugs', {
        params: { search: search || undefined, status: status || undefined, page, per_page: 20 },
      })
      setProducts(data.products || [])
      setMeta(data.meta || { current_page: 1, last_page: 1, total: 0 })
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const openCreate = () => navigate('/dashboard/manufacturer/drugs/new')
  const openEdit = (product) => navigate(`/dashboard/manufacturer/drugs/${product.id}/edit`)

  const openView = (product) => setModal({ type: 'view', product })
  const openDelete = (product) => setModal({ type: 'delete', product })
  const closeModal = () => {
    if (deleting) return
    setModal(null)
  }

  const confirmDelete = async () => {
    if (!modal?.product) return
    setDeleting(true)
    try {
      await api.delete(`/manufacturer-portal/drugs/${modal.product.id}`)
      toast.success('Product deleted.')
      setModal(null)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not delete the product.')
    } finally {
      setDeleting(false)
    }
  }

  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + Number(p.quantity || 0) * Number(p.cost_price || 0), 0),
    [products]
  )

  return (
    <div>
      <PageHeader
        title="My drugs & products"
        subtitle="Your own catalogue. These products are not part of any pharmacy's inventory."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add product
          </PrimaryButton>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <MiniStat icon={Pill} label="Products" value={meta.total ?? products.length} />
        <MiniStat icon={Package} label="Units on this page" value={products.reduce((s, p) => s + Number(p.quantity || 0), 0)} />
        <MiniStat icon={AlertTriangle} label="Low stock" value={products.filter((p) => Number(p.quantity || 0) <= Number(p.reorder_level || 0)).length} />
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, generic, SKU or batch…"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className={`${inputClass} sm:w-48`}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No products found"
          message={search || status ? 'Try a different search or filter.' : 'Create your first product to get started.'}
          action={<PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> Add product</PrimaryButton>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/60">
                <tr className="text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Selling price</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => {
                  const low = Number(product.quantity || 0) <= Number(product.reorder_level || 0)
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#000F14]">{product.name}</p>
                        <p className="text-xs text-gray-400">
                          {[product.strength, product.dosage_form].filter(Boolean).join(' · ') || product.generic_name || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={low ? 'font-semibold text-red-600' : 'text-gray-700'}>
                          {product.quantity ?? 0}
                        </span>
                        <span className="text-xs text-gray-400"> / reorder {product.reorder_level ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(product.selling_price)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(product.expiry_date)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={product.status === 'active' ? 'green' : 'gray'}>
                          {product.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton label="View" onClick={() => openView(product)}><Eye className="h-4 w-4" /></IconButton>
                          <IconButton label="Edit" onClick={() => openEdit(product)}><Pencil className="h-4 w-4" /></IconButton>
                          <IconButton label="Delete" danger onClick={() => openDelete(product)}><Trash2 className="h-4 w-4" /></IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Page value: <strong className="text-[#000F14]">{formatMoney(totalValue)}</strong></span>
            <div className="flex items-center gap-2">
              <button
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {meta.current_page} of {meta.last_page}</span>
              <button
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      <Modal
        open={modal?.type === 'view'}
        onClose={closeModal}
        title={modal?.product?.name || 'Product'}
        subtitle={modal?.product?.generic_name || undefined}
        footer={<SecondaryButton onClick={closeModal}>Close</SecondaryButton>}
      >
        {modal?.product && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Category', modal.product.category],
              ['Strength', modal.product.strength],
              ['Dosage form', modal.product.dosage_form],
              ['SKU', modal.product.sku],
              ['Batch number', modal.product.batch_number],
              ['NAFDAC number', modal.product.nafdac_number],
              ['Barcode', modal.product.barcode],
              ['Expiry date', formatDate(modal.product.expiry_date)],
              ['Cost price', formatMoney(modal.product.cost_price)],
              ['Selling price', formatMoney(modal.product.selling_price)],
              ['Wholesale price', formatMoney(modal.product.wholesale_price)],
              ['Quantity', modal.product.quantity ?? 0],
              ['Reorder level', modal.product.reorder_level ?? 0],
              ['Status', modal.product.status === 'active' ? 'Active' : 'Inactive'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-[#000F14]">{value || '—'}</p>
              </div>
            ))}
            {modal.product.description && (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">Description</p>
                <p className="mt-0.5 text-sm text-gray-600">{modal.product.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={modal?.type === 'delete'}
        onClose={closeModal}
        title="Delete product"
        footer={
          <>
            <SecondaryButton onClick={closeModal} disabled={deleting}>Cancel</SecondaryButton>
            <DangerButton onClick={confirmDelete} loading={deleting}><Trash2 className="h-4 w-4" /> Delete</DangerButton>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong className="text-[#000F14]">{modal?.product?.name}</strong>? This
          cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0a8f3c]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-[#000F14]">{value}</p>
      </div>
    </div>
  )
}

function IconButton({ children, label, danger, ...props }) {
  return (
    <button
      {...props}
      title={label}
      aria-label={label}
      className={`rounded-lg p-2 transition-colors ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
