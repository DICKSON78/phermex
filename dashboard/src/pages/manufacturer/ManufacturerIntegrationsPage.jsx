import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plug, Plus, Pencil, RefreshCw, Trash2, BookOpen, KeyRound, Link2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import {
  PageHeader,
  StatCard,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  formatDate,
  formatMoney,
} from './ManufacturerUI'
import { usePortalData } from './usePortalData'

const statusTone = { connected: 'green', disconnected: 'gray', error: 'red' }

export default function ManufacturerIntegrationsPage() {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const { data, loading, error } = usePortalData('/manufacturer-portal/integrations', { refresh })
  const [modal, setModal] = useState(null) // { type: 'docs'|'delete', integration }
  const [saving, setSaving] = useState(false)

  const integrations = data?.integrations || []
  const summary = data?.summary || {}
  const apiInfo = data?.api || {}

  const openCreate = () => navigate('/dashboard/manufacturer/integrations/new')
  const openEdit = (integration) => navigate(`/dashboard/manufacturer/integrations/${integration.id}/edit`)

  const test = async (integration) => {
    try {
      const { data: payload } = await api.post(`/manufacturer-portal/integrations/${integration.id}/test`)
      toast.success(payload.message || 'Connection successful.')
      setRefresh((value) => value + 1)
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Could not test the connection.')
    }
  }

  const disconnect = async (event) => {
    event?.preventDefault?.()
    if (!modal?.integration) return
    setSaving(true)
    try {
      await api.delete(`/manufacturer-portal/integrations/${modal.integration.id}`)
      toast.success('Integration disconnected.')
      setModal(null)
      setRefresh((value) => value + 1)
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Could not disconnect the integration.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="API / Integrations"
        subtitle="Connect Helix with the systems your team already uses."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add integration
          </PrimaryButton>
        }
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Plug} label="Integrations" value={summary.total ?? 0} hint={`${summary.connected ?? 0} connected`} />
            <StatCard icon={CheckCircle2} label="Connected" value={summary.connected ?? 0} hint="Healthy connections" tone="text-[#0a8f3c]" />
            <StatCard icon={AlertCircle} label="Errors" value={summary.errors ?? 0} hint="Need attention" tone={summary.errors ? 'text-red-600' : 'text-[#000F14]'} />
            <StatCard icon={RefreshCw} label="Last sync" value={formatDate(summary.last_sync)} hint="Most recent activity" tone="text-blue-700" />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex flex-col rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0a8f3c]">
                    <Plug className="h-5 w-5" />
                  </span>
                  <Badge tone={statusTone[integration.status] || 'gray'}>{integration.status}</Badge>
                </div>
                <p className="text-base font-bold text-[#000F14]">{integration.name}</p>
                <p className="mt-1 flex-1 text-sm text-gray-500">{integration.description || 'No description provided.'}</p>
                {integration.endpoint && (
                  <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-gray-400">
                    <Link2 className="h-3.5 w-3.5 shrink-0" /> {integration.endpoint}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">Last sync: {formatDate(integration.last_synced_at)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => test(integration)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0FD452] px-2.5 py-1.5 text-xs font-semibold text-[#000F14] hover:bg-[#0cb843]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> {integration.status === 'connected' ? 'Re-test' : 'Connect'}
                  </button>
                  <button
                    onClick={() => openEdit(integration)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setModal({ type: 'delete', integration })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>

          {integrations.length === 0 && (
            <EmptyState
              icon={Plug}
              title="No integrations configured"
              message="Add an integration to sync data with your ERP, CRM or analytics tools."
              action={<PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> Add integration</PrimaryButton>}
            />
          )}

          <div className="mt-5 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-[#000F14]">
                  <KeyRound className="h-4 w-4 text-[#0a8f3c]" /> Helix REST API
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Base URL <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{apiInfo.base_url}</code>
                  {' · '}Version {apiInfo.version} {' · '}Auth {apiInfo.auth}
                </p>
              </div>
              <SecondaryButton onClick={() => setModal({ type: 'docs' })}>
                <BookOpen className="h-4 w-4" /> View API docs
              </SecondaryButton>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-2 py-2.5 font-semibold">Method</th>
                    <th className="px-2 py-2.5 font-semibold">Endpoint</th>
                    <th className="px-2 py-2.5 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(apiInfo.endpoints || []).map((endpoint) => (
                    <tr key={`${endpoint.method}-${endpoint.path}`}>
                      <td className="px-2 py-2.5"><Badge tone="blue">{endpoint.method}</Badge></td>
                      <td className="px-2 py-2.5 font-mono text-xs text-gray-700">{endpoint.path}</td>
                      <td className="px-2 py-2.5 text-gray-500">{endpoint.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal
        open={modal?.type === 'docs'}
        onClose={() => setModal(null)}
        title="Helix API documentation"
        subtitle="Manufacturer portal endpoints"
        size="max-w-2xl"
        footer={<SecondaryButton onClick={() => setModal(null)}>Close</SecondaryButton>}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p><strong className="text-[#000F14]">Base URL:</strong> {apiInfo.base_url}</p>
            <p className="mt-1"><strong className="text-[#000F14]">Auth:</strong> {apiInfo.auth}</p>
            <p className="mt-1"><strong className="text-[#000F14]">Version:</strong> {apiInfo.version}</p>
          </div>
          <div className="space-y-2">
            {(apiInfo.endpoints || []).map((endpoint) => (
              <div key={endpoint.path} className="rounded-xl border border-gray-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{endpoint.method}</Badge>
                  <code className="text-xs text-gray-700">{endpoint.path}</code>
                </div>
                <p className="mt-1 text-xs text-gray-500">{endpoint.description}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            All requests must include an Authorization header with a valid Sanctum bearer token issued to a
            manufacturer account. Responses are JSON; exports return text/csv.
          </p>
        </div>
      </Modal>

      <Modal
        open={modal?.type === 'delete'}
        onClose={() => !saving && setModal(null)}
        title="Disconnect integration"
        subtitle="Your data will stop syncing."
        size="max-w-md"
        footer={
          <>
            <SecondaryButton onClick={() => setModal(null)} disabled={saving}>Cancel</SecondaryButton>
            <DangerButton onClick={disconnect} loading={saving}>Disconnect</DangerButton>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Disconnect <strong className="text-[#000F14]">{modal?.integration?.name}</strong>? The configuration is kept
          so you can reconnect later.
        </p>
      </Modal>
    </div>
  )
}
