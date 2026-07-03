// Advanced filtering controls for transaction lists. Includes search bar, type
// pills, date ranges, group-by selectors, and batch-action buttons.
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, Filter, Trash2, Download, X, ArrowUpDown, Layers, SlidersHorizontal, CreditCard, Repeat, CalendarDays, Grid, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'

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
  sortOption: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
  setSortOption: (sortOption: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc') => void
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
  selectedYear?: number
  selectedMonth?: number
  onYearChange?: (year: number | undefined) => void
  onMonthChange?: (month: number | undefined) => void
  availableYears?: number[]
}

export function TransactionFilters({
  searchTerm, setSearchTerm,
  filterType, setFilterType,
  filterCategory, setFilterCategory,
  filterPaymentMethod, setFilterPaymentMethod,
  filterSource, setFilterSource,
  filterRecurring, setFilterRecurring,
  groupBy, setGroupBy,
  sortOption, setSortOption,
  showAdvancedFilters, setShowAdvancedFilters,
  hasActiveAdvancedFilters, resetFilters,
  selectedTransactionsSize, handleMultiDelete,
  setShowDateRangePicker,
  categoryOptions, paymentOptions, sourceOptions,
  setCurrentPage,
  selectedYear, selectedMonth, onYearChange, onMonthChange, availableYears = []
}: TransactionFiltersProps) {

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (showAdvancedFilters) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [showAdvancedFilters])

  return (
    <>
      <div className="flex flex-col gap-2.5 sm:gap-3 rounded-none sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-neutral-800 bg-transparent sm:bg-white dark:sm:bg-neutral-900 px-3 pt-2 pb-1 sm:p-3.5 sm:shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search regular transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-slate-300 dark:focus:border-neutral-600 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:focus:ring-neutral-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto pb-1 sm:pb-0 justify-between sm:justify-start">
          <div className="flex flex-1 sm:flex-initial rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1">
            <button
              onClick={() => setFilterType('all')}
              title="All Transactions"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center ${filterType === 'all' ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('income')}
              title="Income"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center ${filterType === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType('expense')}
              title="Expenses"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center ${filterType === 'expense' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}`}
            >
              Expenses
            </button>
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Filters"
            className={`relative flex items-center justify-center gap-1.5 rounded-xl border transition-all shrink-0 w-9 h-9 sm:w-auto sm:h-auto px-0 sm:px-3.5 sm:py-1.5 text-sm font-semibold shadow-sm ${showAdvancedFilters
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
              : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800'
              }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveAdvancedFilters && (
              <span className="absolute top-1.5 right-1.5 sm:static sm:h-2 sm:w-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-neutral-900 sm:ml-0.5" />
            )}
          </button>

          <button
            onClick={resetFilters}
            title="Reset Filters"
            className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-neutral-800 shrink-0 w-9 h-9 sm:w-auto sm:h-auto px-0 sm:px-3 sm:py-1.5 text-sm font-semibold text-slate-600 dark:text-neutral-400"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Reset</span>
          </button>

          {selectedTransactionsSize > 0 && (
            <button
              onClick={handleMultiDelete}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-semibold text-white transition-colors hover:bg-rose-700 shrink-0 w-9 h-9 sm:w-auto sm:h-auto px-0 sm:px-4 sm:py-1.5"
              title={`Delete ${selectedTransactionsSize} selected transactions`}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete {selectedTransactionsSize}</span>
            </button>
          )}

          <button
            onClick={() => setShowDateRangePicker(true)}
            title="Export CSV"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 shrink-0 w-9 h-9 sm:w-auto sm:h-auto px-0 sm:px-4 sm:py-1.5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ACTIVE CHIPS SUMMARY */}
      <div className="flex flex-wrap gap-2 pt-2 px-1">
        {filterType !== 'all' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-neutral-300 shadow-sm animate-fadeIn">
            Type: <span className="capitalize">{filterType}</span>
            <button onClick={() => setFilterType('all')} className="hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
          </div>
        )}
        {groupBy !== 'none' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-400 shadow-sm animate-fadeIn">
            Group: <span className="capitalize">{groupBy === 'payment' ? 'Payment Method' : groupBy}</span>
            <button onClick={() => setGroupBy('none')} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
          </div>
        )}
        {sortOption !== 'date-desc' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-xs font-semibold text-purple-700 dark:text-purple-400 shadow-sm animate-fadeIn">
            Sort: {sortOption === 'date-asc' ? 'Oldest First' : sortOption === 'amount-desc' ? 'Highest Amount' : 'Lowest Amount'}
            <button onClick={() => setSortOption('date-desc')} className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
          </div>
        )}
        {filterCategory !== 'all' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-neutral-300 shadow-sm animate-fadeIn">
            Category: {filterCategory}
            <button onClick={() => { setFilterCategory('all'); setCurrentPage(1) }} className="hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
          </div>
        )}
        {filterPaymentMethod !== 'all' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-neutral-300 shadow-sm animate-fadeIn">
            Payment: {filterPaymentMethod}
            <button onClick={() => { setFilterPaymentMethod('all'); setCurrentPage(1) }} className="hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
          </div>
        )}
        {filterSource !== 'all' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-neutral-300 shadow-sm animate-fadeIn">
            Source: {filterSource}
            <button onClick={() => { setFilterSource('all'); setCurrentPage(1) }} className="hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
          </div>
        )}
        {filterRecurring !== 'all' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-neutral-300 shadow-sm animate-fadeIn">
            Recurring: <span className="capitalize">{filterRecurring}</span>
            <button onClick={() => { setFilterRecurring('all'); setCurrentPage(1) }} className="hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
          </div>
        )}
      </div>

      {mounted && createPortal(
        <>
          {/* OVERLAY BACKDROP */}
          {showAdvancedFilters && (
            <div 
              className="fixed inset-0 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm z-[190] animate-fade-in" 
              onClick={() => setShowAdvancedFilters(false)}
            />
          )}

          {/* RESPONSIVE DRAWER / BOTTOM SHEET */}
          <div 
            className={`fixed z-[200] bg-white dark:bg-[#1C1C1E] transform transition-transform duration-300 ease-in-out flex flex-col
              inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-safe
              sm:top-0 sm:bottom-0 sm:right-0 sm:left-auto sm:w-[400px] sm:max-h-none sm:rounded-none sm:shadow-2xl sm:border-l sm:border-slate-200 sm:dark:border-neutral-800 sm:pb-0
              ${showAdvancedFilters ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}
            `}
          >
            {/* DRAG HANDLE (Mobile Only) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1.5 bg-slate-300 dark:bg-neutral-700 rounded-full"></div>
            </div>

            <div className="flex flex-col border-b border-slate-100 dark:border-neutral-800 shrink-0">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Manage View</h2>
                <div className="flex items-center gap-4">
                  <button onClick={resetFilters} className="text-blue-600 dark:text-blue-500 font-semibold text-sm hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                    Reset all
                  </button>
                  <button onClick={() => setShowAdvancedFilters(false)} className="hidden sm:flex p-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* MOBILE ONLY: DATE FILTERS */}
              <div className="space-y-3 sm:hidden pb-5 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Date Range</h3>
                <div className="flex gap-2">
                  <select
                    value={selectedYear || 'all'}
                    onChange={(e) => onYearChange?.(e.target.value === 'all' ? undefined : parseInt(e.target.value))}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900/50 px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white shadow-sm focus:border-slate-300 focus:outline-none appearance-none"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>

                  {selectedYear && (
                    <select
                      value={selectedMonth !== undefined ? selectedMonth : 'all'}
                      onChange={(e) => onMonthChange?.(e.target.value === 'all' ? undefined : parseInt(e.target.value))}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900/50 px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white shadow-sm focus:border-slate-300 focus:outline-none appearance-none"
                    >
                      <option value="all">All Months</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' })}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-3 animate-fade-in">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2 block">Sort By</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['date-desc', 'date-asc', 'amount-desc', 'amount-asc'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortOption(opt)
                        setCurrentPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left flex items-center justify-between border ${sortOption === opt
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 border-slate-200 dark:border-neutral-700'
                        }`}
                    >
                      <span className="truncate mr-1">
                        {opt === 'date-desc' ? 'Newest First' :
                         opt === 'date-asc' ? 'Oldest First' :
                         opt === 'amount-desc' ? 'Highest Amount' : 'Lowest Amount'}
                      </span>
                      {sortOption === opt && <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0"></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="animate-fade-in">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2 block">Group By</label>
                <div className="flex flex-wrap gap-2">
                  {(['none', 'date', 'month', 'category', 'payment', 'source', 'type'] as const).map((groupOption) => (
                    <button
                      key={groupOption}
                      onClick={() => {
                        setGroupBy(groupOption)
                        setCurrentPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors border ${groupBy === groupOption
                          ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm'
                          : 'bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 border-slate-200 dark:border-neutral-700'
                        }`}
                    >
                      {groupOption === 'payment' ? 'Payment Method' : groupOption}
                    </button>
                  ))}
                </div>
              </div>

              <div className="animate-fade-in">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2 block">Filters</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 mb-1 block">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => {
                        setFilterCategory(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">All</option>
                      {Array.from(new Set(categoryOptions)).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 mb-1 block">Payment Method</label>
                    <select
                      value={filterPaymentMethod}
                      onChange={(e) => {
                        setFilterPaymentMethod(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">All</option>
                      {Array.from(new Set(paymentOptions)).map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 mb-1 block">Source</label>
                    <select
                      value={filterSource}
                      onChange={(e) => {
                        setFilterSource(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">All</option>
                      {Array.from(new Set(sourceOptions)).map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 mb-1 block">Type</label>
                    <select
                      value={filterRecurring}
                      onChange={(e) => {
                        setFilterRecurring(e.target.value as 'all' | 'recurring' | 'one-time')
                        setCurrentPage(1)
                      }}
                      className="w-full rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-950 px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="recurring">Recurring</option>
                      <option value="one-time">One-time</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* APPLY BUTTON */}
            <div className="p-4 sm:p-5 bg-white dark:bg-[#1C1C1E] border-t border-slate-100 dark:border-neutral-800 shrink-0">
               <button 
                 onClick={() => setShowAdvancedFilters(false)}
                 className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-[0.98]"
               >
                 <Filter className="h-4 w-4" /> Apply filters
               </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
