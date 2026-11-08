import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { FormShell, FormSection, FormGrid, Field, inputClass, PrimaryButton } from '../wholesaler/WholesalerUI'

const EMPTY = { drug_name: '', unit: 'unit', pack_size: 1, category: '', batch_number: '', quantity_in_stock: 0, minimum_stock_level: 10, reorder_quantity: 50, unit_price: 0, expiry_date: '', manufacture_date: '', location: '', status: '' }

export default function WholesalerInventoryFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ ...EMPTY })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const { data } = await api.get('/wholesaler-portal/inventory')
          const item = (data.items || []).find((i) => String(i.id) === String(id))
          if (item) setForm({ ...EMPTY, ...item })
        } catch {}
        setLoading(false)
      })()
    }
  }, [id, isEdit])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isEdit) await api.put(`/wholesaler-portal/inventory/${id}`, form)
      else await api.post('/wholesaler-portal/inventory', form)
      toast.success('Saved.')
      navigate('/dashboard/wholesaler/inventory')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <FormShell backTo="/dashboard/wholesaler/inventory" title={isEdit ? 'Edit inventory item' : 'Add inventory item'} onSubmit={onSubmit} submitting={submitting}>
      <FormSection icon={null} title="Item details">
        <FormGrid>
          <Field label="Drug name" required><input className={inputClass} value={form.drug_name} onChange={(e) => set('drug_name', e.target.value)} required /></Field>
          <Field label="Unit"><input className={inputClass} value={form.unit} onChange={(e) => set('unit', e.target.value)} /></Field>
          <Field label="Pack size"><input type="number" className={inputClass} value={form.pack_size} onChange={(e) => set('pack_size', e.target.value)} /></Field>
          <Field label="Category"><input className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)} /></Field>
          <Field label="Batch number" required><input className={inputClass} value={form.batch_number} onChange={(e) => set('batch_number', e.target.value)} required /></Field>
          <Field label="Quantity in stock" required><input type="number" className={inputClass} value={form.quantity_in_stock} onChange={(e) => set('quantity_in_stock', e.target.value)} required /></Field>
          <Field label="Unit price" required><input type="number" step="0.01" className={inputClass} value={form.unit_price} onChange={(e) => set('unit_price', e.target.value)} required /></Field>
          <Field label="Expiry date" required><input type="date" className={inputClass} value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} required /></Field>
          <Field label="Manufacture date"><input type="date" className={inputClass} value={form.manufacture_date} onChange={(e) => set('manufacture_date', e.target.value)} /></Field>
          <Field label="Location"><input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
        </FormGrid>
      </FormSection>
    </FormShell>
  )
}
