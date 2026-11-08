import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Boxes, Package, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Field, inputClass } from './ManufacturerUI'
import { FormGrid, FormPageSpinner, FormSection, FormShell } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/inventory'

function toForm(product) {
  return {
    quantity: product?.quantity ?? 0,
    reorder_level: product?.reorder_level ?? 0,
    cost_price: product?.cost_price ?? 0,
    selling_price: product?.selling_price ?? 0,
    wholesale_price: product?.wholesale_price ?? 0,
    batch_number: product?.batch_number || '',
    expiry_date: product?.expiry_date ? String(product.expiry_date).slice(0, 10) : '',
    status: product?.status || 'active',
  }
}

export default function ManufacturerInventoryFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [form, setForm] = useState(toForm(null))
  const [fetching, setFetching] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setFetching(true)
    try {
      const { data } = await api.get(`/manufacturer-portal/drugs/${id}`)
      setProduct(data.product)
      setForm(toForm(data.product))
    } catch (error) {
      const errors = error?.response?.data?.errors
      toast.error(errors ? Object.values(errors)[0][0] : error?.response?.data?.message || 'Could not load this stock item.')
      navigate(LIST_PATH, { replace: true })
    } finally {
      setFetching(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await api.patch(`/manufacturer-portal/inventory/${id}`, {
        ...form,
        quantity: Number(form.quantity || 0),
        reorder_level: Number(form.reorder_level || 0),
        cost_price: Number(form.cost_price || 0),
        selling_price: Number(form.selling_price || 0),
        wholesale_price: Number(form.wholesale_price || 0),
        expiry_date: form.expiry_date || null,
      })
      toast.success('Stock updated.')
      navigate(LIST_PATH)
    } catch (error) {
      const errors = error?.response?.data?.errors
      toast.error(errors ? Object.values(errors)[0][0] : error?.response?.data?.message || 'Could not update stock.')
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <FormPageSpinner />

  return (
    <FormShell
      backTo={LIST_PATH}
      title="Update stock"
      subtitle={product ? `${product.name}${product.category ? ` · ${product.category}` : ''}` : 'Adjust quantities, prices and batch details.'}
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Save stock"
    >
      <FormSection icon={Boxes} title="Stock position" subtitle="Units and thresholds used by low-stock intelligence.">
        <FormGrid>
          <Field label="Quantity in stock">
            <input type="number" min="0" className={inputClass} value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} />
          </Field>
          <Field label="Reorder level" hint="Low-stock alerts fire at or below this level.">
            <input type="number" min="0" className={inputClass} value={form.reorder_level} onChange={(e) => setField('reorder_level', e.target.value)} />
          </Field>
          <Field label="Batch number">
            <input className={inputClass} value={form.batch_number} onChange={(e) => setField('batch_number', e.target.value)} />
          </Field>
          <Field label="Expiry date">
            <input type="date" className={inputClass} value={form.expiry_date} onChange={(e) => setField('expiry_date', e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setField('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={Wallet} tone="gray" title="Pricing" subtitle="Cost, selling and wholesale prices in TZS.">
        <FormGrid columns={3}>
          <Field label="Cost price (TZS)">
            <input type="number" min="0" step="0.01" className={inputClass} value={form.cost_price} onChange={(e) => setField('cost_price', e.target.value)} />
          </Field>
          <Field label="Selling price (TZS)">
            <input type="number" min="0" step="0.01" className={inputClass} value={form.selling_price} onChange={(e) => setField('selling_price', e.target.value)} />
          </Field>
          <Field label="Wholesale price (TZS)">
            <input type="number" min="0" step="0.01" className={inputClass} value={form.wholesale_price} onChange={(e) => setField('wholesale_price', e.target.value)} />
          </Field>
        </FormGrid>
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-500">
          <Package className="h-3.5 w-3.5 shrink-0" />
          Inventory value is calculated from quantity × cost price.
        </p>
      </FormSection>
    </FormShell>
  )
}
