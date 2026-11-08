import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { KeyRound, Link2, Plug, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Field, inputClass } from './ManufacturerUI'
import { FormGrid, FormPageSpinner, FormSection, FormShell } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/integrations'

const TYPES = [
  ['api', 'REST API'],
  ['webhook', 'Webhook'],
  ['erp', 'ERP'],
  ['crm', 'CRM'],
  ['analytics', 'Analytics'],
  ['payment', 'Payments'],
]

const STATUSES = [
  ['connected', 'Connected'],
  ['disconnected', 'Disconnected'],
  ['error', 'Error'],
]

const EMPTY_FORM = {
  provider: '',
  name: '',
  type: 'api',
  endpoint: '',
  api_key: '',
  status: 'disconnected',
  description: '',
}

function toForm(integration) {
  if (!integration) return { ...EMPTY_FORM }
  return {
    provider: integration.provider || '',
    name: integration.name || '',
    type: integration.type || 'api',
    endpoint: integration.endpoint || '',
    api_key: integration.api_key || '',
    status: integration.status || 'disconnected',
    description: integration.description || '',
  }
}

function firstError(error, fallback) {
  const errors = error?.response?.data?.errors
  return errors ? Object.values(errors)[0][0] : error?.response?.data?.message || fallback
}

export default function ManufacturerIntegrationFormPage() {
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
      const { data } = await api.get('/manufacturer-portal/integrations')
      const integration = (data.integrations || []).find((item) => String(item.id) === String(id))
      if (!integration) {
        toast.error('That integration could not be found.')
        navigate(LIST_PATH, { replace: true })
        return
      }
      setForm(toForm(integration))
    } catch (error) {
      toast.error(firstError(error, 'Could not load the integration.'))
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
    if (!form.name.trim() || !form.provider.trim()) {
      toast.error('Name and provider key are required.')
      return
    }

    setSubmitting(true)
    const payload = {
      ...form,
      provider: form.provider.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
    }

    try {
      if (isEdit) {
        await api.put(`/manufacturer-portal/integrations/${id}`, payload)
        toast.success('Integration updated.')
      } else {
        await api.post('/manufacturer-portal/integrations', payload)
        toast.success('Integration added.')
      }
      navigate(LIST_PATH)
    } catch (error) {
      toast.error(firstError(error, 'Could not save the integration.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <FormPageSpinner />

  return (
    <FormShell
      backTo={LIST_PATH}
      title={isEdit ? 'Edit integration' : 'Add integration'}
      subtitle="Configure how Helix talks to the systems your team already uses."
      onSubmit={submit}
      submitting={submitting}
      submitLabel={isEdit ? 'Save changes' : 'Add integration'}
    >
      <FormSection icon={Plug} title="Connection" subtitle="Identify the system and how it is classified.">
        <FormGrid>
          <Field label="Integration name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Our ERP" />
          </Field>
          <Field
            label="Provider key"
            required
            hint={isEdit ? 'Provider keys cannot be changed after creation.' : 'Lowercase, unique identifier, e.g. our_erp'}
          >
            <input
              className={inputClass}
              value={form.provider}
              onChange={(e) => setField('provider', e.target.value)}
              placeholder="e.g. our_erp"
              disabled={isEdit}
            />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={form.type} onChange={(e) => setField('type', e.target.value)}>
              {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What does this integration do?" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={Link2} tone="gray" title="Endpoint & credentials" subtitle="Where Helix sends requests and how it authenticates.">
        <FormGrid>
          <Field label="Endpoint / URL" className="sm:col-span-2">
            <input className={inputClass} value={form.endpoint} onChange={(e) => setField('endpoint', e.target.value)} placeholder="https://example.com/webhook" />
          </Field>
          <Field label="API key / secret" className="sm:col-span-2" hint="Stored against your manufacturer account only.">
            <input className={inputClass} value={form.api_key} onChange={(e) => setField('api_key', e.target.value)} placeholder="Optional" autoComplete="off" />
          </Field>
        </FormGrid>
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Secrets are scoped to this manufacturer and never shared with pharmacies.
        </p>
      </FormSection>

      <div className="flex items-start gap-2 border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
        <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        After saving, use the Connect / Re-test action on the integrations page to verify the connection.
      </div>
    </FormShell>
  )
}
