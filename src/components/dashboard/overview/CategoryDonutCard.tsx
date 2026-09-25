'use client'

import React, { useMemo, useState } from 'react'
import { PieChart } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import CategoryDonutChart from './CategoryDonutChart'

interface BudgetRow {
  id: string
  category: string
  amount: number
  period: string
  spent: number
  limit: number
  pct: number
  remaining: number
  status: 'over' | 'warn' | 'ok' | 'safe'
}

interface CategoryDonutCardProps {
  budgetRows: BudgetRow[]
  isAllYear: boolean
}

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#a855f7'  // Purple
]

export default React.memo(function CategoryDonutCard({
  budgetRows,
  isAllYear
}: CategoryDonutCardProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const totalSpent = useMemo(() => {
    return budgetRows.reduce((sum, r) => sum + r.spent, 0)
  }, [budgetRows])

  const slices = useMemo(() => {
    return budgetRows.map((r, i) => ({
      name: r.category,
      amount: r.spent,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    }))
  }, [budgetRows])

  const activeSlices = useMemo(() => {
    return slices.filter(s => s.amount > 0).sort((a, b) => b.amount - a.amount)
  }, [slices])

  const visibleSlices = showAll ? activeSlices : activeSlices.slice(0, 6)

  if (totalSpent === 0) {
    return (
      <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col items-center justify-center min-h-[220px] text-center">
        <PieChart className="h-7 w-7 text-slate-400 dark:text-zinc-500 mb-2 opacity-60" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Expense Outflows</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">No debited transactions recorded in this period.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {isAllYear ? 'Annual Distribution' : 'Expense Distribution'}
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-zinc-400 tabular-nums">
            {activeSlices.length} {activeSlices.length === 1 ? 'category' : 'categories'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalSpent)}
          </span>
          <PieChart className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0 opacity-80" />
        </div>
      </div>

      {/* Main Breakdown Body: Sized Donut + Rich Category Progress Rows */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 pt-1">
        {/* Left: Prominent Donut Chart */}
        <div className="shrink-0 flex items-center justify-center py-2 sm:py-1">
          <CategoryDonutChart
            slices={slices}
            totalSpent={totalSpent}
            size={165}
            hoveredSlice={hoveredSlice}
            onHoverSlice={setHoveredSlice}
          />
        </div>

        {/* Right / Bottom: Category Slices Breakdown */}
        <div className="flex-1 w-full min-w-0 space-y-2">
          {visibleSlices.map(slice => {
            const pct = totalSpent > 0 ? Math.round((slice.amount / totalSpent) * 100) : 0
            const isHovered = hoveredSlice === slice.name

            return (
              <div
                key={slice.name}
                onMouseEnter={() => setHoveredSlice(slice.name)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => setHoveredSlice(isHovered ? null : slice.name)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isHovered
                    ? 'bg-slate-100/90 dark:bg-white/[0.08] border-slate-300 dark:border-white/[0.16] shadow-xs'
                    : 'bg-slate-50/60 dark:bg-[#16161a]/60 border-slate-100 dark:border-white/[0.04] hover:bg-slate-100/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate text-xs sm:text-sm">
                      {slice.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 tabular-nums shrink-0">
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300">
                      {pct}%
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {formatCurrency(slice.amount)}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="h-1.5 w-full bg-slate-200/70 dark:bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor: slice.color
                    }}
                  />
                </div>
              </div>
            )
          })}

          {activeSlices.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-center cursor-pointer"
            >
              {showAll ? 'Show fewer categories' : `+${activeSlices.length - 6} more categories`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

