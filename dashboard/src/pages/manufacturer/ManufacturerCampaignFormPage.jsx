import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart3, CalendarDays, Megaphone, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Field, inputClass } from './ManufacturerUI'
import { FormGrid, FormPageSpinner, FormSection, FormShell } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/analytics/campaigns'

const CHANNELS = [
  ['in_app', 'In-app'],
  ['email', 'Email'],
  ['sms', 'SMS'],
  ['social', 'Social media'],
  ['trade', 'Trade / pharmacy'],
  ['field', 'Field sales'],
]

const STATUSES = [
  ['draft', 'Draft'],
  ['scheduled', 'Scheduled'],
  ['active', 'Active'],
  ['paused', 'Paused'],
  ['completed', 'Completed'],
]

const EMPTY_FORM = {
  name: '',
  product_id: '',
  channel: 'in_app',
  status: 'draft',
  target_audience: '',
  description: '',
  start_date: '',
  end_date: '',
  budget: '',
  spend: '',
  impressions: '',
  clicks: '',
  conversions: '',
}

function toForm(campaign) {
  if (!campaign) return { ...EMPTY_FORM }
  return {
    name: campaign.name || '',
    product_id: campaign.product_id || '',
    channel: campaign.channel || 'in_app',
    status: campaign.status || 'draft',
    target_audience: campaign.target_audience || '',
    description: campaign.description || '',
    start_date: campaign.start_date ? String(campaign.start_date).slice(0, 10) : '',
    end_date: campaign.end_date ? String(campaign.end_date).slice(0, 10) : '',
    budget: campaign.budget ?? '',
    spend: campaign.spend ?? '',
    impressions: campaign.impressions ?? '',
    clicks: campaign.clicks ?? '',
    conversions: campaign.conversions ?? '',
  }
}

function firstError(error, fallback) {
  const errors = error?.response?.data?.errors
  return errors ? Object.values(errors)[0][0] : error?.response?.data?.message || fallback
}

export default function ManufacturerCampaignFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [products, setProducts] = useState([])
  const [fetching, setFetching] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/manufacturer-portal/campaigns')
      setProducts(data.products || [])
      if (isEdit) {
        const campaign = (data.campaigns || []).find((item) => String(item.id) === String(id))
        if (!campaign) {
          toast.error('That campaign could not be found.')
          navigate(LIST_PATH, { replace: true })
          return
        }
        setForm(toForm(campaign))
      }
    } catch (error) {
      toast.error(firstError(error, 'Could not load campaigns.'))
      if (isEdit) navigate(LIST_PATH, { replace: true })
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
      toast.error('Campaign name is required.')
      return
    }

    setSubmitting(true)
    const payload = {
      ...form,
      product_id: form.product_id ? Number(form.product_id) : null,
      budget: Number(form.budget || 0),
      spend: Number(form.spend || 0),
      impressions: Number(form.impressions || 0),
      clicks: Number(form.clicks || 0),
      conversions: Number(form.conversions || 0),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }

    try {
      if (isEdit) {
        await api.put(`/manufacturer-portal/campaigns/${id}`, payload)
        toast.success('Campaign updated.')
      } else {
        await api.post('/manufacturer-portal/campaigns', payload)
        toast.success('Campaign created.')
      }
      navigate(LIST_PATH)
    } catch (error) {
      toast.error(firstError(error, 'Could not save the campaign.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <FormPageSpinner />

  return (
    <FormShell
      backTo={LIST_PATH}
      title={isEdit ? 'Edit campaign' : 'New campaign'}
      subtitle="Set the audience, schedule, budget and results for this promotion."
      onSubmit={submit}
      submitting={submitting}
      submitLabel={isEdit ? 'Save changes' : 'Create campaign'}
    >
      <FormSection icon={Megaphone} title="Campaign" subtitle="Name the promotion and choose the product it supports.">
        <FormGrid>
          <Field label="Campaign name" required className="sm:col-span-2">
            <input className={inputClass} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Q4 antibiotic awareness" />
          </Field>
          <Field label="Product">
            <select className={inputClass} value={form.product_id} onChange={(e) => setField('product_id', e.target.value)}>
              <option value="">All products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Target audience">
            <input className={inputClass} value={form.target_audience} onChange={(e) => setField('target_audience', e.target.value)} placeholder="e.g. Pharmacies in Dar es Salaam" />
          </Field>
          <Field label="Channel">
            <select className={inputClass} value={form.channel} onChange={(e) => setField('channel', e.target.value)}>
              {CHANNELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What is this campaign about?" />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={CalendarDays} tone="gray" title="Schedule" subtitle="When the promotion runs.">
        <FormGrid>
          <Field label="Start date">
            <input type="date" className={inputClass} value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} />
          </Field>
          <Field label="End date">
            <input type="date" className={inputClass} value={form.end_date} onChange={(e) => setField('end_date', e.target.value)} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={Target} title="Budget & results" subtitle="Spend and measured engagement. Values update the campaign KPIs.">
        <FormGrid columns={3}>
          <Field label="Budget (TZS)">
            <input type="number" min="0" step="0.01" className={inputClass} value={form.budget} onChange={(e) => setField('budget', e.target.value)} />
          </Field>
          <Field label="Spend so far (TZS)">
            <input type="number" min="0" step="0.01" className={inputClass} value={form.spend} onChange={(e) => setField('spend', e.target.value)} />
          </Field>
          <Field label="Conversions">
            <input type="number" min="0" className={inputClass} value={form.conversions} onChange={(e) => setField('conversions', e.target.value)} />
          </Field>
          <Field label="Impressions">
            <input type="number" min="0" className={inputClass} value={form.impressions} onChange={(e) => setField('impressions', e.target.value)} />
          </Field>
          <Field label="Clicks">
            <input type="number" min="0" className={inputClass} value={form.clicks} onChange={(e) => setField('clicks', e.target.value)} />
          </Field>
        </FormGrid>
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-500">
          <BarChart3 className="h-3.5 w-3.5 shrink-0" />
          Cost per conversion and conversion rate are calculated automatically.
        </p>
      </FormSection>
    </FormShell>
  )
}
