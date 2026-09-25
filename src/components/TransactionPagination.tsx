import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'

export interface TransactionPaginationProps {
  pageSize: number
  setPageSize: (size: number) => void
  paginationLabel: string
  safePage: number
  totalPages: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  position?: 'top' | 'bottom'
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export function TransactionPagination({
  pageSize,
  setPageSize,
  paginationLabel,
  safePage,
  totalPages,
  setCurrentPage,
  position = 'bottom'
}: TransactionPaginationProps) {
  const borderClass = position === 'top'
    ? 'border-b border-slate-200/80 dark:border-white/[0.08]'
    : 'border-t border-slate-200/80 dark:border-white/[0.08]'

  const pageNumbers = getPageNumbers(safePage, totalPages)

  return (
    <div className={`flex items-center justify-between gap-2 ${borderClass} px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50/60 dark:bg-white/[0.02] w-full text-xs`}>
      {/* Left: Page Size Selector & Record Count */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="hidden sm:inline text-slate-500 dark:text-neutral-400 font-medium">Show</span>
        <div className="w-16 sm:w-20">
          <CustomSelect
            selectSize="xs"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            <option value="15">15</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </CustomSelect>
        </div>
        <span className="text-slate-300 dark:text-neutral-700 hidden sm:inline">•</span>
        <span className="text-slate-600 dark:text-neutral-300 font-semibold tabular-nums text-[11px] sm:text-xs">
          {paginationLabel}
        </span>
      </div>
      
      {/* Right: Page Navigation Controls & Numbered Pills */}
      <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0">
        {totalPages > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181b] h-7 w-7 sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5 font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#222226] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#18181b] transition-all cursor-pointer shadow-xs"
              disabled={safePage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Compact Mobile Page Indicator */}
            <span className="sm:hidden px-1.5 font-semibold text-slate-600 dark:text-neutral-400 tabular-nums text-[11px]">
              {safePage} / {totalPages}
            </span>

            {/* Desktop Numbered Page Pills */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-7 text-center text-slate-400 dark:text-neutral-600 select-none font-bold"
                    >
                      …
                    </span>
                  )
                }
                const pageNum = p as number
                const isActive = pageNum === safePage
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`h-7 min-w-[28px] px-2 rounded-lg font-semibold tabular-nums text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181b] h-7 w-7 sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5 font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#222226] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#18181b] transition-all cursor-pointer shadow-xs"
              disabled={safePage >= totalPages}
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500 py-1">
            All records shown
          </span>
        )}
      </div>
    </div>
  )
}
