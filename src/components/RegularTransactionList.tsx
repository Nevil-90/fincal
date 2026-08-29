// Full-featured transaction list with search, filtering, grouping, CSV export,
// optimistic deletion with undo toast, and both desktop table and mobile swipe-card views.
'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Edit2, Search, Filter, Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Check, FileText, ArrowRight, X, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard, Plug, ChevronDown, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/financial-utils'
import SwipeableRow from './ui/SwipeableRow'
import { useScrollLock } from '@/hooks/useScrollLock'
import AddTransactionForm from './AddTransactionForm'
import { TransactionFilters } from './TransactionFilters'
import { TransactionPagination } from './TransactionPagination'
import { useTransactions } from '@/hooks/useApi'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import CustomDateField from '@/components/ui/CustomDateField'
import CustomSelect from '@/components/ui/CustomSelect'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  paymentMethod: string | null
  source: string | null
  date: string
  recurringTransactionId?: string
  recurringTransaction?: {
    id: string
    description: string | null
    frequency: string
    isActive: boolean
    isPaused: boolean
  }
}

interface RegularTransactionListProps {
  selectedMonth?: number
  selectedYear?: number
  viewMode?: 'month' | 'year' | 'all'
  onTransactionDeleted?: () => void
  onYearChange?: (year: number | undefined) => void
  onMonthChange?: (month: number | undefined) => void
  availableYears?: number[]
}

interface GroupedTransactions {
  [key: string]: {
    transactions: Transaction[]
    income: number
    expenses: number
    balance: number
    count: number
  }
}

