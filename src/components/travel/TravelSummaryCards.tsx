// Component for TravelSummaryCards.tsx
import { Car, Fuel, TrendingUp, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

interface TravelSummary {
  totalKmTraveled: number
  totalAmount: number
  totalLiters: number
  averageEfficiency: number
  averagePricePerLiter: number
  totalEntries: number
}

interface TravelSummaryCardsProps {
  analytics: {
    overall: TravelSummary
  } | null
}

export default function TravelSummaryCards({ analytics }: TravelSummaryCardsProps) {
  if (!analytics) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
      <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[12px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider truncate">Total Distance</p>
            <p className="text-lg sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5 sm:mt-2 whitespace-nowrap">
              {analytics.overall.totalKmTraveled.toLocaleString()} <span className="text-[11px] sm:text-sm font-semibold text-slate-400 dark:text-neutral-500">KM</span>
            </p>
          </div>
          <div className="p-1.5 sm:p-2.5 bg-indigo-50 rounded-lg sm:rounded-xl ring-1 ring-inset ring-indigo-500/20 shrink-0">
            <Car className="h-4 w-4 sm:h-5 w-5 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[12px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider truncate">Total Spent</p>
            <p className="text-lg sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5 sm:mt-2 whitespace-nowrap">
              {formatCurrency(analytics.overall.totalAmount)}
            </p>
          </div>
          <div className="p-1.5 sm:p-2.5 bg-rose-50 rounded-lg sm:rounded-xl ring-1 ring-inset ring-rose-500/20 shrink-0">
            <Fuel className="h-4 w-4 sm:h-5 w-5 text-rose-600" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[12px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider truncate">Avg Efficiency</p>
            <p className="text-lg sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5 sm:mt-2 whitespace-nowrap">
              {analytics.overall.averageEfficiency} <span className="text-[11px] sm:text-sm font-semibold text-slate-400 dark:text-neutral-500">KM/L</span>
            </p>
          </div>
          <div className="p-1.5 sm:p-2.5 bg-emerald-50 rounded-lg sm:rounded-xl ring-1 ring-inset ring-emerald-500/20 shrink-0">
            <TrendingUp className="h-4 w-4 sm:h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[12px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider truncate">Avg Price/L</p>
            <p className="text-lg sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5 sm:mt-2 whitespace-nowrap">
              {formatCurrency(analytics.overall.averagePricePerLiter)}
            </p>
          </div>
          <div className="p-1.5 sm:p-2.5 bg-amber-50 rounded-lg sm:rounded-xl ring-1 ring-inset ring-amber-500/20 shrink-0">
            <Calendar className="h-4 w-4 sm:h-5 w-5 text-amber-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
