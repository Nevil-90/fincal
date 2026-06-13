// Pagination controls row: page size selector and prev/next buttons.
export interface TransactionPaginationProps {
  pageSize: number
  setPageSize: (size: number) => void
  paginationLabel: string
  safePage: number
  totalPages: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
}

export function TransactionPagination({
  pageSize,
  setPageSize,
  paginationLabel,
  safePage,
  totalPages,
  setCurrentPage
}: TransactionPaginationProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-neutral-800 px-3 sm:px-4 py-3 sm:py-4 bg-slate-50/50 dark:bg-neutral-900/50 rounded-b-2xl w-full overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="hidden sm:inline text-sm text-slate-500 dark:text-neutral-400">Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            setCurrentPage(1)
          }}
          className="rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-1.5 sm:px-2 py-1 text-xs sm:text-sm text-slate-900 dark:text-white shadow-sm"
        >
          <option value="15">15</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span className="hidden sm:inline text-sm text-slate-500 dark:text-neutral-400">entries</span>
        <span className="ml-1 sm:ml-4 text-[10px] sm:text-sm font-medium text-slate-700 dark:text-neutral-300 whitespace-nowrap">
          {paginationLabel}
        </span>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          className="rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          disabled={safePage === 1}
        >
          Prev
        </button>
        <span className="text-[10px] sm:text-sm font-medium text-slate-600 dark:text-neutral-400 whitespace-nowrap">
          <span className="sm:hidden">{safePage} / {totalPages}</span>
          <span className="hidden sm:inline">Page {safePage} of {totalPages}</span>
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          className="rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          disabled={safePage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
