import { useState } from 'react'
import { Building2, Store, Target, Boxes, Eye } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Panel,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  DateRangeFilter,
  ProgressBar,
  formatDate,
  formatMoney,
  formatNumber,
} from './ManufacturerUI'
import { defaultRange, usePortalData } from './usePortalData'

export default function ManufacturerPharmacyPenetrationPage() {
  const [range, setRange] = useState(defaultRange)
  const [selected, setSelected] = useState(null)
  const { data, loading, error } = usePortalData('/manufacturer-portal/intelligence/penetration', range)

  const summary = data?.summary || {}
  const regions = data?.regions || []
  const pharmacies = data?.pharmacies || []

  return (
    <div>
      <PageHeader
        title="Pharmacy penetration"
        subtitle="Measure how many pharmacies stock or order your products, and where the gaps are."
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Target} label="Penetration rate" value={`${summary.penetration_rate ?? 0}%`} hint={`${summary.penetrated ?? 0} of ${summary.total_pharmacies ?? 0} pharmacies`} />
            <StatCard icon={Building2} label="Pharmacies reached" value={summary.penetrated ?? 0} hint={`${summary.not_penetrated ?? 0} not reached`} tone="text-blue-700" />
            <StatCard icon={Boxes} label="Avg units per pharmacy" value={formatNumber(summary.avg_units_per_pharmacy)} hint="Selected period" tone="text-[#000F14]" />
            <StatCard icon={Store} label="Your active products" value={summary.active_products ?? 0} hint="Seen in pharmacy stock" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <Panel title="Penetration by region" subtitle="Share of active pharmacies reached">
              {regions.length === 0 ? (
                <EmptyState title="No regional data" message="Add regions to pharmacies to measure penetration." />
              ) : (
                <div className="space-y-4">
                  {regions.map((region) => (
                    <div key={region.region}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-[#000F14]">{region.region}</span>
                        <span className="shrink-0 text-gray-500">{region.penetrated}/{region.total} · {region.rate}%</span>
                      </div>
                      <ProgressBar value={region.rate} tone={region.rate >= 50 ? 'bg-[#0FD452]' : 'bg-amber-400'} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Pharmacies reached" subtitle="Click a pharmacy for its full detail" className="xl:col-span-2">
              {pharmacies.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No pharmacies reached yet"
                  message="When pharmacies stock or order your products they will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-2 py-2.5 font-semibold">Pharmacy</th>
                        <th className="px-2 py-2.5 font-semibold">Region</th>
                        <th className="px-2 py-2.5 font-semibold">Units</th>
                        <th className="px-2 py-2.5 font-semibold">Revenue</th>
                        <th className="px-2 py-2.5 font-semibold">Last order</th>
                        <th className="px-2 py-2.5 text-right font-semibold">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pharmacies.map((pharmacy) => (
                        <tr key={pharmacy.id} className="hover:bg-gray-50/60">
                          <td className="px-2 py-3">
                            <p className="font-semibold text-[#000F14]">{pharmacy.name}</p>
                            <p className="text-xs text-gray-400">{pharmacy.district || '—'}</p>
                          </td>
                          <td className="px-2 py-3 text-gray-600">{pharmacy.region || '—'}</td>
                          <td className="px-2 py-3 text-gray-700">{formatNumber(pharmacy.units)}</td>
                          <td className="px-2 py-3 text-gray-700">{formatMoney(pharmacy.revenue)}</td>
                          <td className="px-2 py-3 text-gray-600">{formatDate(pharmacy.last_order)}</td>
                          <td className="px-2 py-3 text-right">
                            <button
                              onClick={() => setSelected(pharmacy)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-3.5 w-3.5" /> Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Pharmacy'}
        subtitle="Penetration detail for this pharmacy"
        size="max-w-lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">Stocking {selected.products} products</Badge>
              <Badge tone="gray">{selected.region || 'Unassigned'}</Badge>
              <Badge tone="blue">{selected.district || 'No district'}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Units ordered</p>
                <p className="mt-1 font-semibold text-[#000F14]">{formatNumber(selected.units)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Revenue</p>
                <p className="mt-1 font-semibold text-[#000F14]">{formatMoney(selected.revenue)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Stock on hand</p>
                <p className="mt-1 font-semibold text-[#000F14]">{formatNumber(selected.stock)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Last order</p>
                <p className="mt-1 font-semibold text-[#000F14]">{formatDate(selected.last_order)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
