import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ClipboardList, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Field, inputClass } from './ManufacturerUI'
import { FormGrid, FormPageSpinner, FormSection, FormShell } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/recalls'

const REASONS = [
  ['defective', 'Defective product'],
  ['contamination', 'Contamination'],
  ['labeling', 'Labelling'],
  ['efficacy', 'Efficacy'],
  ['safety', 'Safety'],
]

const SEVERITIES = [
  ['class_i', 'Class I — serious'],
  ['class_ii', 'Class II — moderate'],
  ['class_iii', 'Class III — minor'],
]

const STATUSES = [
  ['pending', 'Pending'],
  ['in_progress', 'In progress'],
  ['completed', 'Completed'],
]

const EMPTY_FORM = {
  product_id: '',
  recall_number: '',
  product_name: '',
  recall_reason: 'defective',
  severity: 'class_ii',
  batch_numbers: '',
  date_issued: new Date().toISOString().slice(0, 10),
  date_resolved: '',
  affected_quantity: '',
  returned_quantity: '',
  status: 'pending',
  notes: '',
}

function nextRecallNumber() {
  const stamp = Date.now().toString().slice(-6)
  return `RCL-${new Date().getFullYear()}-${stamp}`
}

function toForm(recall) {
  return {
    ...EMPTY_FORM,
    ...recall,
    product_id: recall?.product_id || '',
    batch_numbers: recall?.batch_numbers || '',
    affected_quantity: recall?.affected_quantity ?? '',
    returned_quantity: recall?.returned_quantity ?? '',
    date_issued: recall?.date_issued ? String(recall.date_issued).slice(0, 10) : EMPTY_FORM.date_issued,
    date_resolved: recall?.date_resolved ? String(recall.date_resolved).slice(0, 10) : '',
    notes: recall?.notes || '',
  }
}

function firstError(error, fallback) {
  const errors = error?.response?.data?.errors
  return errors ? Object.values(errors)[0][0] : error?.response?.data?.message || fallback
}

export default function ManufacturerRecallFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, recall_number: nextRecallNumber() }))
  const [products, setProducts] = useState([])
  const [fetching, setFetching] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/manufacturer-portal/drugs', { params: { per_page: 100 } })
      setProducts(data.products || [])
    } catch {
      setProducts([])
    }

    if (!isEdit) return
    setFetching(true)
    try {
      const { data } = await api.get('/manufacturer-portal/recalls')
      const recall = (data.recalls || []).find((item) => String(item.id) === String(id))
      if (!recall) {
        toast.error('That recall could not be found.')
        navigate(LIST_PATH, { replace: true })
        return
      }
      setForm(toForm(recall))
    } catch (error) {
      toast.error(firstError(error, 'Could not load this recall.'))
      navigate(LIST_PATH, { replace: true })
    } finally {
      setFetching(false)
    }
  }, [id, isEdit, navigate])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const chooseProduct = (value) => {
    const product = products.find((item) => String(item.id) === String(value))
    setForm((previous) => ({
      ...previous,
      product_id: value,
      product_name: product ? product.name : previous.product_name,
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.product_name.trim()) {
      toast.error('Product name is required.')
      return
    }
    if (!form.recall_number.trim()) {
      toast.error('Recall number is required.')
      return
    }

    setSubmitting(true)
    const payload = {
      ...form,
      product_id: form.product_id || null,
      affected_quantity: form.affected_quantity === '' ? 0 : Number(form.affected_quantity),
      returned_quantity: form.returned_quantity === '' ? 0 : Number(form.returned_quantity),
      date_resolved: form.date_resolved || null,
    }

    try {
      if (isEdit) {
        await api.put(`/manufacturer-portal/recalls/${id}`, payload)
        toast.success('Recall updated.')
      } else {
        await api.post('/manufacturer-portal/recalls', payload)
        toast.success('Recall recorded.')
      }
      navigate(LIST_PATH)
    } catch (error) {
      toast.error(firstError(error, 'Could not save the recall.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <FormPageSpinner />

  return (
    <FormShell
      backTo={LIST_PATH}
      title={isEdit ? 'Edit recall' : 'Report recall'}
      subtitle="Record the affected product, batch and quantities so the recall stays traceable."
      onSubmit={submit}
      submitting={submitting}
      submitLabel={isEdit ? 'Save changes' : 'Report recall'}
    >
      <FormSection icon={AlertTriangle} title="Recall details" subtitle="What is being recalled and why.">
        <FormGrid>
          <Field label="Linked product" className="sm:col-span-2" hint="Linking a catalogue product keeps recall analytics accurate.">
            <select className={inputClass} value={form.product_id} onChange={(e) => chooseProduct(e.target.value)}>
              <option value="">Not linked / other product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Product name" required>
            <input className={inputClass} value={form.product_name} onChange={(e) => setField('product_name', e.target.value)} />
          </Field>
          <Field label="Recall number" required>
            <input className={inputClass} value={form.recall_number} onChange={(e) => setField('recall_number', e.target.value)} />
          </Field>
          <Field label="Reason" required>
            <select className={inputClass} value={form.recall_reason} onChange={(e) => setField('recall_reason', e.target.value)}>
              {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Severity" required>
            <select className={inputClass} value={form.severity} onChange={(e) => setField('severity', e.target.value)}>
              {SEVERITIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Batch numbers" className="sm:col-span-2">
            <input className={inputClass} value={form.batch_numbers} onChange={(e) => setField('batch_numbers', e.target.value)} placeholder="e.g. B-1023, B-1024" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={ClipboardList} tone="gray" title="Progress & quantities" subtitle="Track the recall through to resolution.">
        <FormGrid>
          <Field label="Date issued" required>
            <input type="date" className={inputClass} value={form.date_issued} onChange={(e) => setField('date_issued', e.target.value)} />
          </Field>
          <Field label="Date resolved">
            <input type="date" className={inputClass} value={form.date_resolved} onChange={(e) => setField('date_resolved', e.target.value)} />
          </Field>
          <Field label="Affected quantity">
            <input type="number" min="0" className={inputClass} value={form.affected_quantity} onChange={(e) => setField('affected_quantity', e.target.value)} />
          </Field>
          <Field label="Returned quantity">
            <input type="number" min="0" className={inputClass} value={form.returned_quantity} onChange={(e) => setField('returned_quantity', e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={FileText} title="Notes" subtitle="Internal context for the recall team.">
        <Field label="Notes">
          <textarea rows={4} className={inputClass} value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Actions taken, communication, regulatory reference…" />
        </Field>
      </FormSection>
    </FormShell>
  )
}
