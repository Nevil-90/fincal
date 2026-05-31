'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Edit2, Search, Filter, Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Check, FileText, ArrowRight, X, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard, Plug, ChevronDown, Copy } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import UndoToast from './ui/UndoToast'
import SwipeableRow from './ui/SwipeableRow'
import { useScrollLock } from '@/hooks/useScrollLock'
import AddTransactionForm from './AddTransactionForm'
import { TransactionFilters } from './TransactionFilters'
import { TransactionPagination } from './TransactionPagination'
import { useTransactions } from '@/hooks/useApi'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'

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
  selectedMonth = new Date().getMonth(),
  selectedYear = new Date().getFullYear(),
  viewMode = 'all',
  onTransactionDeleted = () => { }
}: RegularTransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterRecurring, setFilterRecurring] = useState<'all' | 'recurring' | 'one-time'>('all')
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

  // UndoToast state
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo: () => void; onExpire: () => void } | null>(null)
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

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: Record<string, string | number | undefined> = {}
    if (searchTerm) filters.search = searchTerm
    if (filterType !== 'all') filters.type = filterType
    if (filterCategory !== 'all') filters.category = filterCategory
    if (filterPaymentMethod !== 'all') filters.paymentMethod = filterPaymentMethod
    // The API currently might not support source/recurring filtering but we pass them anyway
    if (filterSource !== 'all') filters.source = filterSource
    if (filterRecurring !== 'all') filters.recurring = filterRecurring

    if (viewMode === 'month') {
      filters.month = selectedMonth + 1
      filters.year = selectedYear
    } else if (viewMode === 'year') {
      filters.year = selectedYear
    }

    return filters
  }, [searchTerm, filterType, filterCategory, filterPaymentMethod, filterSource, filterRecurring, viewMode, selectedMonth, selectedYear])

  const { transactions: fetchedTransactions, pagination, isLoading, mutate } = useTransactions(currentPage, pageSize, apiFilters)

  // Filter out pending deletes locally for immediate UI update
  const filteredTransactions = useMemo(() => {
    return (fetchedTransactions || []).filter(t => !pendingDeleteIds.has(t.id))
  }, [fetchedTransactions, pendingDeleteIds])


  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netAmount = totalIncome - totalExpenses

  // Group transactions
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
    // Optimistic: immediately hide from view
    setPendingDeleteIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })

    // Show undo toast for 5 seconds
    const doDelete = async () => {
      try {
        await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
        setPendingDeleteIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        onTransactionDeleted()
      } catch {
        // If fail, show it again
        setPendingDeleteIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        onTransactionDeleted()
      }
    }

    setUndoToast({
      message: 'Transaction deleted',
      onUndo: () => {
        setUndoToast(null)
        // Restore visibility
        setPendingDeleteIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      },
      onExpire: () => {
        setUndoToast(null)
        doDelete()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTransactionDeleted])

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
          date: new Date().toISOString(),
          recurringTransactionId: t.recurringTransactionId
        })
      })
      if (response.ok) {
        onTransactionDeleted() // this triggers refresh
      }
    } catch (e) {
      console.error(e)
    }
  }, [onTransactionDeleted])

  const handleMultiDelete = async () => {
    if (selectedTransactions.size === 0) return
    const ids = Array.from(selectedTransactions)
    setSelectedTransactions(new Set())

    const doMultiDelete = async () => {
      try {
        await Promise.all(ids.map(id => fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })))
        onTransactionDeleted()
      } catch {
        onTransactionDeleted()
      }
    }

    setUndoToast({
      message: `${ids.length} transactions deleted`,
      onUndo: () => {
        setUndoToast(null)
        setSelectedTransactions(new Set(ids))
      },
      onExpire: () => {
        setUndoToast(null)
        doMultiDelete()
      }
    })
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
          params.append('month', (selectedMonth + 1).toString())
          params.append('year', selectedYear.toString())
        } else if (viewMode === 'year') {
          params.append('year', selectedYear.toString())
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
          alert('Please select both start and end dates for custom range')
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
          alert('Please select both start and end dates for custom range')
          return
        }
        break
    }

    // Add search and filter parameters (but NOT groupBy for non-category exports)
    if (searchTerm) params.append('search', searchTerm)
    if (filterType !== 'all') params.append('filterType', filterType)

    // Only add groupBy if it's not already set by the export type logic above
    if (!params.has('groupBy') && groupBy !== 'none') {
      // Don't add groupBy for simple exports (month, year, custom)
      if (!['month', 'year', 'custom'].includes(pdfExportType)) {
        params.append('groupBy', groupBy)
      }
    }

    // Open export API endpoint to download CSV
    const exportUrl = `/api/export/csv?${params}`
    window.open(exportUrl, '_self')

    // Reset form
    setPdfStartDate('')
    setPdfEndDate('')
    setPdfExportType('category-current')
    setShowDateRangePicker(false)
  }

  const totalPages = pagination?.totalPages || 1
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
    const totalItems = pagination?.totalCount || 0
    if (totalItems === 0) return '0 items'
    const start = (safePage - 1) * pageSize + 1
    const end = Math.min(safePage * pageSize, totalItems)
    return `${start}-${end} of ${totalItems} entries`
  }, [safePage, pageSize, pagination])

  const paginatedTransactions = useMemo(() => {
    if (groupBy !== 'none') return []
    return filteredTransactions
  }, [filteredTransactions, groupBy])

  const paginatedGroups = useMemo(() => {
    if (groupBy === 'none') return []
    return Object.entries(groupedTransactions)
  }, [groupedTransactions])

  const resetFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setFilterCategory('all')
    setFilterPaymentMethod('all')
    setFilterSource('all')
    setFilterRecurring('all')
    setGroupBy('none')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4 px-3 pb-6 sm:px-4" ref={listContainerRef}>
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
      />



      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredTransactions.length > 0 ? (
          groupBy === 'none' ? (
            // Ungrouped table view
            <div>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedTransactions.has(t.id))}
                          onChange={() => handleSelectAll(paginatedTransactions)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{transaction.description || 'No description'}</span>
                            {transaction.recurringTransactionId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> {transaction.recurringTransaction?.frequency || 'Auto'}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {transaction.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {transaction.paymentMethod || '-'}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingTransaction(transaction)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="Edit transaction"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-rose-600 hover:text-rose-800 transition-colors p-1"
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
                        className="flex items-center gap-3 py-3 px-4 bg-white border border-slate-100 rounded-2xl cursor-pointer active:bg-slate-50 transition-colors shadow-sm"
                      >
                        {/* Checkbox (Stop propagation) */}
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Icon */}
                        <div className={`h-10 w-10 flex items-center justify-center rounded-xl text-lg shrink-0 shadow-sm border ${isIncome
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                          {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" /> : <ArrowUpRight className="h-4 w-4 text-rose-600" />}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 leading-snug truncate">
                            {transaction.description || 'No description'}
                          </p>
                          <div className="flex items-center text-[11px] text-slate-500 gap-1.5 mt-0.5">
                            <span className="font-semibold">{new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            <span>•</span>
                            <span className="truncate font-medium">{transaction.category || 'Unspecified'}</span>
                          </div>
                        </div>

                        {/* Amount & Metadata */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className={`text-[15px] font-black tracking-tight ${isIncome ? 'text-emerald-600' : 'text-slate-900'
                            }`}>
                            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                          {(transaction.paymentMethod || transaction.recurringTransactionId) && (
                            <div className="flex gap-1">
                              {transaction.paymentMethod && (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                  {transaction.paymentMethod}
                                </span>
                              )}
                              {transaction.recurringTransactionId && (
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5">
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
            // Grouped view
            <div className="space-y-4 p-4">
              {paginatedGroups.map(([groupKey, group]) => (
                <div key={groupKey} className="border border-slate-200 rounded-2xl">
                  <div
                    className="flex flex-col gap-3 p-4 bg-white cursor-pointer hover:bg-slate-50 transition-colors sm:flex-row sm:items-center sm:justify-between"
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
                      <h3 className="font-medium text-slate-900 break-words">{groupKey}</h3>
                      <span className="text-sm text-slate-500">({group.count} transactions)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="text-green-600 font-medium whitespace-nowrap">+{formatCurrency(group.income)}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-red-600 font-medium whitespace-nowrap">-{formatCurrency(group.expenses)}</span>
                      <span className="text-slate-300">|</span>
                      <span className={`font-medium whitespace-nowrap ${group.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(group.balance)}
                      </span>
                      <span className="text-slate-400">
                        {expandedGroups.has(groupKey) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    </div>
                  </div>

                  {expandedGroups.has(groupKey) && (
                    <div className="border-t border-slate-200">
                      {/* Desktop Table View */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {group.transactions.map((transaction) => (
                              <tr key={transaction.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedTransactions.has(transaction.id)}
                                    onChange={() => handleSelectTransaction(transaction.id)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <span>{transaction.description || 'No description'}</span>
                                    {transaction.recurringTransactionId && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> {transaction.recurringTransaction?.frequency || 'Auto'}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900">
                                  {transaction.category}
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-900">
                                  {transaction.paymentMethod || '-'}
                                </td>
                                <td className={`px-4 py-2 text-sm font-medium text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </td>
                                <td className="px-4 py-2 text-center flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setEditingTransaction(transaction)}
                                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                    title="Edit transaction"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteTransaction(transaction.id)}
                                    className="text-rose-600 hover:text-rose-800 transition-colors p-1"
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

                      {/* Mobile Card View - spacious and modern card layout */}
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
                                className="flex items-center gap-3 py-3 px-4 bg-white border border-slate-100 rounded-2xl cursor-pointer active:bg-slate-50 transition-colors shadow-sm"
                              >
                                {/* Checkbox (Stop propagation) */}
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedTransactions.has(transaction.id)}
                                    onChange={() => handleSelectTransaction(transaction.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </div>

                                {/* Icon */}
                                <div className={`h-10 w-10 flex items-center justify-center rounded-xl text-lg shrink-0 shadow-sm border ${isIncome
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                                  }`}>
                                  {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" /> : <ArrowUpRight className="h-4 w-4 text-rose-600" />}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 leading-snug truncate">
                                    {transaction.description || 'No description'}
                                  </p>
                                  <div className="flex items-center text-[11px] text-slate-500 gap-1.5 mt-0.5">
                                    <span className="font-semibold">{new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                    <span>•</span>
                                    <span className="truncate font-medium">{transaction.category || 'Unspecified'}</span>
                                  </div>
                                </div>

                                {/* Amount & Metadata */}
                                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                  <span className={`text-[15px] font-black tracking-tight ${isIncome ? 'text-emerald-600' : 'text-slate-900'
                                    }`}>
                                    {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                                  </span>
                                  {(transaction.paymentMethod || transaction.recurringTransactionId) && (
                                    <div className="flex gap-1">
                                      {transaction.paymentMethod && (
                                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                          {transaction.paymentMethod}
                                        </span>
                                      )}
                                      {transaction.recurringTransactionId && (
                                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5">
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
          <div className="text-center py-8 text-slate-500">
            <p>No regular transactions found.</p>
            <p className="text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {filteredTransactions.length > 0 && (
        <TransactionPagination
          pageSize={pageSize}
          setPageSize={setPageSize}
          paginationLabel={paginationLabel}
          safePage={safePage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}

            {/* Enhanced Date Range Picker Modal */}
            {showDateRangePicker && typeof document !== 'undefined' && createPortal(
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur">
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Statement Export</p>
                      <h4 className="text-lg font-semibold text-slate-900">Download Data as CSV</h4>
                    </div>
                    <button
                      onClick={() => setShowDateRangePicker(false)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Close
                    </button>
                  </div>

                  <div className="px-6 py-5 space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Statement Range</p>
                      <p className="mt-1 text-sm text-slate-600">Choose the time window and grouping.</p>

                      <div className="mt-4 grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2">
                        <button
                          onClick={() => setPdfExportType('category-current')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'category-current'
                              ? 'border-blue-400 bg-blue-50 text-blue-800'
                              : 'border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                        >
                          Current View (Category)
                        </button>
                        <button
                          onClick={() => setPdfExportType('category-month')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'category-month'
                              ? 'border-blue-400 bg-blue-50 text-blue-800'
                              : 'border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                        >
                          Category by Month
                        </button>
                        <button
                          onClick={() => setPdfExportType('category-year')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'category-year'
                              ? 'border-blue-400 bg-blue-50 text-blue-800'
                              : 'border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                        >
                          Category by Year
                        </button>
                        <button
                          onClick={() => setPdfExportType('category-custom')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'category-custom'
                              ? 'border-blue-400 bg-blue-50 text-blue-800'
                              : 'border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                        >
                          Category (Custom Range)
                        </button>
                        <button
                          onClick={() => setPdfExportType('month')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'month'
                              ? 'border-slate-400 bg-white text-slate-800'
                              : 'border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                        >
                          Statement Month
                        </button>
                        <button
                          onClick={() => setPdfExportType('year')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'year'
                              ? 'border-slate-400 bg-white text-slate-800'
                              : 'border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                        >
                          Statement Year
                        </button>
                        <button
                          onClick={() => setPdfExportType('custom')}
                          className={`col-span-2 rounded-lg border px-3 py-2 text-sm font-semibold ${pdfExportType === 'custom'
                              ? 'border-slate-400 bg-white text-slate-800'
                              : 'border-slate-200 text-slate-600 hover:bg-white'
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
                            <label className="block text-xs uppercase tracking-[0.2em] text-slate-500">Year</label>
                            <select
                              value={pdfSelectedYear}
                              onChange={(e) => setPdfSelectedYear(parseInt(e.target.value))}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                            >
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                          {(pdfExportType === 'month' || pdfExportType === 'category-month') && (
                            <div>
                              <label className="block text-xs uppercase tracking-[0.2em] text-slate-500">Month</label>
                              <select
                                value={pdfSelectedMonth}
                                onChange={(e) => setPdfSelectedMonth(parseInt(e.target.value))}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                              >
                                {Array.from({ length: 12 }, (_, i) => (
                                  <option key={i} value={i}>
                                    {new Date(2025, i, 1).toLocaleString('default', { month: 'long' })}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                    {(pdfExportType === 'custom' || pdfExportType === 'category-custom') && (
                      <div className="grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2">
                        <div>
                          <label className="block text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Start Date</label>
                          <div className="relative w-full">
                            <div className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm flex items-center justify-between pointer-events-none transition-colors">
                              <span className={pdfStartDate ? 'text-slate-900' : 'text-slate-400'}>
                                {pdfStartDate
                                  ? new Date(pdfStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : 'Select Date'}
                              </span>
                              <CalendarIcon className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              type="date"
                              value={pdfStartDate}
                              onChange={(e) => setPdfStartDate(e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">End Date</label>
                          <div className="relative w-full">
                            <div className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm flex items-center justify-between pointer-events-none transition-colors">
                              <span className={pdfEndDate ? 'text-slate-900' : 'text-slate-400'}>
                                {pdfEndDate
                                  ? new Date(pdfEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : 'Select Date'}
                              </span>
                              <CalendarIcon className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              type="date"
                              value={pdfEndDate}
                              onChange={(e) => setPdfEndDate(e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowDateRangePicker(false)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Download CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Undo Toast */}
            {undoToast && (
              <UndoToast
                message={undoToast.message}
                onUndo={undoToast.onUndo}
                onExpire={undoToast.onExpire}
              />
            )}

            {/* Edit Transaction Modal */}
            {editingTransaction && typeof document !== 'undefined' && createPortal(
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setEditingTransaction(null)}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
