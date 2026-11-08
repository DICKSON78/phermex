import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Package, Pill, ShieldCheck, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Field, inputClass } from './ManufacturerUI'
import { FormGrid, FormPageSpinner, FormSection, FormShell } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/drugs'

const EMPTY_FORM = {
  name: '',
  generic_name: '',
  category: '',
  strength: '',
  dosage_form: '',
  sku: '',
  nafdac_number: '',
  barcode: '',
  batch_number: '',
  description: '',
  cost_price: '',
  selling_price: '',
  wholesale_price: '',
  quantity: '',
  reorder_level: '10',
  expiry_date: '',
  requires_prescription: false,
  status: 'active',
}

function toForm(product) {
  if (!product) return { ...EMPTY_FORM }
  return {
    ...EMPTY_FORM,
    ...Object.fromEntries(
      Object.keys(EMPTY_FORM).map((key) => [
        key,
        product[key] === null || product[key] === undefined ? EMPTY_FORM[key] : product[key],
      ])
    ),
    expiry_date: product.expiry_date ? String(product.expiry_date).slice(0, 10) : '',
    requires_prescription: !!product.requires_prescription,
  }
}

function firstError(error, fallback) {
  const errors = error?.response?.data?.errors
  return errors ? Object.values(errors)[0][0] : error?.response?.data?.message || fallback
}

export default function ManufacturerDrugFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [fetching, setFetching] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!isEdit) return
    setFetching(true)
    try {
      const { data } = await api.get(`/manufacturer-portal/drugs/${id}`)
      setForm(toForm(data.product))
    } catch (error) {
      toast.error(firstError(error, 'Could not load this product.'))
      navigate(LIST_PATH, { replace: true })
    } finally {
      setFetching(false)
    }
  }, [id, isEdit, navigate])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Product name is required.')
      return
    }

    setSubmitting(true)
    const payload = {
      ...form,
      cost_price: form.cost_price === '' ? 0 : Number(form.cost_price),
      selling_price: form.selling_price === '' ? 0 : Number(form.selling_price),
      wholesale_price: form.wholesale_price === '' ? 0 : Number(form.wholesale_price),
      quantity: form.quantity === '' ? 0 : Number(form.quantity),
      reorder_level: form.reorder_level === '' ? 0 : Number(form.reorder_level),
      expiry_date: form.expiry_date || null,
      requires_prescription: !!form.requires_prescription,
    }

    try {
      if (isEdit) {
        await api.put(`/manufacturer-portal/drugs/${id}`, payload)
        toast.success('Product updated.')
      } else {
        await api.post('/manufacturer-portal/drugs', payload)
        toast.success('Product added.')
      }
      navigate(LIST_PATH)
    } catch (error) {
      toast.error(firstError(error, 'Could not save the product.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <FormPageSpinner />

  return (
    <FormShell
      backTo={LIST_PATH}
      title={isEdit ? 'Edit product' : 'Add product'}
      subtitle={
        isEdit
          ? 'Update the product details, pricing and stock held in your catalogue.'
          : 'Create a product in your own catalogue. These products are separate from pharmacy inventory.'
      }
      onSubmit={submit}
      submitting={submitting}
      submitLabel={isEdit ? 'Save changes' : 'Add product'}
    >
      <FormSection
        icon={Pill}
        title="Product information"
        subtitle="Identity and classification shown in the portal and reports."
      >
        <FormGrid>
          <Field label="Product name" required className="sm:col-span-2">
            <input className={inputClass} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Paracetamol 500mg" />
          </Field>
          <Field label="Generic name">
            <input className={inputClass} value={form.generic_name} onChange={(e) => setField('generic_name', e.target.value)} placeholder="e.g. Acetaminophen" />
          </Field>
          <Field label="Category">
            <input className={inputClass} value={form.category} onChange={(e) => setField('category', e.target.value)} placeholder="e.g. Analgesics" />
          </Field>
          <Field label="Strength">
            <input className={inputClass} value={form.strength} onChange={(e) => setField('strength', e.target.value)} placeholder="e.g. 500mg" />
          </Field>
          <Field label="Dosage form">
            <input className={inputClass} value={form.dosage_form} onChange={(e) => setField('dosage_form', e.target.value)} placeholder="e.g. Tablets" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Optional product notes" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        icon={Package}
        tone="gray"
        title="Pricing & stock"
        subtitle="All amounts are in Tanzanian shillings (TZS)."
      >
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
          <Field label="Quantity in stock">
            <input type="number" min="0" className={inputClass} value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} />
          </Field>
          <Field label="Reorder level">
            <input type="number" min="0" className={inputClass} value={form.reorder_level} onChange={(e) => setField('reorder_level', e.target.value)} />
          </Field>
          <Field label="Expiry date">
            <input type="date" className={inputClass} value={form.expiry_date} onChange={(e) => setField('expiry_date', e.target.value)} />
          </Field>
          <Field label="Batch number">
            <input className={inputClass} value={form.batch_number} onChange={(e) => setField('batch_number', e.target.value)} />
          </Field>
          <Field label="SKU">
            <input className={inputClass} value={form.sku} onChange={(e) => setField('sku', e.target.value)} placeholder="Internal code" />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setField('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        icon={ShieldCheck}
        title="Regulatory & identifiers"
        subtitle="Registration details and dispensing requirements."
      >
        <FormGrid>
          <Field label="NAFDAC number">
            <input className={inputClass} value={form.nafdac_number} onChange={(e) => setField('nafdac_number', e.target.value)} />
          </Field>
          <Field label="Barcode">
            <input className={inputClass} value={form.barcode} onChange={(e) => setField('barcode', e.target.value)} />
          </Field>
        </FormGrid>
        <label className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.requires_prescription}
            onChange={(e) => setField('requires_prescription', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#0FD452] focus:ring-[#0FD452]"
          />
          <span className="text-sm text-gray-700">Requires a prescription</span>
        </label>
      </FormSection>

      <div className="flex items-start gap-2 border-t border-gray-100 bg-[#f8fbf9] px-5 py-3 text-xs text-gray-500">
        <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Products are scoped to your manufacturer account and never mixed with a pharmacy&apos;s own inventory.
      </div>
    </FormShell>
  )
}
