import { useState } from 'react'
import { Wallet, Boxes, ShoppingCart, Award, Eye } from 'lucide-react'
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
  GrowthBadge,
  ProgressBar,
  formatMoney,
  formatNumber,
} from './ManufacturerUI'
import { defaultRange, usePortalData } from './usePortalData'

export default function ManufacturerProductPerformancePage() {
  const [range, setRange] = useState(defaultRange)
  const [selected, setSelected] = useState(null)
  const { data, loading, error } = usePortalData('/manufacturer-portal/analytics/product-performance', range)

  const summary = data?.summary || {}
  const products = data?.products || []
  const monthly = data?.monthly || []
  const maxRevenue = Math.max(1, ...products.map((product) => product.revenue))

  return (
    <div>
      <PageHeader
        title="Product performance"
        subtitle="Revenue, units, growth and stock turnover for every product you sell."
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Wallet} label="Revenue" value={formatMoney(summary.revenue)} hint="Selected period" />
            <StatCard icon={Boxes} label="Units sold" value={formatNumber(summary.units)} hint={<GrowthBadge value={summary.growth} />} tone="text-blue-700" />
            <StatCard icon={ShoppingCart} label="Orders" value={formatNumber(summary.orders)} hint={`Avg ${formatMoney(summary.avg_order_value)}`} tone="text-[#000F14]" />
            <StatCard icon={Award} label="Best product" value={summary.best_product || '—'} hint="By revenue" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <Panel title="Revenue trend" subtitle="Monthly revenue for your products" className="xl:col-span-2">
              <TrendChart
                data={monthly}
                height={280}
                series={[
                  { key: 'revenue', label: 'Revenue', color: '#0FD452' },
                  { key: 'units', label: 'Units', color: '#3B82F6' },
                ]}
              />
            </Panel>

            <Panel title="Revenue share" subtitle="Top products by revenue">
              {products.length === 0 ? (
                <EmptyState title="No product sales" message="Sales will appear once your products are ordered." />
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 8).map((product) => (
                    <div key={product.name}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-[#000F14]">{product.name}</span>
                        <span className="shrink-0 text-gray-500">{product.share}%</span>
                      </div>
                      <ProgressBar value={(product.revenue / maxRevenue) * 100} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Product breakdown" subtitle="Performance compared with the previous period" className="mt-5">
            {products.length === 0 ? (
              <EmptyState title="No products to show" message="Record orders against your products to see performance." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-2 py-2.5 font-semibold">Product</th>
                      <th className="px-2 py-2.5 font-semibold">Units</th>
                      <th className="px-2 py-2.5 font-semibold">Revenue</th>
                      <th className="px-2 py-2.5 font-semibold">Orders</th>
                      <th className="px-2 py-2.5 font-semibold">Avg price</th>
                      <th className="px-2 py-2.5 font-semibold">Stock</th>
                      <th className="px-2 py-2.5 font-semibold">Growth</th>
                      <th className="px-2 py-2.5 text-right font-semibold">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((product) => (
                      <tr key={product.name} className="hover:bg-gray-50/60">
                        <td className="px-2 py-3 font-semibold text-[#000F14]">{product.name}</td>
                        <td className="px-2 py-3 text-gray-700">{formatNumber(product.units)}</td>
                        <td className="px-2 py-3 text-gray-700">{formatMoney(product.revenue)}</td>
                        <td className="px-2 py-3 text-gray-600">{product.orders}</td>
                        <td className="px-2 py-3 text-gray-600">{formatMoney(product.avg_price)}</td>
                        <td className="px-2 py-3 text-gray-600">{formatNumber(product.stock)}</td>
                        <td className="px-2 py-3"><GrowthBadge value={product.growth} /></td>
                        <td className="px-2 py-3 text-right">
                          <button
                            onClick={() => setSelected(product)}
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
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Product performance'}
        subtitle="Compared with the previous period"
        size="max-w-lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">{formatNumber(selected.units)} units</Badge>
              <Badge tone="blue">{selected.share}% revenue share</Badge>
              <GrowthBadge value={selected.growth} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Revenue" value={formatMoney(selected.revenue)} />
              <Detail label="Orders" value={selected.orders} />
              <Detail label="Average price" value={formatMoney(selected.avg_price)} />
              <Detail label="Stock on hand" value={formatNumber(selected.stock)} />
              <Detail label="Pharmacies" value={selected.pharmacies} />
              <Detail label="Revenue share" value={`${selected.share}%`} />
            </div>
          </div>
        )}
      </Modal>
    </div>
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
