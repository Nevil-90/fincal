// Streamlined, workflow-integrated power filter controls for transactions.
// Focuses on high density, fast keyboard-friendly searching, segmented controls,
// custom date ranges, amount constraints, quick filter presets, active filter pills, and density toggles.
'use client'

import React from 'react'
import {
  Search,
  Trash2,
  Download,
  X,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  DollarSign,
  Tag,
  AlignJustify,
  Menu
} from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'
import CustomDateField from '@/components/ui/CustomDateField'

export type DatePresetType = 'all' | 'this-month' | 'last-30' | 'last-month' | 'this-year' | 'custom'
export type QuickPresetType = 'all' | 'high-value' | 'recurring' | 'notes'
export type DensityType = 'comfortable' | 'compact'

export type SortOptionType = 
  | 'date-desc' 
  | 'date-asc' 
  | 'amount-desc' 
  | 'amount-asc'
  | 'title-asc'
  | 'title-desc'
  | 'category-asc'
  | 'category-desc'

export interface TransactionFiltersProps {
  embedded?: boolean
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
  sortOption: SortOptionType
  setSortOption: (sortOption: SortOptionType) => void
  showAdvancedFilters: boolean
  setShowAdvancedFilters: (show: boolean) => void
  hasActiveAdvancedFilters: boolean
  resetFilters: () => void
  selectedTransactionsSize: number
  handleMultiDelete: () => void
  setShowDateRangePicker: (show: boolean) => void
  categoryOptions: string[]
  filterGoalCategory?: string
  setFilterGoalCategory?: (category: string) => void
  goalCategoryOptions?: string[]
  paymentOptions: string[]
  sourceOptions: string[]
  setCurrentPage: (page: number) => void
  selectedYear?: number
  selectedMonth?: number
  onYearChange?: (year: number | undefined) => void
  onMonthChange?: (month: number | undefined) => void
  availableYears?: number[]
  // New Power Features
  datePreset: DatePresetType
  setDatePreset: (preset: DatePresetType) => void
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  minAmount: string
  setMinAmount: (val: string) => void
  maxAmount: string
  setMaxAmount: (val: string) => void
  quickPreset: QuickPresetType
  setQuickPreset: (preset: QuickPresetType) => void
  density: DensityType
  setDensity: (d: DensityType) => void
}

