import { useState } from 'react'
import { ShoppingCart, Boxes, Wallet, TrendingUp, MapPin, Eye } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Panel,
  TrendChart,
  DataBar,
  Spinner,
  EmptyState,
  Modal,
  Badge,
  DateRangeFilter,
  GrowthBadge,
  formatMoney,
  formatNumber,
} from './ManufacturerUI'
import { defaultRange, usePortalData } from './usePortalData'

export default function ManufacturerMarketDemandPage() {
  const [range, setRange] = useState(defaultRange)
  const [selected, setSelected] = useState(null)
  const { data, loading, error } = usePortalData('/manufacturer-portal/intelligence/market-demand', range)

  const summary = data?.summary || {}
  const monthly = data?.monthly || []
  const topProducts = data?.top_products || []
  const regions = data?.by_region || []
  const maxUnits = Math.max(1, ...topProducts.map((product) => product.units))
  const maxRegion = Math.max(1, ...regions.map((region) => region.units))

  return (
    <div>
      <PageHeader
        title="Market demand"
        subtitle="Track how demand for your products moves over time and where it comes from."
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Boxes} label="Units demanded" value={formatNumber(summary.units_sold)} hint="Selected period" />
            <StatCard icon={ShoppingCart} label="Orders" value={formatNumber(summary.orders)} hint={`Avg ${formatMoney(summary.avg_order_value)}`} tone="text-blue-700" />
            <StatCard icon={Wallet} label="Revenue" value={formatMoney(summary.revenue)} hint="Marketplace sales" tone="text-[#000F14]" />
            <StatCard icon={TrendingUp} label="Month-on-month growth" value={<GrowthBadge value={summary.growth} />} hint={`Peak: ${summary.peak_month || '—'}`} />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <Panel title="Demand trend" subtitle="Units sold per month" className="xl:col-span-2">
              <TrendChart
                data={monthly}
                series={[
                  { key: 'units', label: 'Units', color: '#0FD452' },
                  { key: 'orders', label: 'Orders', color: '#3B82F6' },
                ]}
                height={280}
              />
            </Panel>

            <Panel title="Most demanded products" subtitle="Ranked by units sold">
              {topProducts.length === 0 ? (
                <EmptyState title="No demand yet" message="Sales will appear once pharmacies order your products." />
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product) => (
                    <button
                      key={product.name}
                      onClick={() => setSelected(product)}
                      className="w-full rounded-xl p-1 text-left transition-colors hover:bg-gray-50"
                    >
                      <DataBar
                        label={product.name}
                        value={product.units}
                        max={maxUnits}
                        hint={`${formatNumber(product.units)} units`}
                      />
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#0a8f3c]">
                        <Eye className="h-3 w-3" /> View demand
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Demand by region" subtitle="Units sold across regions">
              {regions.length === 0 ? (
                <EmptyState icon={MapPin} title="No regional data" message="Orders with a pharmacy region will appear here." />
              ) : (
                <div className="space-y-4">
                  {regions.map((region) => (
                    <DataBar
                      key={region.region}
                      label={region.region}
                      value={region.units}
                      max={maxRegion}
                      hint={`${formatNumber(region.units)} units · ${region.pharmacies} pharmacies`}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Monthly detail" subtitle="Revenue and orders for each month">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-2 py-2.5 font-semibold">Month</th>
                      <th className="px-2 py-2.5 font-semibold">Units</th>
                      <th className="px-2 py-2.5 font-semibold">Orders</th>
                      <th className="px-2 py-2.5 font-semibold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthly.map((month) => (
                      <tr key={month.key}>
                        <td className="px-2 py-2.5 font-medium text-[#000F14]">{month.month}</td>
                        <td className="px-2 py-2.5 text-gray-600">{formatNumber(month.units)}</td>
                        <td className="px-2 py-2.5 text-gray-600">{month.orders}</td>
                        <td className="px-2 py-2.5 text-gray-700">{formatMoney(month.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Product demand'}
        subtitle="Demand detail for the selected period"
        size="max-w-md"
        footer={<button onClick={() => setSelected(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>}
      >
        {selected && (
          <div className="space-y-4">
            <Badge tone="green">{formatNumber(selected.units)} units demanded</Badge>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Revenue</p>
                <p className="mt-1 font-semibold text-[#000F14]">{formatMoney(selected.revenue)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Orders</p>
                <p className="mt-1 font-semibold text-[#000F14]">{selected.orders}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Avg units / order</p>
                <p className="mt-1 font-semibold text-[#000F14]">
                  {selected.orders > 0 ? formatNumber(selected.units / selected.orders) : 0}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Avg price</p>
                <p className="mt-1 font-semibold text-[#000F14]">
                  {formatMoney(selected.units > 0 ? selected.revenue / selected.units : 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
