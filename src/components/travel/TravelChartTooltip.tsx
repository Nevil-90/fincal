'use client'

import React from 'react'
import { MetricConfig, ChartMode } from './travel-chart-types'

interface SingleChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  selectedYear: number
  compareYear: number
  metricConfig: MetricConfig
  mode: ChartMode
}

export default function SingleChartTooltip({
  active,
  payload,
  label,
  selectedYear,
  compareYear,
  metricConfig,
  mode
}: SingleChartTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const row = payload[0]?.payload
  if (!row) return null

  const valCurrent = typeof row[metricConfig.currentKey] === 'number' ? row[metricConfig.currentKey] : 0
  const valCompare = typeof row[metricConfig.compareKey] === 'number' ? row[metricConfig.compareKey] : 0

  const diff = valCurrent - valCompare
  const pctChange = valCompare !== 0 ? (diff / valCompare) * 100 : null

  const isPositiveChange = metricConfig.isHigherBetter ? diff > 0 : diff < 0
  const isNeutral = diff === 0

  return (
    <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-slate-200 dark:border-neutral-700/80 rounded-2xl p-4 shadow-xl min-w-[240px]">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-2 mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-300">
          {label} ({row.fullMonthName})
        </p>
        {pctChange !== null && !isNeutral && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isPositiveChange
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
            }`}
          >
            {diff > 0 ? '+' : ''}
            {pctChange.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* Selected Year */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: metricConfig.colorCurrent }}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              {selectedYear}
            </span>
          </div>
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
            {metricConfig.formatVal(valCurrent)}
          </span>
        </div>

        {/* Compare Year */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: metricConfig.colorCompare }}
            />
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              {compareYear}
            </span>
          </div>
          <span className="text-xs font-bold font-mono text-slate-600 dark:text-neutral-400">
            {metricConfig.formatVal(valCompare)}
          </span>
        </div>

        {/* Difference Row */}
        <div className="border-t border-dashed border-slate-200 dark:border-neutral-800 pt-2 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 dark:text-neutral-500 font-medium">Difference</span>
          <span
            className={`font-mono font-bold ${
              isNeutral
                ? 'text-slate-500 dark:text-neutral-400'
                : isPositiveChange
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {diff > 0 ? '+' : ''}
            {metricConfig.formatVal(diff)}
          </span>
        </div>
      </div>
    </div>
  )
}