export function TransactionFilters({
  embedded = true,
  searchTerm, setSearchTerm,
  filterType, setFilterType,
  filterCategory, setFilterCategory,
  filterPaymentMethod, setFilterPaymentMethod,
  filterSource, setFilterSource,
  filterRecurring, setFilterRecurring,
  groupBy, setGroupBy,
  sortOption, setSortOption,
  showAdvancedFilters, setShowAdvancedFilters,
  resetFilters,
  selectedTransactionsSize, handleMultiDelete,
  setShowDateRangePicker,
  categoryOptions, paymentOptions, sourceOptions,
  filterGoalCategory = 'all', setFilterGoalCategory, goalCategoryOptions = [],
  setCurrentPage,
  datePreset, setDatePreset,
  startDate, setStartDate,
  endDate, setEndDate,
  minAmount, setMinAmount,
  maxAmount, setMaxAmount,
  quickPreset, setQuickPreset,
  density, setDensity
}: TransactionFiltersProps) {

  const uniqueCategoryOptions = React.useMemo(() => {
    return Array.from(new Set((categoryOptions || []).map(c => c?.trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
  }, [categoryOptions])

  const uniquePaymentOptions = React.useMemo(() => {
    return Array.from(new Set((paymentOptions || []).map(p => p?.trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
  }, [paymentOptions])

  const activeFiltersCount = (
    (filterCategory !== 'all' ? 1 : 0) +
    (filterCategory === 'Goals' && filterGoalCategory !== 'all' ? 1 : 0) +
    (filterPaymentMethod !== 'all' ? 1 : 0) +
    (filterSource !== 'all' ? 1 : 0) +
    (filterRecurring !== 'all' ? 1 : 0) +
    (groupBy !== 'none' ? 1 : 0) +
    (searchTerm ? 1 : 0) +
    (datePreset !== 'all' ? 1 : 0) +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0) +
    (quickPreset !== 'all' ? 1 : 0)
  )

  const handleDatePresetChange = (preset: DatePresetType) => {
    setDatePreset(preset)
    setCurrentPage(1)
    const now = new Date()

    if (preset === 'all') {
      setStartDate('')
      setEndDate('')
    } else if (preset === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    } else if (preset === 'last-30') {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    } else if (preset === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    } else if (preset === 'this-year') {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
  }

  const handleQuickPresetChange = (preset: QuickPresetType) => {
    if (quickPreset === preset) {
      setQuickPreset('all')
      if (preset === 'high-value') setMinAmount('')
      if (preset === 'recurring') setFilterRecurring('all')
      return
    }

    setQuickPreset(preset)
    setCurrentPage(1)

    if (preset === 'all') {
      setMinAmount('')
      setFilterRecurring('all')
    } else if (preset === 'high-value') {
      setMinAmount('1000')
    } else if (preset === 'recurring') {
      setFilterRecurring('recurring')
    }
  }

  return (
    <div className={
      embedded
        ? "p-3 sm:p-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] space-y-2.5"
        : "rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-3 sm:p-3.5 shadow-xs space-y-2.5"
    }>
      {/* 1. Primary Workflow Command Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Left: Search & Segmented Type Scope */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
          {/* Integrated Search Box with fluid responsive width */}
          <div className="relative w-full sm:w-60 md:w-64 lg:w-72 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search description, notes, payee..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-8 pl-8 pr-7 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Segmented Type Switcher */}
          <div className="grid grid-cols-3 sm:flex items-center p-0.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-xs w-full sm:w-auto shrink-0 select-none">
            <button
              type="button"
              onClick={() => { setFilterType('all'); setCurrentPage(1) }}
              className={`px-3 py-1 rounded-lg font-bold text-center transition-colors cursor-pointer outline-none focus:outline-none ${
                filterType === 'all'
                  ? 'bg-white dark:bg-[#18181b] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => { setFilterType('expense'); setCurrentPage(1) }}
              className={`px-3 py-1 rounded-lg font-bold text-center transition-colors cursor-pointer outline-none focus:outline-none ${
                filterType === 'expense'
                  ? 'bg-white dark:bg-[#18181b] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => { setFilterType('income'); setCurrentPage(1) }}
              className={`px-3 py-1 rounded-lg font-bold text-center transition-colors cursor-pointer outline-none focus:outline-none ${
                filterType === 'income'
                  ? 'bg-white dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Right: Actions (Density, Filters, Reset, Export) */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          {/* Density Toggle (Comfortable vs Compact) */}
          <button
            type="button"
            onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
            title={`Toggle Density (Currently: ${density})`}
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181b] hover:bg-slate-100 dark:hover:bg-[#202024] text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
          >
            {density === 'comfortable' ? (
              <AlignJustify className="h-3.5 w-3.5" />
            ) : (
              <Menu className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Secondary Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showAdvancedFilters || (activeFiltersCount > 0)
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
                : 'bg-slate-50 dark:bg-[#18181b] text-slate-600 dark:text-neutral-300 border-slate-200/90 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#202024]'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Reset Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              title="Reset all filters"
              className="flex items-center justify-center gap-1 h-8 px-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Export Action */}
          <button
            type="button"
            onClick={() => setShowDateRangePicker(true)}
            className="flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181b] hover:bg-slate-100 dark:hover:bg-[#202024] text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary Drawer-less Advanced Filter Strip */}
      {(showAdvancedFilters || datePreset === 'custom') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 pt-2.5 border-t border-slate-100 dark:border-white/[0.05] text-xs">
          {/* Custom Date Range Pickers */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              Start Date
            </label>
            <CustomDateField
              value={startDate}
              onChange={(val) => {
                setStartDate(val)
                setDatePreset('custom')
                setCurrentPage(1)
              }}
              placeholder="From (DD MMM YYYY)"
              size="xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              End Date
            </label>
            <CustomDateField
              value={endDate}
              onChange={(val) => {
                setEndDate(val)
                setDatePreset('custom')
                setCurrentPage(1)
              }}
              placeholder="To (DD MMM YYYY)"
              size="xs"
            />
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              Min Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-7 px-2.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181b] text-xs tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              Max Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-7 px-2.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181b] text-xs tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              Payment Method
            </label>
            <CustomSelect
              selectSize="xs"
              value={filterPaymentMethod}
              onChange={(e) => {
                setFilterPaymentMethod(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Methods</option>
              {uniquePaymentOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </CustomSelect>
          </div>

          {/* Group By */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              Group By
            </label>
            <CustomSelect
              selectSize="xs"
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value as any)
                setCurrentPage(1)
              }}
            >
              <option value="none">Date (Default)</option>
              <option value="category">Category</option>
              <option value="payment">Payment</option>
              <option value="source">Source</option>
              <option value="type">Type</option>
            </CustomSelect>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              Sort By
            </label>
            <CustomSelect
              selectSize="xs"
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as any)
                setCurrentPage(1)
              }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="title-asc">Description (A-Z)</option>
              <option value="title-desc">Description (Z-A)</option>
              <option value="category-asc">Category (A-Z)</option>
              <option value="category-desc">Category (Z-A)</option>
            </CustomSelect>
          </div>
        </div>
      )}

      {/* 3. Refinements & Filter Dimensions Bar */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap pt-2 border-t border-slate-100 dark:border-white/[0.04]">
        {/* Left: Dimension Selectors & Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Category Dropdown */}
          <div className="w-36 min-w-[130px]">
            <CustomSelect
              selectSize="xs"
              value={filterCategory}
              onChange={(e) => {
                const nextVal = e.target.value
                setFilterCategory(nextVal)
                if (nextVal !== 'Goals') setFilterGoalCategory?.('all')
                setCurrentPage(1)
              }}
            >
              <option value="all">All Categories</option>
              {uniqueCategoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </CustomSelect>
          </div>

          {/* Goal Category Sub-Filter (shown only when Category === 'Goals') */}
          {filterCategory === 'Goals' && (
            <div className="w-40 min-w-[135px] animate-in fade-in zoom-in-95 duration-150">
              <CustomSelect
                selectSize="xs"
                value={filterGoalCategory}
                onChange={(e) => {
                  setFilterGoalCategory?.(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="all">All Goal Categories</option>
                {goalCategoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </CustomSelect>
            </div>
          )}

          {/* Date Range Preset Selector */}
          <div className="w-32 min-w-[115px]">
            <CustomSelect
              selectSize="xs"
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value as DatePresetType)}
            >
              <option value="all">All Dates</option>
              <option value="this-month">This Month</option>
              <option value="last-30">Last 30 Days</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range...</option>
            </CustomSelect>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] hidden sm:block mx-0.5" />

          {/* Quick 1-Tap Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mr-0.5">
              Quick:
            </span>
            <button
              type="button"
              onClick={() => handleQuickPresetChange('all')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                quickPreset === 'all' && !minAmount && filterRecurring === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleQuickPresetChange('high-value')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                minAmount === '1000'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              High Value (&gt; ₹1k)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPresetChange('recurring')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                filterRecurring === 'recurring'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Recurring
            </button>
          </div>
        </div>

        {/* Right: Removable Active Criteria Pills */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                {filterCategory}
                <button type="button" onClick={() => { setFilterCategory('all'); setFilterGoalCategory?.('all'); }} className="hover:text-rose-500 cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {filterCategory === 'Goals' && filterGoalCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                Goal Category: {filterGoalCategory}
                <button type="button" onClick={() => setFilterGoalCategory?.('all')} className="hover:text-rose-500 cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                Date: {datePreset === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` : datePreset}
                <button type="button" onClick={() => handleDatePresetChange('all')} className="hover:text-rose-500 cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {minAmount && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                Min: ₹{minAmount}
                <button
                  type="button"
                  onClick={() => {
                    setMinAmount('')
                    if (quickPreset === 'high-value') setQuickPreset('all')
                  }}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {maxAmount && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                Max: ₹{maxAmount}
                <button type="button" onClick={() => setMaxAmount('')} className="hover:text-rose-500 cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {groupBy !== 'none' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                Group: {groupBy}
                <button type="button" onClick={() => setGroupBy('none')} className="hover:text-rose-500 cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {filterPaymentMethod !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                {filterPaymentMethod}
                <button type="button" onClick={() => setFilterPaymentMethod('all')} className="hover:text-rose-500 cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {filterRecurring !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                {filterRecurring === 'recurring' ? 'Recurring' : 'One-time'}
                <button
                  type="button"
                  onClick={() => {
                    setFilterRecurring('all')
                    if (quickPreset === 'recurring') setQuickPreset('all')
                  }}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            {filterSource !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                Source: {filterSource}
                <button type="button" onClick={() => setFilterSource('all')} className="hover:text-rose-500 cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
