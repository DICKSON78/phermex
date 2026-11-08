import { useState } from 'react'
import { Truck, Boxes, AlertTriangle, Clock, CheckCircle2, Eye } from 'lucide-react'
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
  formatDate,
  formatMoney,
  formatNumber,
} from './ManufacturerUI'
import { defaultRange, usePortalData } from './usePortalData'

const riskTone = { expired: 'red', expiring: 'amber', low_stock: 'blue' }

export default function ManufacturerSupplyChainPage() {
  const [range, setRange] = useState(defaultRange)
  const [selected, setSelected] = useState(null)
  const { data, loading, error } = usePortalData('/manufacturer-portal/analytics/supply-chain', range)

  const summary = data?.summary || {}
  const byPharmacy = data?.by_pharmacy || []
  const monthly = data?.monthly || []
  const riskItems = data?.risk_items || []

  return (
    <div>
      <PageHeader
        title="Supply chain intelligence"
        subtitle="Monitor stock health, expiry risk and order fulfilment across your pharmacy network."
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Boxes} label="Units in network" value={formatNumber(summary.total_stock)} hint={formatMoney(summary.stock_value)} />
            <StatCard icon={AlertTriangle} label="Stock risks" value={(summary.low_stock ?? 0) + (summary.expiring_soon ?? 0) + (summary.expired ?? 0)} hint={`${summary.low_stock ?? 0} low · ${summary.expiring_soon ?? 0} expiring · ${summary.expired ?? 0} expired`} tone="text-red-600" />
            <StatCard icon={Truck} label="Pending orders" value={summary.pending_orders ?? 0} hint={`${summary.pharmacies ?? 0} pharmacies in network`} tone="text-blue-700" />
            <StatCard icon={CheckCircle2} label="Fulfilment rate" value={`${summary.fulfillment_rate ?? 0}%`} hint={`Avg ${summary.avg_fulfillment_days ?? 0} days to fulfil`} />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <Panel title="Fulfilment trend" subtitle="Units and orders processed each month" className="xl:col-span-2">
              <TrendChart
                data={monthly}
                height={280}
                series={[
                  { key: 'units', label: 'Units', color: '#0FD452' },
                  { key: 'orders', label: 'Orders', color: '#3B82F6' },
                ]}
              />
            </Panel>

            <Panel title="Network health" subtitle="Snapshot of current stock signals">
              <div className="space-y-3">
                <Signal label="Low stock" value={summary.low_stock ?? 0} tone="text-amber-600" />
                <Signal label="Expiring in 90 days" value={summary.expiring_soon ?? 0} tone="text-amber-600" />
                <Signal label="Already expired" value={summary.expired ?? 0} tone="text-red-600" />
                <Signal label="Pending orders" value={summary.pending_orders ?? 0} tone="text-blue-700" />
                <Signal label="Pharmacies stocked" value={summary.pharmacies ?? 0} tone="text-[#0F9D58]" />
              </div>
            </Panel>
          </div>

          <Panel title="Stock risk register" subtitle="Low stock and expiry issues that need action" className="mt-5">
            {riskItems.length === 0 ? (
              <EmptyState icon={Clock} title="No stock risks" message="Stock levels and expiry dates look healthy right now." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-2 py-2.5 font-semibold">Product</th>
                      <th className="px-2 py-2.5 font-semibold">Pharmacy</th>
                      <th className="px-2 py-2.5 font-semibold">Batch</th>
                      <th className="px-2 py-2.5 font-semibold">Quantity</th>
                      <th className="px-2 py-2.5 font-semibold">Expiry</th>
                      <th className="px-2 py-2.5 font-semibold">Risk</th>
                      <th className="px-2 py-2.5 text-right font-semibold">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {riskItems.map((item, index) => (
                      <tr key={`${item.name}-${item.batch}-${index}`} className="hover:bg-gray-50/60">
                        <td className="px-2 py-3 font-semibold text-[#000F14]">{item.name}</td>
                        <td className="px-2 py-3 text-gray-600">{item.pharmacy || '—'}</td>
                        <td className="px-2 py-3 text-gray-600">{item.batch || '—'}</td>
                        <td className="px-2 py-3 text-gray-700">{formatNumber(item.quantity)} / {formatNumber(item.reorder_level)}</td>
                        <td className="px-2 py-3 text-gray-600">{formatDate(item.expiry_date)}</td>
                        <td className="px-2 py-3">
                          <Badge tone={riskTone[item.risk] || 'gray'}>{item.risk.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <button
                            onClick={() => setSelected(item)}
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

          <Panel title="Stock by pharmacy" subtitle="Inventory and sales across your network" className="mt-5">
            {byPharmacy.length === 0 ? (
              <EmptyState icon={Truck} title="No pharmacies stocked" message="Pharmacies stocking your products will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-2 py-2.5 font-semibold">Pharmacy</th>
                      <th className="px-2 py-2.5 font-semibold">Region</th>
                      <th className="px-2 py-2.5 font-semibold">Stock</th>
                      <th className="px-2 py-2.5 font-semibold">Low stock</th>
                      <th className="px-2 py-2.5 font-semibold">Expiring</th>
                      <th className="px-2 py-2.5 font-semibold">Units sold</th>
                      <th className="px-2 py-2.5 font-semibold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byPharmacy.map((row) => (
                      <tr key={row.pharmacy_id} className="hover:bg-gray-50/60">
                        <td className="px-2 py-3 font-semibold text-[#000F14]">{row.pharmacy}</td>
                        <td className="px-2 py-3 text-gray-600">{row.region || '—'}</td>
                        <td className="px-2 py-3 text-gray-700">{formatNumber(row.stock)}</td>
                        <td className="px-2 py-3">{row.low_stock > 0 ? <Badge tone="amber">{row.low_stock}</Badge> : '—'}</td>
                        <td className="px-2 py-3">{row.expiring > 0 ? <Badge tone="red">{row.expiring}</Badge> : '—'}</td>
                        <td className="px-2 py-3 text-gray-700">{formatNumber(row.units_sold)}</td>
                        <td className="px-2 py-3 text-gray-700">{formatMoney(row.revenue)}</td>
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
        title={selected?.name || 'Stock risk'}
        subtitle="Supply chain risk detail"
        size="max-w-lg"
        footer={<button onClick={() => setSelected(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={riskTone[selected.risk] || 'gray'}>{selected.risk.replace('_', ' ')}</Badge>
              {selected.batch && <Badge tone="gray">Batch {selected.batch}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Pharmacy" value={selected.pharmacy || '—'} />
              <Detail label="Quantity" value={formatNumber(selected.quantity)} />
              <Detail label="Reorder level" value={formatNumber(selected.reorder_level)} />
              <Detail label="Expiry date" value={formatDate(selected.expiry_date)} />
              <Detail label="Days to expiry" value={selected.days_to_expiry ?? '—'} />
              <Detail label="Risk type" value={selected.risk.replace('_', ' ')} />
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              {selected.risk === 'expired'
                ? 'This batch is past its expiry date and should be quarantined and recalled.'
                : selected.risk === 'expiring'
                  ? 'This batch expires within 90 days. Prioritise redistribution or promotion.'
                  : 'Stock is at or below the reorder level. Raise a replenishment order.'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Signal({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3.5 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-lg font-bold ${tone}`}>{formatNumber(value)}</span>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 font-semibold capitalize text-[#000F14]">{value}</p>
    </div>
  )
}
