import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LifeBuoy, MessageSquare, ShieldQuestion } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Field, inputClass } from './ManufacturerUI'
import { FormGrid, FormSection, FormShell } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/help'

const EMPTY_FORM = { subject: '', description: '', priority: 'medium', category: 'general' }

export default function ManufacturerSupportFormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject and description are required.')
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/manufacturer-portal/support', form)
      toast.success('Support ticket created.')
      if (data?.ticket?.id) {
        navigate(`/dashboard/manufacturer/help/${data.ticket.id}`)
      } else {
        navigate(LIST_PATH)
      }
    } catch (error) {
      const errors = error?.response?.data?.errors
      toast.error(errors ? Object.values(errors)[0][0] : error?.response?.data?.message || 'Could not create the ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormShell
      backTo={LIST_PATH}
      title="New support ticket"
      subtitle="Tell us what you need help with and the Helix team will respond."
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Create ticket"
    >
      <FormSection icon={LifeBuoy} title="What do you need help with?" subtitle="A clear subject helps us route your ticket quickly.">
        <FormGrid>
          <Field label="Subject" required className="sm:col-span-2">
            <input className={inputClass} value={form.subject} onChange={(e) => setField('subject', e.target.value)} placeholder="Short summary of the issue" />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={(e) => setField('category', e.target.value)}>
              <option value="general">General</option>
              <option value="account">Account & profile</option>
              <option value="products">Products & inventory</option>
              <option value="analytics">Analytics & reports</option>
              <option value="integrations">API & integrations</option>
              <option value="billing">Billing</option>
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputClass} value={form.priority} onChange={(e) => setField('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection icon={MessageSquare} tone="gray" title="Description" subtitle="Include product names, dates and any error messages.">
        <Field label="Describe the problem" required>
          <textarea rows={6} className={inputClass} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Describe the problem…" />
        </Field>
      </FormSection>

      <div className="flex items-start gap-2 border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
        <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Check the common questions on the Help & Support page first — most answers are already there.
      </div>
    </FormShell>
  )
}
