'use client'

import React, { useState, useMemo } from 'react'
import { ClipboardList, ChevronRight, ChevronLeft, Settings } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { getCategoryVisual } from '@/lib/category-icons'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'

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
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
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
  const { data } = useEnhancedStaticData()
  const customIcons = useMemo(() => {
    try {
      return data.userSettings?.custom_category_icons ? JSON.parse(data.userSettings.custom_category_icons) : {}
    } catch {
      return {}
    }
  }, [data.userSettings?.custom_category_icons])

  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(budgetRows.length / PAGE_SIZE))

  const paginatedRows = useMemo(() => {
    return budgetRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }, [budgetRows, page])

  if (budgetRows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-5 text-center shadow-sm flex flex-col items-center justify-center min-h-[220px]">
        <ClipboardList className="h-6 w-6 text-slate-400 dark:text-zinc-500 mb-1.5 opacity-60" />
        <h3 className="text-xs font-semibold text-slate-900 dark:text-white">No category budgets</h3>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 mb-2.5">Set monthly limits to monitor spending pace.</p>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-xs"
        >
          Configure Budgets →
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-sm p-3.5 flex flex-col justify-between space-y-2.5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
            Category Budgets
          </h3>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
            ({budgetRows.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 tabular-nums text-[10px] text-slate-500 dark:text-zinc-400 mr-1">
              <span>{page}/{totalPages}</span>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-0.5 rounded border border-slate-200 dark:border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-0.5 rounded border border-slate-200 dark:border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            title="Configure in settings"
          >
            <Settings className="w-3 h-3" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </div>

      {/* High-Density Wide-Track Row List */}
      <div className="space-y-2">
        {paginatedRows.map((row, idx) => {
          const absoluteIdx = (page - 1) * PAGE_SIZE + idx
          const catColor = CATEGORY_COLORS[absoluteIdx % CATEGORY_COLORS.length]
          const isOver = row.spent > row.limit
          const visual = getCategoryVisual(row.category, 'EXPENSE', undefined, customIcons)
          const RowIcon = visual.icon

          return (
            <div
              key={row.id}
              onClick={() => onCategoryClick(row.category)}
              className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#16161a] border border-slate-200/60 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.15] transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border shrink-0 ${visual.bgClass} ${visual.borderClass}`}>
                    <RowIcon className={`w-3.5 h-3.5 ${visual.colorClass}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {row.category}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums font-medium">
                    ({Math.round(row.pct)}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 tabular-nums shrink-0">
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(row.spent)}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500">
                      / {formatCurrency(row.limit)}
                    </span>
                  </div>

                  {isOver ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] border border-rose-500/20">
                      +{formatCurrency(row.spent - row.limit)} over
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-zinc-400 font-medium bg-slate-200/60 dark:bg-white/[0.04] px-1.5 py-0.5 rounded text-[10px]">
                      {formatCurrency(row.remaining)} left
                    </span>
                  )}

                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Wide Progress Track */}
              <div className="h-1.5 w-full bg-slate-200/80 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(row.pct, 100)}%`,
                    backgroundColor: isOver ? '#f43f5e' : catColor
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
