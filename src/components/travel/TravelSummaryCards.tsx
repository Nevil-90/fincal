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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-sm transition-all duration-150 hover:border-slate-300 dark:hover:border-white/[0.15]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">Total Distance</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white mt-1 sm:mt-1.5 whitespace-nowrap">
              {analytics.overall.totalKmTraveled.toLocaleString()} <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-zinc-500">KM</span>
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shrink-0">
            <Car className="h-4 w-4 sm:h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-sm transition-all duration-150 hover:border-slate-300 dark:hover:border-white/[0.15]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">Total Fuel Cost</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white mt-1 sm:mt-1.5 whitespace-nowrap">
              {formatCurrency(analytics.overall.totalAmount)}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 shrink-0">
            <Fuel className="h-4 w-4 sm:h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-sm transition-all duration-150 hover:border-slate-300 dark:hover:border-white/[0.15]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">Avg Efficiency</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white mt-1 sm:mt-1.5 whitespace-nowrap">
              {analytics.overall.averageEfficiency} <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-zinc-500">KM/L</span>
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">
            <TrendingUp className="h-4 w-4 sm:h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-sm transition-all duration-150 hover:border-slate-300 dark:hover:border-white/[0.15]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">Avg Fuel Price</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white mt-1 sm:mt-1.5 whitespace-nowrap">
              {formatCurrency(analytics.overall.averagePricePerLiter)}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shrink-0">
            <Calendar className="h-4 w-4 sm:h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
