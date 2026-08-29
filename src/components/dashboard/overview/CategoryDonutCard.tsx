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
    return null
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 block">
            {isAllYear ? 'Annual Distribution' : 'Expense Distribution'}
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            Spending by Category
          </h3>
        </div>
        <PieChart className="h-3.5 w-3.5 text-indigo-500 shrink-0 opacity-80" />
      </div>

      {/* Centered Donut Chart */}
      <div className="flex justify-center">
        <CategoryDonutChart slices={slices} totalSpent={totalSpent} />
      </div>

      {/* Slices Legend */}
      <div className="border-t border-slate-100 dark:border-neutral-800 pt-2.5 space-y-1.5">
        {activeSlices.slice(0, 3).map(slice => {
          const pct = totalSpent > 0 ? Math.round((slice.amount / totalSpent) * 100) : 0
          return (
            <div key={slice.name} className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                  {slice.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                <span className="text-slate-400 dark:text-neutral-500">{pct}%</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(slice.amount)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
