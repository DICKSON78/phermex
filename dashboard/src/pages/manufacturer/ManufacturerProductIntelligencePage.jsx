import { useMemo, useState } from 'react'
import { Pill, Boxes, Wallet, Building2, Search, Eye } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Panel,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  DateRangeFilter,
  GrowthBadge,
  formatMoney,
  formatNumber,
  inputClass,
} from './ManufacturerUI'
import { defaultRange, usePortalData } from './usePortalData'

export default function ManufacturerProductIntelligencePage() {
  const [range, setRange] = useState(defaultRange)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const { data, loading, error } = usePortalData('/manufacturer-portal/intelligence/product', range)

  const products = useMemo(() => {
    const rows = data?.products || []
    if (!search.trim()) return rows
    const term = search.toLowerCase()
    return rows.filter((product) =>
      [product.name, product.category, product.sku].filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
    )
  }, [data, search])

  const summary = data?.summary || {}
  const categories = data?.by_category || []
  const maxCategory = Math.max(1, ...categories.map((category) => category.revenue))

  return (
    <div>
      <PageHeader
        title="Product intelligence"
        subtitle="How each product in your catalogue is performing across the pharmacy marketplace."
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Pill} label="Catalogue products" value={summary.catalogue_products ?? 0} hint={`${summary.marketed_products ?? 0} seen in marketplace`} />
            <StatCard icon={Boxes} label="Units sold" value={formatNumber(summary.units_sold)} hint="Selected period" tone="text-blue-700" />
            <StatCard icon={Wallet} label="Revenue" value={formatMoney(summary.revenue)} hint={`Avg price ${formatMoney(summary.avg_price)}`} tone="text-[#000F14]" />
            <StatCard icon={Building2} label="Pharmacy reach" value={summary.pharmacy_reach ?? 0} hint="Pharmacies stocking your drugs" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <Panel title="Revenue by category" subtitle="Where your catalogue earns the most" className="lg:col-span-1">
              {categories.length === 0 ? (
                <EmptyState title="No category data" message="Sales will appear once pharmacy orders are recorded." />
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.category}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-[#000F14]">{category.category}</span>
                        <span className="shrink-0 text-gray-500">{formatMoney(category.revenue)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#0FD452]" style={{ width: `${Math.max(2, (category.revenue / maxCategory) * 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{category.products} products · {formatNumber(category.units_sold)} units</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Catalogue performance"
              subtitle="Sales matched to your catalogue products by name."
              className="lg:col-span-2"
              action={
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products…"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              }
            >
              {products.length === 0 ? (
                <EmptyState
                  icon={Pill}
                  title="No products found"
                  message={search ? 'Try a different search.' : 'Add products to your catalogue to unlock intelligence.'}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-2 py-2.5 font-semibold">Product</th>
                        <th className="px-2 py-2.5 font-semibold">Market stock</th>
                        <th className="px-2 py-2.5 font-semibold">Pharmacies</th>
                        <th className="px-2 py-2.5 font-semibold">Units sold</th>
                        <th className="px-2 py-2.5 font-semibold">Revenue</th>
                        <th className="px-2 py-2.5 font-semibold">Growth</th>
                        <th className="px-2 py-2.5 text-right font-semibold">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/60">
                          <td className="px-2 py-3">
                            <p className="font-semibold text-[#000F14]">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.category || product.sku || '—'}</p>
                          </td>
                          <td className="px-2 py-3 text-gray-600">{formatNumber(product.market_stock)}</td>
                          <td className="px-2 py-3 text-gray-600">{product.pharmacies}</td>
                          <td className="px-2 py-3 font-medium text-gray-700">{formatNumber(product.units_sold)}</td>
                          <td className="px-2 py-3 text-gray-700">{formatMoney(product.revenue)}</td>
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
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Product detail'}
        subtitle="Marketplace performance for this catalogue product"
        size="max-w-lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={selected.status === 'active' ? 'green' : 'gray'}>{selected.status}</Badge>
              {selected.sku && <Badge tone="blue">SKU {selected.sku}</Badge>}
              {selected.category && <Badge tone="gray">{selected.category}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Units sold" value={formatNumber(selected.units_sold)} />
              <Detail label="Revenue" value={formatMoney(selected.revenue)} />
              <Detail label="Average price" value={formatMoney(selected.avg_price)} />
              <Detail label="Pharmacies reached" value={selected.pharmacies} />
              <Detail label="Catalogue stock" value={formatNumber(selected.catalogue_stock)} />
              <Detail label="Market stock" value={formatNumber(selected.market_stock)} />
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Growth vs previous period</p>
              <div className="mt-2"><GrowthBadge value={selected.growth} /></div>
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
      <p className="mt-1 text-sm font-semibold text-[#000F14]">{value}</p>
    </div>
  )
}
