'use client'

interface OverviewPeriod {
  year: number
  month?: number
}

interface PeriodFilterProps {
  overviewPeriod: OverviewPeriod
  onPeriodChange: (period: OverviewPeriod) => void
}

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })
}))

export default function PeriodFilter({ overviewPeriod, onPeriodChange }: PeriodFilterProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const selectedMonthLabel = overviewPeriod.month
    ? new Date(overviewPeriod.year, overviewPeriod.month - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : `${overviewPeriod.year}`

  const quickFilters = [
    {
      label: 'Current Month',
      period: { year: currentYear, month: currentMonth }
    },
    {
      label: 'Previous Month',
      period:
        currentMonth === 1
          ? { year: currentYear - 1, month: 12 }
          : { year: currentYear, month: currentMonth - 1 }
    },
    {
      label: 'This Year',
      period: { year: currentYear }
    },
    {
      label: 'Previous Year',
      period: { year: currentYear - 1 }
    }
  ]

  const isSelectedQuickFilter = (period: OverviewPeriod) =>
    overviewPeriod.year === period.year && overviewPeriod.month === period.month

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-blue-900 to-indigo-800 px-5 py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
                Financial Dashboard
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700">
                {selectedMonthLabel}
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Welcome back!
              </h1>
              <p className="text-sm text-blue-50">
                Switch between monthly and yearly performance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onPeriodChange({ year: currentYear, month: currentMonth })}
            className="hidden sm:inline-flex shrink-0 items-center justify-center rounded-xl bg-white/15 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
          >
            Current Month
          </button>
        </div>
      </div>

      <div className="px-5 py-3.5">
        <div className="grid gap-3 lg:grid-cols-[160px_200px_auto] lg:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Year</label>
            <select
              value={overviewPeriod.year}
              onChange={(e) => onPeriodChange({ ...overviewPeriod, year: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {Array.from({ length: 10 }, (_, i) => currentYear - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Month</label>
            <select
              value={overviewPeriod.month || ''}
              onChange={(e) =>
                onPeriodChange({
                  ...overviewPeriod,
                  month: e.target.value ? parseInt(e.target.value) : undefined
                })
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All Year</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:hidden">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Filter</label>
            <select
              value={
                overviewPeriod.year === currentYear && overviewPeriod.month === currentMonth
                  ? 'current-month'
                  : overviewPeriod.year === currentYear && overviewPeriod.month === currentMonth - 1
                    ? 'previous-month'
                    : overviewPeriod.year === currentYear && !overviewPeriod.month
                      ? 'this-year'
                      : overviewPeriod.year === currentYear - 1 && !overviewPeriod.month
                        ? 'previous-year'
                        : overviewPeriod.year === overviewPeriod.year && overviewPeriod.month === undefined
                          ? 'full-year'
                          : 'custom'
              }
              onChange={(e) => {
                const value = e.target.value
                if (value === 'full-year') onPeriodChange({ year: overviewPeriod.year })
                if (value === 'current-month') onPeriodChange({ year: currentYear, month: currentMonth })
                if (value === 'previous-month') {
                  const period =
                    currentMonth === 1
                      ? { year: currentYear - 1, month: 12 }
                      : { year: currentYear, month: currentMonth - 1 }
                  onPeriodChange(period)
                }
                if (value === 'this-year') onPeriodChange({ year: currentYear })
                if (value === 'previous-year') onPeriodChange({ year: currentYear - 1 })
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="full-year">Full Year</option>
              <option value="current-month">Current Month</option>
              <option value="previous-month">Previous Month</option>
              <option value="this-year">This Year</option>
              <option value="previous-year">Previous Year</option>
              <option value="custom">Custom (Year/Month)</option>
            </select>
          </div>

          <div className="hidden sm:flex sm:flex-wrap sm:gap-2">
            <button
              type="button"
              onClick={() => onPeriodChange({ year: overviewPeriod.year })}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              Full Year
            </button>

            {quickFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => onPeriodChange(filter.period)}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                  isSelectedQuickFilter(filter.period)
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