export default function RegularTransactionList({
  selectedMonth,
  selectedYear,
  viewMode = 'all',
  onTransactionDeleted = () => { },
  onYearChange,
  onMonthChange,
  availableYears = []
}: RegularTransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterRecurring, setFilterRecurring] = useState<'all' | 'recurring' | 'one-time'>('all')
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  const [pdfStartDate, setPdfStartDate] = useState('')
  const [pdfEndDate, setPdfEndDate] = useState('')
  const [pdfExportType, setPdfExportType] = useState<'category-current' | 'category-month' | 'category-year' | 'category-custom' | 'month' | 'year' | 'custom'>('category-current')
  const [pdfSelectedMonth, setPdfSelectedMonth] = useState(new Date().getMonth())
  const [pdfSelectedYear, setPdfSelectedYear] = useState(new Date().getFullYear())
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'category' | 'payment' | 'month' | 'source' | 'type'>('none')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  useScrollLock(showDateRangePicker)

  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set())
  const listContainerRef = useRef<HTMLDivElement>(null)

  const hasActiveAdvancedFilters = filterCategory !== 'all' || filterPaymentMethod !== 'all' || filterSource !== 'all' || filterRecurring !== 'all' || groupBy !== 'none'

  const { data: staticData } = useEnhancedStaticData()
  const categoryOptions = [
    ...(staticData?.expenseCategories || []),
    ...(staticData?.incomeCategories || [])
  ].map(c => c.name)
  const paymentOptions = staticData?.paymentMethods?.map(p => p.name) || []
  const sourceOptions = staticData?.incomeSources?.map(s => s.name) || []

  const apiFilters = useMemo(() => {
    const filters: Record<string, string | number | undefined> = {}
    if (searchTerm) filters.search = searchTerm
    if (filterType !== 'all') filters.type = filterType
    if (filterCategory !== 'all') filters.category = filterCategory
    if (filterPaymentMethod !== 'all') filters.paymentMethod = filterPaymentMethod
    if (filterSource !== 'all') filters.source = filterSource
    if (filterRecurring !== 'all') filters.recurring = filterRecurring

    if (viewMode === 'month') {
      if (selectedMonth !== undefined) filters.month = selectedMonth + 1
      if (selectedYear !== undefined) filters.year = selectedYear
    } else if (viewMode === 'year') {
      if (selectedYear !== undefined) filters.year = selectedYear
    }

    return filters
  }, [searchTerm, filterType, filterCategory, filterPaymentMethod, filterSource, filterRecurring, viewMode, selectedMonth, selectedYear])

  const { transactions: fetchedTransactions, pagination, isLoading, mutate } = useTransactions(
    groupBy !== 'none' ? 1 : currentPage,
    groupBy !== 'none' ? 10000 : pageSize,
    apiFilters
  )

  // Debounce API refreshes to prevent storms when deleting rapidly
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
    refreshTimeoutRef.current = setTimeout(() => {
      mutate()
      onTransactionDeleted()
    }, 500)
  }, [mutate, onTransactionDeleted])

  const filteredTransactions = useMemo(() => {
    let sorted = (fetchedTransactions || []).filter(t => !pendingDeleteIds.has(t.id))

    sorted = sorted.sort((a, b) => {
      if (sortOption === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortOption === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortOption === 'amount-desc') return b.amount - a.amount
      if (sortOption === 'amount-asc') return a.amount - b.amount
      return 0
    })

    return sorted
  }, [fetchedTransactions, pendingDeleteIds, sortOption])


  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netAmount = totalIncome - totalExpenses

  const groupedTransactions = useMemo((): GroupedTransactions => {
    if (groupBy === 'none') return {}

    const groups: GroupedTransactions = {}

    filteredTransactions.forEach(transaction => {
      let groupKey = ''

      switch (groupBy) {
        case 'date':
          groupKey = new Date(transaction.date).toLocaleDateString('en-IN')
          break
        case 'month':
          const date = new Date(transaction.date)
          groupKey = `${date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
          break
        case 'category':
          groupKey = transaction.category
          break
        case 'payment':
          groupKey = transaction.paymentMethod || 'No Payment Method'
          break
        case 'source':
          groupKey = transaction.source || 'No Source'
          break
        case 'type':
          groupKey = transaction.type === 'income' ? 'Income' : 'Expense'
          break
        default:
          groupKey = 'Other'
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          transactions: [],
          income: 0,
          expenses: 0,
          balance: 0,
          count: 0
        }
      }

      groups[groupKey].transactions.push(transaction)
      groups[groupKey].count++

      if (transaction.type === 'income') {
        groups[groupKey].income += transaction.amount
      } else {
        groups[groupKey].expenses += transaction.amount
      }

      groups[groupKey].balance = groups[groupKey].income - groups[groupKey].expenses
    })

    return groups
  }, [filteredTransactions, groupBy, pendingDeleteIds])

  const deleteTransaction = useCallback(async (id: string) => {
    // Capture transaction data before deleting for the Undo feature
    const t = fetchedTransactions?.find(tx => tx.id === id)

    setPendingDeleteIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })

    try {
      const response = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete transaction')
      }

      triggerRefresh()

      toast.success('Transaction deleted', {
        action: t ? {
          label: 'Undo',
          onClick: async () => {
            try {
              await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: t.type, amount: t.amount, category: t.category,
                  description: t.description, paymentMethod: t.paymentMethod,
                  source: t.source, date: t.date, recurringTransactionId: t.recurringTransactionId
                })
              })
              triggerRefresh()
              toast.success('Transaction restored')
              // Also remove from pending deletes just in case
              setPendingDeleteIds(prev => { const next = new Set(prev); next.delete(id); return next; })
            } catch {
              toast.error('Failed to restore transaction')
            }
          }
        } : undefined
      })
    } catch (err: any) {
      setPendingDeleteIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.error(err.message || 'Failed to delete transaction')
      triggerRefresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedTransactions, triggerRefresh])

  const duplicateTransaction = useCallback(async (t: Transaction) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: t.type,
          amount: t.amount,
          category: t.category,
          description: (t.description || '') + ' (Copy)',
          paymentMethod: t.paymentMethod,
          source: t.source,
          date: t.date,
          recurringTransactionId: t.recurringTransactionId
        })
      })
      if (response.ok) {
        triggerRefresh()
      }
    } catch (e) {
      console.error(e)
    }
  }, [triggerRefresh])

  const handleMultiDelete = async () => {
    if (selectedTransactions.size === 0) return
    const ids = Array.from(selectedTransactions)

    // Capture transactions for Undo
    const deletedTxns = (fetchedTransactions || []).filter(tx => ids.includes(tx.id))

    setSelectedTransactions(new Set())
    setPendingDeleteIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })

    try {
      await Promise.all(ids.map(async (id) => {
        const response = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to delete transaction')
        }
      }))

      triggerRefresh()

      toast.success(`${ids.length} transactions deleted`, {
        action: deletedTxns.length > 0 ? {
          label: 'Undo',
          onClick: async () => {
            try {
              await Promise.all(deletedTxns.map(t => fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: t.type, amount: t.amount, category: t.category,
                  description: t.description, paymentMethod: t.paymentMethod,
                  source: t.source, date: t.date, recurringTransactionId: t.recurringTransactionId
                })
              })))
              triggerRefresh()
              toast.success(`${deletedTxns.length} transactions restored`)
              setPendingDeleteIds(prev => {
                const next = new Set(prev)
                ids.forEach(id => next.delete(id))
                return next
              })
            } catch {
              toast.error('Failed to restore transactions')
            }
          }
        } : undefined
      })
    } catch (err: any) {
      setPendingDeleteIds(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
      toast.error(err.message || 'Failed to delete transactions')
      triggerRefresh()
    }
  }

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTransactions(newSelected)
  }

  const handleSelectAll = (targetTransactions: Transaction[]) => {
    const targetIds = targetTransactions.map(t => t.id)
    const allSelected = targetIds.length > 0 && targetIds.every(id => selectedTransactions.has(id))
    const newSelected = new Set(selectedTransactions)

    if (allSelected) {
      targetIds.forEach(id => newSelected.delete(id))
    } else {
      targetIds.forEach(id => newSelected.add(id))
    }
    setSelectedTransactions(newSelected)
  }

  const exportToPDF = () => {
    // Build export URL with current filters
    const params = new URLSearchParams({
      type: 'transactions'
    })

    switch (pdfExportType) {
      case 'category-current':
        // Export grouped by category with current view mode settings
        params.append('groupBy', 'category')
        if (viewMode === 'month') {
          if (selectedMonth !== undefined) params.append('month', (selectedMonth + 1).toString())
          if (selectedYear !== undefined) params.append('year', selectedYear.toString())
        } else if (viewMode === 'year') {
          if (selectedYear !== undefined) params.append('year', selectedYear.toString())
        }
        break
      case 'category-month':
        // Export grouped by category for specific month
        params.append('groupBy', 'category')
        params.append('month', (pdfSelectedMonth + 1).toString())
        params.append('year', pdfSelectedYear.toString())
        break
      case 'category-year':
        // Export grouped by category for specific year
        params.append('groupBy', 'category')
        params.append('year', pdfSelectedYear.toString())
        break
      case 'category-custom':
        // Export grouped by category for custom date range
        params.append('groupBy', 'category')
        if (pdfStartDate && pdfEndDate) {
          params.append('startDate', pdfStartDate)
          params.append('endDate', pdfEndDate)
        } else {
          toast.error('Please select both start and end dates for custom range')
          return
        }
        break
      case 'month':
        // Simple month export (no grouping)
        params.append('month', (pdfSelectedMonth + 1).toString())
        params.append('year', pdfSelectedYear.toString())
        break
      case 'year':
        // Simple year export (no grouping)
        params.append('year', pdfSelectedYear.toString())
        break
      case 'custom':
        // Simple custom date range export (no grouping)
        if (pdfStartDate && pdfEndDate) {
          params.append('startDate', pdfStartDate)
          params.append('endDate', pdfEndDate)
        } else {
          toast.error('Please select both start and end dates for custom range')
          return
        }
        break
    }

    if (searchTerm) params.append('search', searchTerm)
    if (filterType !== 'all') params.append('filterType', filterType)

    if (!params.has('groupBy') && groupBy !== 'none') {
      if (!['month', 'year', 'custom'].includes(pdfExportType)) {
        params.append('groupBy', groupBy)
      }
    }

    const exportUrl = `/api/export/csv?${params}`
    window.open(exportUrl, '_self')

    setPdfStartDate('')
    setPdfEndDate('')
    setPdfExportType('category-current')
    setShowDateRangePicker(false)
  }

  const totalItems = useMemo(() => {
    return groupBy !== 'none'
      ? Object.keys(groupedTransactions).length
      : (pagination?.totalCount || 0)
  }, [groupBy, groupedTransactions, pagination])

  const totalPages = useMemo(() => {
    if (groupBy !== 'none') {
      return Math.max(1, Math.ceil(Object.keys(groupedTransactions).length / pageSize))
    }
    return pagination?.totalPages || 1
  }, [groupBy, groupedTransactions, pageSize, pagination])

  const safePage = Math.min(currentPage, totalPages)

  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    filterType,
    filterCategory,
    filterPaymentMethod,
    filterSource,
    filterRecurring,
    groupBy
  ])

  const paginationLabel = useMemo(() => {
    if (totalItems === 0) return '0 items'
    const start = (safePage - 1) * pageSize + 1
    const end = Math.min(safePage * pageSize, totalItems)
    const suffix = groupBy !== 'none' ? 'groups' : 'entries'
    return `${start}-${end} of ${totalItems} ${suffix}`
  }, [safePage, pageSize, totalItems, groupBy])

  const paginatedTransactions = useMemo(() => {
    if (groupBy !== 'none') return []
    return filteredTransactions
  }, [filteredTransactions, groupBy])

  const paginatedGroups = useMemo(() => {
    if (groupBy === 'none') return []
    const entries = Object.entries(groupedTransactions)
    const start = (safePage - 1) * pageSize
    const end = start + pageSize
    return entries.slice(start, end)
  }, [groupedTransactions, groupBy, safePage, pageSize])

  const resetFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setFilterCategory('all')
    setFilterPaymentMethod('all')
    setFilterSource('all')
    setFilterRecurring('all')
    setGroupBy('none')
    setSortOption('date-desc')
    setCurrentPage(1)
    onYearChange?.(undefined)
    onMonthChange?.(undefined)
  }

  return (
    <div className="space-y-4 pb-6" ref={listContainerRef}>
      <TransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterPaymentMethod={filterPaymentMethod}
        setFilterPaymentMethod={setFilterPaymentMethod}
        filterSource={filterSource}
        setFilterSource={setFilterSource}
        filterRecurring={filterRecurring}
        setFilterRecurring={setFilterRecurring}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        sortOption={sortOption}
        setSortOption={setSortOption}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        hasActiveAdvancedFilters={hasActiveAdvancedFilters}
        resetFilters={resetFilters}
        selectedTransactionsSize={selectedTransactions.size}
        handleMultiDelete={handleMultiDelete}
        setShowDateRangePicker={setShowDateRangePicker}
        categoryOptions={categoryOptions}
        paymentOptions={paymentOptions}
        sourceOptions={sourceOptions}
        setCurrentPage={setCurrentPage}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        availableYears={availableYears}
      />

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {filteredTransactions.length > 0 ? (
          groupBy === 'none' ? (
            <div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedTransactions.has(t.id))}
                          onChange={() => handleSelectAll(paginatedTransactions)}
                          className="rounded border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Method</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-900 divide-y divide-slate-200 dark:divide-neutral-800">
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="rounded border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-neutral-200">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-neutral-200">
                          <div className="flex items-center gap-2">
                            <span>{transaction.description || 'No description'}</span>
                            {transaction.recurringTransactionId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> {transaction.recurringTransaction?.frequency || 'Auto'}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-neutral-200">
                          {transaction.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-neutral-200">
                          {transaction.paymentMethod || '-'}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium text-right ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingTransaction(transaction)}
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                            title="Edit transaction"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-rose-600 dark:text-rose-500 hover:text-rose-800 dark:hover:text-rose-400 transition-colors p-1"
                            title="Delete transaction"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden space-y-3 p-1">
                {paginatedTransactions.map((transaction) => {
                  const isIncome = transaction.type === 'income'
                  return (
                    <SwipeableRow
                      key={transaction.id}
                      onSwipeLeft={() => deleteTransaction(transaction.id)}
                      onSwipeRight={() => duplicateTransaction(transaction)}
                      leftContent={
                        <div className="flex flex-col items-center justify-center w-full h-full text-white bg-blue-500 rounded-l-2xl">
                          <Copy className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-bold">Duplicate</span>
                        </div>
                      }
                      rightContent={
                        <div className="flex flex-col items-center justify-center w-full h-full text-white bg-rose-500 rounded-r-2xl">
                          <Trash2 className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-bold">Delete</span>
                        </div>
                      }
                    >
                      <div
                        onClick={() => setEditingTransaction(transaction)}
                        className="flex items-center gap-3 py-3 px-4 bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl cursor-pointer active:bg-slate-50 dark:active:bg-neutral-800 transition-colors shadow-sm"
                      >
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                          />
                        </div>

                        <div className={`h-10 w-10 flex items-center justify-center rounded-xl text-lg shrink-0 shadow-sm border ${isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                          }`}>
                          {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                            {transaction.description || 'No description'}
                          </p>
                          <div className="flex items-center text-[11px] text-slate-500 dark:text-neutral-400 gap-1.5 mt-0.5">
                            <span className="font-semibold">{new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            <span>•</span>
                            <span className="truncate font-medium">{transaction.category || 'Unspecified'}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className={`text-[15px] font-black tracking-tight ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-neutral-100'
                            }`}>
                            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                          {(transaction.paymentMethod || transaction.recurringTransactionId) && (
                            <div className="flex gap-1">
                              {transaction.paymentMethod && (
                                <span className="bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                  {transaction.paymentMethod}
                                </span>
                              )}
                              {transaction.recurringTransactionId && (
                                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5">
                                  <RefreshCw className="h-2 w-2" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </SwipeableRow>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {paginatedGroups.map(([groupKey, group]) => (
                <div key={groupKey} className="border border-slate-200 dark:border-neutral-800 rounded-2xl">
                  <div
                    className="flex flex-col gap-3 p-4 bg-white dark:bg-neutral-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => {
                      const newExpanded = new Set(expandedGroups)
                      if (expandedGroups.has(groupKey)) {
                        newExpanded.delete(groupKey)
                      } else {
                        newExpanded.add(groupKey)
                      }
                      setExpandedGroups(newExpanded)
                    }}
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-neutral-200 break-words">{groupKey}</h3>
                      <span className="text-sm text-slate-500 dark:text-neutral-400">({group.count} transactions)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium whitespace-nowrap">+{formatCurrency(group.income)}</span>
                      <span className="text-slate-300 dark:text-neutral-700">|</span>
                      <span className="text-red-600 dark:text-red-400 font-medium whitespace-nowrap">-{formatCurrency(group.expenses)}</span>
                      <span className="text-slate-300 dark:text-neutral-700">|</span>
                      <span className={`font-medium whitespace-nowrap ${group.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {formatCurrency(group.balance)}
                      </span>
                      <span className="text-slate-400">
                        {expandedGroups.has(groupKey) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    </div>
                  </div>

                  {expandedGroups.has(groupKey) && (
                    <div className="border-t border-slate-200 dark:border-neutral-800">
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white dark:bg-neutral-900">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                                <input
                                  type="checkbox"
                                  checked={group.transactions.length > 0 && group.transactions.every(t => selectedTransactions.has(t.id))}
                                  onChange={() => {
                                    const groupTransactionIds = group.transactions.map(t => t.id)
                                    const allSelected = groupTransactionIds.every(id => selectedTransactions.has(id))
                                    const newSelected = new Set(selectedTransactions)

                                    if (allSelected) {
                                      groupTransactionIds.forEach(id => newSelected.delete(id))
                                    } else {
                                      groupTransactionIds.forEach(id => newSelected.add(id))
                                    }
                                    setSelectedTransactions(newSelected)
                                  }}
                                  className="rounded border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                />
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Description</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-neutral-900 divide-y divide-slate-100 dark:divide-neutral-800">
                            {group.transactions.map((transaction) => (
                              <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                                <td className="px-4 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedTransactions.has(transaction.id)}
                                    onChange={() => handleSelectTransaction(transaction.id)}
                                    className="rounded border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900 dark:text-neutral-200">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900 dark:text-neutral-200">
                                  <div className="flex items-center gap-2">
                                    <span>{transaction.description || 'No description'}</span>
                                    {transaction.recurringTransactionId && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                        <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> {transaction.recurringTransaction?.frequency || 'Auto'}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900 dark:text-neutral-200">
                                  {transaction.category}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900 dark:text-neutral-200">
                                  {transaction.paymentMethod || '-'}
                                </td>
                                <td className={`px-4 py-2 text-sm font-medium text-right ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </td>
                                <td className="px-4 py-2 text-center flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setEditingTransaction(transaction)}
                                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                                    title="Edit transaction"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteTransaction(transaction.id)}
                                    className="text-rose-600 dark:text-rose-500 hover:text-rose-800 dark:hover:text-rose-400 transition-colors p-1"
                                    title="Delete transaction"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="sm:hidden space-y-3 p-1">
                        {group.transactions.map((transaction) => {
                          const isIncome = transaction.type === 'income'
                          return (
                            <SwipeableRow
                              key={transaction.id}
                              onSwipeLeft={() => deleteTransaction(transaction.id)}
                              onSwipeRight={() => duplicateTransaction(transaction)}
                              leftContent={
                                <div className="flex flex-col items-center justify-center w-full h-full text-white bg-blue-500 rounded-l-2xl">
                                  <Copy className="w-5 h-5 mb-1" />
                                  <span className="text-[10px] font-bold">Duplicate</span>
                                </div>
                              }
                              rightContent={
                                <div className="flex flex-col items-center justify-center w-full h-full text-white bg-rose-500 rounded-r-2xl">
                                  <Trash2 className="w-5 h-5 mb-1" />
                                  <span className="text-[10px] font-bold">Delete</span>
                                </div>
                              }
                            >
                              <div
                                onClick={() => setEditingTransaction(transaction)}
                                className="flex items-center gap-3 py-3 px-4 bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl cursor-pointer active:bg-slate-50 dark:active:bg-neutral-800 transition-colors shadow-sm"
                              >
                                {/* Checkbox (Stop propagation) */}
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedTransactions.has(transaction.id)}
                                    onChange={() => handleSelectTransaction(transaction.id)}
                                    className="h-4 w-4 rounded border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                                  />
                                </div>

                                {/* Icon */}
                                <div className={`h-10 w-10 flex items-center justify-center rounded-xl text-lg shrink-0 shadow-sm border ${isIncome
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                                  }`}>
                                  {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                                    {transaction.description || 'No description'}
                                  </p>
                                  <div className="flex items-center text-[11px] text-slate-500 dark:text-neutral-400 gap-1.5 mt-0.5">
                                    <span className="font-semibold">{new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                    <span>•</span>
                                    <span className="truncate font-medium">{transaction.category || 'Unspecified'}</span>
                                  </div>
                                </div>

                                {/* Amount & Metadata */}
                                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                  <span className={`text-[15px] font-black tracking-tight ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-neutral-100'
                                    }`}>
                                    {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                                  </span>
                                  {(transaction.paymentMethod || transaction.recurringTransactionId) && (
                                    <div className="flex gap-1">
                                      {transaction.paymentMethod && (
                                        <span className="bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                          {transaction.paymentMethod}
                                        </span>
                                      )}
                                      {transaction.recurringTransactionId && (
                                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5">
                                          <RefreshCw className="h-2 w-2" />
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </SwipeableRow>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/50 dark:bg-neutral-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-neutral-800">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-slate-100 dark:border-neutral-800 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-slate-300 dark:text-neutral-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No transactions found</h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 text-center max-w-sm mb-6">
              You haven't logged any transactions matching your current filters. Add a new transaction to see it here.
            </p>
          </div>
        )}
      </div>

      {(filteredTransactions.length > 0 || paginatedGroups.length > 0) && (
        <TransactionPagination
          pageSize={pageSize}
          setPageSize={setPageSize}
          paginationLabel={paginationLabel}
          safePage={safePage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}

      {showDateRangePicker && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 dark:bg-neutral-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Download Data as CSV</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-500">Statement Export</p>
              </div>
              <button
                onClick={() => setShowDateRangePicker(false)}
                className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 dark:border-neutral-700 bg-slate-50/70 dark:bg-neutral-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-neutral-400">Statement Range</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400">Choose the time window and grouping.</p>

                <div className="mt-4 grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2">
                  <button
                    onClick={() => setPdfExportType('category-current')}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'category-current'
                      ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    Current View (Category)
                  </button>
                  <button
                    onClick={() => setPdfExportType('category-month')}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'category-month'
                      ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    Category by Month
                  </button>
                  <button
                    onClick={() => setPdfExportType('category-year')}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'category-year'
                      ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    Category by Year
                  </button>
                  <button
                    onClick={() => setPdfExportType('category-custom')}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'category-custom'
                      ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    Category (Custom Range)
                  </button>
                  <button
                    onClick={() => setPdfExportType('month')}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'month'
                      ? 'border-slate-400 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    Statement Month
                  </button>
                  <button
                    onClick={() => setPdfExportType('year')}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'year'
                      ? 'border-slate-400 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    Statement Year
                  </button>
                  <button
                    onClick={() => setPdfExportType('custom')}
                    className={`col-span-2 rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'custom'
                      ? 'border-slate-400 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200'
                      : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    Statement Custom Range
                  </button>
                </div>
              </div>

              {(pdfExportType === 'month' || pdfExportType === 'year' ||
                pdfExportType === 'category-current' || pdfExportType === 'category-month' ||
                pdfExportType === 'category-year') && (
                  <div className="grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2">
                    <div>
                      <CustomSelect
                        label="Year"
                        value={pdfSelectedYear}
                        onChange={(e) => setPdfSelectedYear(parseInt(e.target.value))}
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </CustomSelect>
                    </div>
                    {(pdfExportType === 'month' || pdfExportType === 'category-month') && (
                      <div>
                        <CustomSelect
                          label="Month"
                          value={pdfSelectedMonth}
                          onChange={(e) => setPdfSelectedMonth(parseInt(e.target.value))}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                              {new Date(2025, i, 1).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </CustomSelect>
                      </div>
                    )}
                  </div>
                )}

              {(pdfExportType === 'custom' || pdfExportType === 'category-custom') && (
                <div className="grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2">
                  <div>
                    <CustomDateField
                      label="Start Date"
                      value={pdfStartDate}
                      onChange={setPdfStartDate}
                    />
                  </div>
                  <div>
                    <CustomDateField
                      label="End Date"
                      value={pdfEndDate}
                      onChange={setPdfEndDate}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDateRangePicker(false)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex-1 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setEditingTransaction(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-slate-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <AddTransactionForm
              initialData={{
                id: editingTransaction.id,
                type: editingTransaction.type,
                amount: editingTransaction.amount,
                category: editingTransaction.category,
                description: editingTransaction.description,
                paymentMethod: editingTransaction.paymentMethod,
                source: editingTransaction.source,
                date: editingTransaction.date
              }}
              onClose={() => setEditingTransaction(null)}
              onTransactionAdded={() => {
                setEditingTransaction(null)
                onTransactionDeleted() // Triggers a re-fetch of transactions
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
