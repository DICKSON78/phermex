import { useState } from 'react'
import { Download, FileSpreadsheet, Database, CalendarRange } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Panel,
  Badge,
  Spinner,
  Modal,
  Field,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  DateRangeFilter,
  formatDate,
  formatNumber,
} from './ManufacturerUI'
import { defaultRange, downloadCsv, usePortalData } from './usePortalData'

export default function ManufacturerDataExportsPage() {
  const [range, setRange] = useState(defaultRange)
  const [selected, setSelected] = useState(null)
  const [exportRange, setExportRange] = useState(defaultRange())
  const { data, loading, error } = usePortalData('/manufacturer-portal/exports', range)

  const types = data?.types || []
  const totalRows = types.reduce((sum, type) => sum + Number(type.rows || 0), 0)

  const openExport = (type) => {
    setExportRange(range)
    setSelected(type)
  }

  const runExport = (event) => {
    event?.preventDefault?.()
    if (!selected) return
    downloadCsv(
      `/manufacturer-portal/exports/${selected.key}`,
      `manufacturer-${selected.key}-${exportRange.from}-to-${exportRange.to}.csv`,
      exportRange
    )
    setSelected(null)
  }

  return (
    <div>
      <PageHeader
        title="Data exports"
        subtitle="Download your manufacturer data as CSV for analysis, audits or reporting."
      />

      <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FileSpreadsheet} label="Export types" value={types.length} hint="Ready to download" />
            <StatCard icon={Database} label="Available rows" value={formatNumber(totalRows)} hint="Across all export types" tone="text-blue-700" />
            <StatCard icon={CalendarRange} label="Period start" value={formatDate(data?.period?.from)} hint="Change with the date filter" tone="text-[#000F14]" />
            <StatCard icon={CalendarRange} label="Period end" value={formatDate(data?.period?.to)} hint="Inclusive" />
          </div>

          <Panel
            title="Available exports"
            subtitle="Each export respects the date range shown above."
            className="mt-5"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {types.map((type) => (
                <div key={type.key} className="flex flex-col rounded-xl border border-gray-100 p-4 transition-colors hover:border-[#0FD452]/40">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FD452]/10 text-[#0a8f3c]">
                      <FileSpreadsheet className="h-5 w-5" />
                    </span>
                    <Badge tone="gray">{formatNumber(type.rows)} rows</Badge>
                  </div>
                  <p className="text-sm font-bold text-[#000F14]">{type.label}</p>
                  <p className="mt-1 flex-1 text-xs text-gray-500">{type.description}</p>
                  <button
                    onClick={() => openExport(type)}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0FD452] px-3 py-2 text-xs font-semibold text-[#000F14] hover:bg-[#0cb843]"
                  >
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">Export tips</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-blue-700">
              <li>CSV files open in Excel, Google Sheets and most BI tools.</li>
              <li>Sales and performance exports use the order date, not the product creation date.</li>
              <li>Exports only include data owned by your manufacturer account.</li>
            </ul>
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Export ${selected?.label || 'data'}`}
        subtitle={selected?.description}
        size="max-w-md"
        footer={
          <>
            <SecondaryButton onClick={() => setSelected(null)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={runExport}>
              <Download className="h-4 w-4" /> Download CSV
            </PrimaryButton>
          </>
        }
      >
        <form onSubmit={runExport} className="space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            <p className="flex items-center justify-between"><span>Rows available</span><strong className="text-[#000F14]">{formatNumber(selected?.rows)}</strong></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <input
                type="date"
                className={inputClass}
                value={exportRange.from}
                onChange={(event) => setExportRange((previous) => ({ ...previous, from: event.target.value }))}
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                className={inputClass}
                value={exportRange.to}
                onChange={(event) => setExportRange((previous) => ({ ...previous, to: event.target.value }))}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  )
}
