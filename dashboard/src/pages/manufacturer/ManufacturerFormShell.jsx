import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

const BACK_BUTTON =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800'

/**
 * Shared shell for manufacturer create/edit pages. The manufacturer portal
 * mirrors the pharmacy-owner portal, where records are edited on dedicated
 * routes instead of inside modals.
 */
export function FormShell({
  backTo,
  title,
  subtitle,
  onSubmit,
  submitting = false,
  submitLabel = 'Save changes',
  cancelLabel = 'Cancel',
  children,
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link to={backTo} className={BACK_BUTTON} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#000F14] sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>

      <form onSubmit={onSubmit} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {children}

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-white px-5 py-4">
          <Link
            to={backTo}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {cancelLabel}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0FD452] px-4 py-2.5 text-sm font-semibold text-[#000F14] transition-all hover:bg-[#0cb843] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export function FormSection({ icon: Icon, title, subtitle, children, tone = 'white' }) {
  return (
    <section className={tone === 'gray' ? 'border-t border-gray-200 bg-gray-50/60 p-5 sm:p-6' : 'p-5 sm:p-6'}>
      <div className="mb-5 flex items-start gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0FD452]/10 text-[#0a8f3c]">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h2 className="text-base font-bold text-[#000F14]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export function FormGrid({ children, columns = 2 }) {
  return (
    <div className={`grid gap-4 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {children}
    </div>
  )
}

export function FormPageSpinner() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0FD452] border-t-transparent" />
    </div>
  )
}
