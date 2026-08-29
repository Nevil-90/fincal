'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { MONTH_NAMES, MetricConfig } from './travel-chart-types'

interface TravelChartToolbarProps {
  selectedYear: number
  onYearChange: (year: number) => void
  compareYear: number
  onCompareYearChange: (year: number) => void
  availableYears: number[]
  selectedMonths: Set<number>
  toggleMonth: (month: number) => void
  selectAllMonths: () => void
  activeConfig: MetricConfig
}

export default function TravelChartToolbar({
  selectedYear,
  onYearChange,
  compareYear,
  onCompareYearChange,
  availableYears,
  selectedMonths,
  toggleMonth,
  selectAllMonths,
  activeConfig
}: TravelChartToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-3 sm:px-4 shadow-sm">
      {/* Left: Year Comparison Selectors */}
      <div className="flex items-center gap-2">
        {/* Base Year Pill */}
        <div className="relative flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200/70 dark:hover:bg-neutral-750 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-neutral-700/80 transition-colors cursor-pointer group">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: activeConfig.colorCurrent }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 shrink-0">
            Base
          </span>
          <select
            value={selectedYear}
            onChange={e => onYearChange(Number(e.target.value))}
            className="appearance-none [-webkit-appearance:none] bg-transparent text-xs font-bold font-mono text-slate-900 dark:text-white outline-none cursor-pointer pr-4 pl-0.5 border-0 focus:ring-0"
          >
            {availableYears.map(y => (
              <option key={`base-${y}`} value={y} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">
                {y}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 pointer-events-none transition-colors" />
        </div>

        <span className="text-xs font-bold text-slate-400 dark:text-neutral-500">vs</span>

        {/* Compare Year Pill */}
        <div className="relative flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200/70 dark:hover:bg-neutral-750 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-neutral-700/80 transition-colors cursor-pointer group">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: activeConfig.colorCompare }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 shrink-0">
            Compare
          </span>
          <select
            value={compareYear}
            onChange={e => onCompareYearChange(Number(e.target.value))}
            className="appearance-none [-webkit-appearance:none] bg-transparent text-xs font-bold font-mono text-slate-900 dark:text-white outline-none cursor-pointer pr-4 pl-0.5 border-0 focus:ring-0"
          >
            {availableYears.map(y => (
              <option key={`comp-${y}`} value={y} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">
                {y}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 pointer-events-none transition-colors" />
        </div>
      </div>

      {/* Right: Inline Month Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 [scrollbar-width:none]">
        <button
          type="button"
          onClick={selectAllMonths}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            selectedMonths.size === 12
              ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
              : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
          }`}
        >
          All
        </button>
        <span className="text-slate-200 dark:text-neutral-800 text-xs">|</span>
        <div className="flex items-center gap-1">
          {MONTH_NAMES.map((name, i) => {
            const m = i + 1
            const isSelected = selectedMonths.has(m)
            return (
              <button
                key={`month-pill-${m}`}
                type="button"
                onClick={() => toggleMonth(m)}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
