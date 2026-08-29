// Component for TravelSummaryList.tsx
import { Calendar, TrendingUp, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

interface MonthlySummary {
  month: number
  year: number
  monthName: string
  totalKmTraveled: number
  totalAmount: number
  totalLiters: number
  averageEfficiency: number
  averagePricePerLiter: number
  totalEntries: number
}

interface YearlySummary {
  year: number
  totalKmTraveled: number
  totalAmount: number
  totalLiters: number
  averageEfficiency: number
  averagePricePerLiter: number
  totalEntries: number
}

interface TravelSummaryListProps {
  analytics: {
    monthly: MonthlySummary[]
    yearly: YearlySummary[]
  } | null
  selectedYear: number
  onYearChange: (year: number) => void
}

export default function TravelSummaryList({ analytics, selectedYear, onYearChange }: TravelSummaryListProps) {
  if (!analytics) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:[&>*:last-child:nth-child(odd)]:col-span-2">
      {/* Monthly Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Summary</h3>
          </div>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="appearance-none [-webkit-appearance:none] pl-2.5 pr-6 py-1 rounded-xl text-xs font-bold font-mono text-slate-700 dark:text-neutral-200 bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 cursor-pointer"
            >
              {analytics?.yearly?.length ? (
                analytics.yearly.map((year) => (
                  <option key={year.year} value={year.year} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">
                    {year.year}
                  </option>
                ))
              ) : (
                <option value={selectedYear}>{selectedYear}</option>
              )}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 [scrollbar-width:thin] flex-1">
          {analytics.monthly.length > 0 ? (
            analytics.monthly.map((month) => (
              <div
                key={`${month.year}-${month.month}`}
                className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50/80 dark:bg-neutral-800/40 hover:bg-slate-100/80 dark:hover:bg-neutral-800/80 rounded-xl border border-slate-100 dark:border-neutral-800 transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {month.monthName}
                  </p>
                  <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-neutral-400 mt-0.5">
                    {month.totalKmTraveled.toLocaleString('en-IN')} KM • {month.totalLiters}L
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {formatCurrency(month.totalAmount)}
                  </p>
                  <span className="inline-flex items-center text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-500/20 mt-0.5">
                    {month.averageEfficiency} KM/L
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-neutral-500 py-8">
              <Calendar className="h-6 w-6 mb-2 opacity-50" />
              <p className="text-xs">No data for {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Yearly Summary</h3>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 [scrollbar-width:thin] flex-1">
          {analytics.yearly.length > 0 ? (
            analytics.yearly.map((year) => (
              <div
                key={year.year}
                className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50/80 dark:bg-neutral-800/40 hover:bg-slate-100/80 dark:hover:bg-neutral-800/80 rounded-xl border border-slate-100 dark:border-neutral-800 transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {year.year}
                  </p>
                  <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-neutral-400 mt-0.5">
                    {year.totalKmTraveled.toLocaleString('en-IN')} KM • {year.totalLiters}L
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {formatCurrency(year.totalAmount)}
                  </p>
                  <span className="inline-flex items-center text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-500/20 mt-0.5">
                    {year.averageEfficiency} KM/L
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-neutral-500 py-8">
              <TrendingUp className="h-6 w-6 mb-2 opacity-50" />
              <p className="text-xs">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
