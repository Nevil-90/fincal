'use client'

import React from 'react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'

interface CategorySlice {
  name: string
  amount: number
  color: string
}

interface CategoryDonutChartProps {
  slices: CategorySlice[]
  totalSpent: number
  size?: number
}

export default React.memo(function CategoryDonutChart({
  slices,
  totalSpent,
  size = 110
}: CategoryDonutChartProps) {
  const center = size / 2
  const strokeWidth = size >= 130 ? 12 : 9
  const r = center - strokeWidth
  const circ = 2 * Math.PI * r
  let accumulated = 0

  const activeSlices = slices.filter(s => s.amount > 0)
  const fullFormatted = formatCurrency(totalSpent)
  const isLargeNumber = totalSpent >= 100000

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 drop-shadow-sm">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-neutral-800"
        />

        {/* Multi-Segment Dynamic Slices */}
        {totalSpent > 0 && activeSlices.map((slice, idx) => {
          const sliceRatio = slice.amount / totalSpent
          const strokeLength = sliceRatio * circ
          const offset = -accumulated
          accumulated += strokeLength

          return (
            <circle
              key={`slice-${slice.name}-${idx}`}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeLength} ${circ}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
              transform={`rotate(-90 ${center} ${center})`}
            />
          )
        })}
      </svg>

      {/* Center Metric Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 leading-none">
          Total
        </span>
        <span 
          className="text-xs font-bold text-slate-900 dark:text-white tabular-nums tracking-tight leading-tight mt-0.5"
          title={fullFormatted}
        >
          {isLargeNumber ? formatCompactCurrency(totalSpent) : fullFormatted}
        </span>
      </div>
    </div>
  )
})
