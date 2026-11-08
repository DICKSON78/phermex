import { useState } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, SlidersHorizontal, CalendarClock } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Panel,
  TrendChart,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  Field,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  GrowthBadge,
  formatNumber,
} from './ManufacturerUI'
import { usePortalData } from './usePortalData'

export default function ManufacturerDemandForecastPage() {
  const [horizon, setHorizon] = useState(6)
  const [draftHorizon, setDraftHorizon] = useState(6)
  const [showSettings, setShowSettings] = useState(false)
  const { data, loading, error } = usePortalData('/manufacturer-portal/intelligence/demand-forecast', { horizon })

  const summary = data?.summary || {}
  const history = data?.history || []
  const forecast = data?.forecast || []
  const products = data?.products || []

  const chartData = [
    ...history.map((month, index) => ({
      month: month.month,
      actual: month.units,
      forecast: index === history.length - 1 ? month.units : null,
    })),
    ...forecast.map((month) => ({ month: month.month, forecast: month.forecast })),
  ]

  const applySettings = (event) => {
    event?.preventDefault?.()
    setHorizon(Math.max(1, Math.min(12, Number(draftHorizon || 6))))
    setShowSettings(false)
  }

  return (
    <div>
      <PageHeader
        title="Demand forecast"
        subtitle="A statistical projection of future demand built from the last 12 months of sales."
        action={
          <PrimaryButton onClick={() => { setDraftHorizon(horizon); setShowSettings(true) }}>
            <SlidersHorizontal className="h-4 w-4" /> Configure
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
            <StatCard icon={Brain} label="Next month forecast" value={`${formatNumber(summary.next_month_units)} units`} hint={summary.method} />
            <StatCard icon={TrendingUp} label="Expected growth" value={<GrowthBadge value={summary.expected_growth} />} hint="Versus last recorded month" tone="text-[#000F14]" />
            <StatCard icon={CalendarClock} label="Forecast horizon" value={`${summary.horizon || horizon} months`} hint={`${summary.history_months || 0} months of history`} tone="text-blue-700" />
            <StatCard icon={Brain} label="Model confidence" value={`${summary.confidence || 0}%`} hint="Based on trend fit (R²)" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <Panel title="Historical demand vs forecast" subtitle="Solid line is actual demand, dashed line is the projection" className="xl:col-span-2">
              <TrendChart
                data={chartData}
                type="line"
                height={300}
                series={[
                  { key: 'actual', label: 'Actual units', color: '#0FD452' },
                  { key: 'forecast', label: 'Forecast units', color: '#3B82F6', dashed: true },
                ]}
              />
            </Panel>

            <Panel title="Forecast months" subtitle="Projected units per month">
              {forecast.length === 0 ? (
                <EmptyState title="No forecast" message="Add sales history to generate a projection." />
              ) : (
                <div className="space-y-2.5">
                  {forecast.map((month) => (
                    <div key={month.month} className="flex items-center justify-between rounded-xl border border-gray-100 px-3.5 py-2.5">
                      <span className="text-sm font-medium text-[#000F14]">{month.month}</span>
                      <span className="text-sm font-semibold text-[#0a8f3c]">{formatNumber(month.forecast)} units</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Product-level forecast" subtitle="Top products with the strongest demand" className="mt-5">
            {products.length === 0 ? (
              <EmptyState title="No product history" message="Once products have sales history, forecasts appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-2 py-2.5 font-semibold">Product</th>
                      <th className="px-2 py-2.5 font-semibold">Avg / month</th>
                      <th className="px-2 py-2.5 font-semibold">Next month</th>
                      <th className="px-2 py-2.5 font-semibold">Trend</th>
                      <th className="px-2 py-2.5 font-semibold">Confidence</th>
                      <th className="px-2 py-2.5 font-semibold">Projection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((product) => {
                      const TrendIcon = product.trend === 'up' ? TrendingUp : product.trend === 'down' ? TrendingDown : Minus
                      return (
                        <tr key={product.name} className="hover:bg-gray-50/60">
                          <td className="px-2 py-3 font-semibold text-[#000F14]">{product.name}</td>
                          <td className="px-2 py-3 text-gray-600">{formatNumber(product.avg_monthly)}</td>
                          <td className="px-2 py-3 text-gray-700">{formatNumber(product.next_month)}</td>
                          <td className="px-2 py-3">
                            <Badge tone={product.trend === 'up' ? 'green' : product.trend === 'down' ? 'red' : 'gray'}>
                              <TrendIcon className="mr-1 h-3.5 w-3.5" />
                              {product.trend}
                            </Badge>
                          </td>
                          <td className="px-2 py-3 text-gray-600">{product.confidence}%</td>
                          <td className="px-2 py-3">
                            <div className="flex flex-wrap gap-1">
                              {product.forecast.slice(0, 3).map((month) => (
                                <span key={month.month} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  {month.month.split(' ')[0]} · {formatNumber(month.units)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">How this forecast works</p>
            <p className="mt-1 text-blue-700">
              We fit a linear trend across your last 12 months of recorded sales and project it forward.
              Confidence reflects how closely the actual months follow that trend. Use it as a planning guide,
              not a guarantee — seasonal campaigns and stock-outs can shift real demand.
            </p>
          </div>
        </>
      )}

      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Forecast settings"
        subtitle="Choose how many months ahead to project"
        size="max-w-md"
        footer={
          <>
            <SecondaryButton onClick={() => setShowSettings(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={applySettings}>Apply</PrimaryButton>
          </>
        }
      >
        <form onSubmit={applySettings}>
          <Field label="Forecast horizon (months)" required hint="Between 1 and 12 months">
            <input
              type="number"
              min="1"
              max="12"
              className={inputClass}
              value={draftHorizon}
              onChange={(event) => setDraftHorizon(event.target.value)}
            />
          </Field>
          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
            The model always uses the most recent 12 months of sales data. Increasing the horizon
            makes the projection less certain.
          </div>
        </form>
      </Modal>
    </div>
  )
}
