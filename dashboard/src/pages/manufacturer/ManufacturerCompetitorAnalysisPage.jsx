import { useState } from 'react'
import { Users, Trophy, Wallet, Target, Eye } from 'lucide-react'
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

export default function ManufacturerCompetitorAnalysisPage() {
  const [range, setRange] = useState(defaultRange)
  const [selected, setSelected] = useState(null)
  const { data, loading, error } = usePortalData('/manufacturer-portal/analytics/competitors', range)

  const summary = data?.summary || {}
  const manufacturers = data?.manufacturers || []
  const products = data?.products || []
  const maxRevenue = Math.max(1, ...manufacturers.map((manufacturer) => manufacturer.revenue))

  return (
    <div>
      <PageHeader
        title="Competitor analysis"
        subtitle="Compare your market share with other manufacturers in the same categories."
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Trophy} label="Your market share" value={`${summary.our_share ?? 0}%`} hint={`Rank ${summary.our_rank ?? '—'} of ${summary.total_manufacturers ?? 0}`} />
            <StatCard icon={Wallet} label="Category revenue" value={formatMoney(summary.market_revenue)} hint={`Yours: ${formatMoney(summary.our_revenue)}`} tone="text-[#000F14]" />
            <StatCard icon={Users} label="Competitors" value={summary.competitors ?? 0} hint="Manufacturers in your categories" tone="text-blue-700" />
            <StatCard icon={Target} label="Market leader" value={summary.leading_competitor || 'You'} hint="Largest competitor by revenue" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <Panel title="Revenue by manufacturer" subtitle="Your position against the market" className="xl:col-span-2">
              {manufacturers.length === 0 ? (
                <EmptyState title="No market data" message="Category sales will appear here once orders are recorded." />
              ) : (
                <TrendChart
                  data={manufacturers}
                  type="bar"
                  xKey="name"
                  height={300}
                  series={[{ key: 'revenue', label: 'Revenue', color: '#0FD452' }]}
                />
              )}
            </Panel>

            <Panel title="Market share" subtitle="Share of category revenue">
              {manufacturers.length === 0 ? (
                <EmptyState title="No share data" message="Add products to categories with market activity." />
              ) : (
                <div className="space-y-4">
                  {manufacturers.slice(0, 8).map((manufacturer) => (
                    <div key={manufacturer.name}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className={`truncate ${manufacturer.is_own ? 'font-bold text-[#0a8f3c]' : 'font-medium text-[#000F14]'}`}>
                          {manufacturer.name}{manufacturer.is_own ? ' (you)' : ''}
                        </span>
                        <span className="shrink-0 text-gray-500">{manufacturer.share}%</span>
                      </div>
                      <ProgressBar
                        value={(manufacturer.revenue / maxRevenue) * 100}
                        tone={manufacturer.is_own ? 'bg-[#0FD452]' : 'bg-gray-300'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Manufacturer ranking" subtitle="Ranked by category revenue">
              {manufacturers.length === 0 ? (
                <EmptyState title="No manufacturers" message="Competitor data appears when categories have sales." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-2 py-2.5 font-semibold">#</th>
                        <th className="px-2 py-2.5 font-semibold">Manufacturer</th>
                        <th className="px-2 py-2.5 font-semibold">Revenue</th>
                        <th className="px-2 py-2.5 font-semibold">Share</th>
                        <th className="px-2 py-2.5 text-right font-semibold">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {manufacturers.map((manufacturer) => (
                        <tr key={manufacturer.name} className={manufacturer.is_own ? 'bg-[#0FD452]/5' : 'hover:bg-gray-50/60'}>
                          <td className="px-2 py-3 text-gray-500">{manufacturer.rank}</td>
                          <td className="px-2 py-3">
                            <p className={`font-semibold ${manufacturer.is_own ? 'text-[#0a8f3c]' : 'text-[#000F14]'}`}>
                              {manufacturer.name}{manufacturer.is_own ? ' (you)' : ''}
                            </p>
                            <p className="text-xs text-gray-400">{manufacturer.products} products</p>
                          </td>
                          <td className="px-2 py-3 text-gray-700">{formatMoney(manufacturer.revenue)}</td>
                          <td className="px-2 py-3 text-gray-600">{manufacturer.share}%</td>
                          <td className="px-2 py-3 text-right">
                            <button
                              onClick={() => setSelected(manufacturer)}
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

            <Panel title="Top products in your categories" subtitle="Your products and competitor products together">
              {products.length === 0 ? (
                <EmptyState title="No product data" message="Product-level competitor data appears with sales." />
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <div key={`${product.manufacturer}-${product.name}`} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#000F14]">{product.name}</p>
                        <p className="truncate text-xs text-gray-400">{product.manufacturer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#000F14]">{formatMoney(product.revenue)}</p>
                        <p className="text-xs text-gray-400">{formatNumber(product.units)} units</p>
                      </div>
                      {product.is_own && <Badge tone="green">You</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Manufacturer'}
        subtitle="Competitive position detail"
        size="max-w-lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={selected.is_own ? 'green' : 'gray'}>{selected.is_own ? 'Your company' : 'Competitor'}</Badge>
              <Badge tone="blue">Rank #{selected.rank}</Badge>
              <Badge tone="gray">{selected.products} products</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Revenue</p>
                <p className="mt-1 font-semibold text-[#000F14]">{formatMoney(selected.revenue)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Units</p>
                <p className="mt-1 font-semibold text-[#000F14]">{formatNumber(selected.units)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Market share</p>
                <p className="mt-1 font-semibold text-[#000F14]">{selected.share}%</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400">Products</p>
                <p className="mt-1 font-semibold text-[#000F14]">{selected.products}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[#000F14]">Products in the same categories</p>
              <div className="space-y-2">
                {products.filter((product) => product.manufacturer === selected.name).length === 0 ? (
                  <p className="text-sm text-gray-400">No product-level sales recorded for this manufacturer.</p>
                ) : (
                  products
                    .filter((product) => product.manufacturer === selected.name)
                    .map((product) => (
                      <div key={product.name} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm">
                        <span className="text-gray-700">{product.name}</span>
                        <span className="font-medium text-[#000F14]">{formatMoney(product.revenue)}</span>
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
