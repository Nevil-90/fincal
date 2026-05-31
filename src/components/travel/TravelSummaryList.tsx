import { Calendar, TrendingUp } from 'lucide-react'
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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-base font-semibold text-slate-900">Monthly Summary</h3>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 cursor-pointer"
          >
            {analytics?.yearly?.length ? (
              analytics.yearly.map((year) => (
                <option key={year.year} value={year.year}>
                  {year.year}
                </option>
              ))
            ) : (
              <option value={selectedYear}>{selectedYear}</option>
            )}
          </select>
        </div>
        
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {analytics.monthly.length > 0 ? (
            analytics.monthly.map((month) => (
              <div key={`${month.year}-${month.month}`} className="flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{month.monthName}</p>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">{month.totalKmTraveled} KM • {month.totalLiters}L</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(month.totalAmount)}</p>
                  <p className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                    {month.averageEfficiency} KM/L
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
              <Calendar className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No data for {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm flex flex-col">
        <h3 className="text-base font-semibold text-slate-900 mb-4 sm:mb-6">Yearly Summary</h3>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {analytics.yearly.length > 0 ? (
            analytics.yearly.map((year) => (
              <div key={year.year} className="flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{year.year}</p>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">{year.totalKmTraveled} KM • {year.totalLiters}L</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(year.totalAmount)}</p>
                  <p className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                    {year.averageEfficiency} KM/L
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
              <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
