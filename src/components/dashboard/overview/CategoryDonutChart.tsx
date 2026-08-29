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
}

export default React.memo(function CategoryDonutChart({
  slices,
  totalSpent
}: CategoryDonutChartProps) {
  const r = 58
  const circ = 2 * Math.PI * r
  let accumulated = 0

  const activeSlices = slices.filter(s => s.amount > 0)
  const fullFormatted = formatCurrency(totalSpent)
  const isLargeNumber = totalSpent >= 100000

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width="150" height="150" viewBox="0 0 150 150" className="shrink-0 drop-shadow-sm">
        {/* Background Track */}
        <circle
          cx="75"
          cy="75"
          r={r}
          fill="none"
          strokeWidth="12"
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
              cx="75"
              cy="75"
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth="12"
              strokeDasharray={`${strokeLength} ${circ}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 75 75)"
              style={{ transition: 'all 0.6s ease' }}
            />
          )
        })}
      </svg>

      {/* Center Label (Never Truncated) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-3"
        title={fullFormatted}
      >
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
          Total Spent
        </span>
        <span className={`font-black font-mono text-slate-900 dark:text-white leading-tight mt-0.5 ${
          isLargeNumber ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
        }`}>
          {totalSpent >= 1000000 ? formatCompactCurrency(totalSpent) : fullFormatted}
        </span>
      </div>
    </div>
  )
})
