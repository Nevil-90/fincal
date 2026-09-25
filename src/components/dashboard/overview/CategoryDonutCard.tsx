'use client'

import React, { useMemo } from 'react'
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

  const activeSlices = slices.filter(s => s.amount > 0).sort((a, b) => b.amount - a.amount)

  if (totalSpent === 0) {
    return (
      <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-sm flex flex-col items-center justify-center min-h-[220px] text-center">
        <PieChart className="h-6 w-6 text-slate-400 dark:text-zinc-500 mb-1.5 opacity-60" />
        <h3 className="text-xs font-semibold text-slate-900 dark:text-white">No Expense Outflows</h3>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">No debited transactions recorded in this period.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
            {isAllYear ? 'Annual Distribution' : 'Expense Distribution'}
          </h3>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
            ({activeSlices.length} {activeSlices.length === 1 ? 'category' : 'categories'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalSpent)}
          </span>
          <PieChart className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 opacity-80" />
        </div>
      </div>

      {/* Horizontal Split: Donut Chart on Left, Ranked Slices on Right */}
      <div className="flex items-center gap-4 py-0.5">
        <div className="shrink-0 flex items-center justify-center">
          <CategoryDonutChart slices={slices} totalSpent={totalSpent} size={110} />
        </div>

        {/* Slices Legend */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {activeSlices.slice(0, 4).map(slice => {
            const pct = totalSpent > 0 ? Math.round((slice.amount / totalSpent) * 100) : 0
            return (
              <div key={slice.name} className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="font-medium text-slate-800 dark:text-zinc-300 truncate text-[11px]">
                    {slice.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 tabular-nums shrink-0">
                  <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-medium">{pct}%</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{formatCurrency(slice.amount)}</span>
                </div>
              </div>
            )
          })}
          {activeSlices.length > 4 && (
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 text-right pt-0.5">
              +{activeSlices.length - 4} more categories
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

