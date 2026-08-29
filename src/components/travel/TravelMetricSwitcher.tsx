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
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm overflow-x-auto max-w-full [scrollbar-width:none]">
        {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map(key => {
          const config = METRIC_CONFIGS[key]
          const Icon = config.icon
          const isActive = activeMetric === key

          return (
            <button
              key={`metric-toggle-${key}`}
              type="button"
              onClick={() => onSelectMetric(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white dark:text-neutral-900' : 'text-slate-400 dark:text-neutral-500'}`} />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
