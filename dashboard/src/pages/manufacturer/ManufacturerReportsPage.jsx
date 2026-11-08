import { useState } from 'react'
import { FileText, Download, Eye, RefreshCw, Wallet, Boxes, AlertTriangle, Megaphone } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Panel,
  Badge,
  Spinner,
  DateRangeFilter,
  Modal,
  PrimaryButton,
  SecondaryButton,
  formatDate,
  formatMoney,
  formatNumber,
} from './ManufacturerUI'
import { defaultRange, downloadCsv, usePortalData } from './usePortalData'

export default function ManufacturerReportsPage() {
  const [range, setRange] = useState(defaultRange)
  const [selected, setSelected] = useState(null)
  const { data, loading, error, reload } = usePortalData('/manufacturer-portal/analytics/reports', range)

  const cards = data?.cards || {}
  const reports = data?.available_reports || []

  const exportReport = (key) => {
    downloadCsv(`/manufacturer-portal/exports/${key}`, `manufacturer-${key}-${range.from}-to-${range.to}.csv`, range)
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and download reports for sales, stock, campaigns and market coverage."
        action={
          <SecondaryButton onClick={reload}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </SecondaryButton>
        }
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Wallet} label="Sales revenue" value={formatMoney(cards.sales?.revenue)} hint={`${formatNumber(cards.sales?.units)} units · ${cards.sales?.orders ?? 0} orders`} />
            <StatCard icon={Boxes} label="Inventory value" value={formatMoney(cards.inventory?.value)} hint={`${formatNumber(cards.inventory?.total_stock)} units on hand`} tone="text-blue-700" />
            <StatCard icon={AlertTriangle} label="Open recalls" value={cards.recalls?.open ?? 0} hint={`${cards.recalls?.total ?? 0} total recalls`} tone="text-red-600" />
            <StatCard icon={Megaphone} label="Campaign conversions" value={formatNumber(cards.campaigns?.conversions)} hint={`${formatMoney(cards.campaigns?.spend)} spend`} />
          </div>

          <Panel
            title="Available reports"
            subtitle={`Period ${formatDate(data?.period?.from)} – ${formatDate(data?.period?.to)} · Generated ${formatDate(data?.generated_at)}`}
            className="mt-5"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {reports.map((report) => (
                <div key={report.key} className="flex flex-col rounded-xl border border-gray-100 p-4 transition-colors hover:border-[#0FD452]/40">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0a8f3c]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-bold text-[#000F14]">{report.label}</p>
                  <p className="mt-1 flex-1 text-xs text-gray-500">{report.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelected(report)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => exportReport(report.key)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0FD452] px-2.5 py-1.5 text-xs font-semibold text-[#000F14] hover:bg-[#0cb843]"
                    >
                      <Download className="h-3.5 w-3.5" /> CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Sales & growth" subtitle="Summary for the selected period">
              <SummaryRow label="Revenue" value={formatMoney(cards.sales?.revenue)} />
              <SummaryRow label="Units sold" value={formatNumber(cards.sales?.units)} />
              <SummaryRow label="Orders" value={formatNumber(cards.sales?.orders)} />
              <SummaryRow label="Unit growth" value={`${cards.sales?.growth ?? 0}%`} />
            </Panel>
            <Panel title="Market coverage" subtitle="Geographic footprint">
              <SummaryRow label="Regions active" value={formatNumber(cards.geography?.regions)} />
              <SummaryRow label="Top region" value={cards.geography?.top_region || '—'} />
              <SummaryRow label="Pharmacies reached" value={formatNumber(cards.geography?.pharmacies)} />
              <SummaryRow label="Low stock items" value={formatNumber(cards.inventory?.low_stock)} />
            </Panel>
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.label || 'Report preview'}
        subtitle={selected?.description}
        size="max-w-lg"
        footer={
          <>
            <SecondaryButton onClick={() => setSelected(null)}>Close</SecondaryButton>
            <PrimaryButton onClick={() => { exportReport(selected.key); setSelected(null) }}>
              <Download className="h-4 w-4" /> Download CSV
            </PrimaryButton>
          </>
        }
      >
        {selected && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">{formatDate(data?.period?.from)} – {formatDate(data?.period?.to)}</Badge>
              <Badge tone="gray">Generated {formatDate(data?.generated_at)}</Badge>
            </div>
            <PreviewContent reportKey={selected.key} cards={cards} />
            <p className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
              The CSV includes every matching record for the selected date range. Use the date filter
              to change the period before downloading.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function PreviewContent({ reportKey, cards }) {
  const rows = {
    sales: [
      ['Revenue', formatMoney(cards.sales?.revenue)],
      ['Units', formatNumber(cards.sales?.units)],
      ['Orders', formatNumber(cards.sales?.orders)],
      ['Growth', `${cards.sales?.growth ?? 0}%`],
    ],
    performance: [
      ['Revenue', formatMoney(cards.sales?.revenue)],
      ['Units', formatNumber(cards.sales?.units)],
      ['Orders', formatNumber(cards.sales?.orders)],
      ['Growth', `${cards.sales?.growth ?? 0}%`],
    ],
    inventory: [
      ['Units on hand', formatNumber(cards.inventory?.total_stock)],
      ['Inventory value', formatMoney(cards.inventory?.value)],
      ['Low stock', formatNumber(cards.inventory?.low_stock)],
      ['Expiring soon', formatNumber(cards.inventory?.expiring_soon)],
    ],
    geography: [
      ['Regions', formatNumber(cards.geography?.regions)],
      ['Top region', cards.geography?.top_region || '—'],
      ['Pharmacies reached', formatNumber(cards.geography?.pharmacies)],
    ],
    competitors: [
      ['Revenue', formatMoney(cards.sales?.revenue)],
      ['Units', formatNumber(cards.sales?.units)],
      ['Orders', formatNumber(cards.sales?.orders)],
    ],
    campaigns: [
      ['Campaigns', formatNumber(cards.campaigns?.total)],
      ['Active', formatNumber(cards.campaigns?.active)],
      ['Budget', formatMoney(cards.campaigns?.budget)],
      ['Spend', formatMoney(cards.campaigns?.spend)],
      ['Conversions', formatNumber(cards.campaigns?.conversions)],
    ],
    recalls: [
      ['Total recalls', formatNumber(cards.recalls?.total)],
      ['Open recalls', formatNumber(cards.recalls?.open)],
      ['Affected units', formatNumber(cards.recalls?.affected_quantity)],
      ['Returned units', formatNumber(cards.recalls?.returned_quantity)],
    ],
    products: [
      ['Units on hand', formatNumber(cards.inventory?.total_stock)],
      ['Low stock', formatNumber(cards.inventory?.low_stock)],
      ['Expiring soon', formatNumber(cards.inventory?.expiring_soon)],
    ],
  }[reportKey] || []

  return (
    <div className="divide-y divide-gray-50 rounded-xl border border-gray-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
          <span className="text-gray-500">{label}</span>
          <span className="font-semibold text-[#000F14]">{value}</span>
        </div>
      ))}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-2.5 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#000F14]">{value}</span>
    </div>
  )
}
