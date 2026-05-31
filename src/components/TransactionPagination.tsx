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
    <div className="flex flex-col items-center gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-between bg-slate-50/50 rounded-b-2xl">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            setCurrentPage(1)
          }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm"
        >
          <option value="15">15</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span className="text-sm text-slate-500">entries</span>
        <span className="ml-4 text-sm font-medium text-slate-700">{paginationLabel}</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          disabled={safePage === 1}
        >
          Prev
        </button>
        <span className="text-sm font-medium text-slate-600">Page {safePage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          disabled={safePage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
