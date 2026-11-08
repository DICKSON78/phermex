import { useState } from 'react'
import { MapPin, Building2, Boxes, Wallet, Eye } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Panel,
  TrendChart,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  DateRangeFilter,
  ProgressBar,
  formatMoney,
  formatNumber,
} from './ManufacturerUI'
import { defaultRange, usePortalData } from './usePortalData'

export default function ManufacturerGeographicConsumptionPage() {
  const [range, setRange] = useState(defaultRange)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const { data, loading, error } = usePortalData('/manufacturer-portal/intelligence/geography', range)

  const summary = data?.summary || {}
  const regions = data?.regions || []
  const districts = data?.districts || []
  const maxUnits = Math.max(1, ...regions.map((region) => region.units))

  return (
    <div>
      <PageHeader
        title="Geographic consumption"
        subtitle="See which regions and districts consume the most of your products."
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={MapPin} label="Regions active" value={summary.regions ?? 0} hint={`${summary.districts ?? 0} districts`} />
            <StatCard icon={Building2} label="Pharmacies reached" value={summary.pharmacies ?? 0} hint="In selected period" tone="text-blue-700" />
            <StatCard icon={Boxes} label="Units consumed" value={formatNumber(summary.units_sold)} hint="Selected period" tone="text-[#000F14]" />
            <StatCard icon={MapPin} label="Top region" value={summary.top_region || '—'} hint={`${summary.top_region_share ?? 0}% of units`} />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Panel title="Consumption by region" subtitle="Units consumed in each region">
              {regions.length === 0 ? (
                <EmptyState icon={MapPin} title="No consumption data" message="Orders linked to pharmacy regions will appear here." />
              ) : (
                <TrendChart
                  data={regions}
                  type="bar"
                  xKey="region"
                  height={300}
                  series={[{ key: 'units', label: 'Units', color: '#0FD452' }]}
                />
              )}
            </Panel>

            <Panel title="Regional share" subtitle="Click a region to inspect its districts">
              {regions.length === 0 ? (
                <EmptyState title="No regions" message="Regional data appears once orders are recorded." />
              ) : (
                <div className="space-y-4">
                  {regions.map((region) => (
                    <button
                      key={region.region}
                      onClick={() => setSelectedRegion(region)}
                      className="w-full rounded-xl p-2 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-[#000F14]">{region.region}</span>
                        <span className="text-gray-500">{formatNumber(region.units)} units · {region.share}%</span>
                      </div>
                      <ProgressBar value={(region.units / maxUnits) * 100} />
                      <p className="mt-1 text-xs text-gray-400">{formatMoney(region.revenue)} · {region.pharmacies} pharmacies</p>
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Top districts" subtitle="Highest consuming districts across all regions" className="mt-5">
            {districts.length === 0 ? (
              <EmptyState title="No district data" message="Add district details to pharmacies to unlock this view." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-2 py-2.5 font-semibold">District</th>
                      <th className="px-2 py-2.5 font-semibold">Region</th>
                      <th className="px-2 py-2.5 font-semibold">Units</th>
                      <th className="px-2 py-2.5 font-semibold">Revenue</th>
                      <th className="px-2 py-2.5 font-semibold">Pharmacies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {districts.map((district) => (
                      <tr key={`${district.region}-${district.district}`} className="hover:bg-gray-50/60">
                        <td className="px-2 py-3 font-semibold text-[#000F14]">{district.district}</td>
                        <td className="px-2 py-3 text-gray-600">{district.region}</td>
                        <td className="px-2 py-3 text-gray-700">{formatNumber(district.units)}</td>
                        <td className="px-2 py-3 text-gray-700">{formatMoney(district.revenue)}</td>
                        <td className="px-2 py-3 text-gray-600">{district.pharmacies}</td>
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
        open={!!selectedRegion}
        onClose={() => setSelectedRegion(null)}
        title={selectedRegion?.region || 'Region'}
        subtitle="Regional consumption detail"
        size="max-w-lg"
      >
        {selectedRegion && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">{formatNumber(selectedRegion.units)} units</Badge>
              <Badge tone="blue">{selectedRegion.share}% of total</Badge>
              <Badge tone="gray">{selectedRegion.pharmacies} pharmacies</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Revenue</p>
                <p className="mt-1 font-semibold text-[#000F14]">{formatMoney(selectedRegion.revenue)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Orders</p>
                <p className="mt-1 font-semibold text-[#000F14]">{selectedRegion.orders}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#000F14]">
                <Eye className="h-4 w-4 text-gray-400" /> Districts in this region
              </p>
              <div className="space-y-2">
                {districts.filter((district) => district.region === selectedRegion.region).length === 0 ? (
                  <p className="text-sm text-gray-400">No district-level sales recorded yet.</p>
                ) : (
                  districts
                    .filter((district) => district.region === selectedRegion.region)
                    .map((district) => (
                      <div key={district.district} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm">
                        <span className="text-gray-700">{district.district}</span>
                        <span className="font-medium text-[#000F14]">{formatNumber(district.units)} units</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
