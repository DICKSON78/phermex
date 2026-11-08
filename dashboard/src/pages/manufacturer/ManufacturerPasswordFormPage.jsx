import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Lock, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Field, inputClass } from './ManufacturerUI'
import { FormSection, FormShell } from './ManufacturerFormShell'

const LIST_PATH = '/dashboard/manufacturer/profile'

const EMPTY = { current_password: '', password: '', password_confirmation: '' }

export default function ManufacturerPasswordFormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.current_password || !form.password) {
      toast.error('Enter your current and new password.')
      return
    }
    if (form.password !== form.password_confirmation) {
      toast.error('The new password confirmation does not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/user/password', form)
      toast.success('Password changed.')
      navigate(LIST_PATH)
    } catch (error) {
      const errors = error?.response?.data?.errors
      toast.error(errors ? Object.values(errors)[0][0] : error?.response?.data?.message || 'Could not change the password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormShell
      backTo={LIST_PATH}
      title="Change password"
      subtitle="Choose a strong password that you do not use on other services."
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Change password"
      cancelLabel="Back to profile"
    >
      <FormSection icon={KeyRound} title="Password" subtitle="You will stay signed in on this device.">
        <div className="grid max-w-xl gap-4">
          <Field label="Current password" required>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                autoComplete="current-password"
                className={`${inputClass} pl-9`}
                value={form.current_password}
                onChange={(e) => setField('current_password', e.target.value)}
              />
            </div>
          </Field>
          <Field label="New password" required hint="At least 8 characters.">
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                autoComplete="new-password"
                className={`${inputClass} pl-9`}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
              />
            </div>
          </Field>
          <Field label="Confirm new password" required>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                autoComplete="new-password"
                className={`${inputClass} pl-9`}
                value={form.password_confirmation}
                onChange={(e) => setField('password_confirmation', e.target.value)}
              />
            </div>
          </Field>
        </div>
      </FormSection>
    </FormShell>
  )
}
