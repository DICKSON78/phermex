import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Factory, Globe, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Field, inputClass } from './ManufacturerUI'
import { FormGrid, FormPageSpinner, FormSection, FormShell } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/profile'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  manufacturer_name: '',
  manufacturer_license: '',
  manufacturer_address: '',
  manufacturer_phone: '',
  manufacturer_email: '',
  manufacturer_website: '',
  manufacturer_logo: '',
  manufacturer_description: '',
}

function firstError(error, fallback) {
  const errors = error?.response?.data?.errors
  return errors ? Object.values(errors)[0][0] : error?.response?.data?.message || fallback
}

export default function ManufacturerProfileFormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [fetching, setFetching] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setFetching(true)
    try {
      const { data } = await api.get('/manufacturer-portal/profile')
      const profile = data.profile || {}
      setForm({
        ...EMPTY_FORM,
        ...Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, profile[key] ?? ''])),
      })
    } catch (error) {
      toast.error(firstError(error, 'Could not load the profile.'))
      navigate(LIST_PATH, { replace: true })
    } finally {
      setFetching(false)
    }
  }, [navigate])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Contact name is required.')
      return
    }
    if (!form.manufacturer_name.trim()) {
      toast.error('Manufacturer name is required.')
      return
    }

    setSubmitting(true)
    try {
      await api.put('/manufacturer-portal/profile', form)
      toast.success('Profile updated.')
      navigate(LIST_PATH)
    } catch (error) {
      toast.error(firstError(error, 'Could not update the profile.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) return <FormPageSpinner />

  return (
    <FormShell
      backTo={LIST_PATH}
      title="Edit manufacturer profile"
      subtitle="Update your account and business identity. This is what pharmacies and reports see."
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Save changes"
    >
      <FormSection icon={UserRound} title="Account contact" subtitle="The person who manages this manufacturer account.">
        <FormGrid>
          <Field label="Contact name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </Field>
          <Field label="Account email" required>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </Field>
          <Field label="Account phone">
            <input className={inputClass} value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={Factory} tone="gray" title="Business identity" subtitle="Legal and trading details shown on product information.">
        <FormGrid>
          <Field label="Manufacturer name" required>
            <input className={inputClass} value={form.manufacturer_name} onChange={(e) => setField('manufacturer_name', e.target.value)} />
          </Field>
          <Field label="License number">
            <input className={inputClass} value={form.manufacturer_license} onChange={(e) => setField('manufacturer_license', e.target.value)} />
          </Field>
          <Field label="Business phone">
            <input className={inputClass} value={form.manufacturer_phone} onChange={(e) => setField('manufacturer_phone', e.target.value)} />
          </Field>
          <Field label="Business email">
            <input type="email" className={inputClass} value={form.manufacturer_email} onChange={(e) => setField('manufacturer_email', e.target.value)} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input className={inputClass} value={form.manufacturer_address} onChange={(e) => setField('manufacturer_address', e.target.value)} />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={Globe} title="Online presence" subtitle="Optional public information and company description.">
        <FormGrid>
          <Field label="Website" className="sm:col-span-2">
            <input className={inputClass} value={form.manufacturer_website} onChange={(e) => setField('manufacturer_website', e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Logo URL" className="sm:col-span-2" hint="Paste a public image URL. Leave blank to use the default factory icon.">
            <input className={inputClass} value={form.manufacturer_logo} onChange={(e) => setField('manufacturer_logo', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="About" className="sm:col-span-2">
            <textarea rows={4} className={inputClass} value={form.manufacturer_description} onChange={(e) => setField('manufacturer_description', e.target.value)} placeholder="A short description of your company and therapeutic focus." />
          </Field>
        </FormGrid>
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-500">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          Keep the manufacturer name consistent with the name recorded on pharmacy products so analytics can match sales.
        </p>
      </FormSection>
    </FormShell>
  )
}
