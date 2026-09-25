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
  hoveredSlice?: string | null
  onHoverSlice?: (name: string | null) => void
}

export default React.memo(function CategoryDonutChart({
  slices,
  totalSpent,
  size = 165,
  hoveredSlice,
  onHoverSlice
}: CategoryDonutChartProps) {
  const center = size / 2
  const strokeWidth = size >= 155 ? 14 : size >= 130 ? 12 : 9
  const r = center - strokeWidth
  const circ = 2 * Math.PI * r
  let accumulated = 0

  const activeSlices = slices.filter(s => s.amount > 0)
  const fullFormatted = formatCurrency(totalSpent)
  const isLargeNumber = totalSpent >= 1000000

  const activeHoveredSlice = hoveredSlice ? activeSlices.find(s => s.name === hoveredSlice) : null

  return (
    <div className="relative flex items-center justify-center shrink-0 select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 drop-shadow-xs transition-transform duration-200"
      >
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-neutral-800/80"
        />

        {/* Multi-Segment Dynamic Slices */}
        {totalSpent > 0 && activeSlices.map((slice, idx) => {
          const sliceRatio = slice.amount / totalSpent
          const strokeLength = sliceRatio * circ
          const offset = -accumulated
          accumulated += strokeLength
          const isSelected = hoveredSlice === slice.name

          return (
            <circle
              key={`slice-${slice.name}-${idx}`}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={isSelected ? strokeWidth + 2.5 : strokeWidth}
              strokeDasharray={`${strokeLength} ${circ}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out cursor-pointer"
              transform={`rotate(-90 ${center} ${center})`}
              onMouseEnter={() => onHoverSlice?.(slice.name)}
              onMouseLeave={() => onHoverSlice?.(null)}
              onClick={() => onHoverSlice?.(isSelected ? null : slice.name)}
              opacity={hoveredSlice && !isSelected ? 0.35 : 1}
            />
          )
        })}
      </svg>

      {/* Center Metric Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 leading-none truncate max-w-[120px]">
          {activeHoveredSlice ? activeHoveredSlice.name : 'Total Outflow'}
        </span>
        <span 
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight leading-tight mt-1"
          title={activeHoveredSlice ? formatCurrency(activeHoveredSlice.amount) : fullFormatted}
        >
          {activeHoveredSlice
            ? formatCurrency(activeHoveredSlice.amount)
            : (isLargeNumber ? formatCompactCurrency(totalSpent) : fullFormatted)}
        </span>
        {activeHoveredSlice ? (
          <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 tabular-nums mt-0.5">
            {totalSpent > 0 ? Math.round((activeHoveredSlice.amount / totalSpent) * 100) : 0}% of total
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 tabular-nums mt-0.5">
            {activeSlices.length} {activeSlices.length === 1 ? 'category' : 'categories'}
          </span>
        )}
      </div>
    </div>
  )
})
