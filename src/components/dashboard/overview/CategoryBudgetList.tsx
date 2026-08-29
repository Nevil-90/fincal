'use client'

import React, { useState, useMemo } from 'react'
import { ClipboardList, ChevronRight, ChevronLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

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

interface CategoryBudgetListProps {
  budgetRows: BudgetRow[]
  isAllYear: boolean
  onCategoryClick: (category: string) => void
  onOpenSettings: () => void
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

const PAGE_SIZE = 6

export default React.memo(function CategoryBudgetList({
  budgetRows,
  isAllYear,
  onCategoryClick,
  onOpenSettings
}: CategoryBudgetListProps) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(budgetRows.length / PAGE_SIZE))

  const paginatedRows = useMemo(() => {
    return budgetRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }, [budgetRows, page])

  if (budgetRows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center shadow-sm">
        <ClipboardList className="h-8 w-8 text-slate-400 dark:text-neutral-500 mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200">No category limits configured</h3>
        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 mb-3">Set monthly limits in Settings to track category spending against targets.</p>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-slate-100 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Configure Limits →
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 block">
            {isAllYear ? 'Annual Category Targets' : 'Monthly Category Targets'}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Category Budgets
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400 dark:text-neutral-500 mr-2">
              <span>{page} of {totalPages}</span>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 dark:border-neutral-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-slate-200 dark:border-neutral-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Edit Limits
          </button>
        </div>
      </div>

      {/* Spacious 2-Column Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {paginatedRows.map((row, idx) => {
          const absoluteIdx = (page - 1) * PAGE_SIZE + idx
          const catColor = CATEGORY_COLORS[absoluteIdx % CATEGORY_COLORS.length]
          const isOver = row.spent > row.limit

          return (
            <div
              key={row.id}
              onClick={() => onCategoryClick(row.category)}
              className="p-3 rounded-xl bg-slate-50/70 dark:bg-neutral-950/70 border border-slate-200/70 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700 transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {row.category}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 font-mono text-xs shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(row.spent)}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                    / {formatCurrency(row.limit)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 shrink-0 group-hover:translate-x-0.5 transition-transform ml-0.5" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-200/70 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(row.pct, 100)}%`,
                    backgroundColor: isOver ? '#f43f5e' : catColor
                  }}
                />
              </div>

              {/* Footer Status */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                <span>{Math.round(row.pct)}% used</span>
                {isOver ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.2 rounded border border-rose-200/50 dark:border-rose-900/30">
                    +{formatCurrency(row.spent - row.limit)} over
                  </span>
                ) : (
                  <span>{formatCurrency(row.remaining)} left</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
