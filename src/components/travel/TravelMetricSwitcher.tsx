'use client'

import React from 'react'
import { MetricKey, METRIC_CONFIGS } from './travel-chart-types'

interface TravelMetricSwitcherProps {
  activeMetric: MetricKey
  onSelectMetric: (metric: MetricKey) => void
}

export default function TravelMetricSwitcher({
  activeMetric,
  onSelectMetric
}: TravelMetricSwitcherProps) {
  return (
    <div className="flex items-center justify-center pt-1">
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.08] overflow-x-auto max-w-full [scrollbar-width:none]">
        {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map(key => {
          const config = METRIC_CONFIGS[key]
          const Icon = config.icon
          const isActive = activeMetric === key

          return (
            <button
              key={`metric-toggle-${key}`}
              type="button"
              onClick={() => onSelectMetric(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.08] font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
