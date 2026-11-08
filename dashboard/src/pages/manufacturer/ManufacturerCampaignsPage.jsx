import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Plus, Eye, Pencil, Trash2, Target, Wallet, MousePointerClick, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import {
  PageHeader,
  StatCard,
  Panel,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  formatDate,
  formatMoney,
  formatNumber,
} from './ManufacturerUI'
import { usePortalData } from './usePortalData'

const statusTone = { active: 'green', scheduled: 'blue', paused: 'amber', completed: 'gray', draft: 'gray' }

export default function ManufacturerCampaignsPage() {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const { data, loading, error } = usePortalData('/manufacturer-portal/campaigns', { refresh })
  const [modal, setModal] = useState(null) // { type: 'view'|'delete', campaign }
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const campaigns = data?.campaigns || []
  const products = data?.products || []
  const summary = data?.summary || {}

  const filtered = useMemo(() => {
    if (!search.trim()) return campaigns
    const term = search.toLowerCase()
    return campaigns.filter((campaign) =>
      [campaign.name, campaign.channel, campaign.status, campaign.product?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [campaigns, search])

  const openCreate = () => navigate('/dashboard/manufacturer/analytics/campaigns/new')
  const openEdit = (campaign) => navigate(`/dashboard/manufacturer/analytics/campaigns/${campaign.id}/edit`)

  const remove = async (event) => {
    event?.preventDefault?.()
    if (!modal?.campaign) return
    setSaving(true)
    try {
      await api.delete(`/manufacturer-portal/campaigns/${modal.campaign.id}`)
      toast.success('Campaign deleted.')
      setModal(null)
      setRefresh((value) => value + 1)
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Could not delete the campaign.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Promotions & campaigns"
        subtitle="Plan, run and measure promotions that drive demand for your products."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> New campaign
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
            <StatCard icon={Megaphone} label="Total campaigns" value={summary.total ?? 0} hint={`${summary.active ?? 0} active`} />
            <StatCard icon={Wallet} label="Budget" value={formatMoney(summary.budget)} hint={`Spent ${formatMoney(summary.spend)}`} tone="text-[#000F14]" />
            <StatCard icon={MousePointerClick} label="Conversions" value={formatNumber(summary.conversions)} hint={`${summary.conversion_rate ?? 0}% conversion rate`} tone="text-blue-700" />
            <StatCard icon={Target} label="Cost per conversion" value={formatMoney(summary.cost_per_conversion)} hint={`${formatNumber(summary.impressions)} impressions`} />
          </div>

          <Panel
            title="All campaigns"
            subtitle="Create, edit, pause or close your promotions."
            className="mt-5"
            action={
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaigns…"
                className={`${inputClass} sm:w-64`}
              />
            }
          >
            {filtered.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title={search ? 'No campaigns match your search' : 'No campaigns yet'}
                message={search ? 'Try a different term.' : 'Create your first promotion to reach more pharmacies.'}
                action={!search ? <PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> New campaign</PrimaryButton> : null}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-2 py-2.5 font-semibold">Campaign</th>
                      <th className="px-2 py-2.5 font-semibold">Channel</th>
                      <th className="px-2 py-2.5 font-semibold">Status</th>
                      <th className="px-2 py-2.5 font-semibold">Dates</th>
                      <th className="px-2 py-2.5 font-semibold">Budget</th>
                      <th className="px-2 py-2.5 font-semibold">Conversions</th>
                      <th className="px-2 py-2.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50/60">
                        <td className="px-2 py-3">
                          <p className="font-semibold text-[#000F14]">{campaign.name}</p>
                          <p className="text-xs text-gray-400">{campaign.product?.name || campaign.target_audience || 'All products'}</p>
                        </td>
                        <td className="px-2 py-3 text-gray-600 capitalize">{campaign.channel.replace('_', ' ')}</td>
                        <td className="px-2 py-3">
                          <Badge tone={statusTone[campaign.status] || 'gray'}>{campaign.status}</Badge>
                        </td>
                        <td className="px-2 py-3 text-gray-600">
                          {formatDate(campaign.start_date)} → {formatDate(campaign.end_date)}
                        </td>
                        <td className="px-2 py-3 text-gray-700">
                          {formatMoney(campaign.budget)}
                          <span className="block text-xs text-gray-400">Spent {formatMoney(campaign.spend)}</span>
                        </td>
                        <td className="px-2 py-3 text-gray-700">{formatNumber(campaign.conversions)}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton label="View" onClick={() => setModal({ type: 'view', campaign })}><Eye className="h-4 w-4" /></IconButton>
                            <IconButton label="Edit" onClick={() => openEdit(campaign)}><Pencil className="h-4 w-4" /></IconButton>
                            <IconButton label="Delete" danger onClick={() => setModal({ type: 'delete', campaign })}><Trash2 className="h-4 w-4" /></IconButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}

      <Modal
        open={modal?.type === 'view'}
        onClose={() => setModal(null)}
        title={modal?.campaign?.name || 'Campaign'}
        subtitle="Campaign performance"
        size="max-w-lg"
        footer={<SecondaryButton onClick={() => setModal(null)}>Close</SecondaryButton>}
      >
        {modal?.campaign && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone[modal.campaign.status] || 'gray'}>{modal.campaign.status}</Badge>
              <Badge tone="blue">{modal.campaign.channel.replace('_', ' ')}</Badge>
              <Badge tone="gray">{modal.campaign.product?.name || 'All products'}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Budget" value={formatMoney(modal.campaign.budget)} />
              <Detail label="Spend" value={formatMoney(modal.campaign.spend)} />
              <Detail label="Impressions" value={formatNumber(modal.campaign.impressions)} />
              <Detail label="Clicks" value={formatNumber(modal.campaign.clicks)} />
              <Detail label="Conversions" value={formatNumber(modal.campaign.conversions)} />
              <Detail label="Cost / conversion" value={formatMoney(modal.campaign.conversions > 0 ? modal.campaign.spend / modal.campaign.conversions : 0)} />
              <Detail label="Start" value={formatDate(modal.campaign.start_date)} />
              <Detail label="End" value={formatDate(modal.campaign.end_date)} />
            </div>
            {modal.campaign.target_audience && (
              <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> {modal.campaign.target_audience}
              </p>
            )}
            {modal.campaign.description && <p className="text-sm text-gray-600">{modal.campaign.description}</p>}
          </div>
        )}
      </Modal>

      <Modal
        open={modal?.type === 'delete'}
        onClose={() => !saving && setModal(null)}
        title="Delete campaign"
        subtitle="This cannot be undone."
        size="max-w-md"
        footer={
          <>
            <SecondaryButton onClick={() => setModal(null)} disabled={saving}>Cancel</SecondaryButton>
            <DangerButton onClick={remove} loading={saving}>Delete campaign</DangerButton>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong className="text-[#000F14]">{modal?.campaign?.name}</strong>?
          Its budget and conversion history will be removed.
        </p>
      </Modal>
    </div>
  )
}

function IconButton({ children, label, danger, ...props }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 transition-colors ${danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
    >
      {children}
    </button>
  )
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 font-semibold text-[#000F14]">{value}</p>
    </div>
  )
}
