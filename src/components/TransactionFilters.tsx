import { Search, Filter, Trash2, Download } from 'lucide-react'

export interface TransactionFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterType: 'all' | 'income' | 'expense'
  setFilterType: (type: 'all' | 'income' | 'expense') => void
  filterCategory: string
  setFilterCategory: (category: string) => void
  filterPaymentMethod: string
  setFilterPaymentMethod: (method: string) => void
  filterSource: string
  setFilterSource: (source: string) => void
  filterRecurring: 'all' | 'recurring' | 'one-time'
  setFilterRecurring: (recurring: 'all' | 'recurring' | 'one-time') => void
  groupBy: 'none' | 'date' | 'category' | 'payment' | 'month' | 'source' | 'type'
  setGroupBy: (groupBy: 'none' | 'date' | 'category' | 'payment' | 'month' | 'source' | 'type') => void
  showAdvancedFilters: boolean
  setShowAdvancedFilters: (show: boolean) => void
  hasActiveAdvancedFilters: boolean
  resetFilters: () => void
  selectedTransactionsSize: number
  handleMultiDelete: () => void
  setShowDateRangePicker: (show: boolean) => void
  categoryOptions: string[]
  paymentOptions: string[]
  sourceOptions: string[]
  setCurrentPage: (page: number) => void
}

export function TransactionFilters({
  searchTerm, setSearchTerm,
  filterType, setFilterType,
  filterCategory, setFilterCategory,
  filterPaymentMethod, setFilterPaymentMethod,
  filterSource, setFilterSource,
  filterRecurring, setFilterRecurring,
  groupBy, setGroupBy,
  showAdvancedFilters, setShowAdvancedFilters,
  hasActiveAdvancedFilters, resetFilters,
  selectedTransactionsSize, handleMultiDelete,
  setShowDateRangePicker,
  categoryOptions, paymentOptions, sourceOptions,
  setCurrentPage
}: TransactionFiltersProps) {
  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search regular transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${filterType === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-800'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${filterType === 'income' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${filterType === 'expense' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Expenses
            </button>
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold shadow-sm transition-all ${
              showAdvancedFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveAdvancedFilters && (
              <span className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white ml-0.5" />
            )}
          </button>

          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50"
          >
            Reset
          </button>

          {selectedTransactionsSize > 0 && (
            <button
              onClick={handleMultiDelete}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
              title={`Delete ${selectedTransactionsSize} selected transactions`}
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedTransactionsSize}
            </button>
          )}

          <button
            onClick={() => setShowDateRangePicker(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            title="Export Data to CSV"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-5 animate-fadeIn">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">GroupBy</label>
            <select
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value as any)
                setCurrentPage(1)
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              <option value="none">No Grouping</option>
              <option value="date">Date</option>
              <option value="category">Category</option>
              <option value="payment">Payment Method</option>
              <option value="source">Source</option>
              <option value="type">Type (Income/Expense)</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment Method</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => {
                setFilterPaymentMethod(e.target.value)
                setCurrentPage(1)
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              <option value="all">All Methods</option>
              {paymentOptions.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Source</label>
            <select
              value={filterSource}
              onChange={(e) => {
                setFilterSource(e.target.value)
                setCurrentPage(1)
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              <option value="all">All Sources</option>
              {sourceOptions.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Recurring</label>
            <select
              value={filterRecurring}
              onChange={(e) => {
                setFilterRecurring(e.target.value as 'all' | 'recurring' | 'one-time')
                setCurrentPage(1)
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              <option value="all">All</option>
              <option value="recurring">Recurring</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
        </div>
      )}

      {/* Grouping Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-slate-700">Group by:</span>
        <div className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 custom-scrollbar">
          {(['none', 'date', 'month', 'category', 'payment', 'source', 'type'] as const).map((groupOption) => (
            <button
              key={groupOption}
              onClick={() => setGroupBy(groupOption)}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap capitalize ${
                groupBy === groupOption 
                  ? 'bg-slate-100 text-slate-900 font-medium' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {groupOption === 'payment' ? 'Payment Method' : groupOption}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
