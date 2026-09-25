'use client'

import React from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

interface OverviewPeriod {
  year: number
  month?: number
}

interface PeriodSelectorProps {
  overviewPeriod: OverviewPeriod
  activeYear: number
  activeMonth: number
  availableYears: number[]
  monthNames: string[]
  onPeriodChange: (period: OverviewPeriod) => void
  onShowAddTransaction: () => void
}

export default React.memo(function PeriodSelector({
  overviewPeriod,
  activeYear,
  activeMonth,
  availableYears,
  monthNames,
  onPeriodChange,
  onShowAddTransaction
}: PeriodSelectorProps) {
  const now = new Date()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Month Navigator */}
      <div className="flex items-center bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-white/[0.08] rounded-xl shadow-xs h-8">
        <button
          type="button"
          onClick={() => {
            const prev = activeMonth === 1 ? 12 : activeMonth - 1
            const prevYear = activeMonth === 1 ? activeYear - 1 : activeYear
            onPeriodChange({ year: prevYear, month: prev })
          }}
          className="px-2 h-full flex items-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          title="Previous month"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <div className="relative flex items-center px-1">
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 min-w-[55px] text-center select-none pointer-events-none tabular-nums">
            {monthNames[activeMonth - 1]}
          </span>
          <select
            value={activeMonth}
            onChange={e => onPeriodChange({ year: activeYear, month: Number(e.target.value) })}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Pick month"
          >
            {monthNames.map((m, i) => (
              <option key={i} value={i + 1} className="bg-white dark:bg-[#121215] text-slate-800 dark:text-white">
                {m}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = activeMonth === 12 ? 1 : activeMonth + 1
            const nextYear = activeMonth === 12 ? activeYear + 1 : activeYear
            onPeriodChange({ year: nextYear, month: next })
          }}
          className="px-2 h-full flex items-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          title="Next month"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Year Select */}
      <div className="relative flex items-center h-8 bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-white/[0.08] rounded-xl shadow-xs px-2.5">
        <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 select-none pointer-events-none tabular-nums">
          {activeYear}
        </span>
        <select
          value={activeYear}
          onChange={e => onPeriodChange({ year: Number(e.target.value), month: overviewPeriod.month })}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title="Pick year"
        >
          {availableYears.map(y => (
            <option key={y} value={y} className="bg-white dark:bg-[#121215] text-slate-800 dark:text-white">
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* All Year Toggle */}
      <button
        type="button"
        onClick={() => onPeriodChange(
          overviewPeriod.month === undefined
            ? { year: activeYear, month: now.getMonth() + 1 }
            : { year: activeYear, month: undefined }
        )}
        className={`h-8 px-3 text-xs font-bold rounded-xl border transition-colors cursor-pointer shadow-xs ${
          overviewPeriod.month === undefined
            ? 'bg-blue-600 dark:bg-blue-600 text-white border-transparent'
            : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-neutral-300 border-slate-200/90 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#18181b]'
        }`}
      >
        All Year
      </button>
    </div>
  )
})
