// Full-featured transaction list with search, filtering, grouping, CSV export,
// optimistic deletion with undo toast, and both desktop table and mobile swipe-card views.
'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { 
  Trash2, Edit2, Search, Filter, Calendar as CalendarIcon, Download, 
  ChevronLeft, ChevronRight, Check, FileText, ArrowRight, X, AlertTriangle, 
  ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard, Plug, ChevronDown, 
  Copy, Utensils, ShoppingBag, Car, Film, HeartPulse, Home, Zap, Tag,
  ArrowUp, ArrowDown, ArrowUpDown, CheckSquare, Square, FolderEdit, 
  Sparkles, CheckCircle2, SlidersHorizontal, Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/financial-utils'
import SwipeableRow from './ui/SwipeableRow'
import { useScrollLock } from '@/hooks/useScrollLock'
import AddTransactionForm from './AddTransactionForm'
import { getCategoryVisual } from '@/lib/category-icons'
import { 
  TransactionFilters, 
  SortOptionType, 
  DatePresetType, 
  QuickPresetType, 
  DensityType 
} from './TransactionFilters'
import { TransactionPagination } from './TransactionPagination'
import TransactionDetailDrawer from './transactions/TransactionDetailDrawer'
import { useTransactions, useGoals, useTransactionSummary } from '@/hooks/useApi'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import CustomDateField from '@/components/ui/CustomDateField'
import CustomSelect from '@/components/ui/CustomSelect'
import { formatDateForDisplay, formatToDateString, parseLocalDate } from '@/lib/dateUtils'

export interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  category: string
  title?: string
  description?: string | null
  notes?: string | null
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
  travelEntry?: {
    id: string
    startDate: string
    endDate: string
    startKm: number
    endKm: number
    amount: number
    liters: number
    description?: string | null
  } | null
  goalContribution?: {
    id: string
    goalId: string
    type: string
    reason?: string | null
    amount: number
    goal?: {
      id: string
      name: string
      category?: string
    } | null
  } | null
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
  const [filterGoalCategory, setFilterGoalCategory] = useState('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterRecurring, setFilterRecurring] = useState<'all' | 'recurring' | 'one-time'>('all')
  const [sortOption, setSortOption] = useState<SortOptionType>('date-desc')
  const { goals } = useGoals()
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
  const [inspectingTransaction, setInspectingTransaction] = useState<Transaction | null>(null)

  // Advanced Power Filter & Batch Operations States
  const [datePreset, setDatePreset] = useState<DatePresetType>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [quickPreset, setQuickPreset] = useState<QuickPresetType>('all')
  const [density, setDensity] = useState<DensityType>('comfortable')
  const [batchCategoryModalOpen, setBatchCategoryModalOpen] = useState(false)
  const [batchCategoryValue, setBatchCategoryValue] = useState('')
  const [isBatchUpdating, setIsBatchUpdating] = useState(false)

  useScrollLock(showDateRangePicker || batchCategoryModalOpen)

  const { data: staticData } = useEnhancedStaticData()
  const customIcons = useMemo(() => {
    try {
      return JSON.parse(staticData?.userSettings?.custom_category_icons || '{}')
    } catch {
      return {}
    }
  }, [staticData?.userSettings?.custom_category_icons])

  const resolveVisual = useCallback((category: string, type: string) => {
    return getCategoryVisual(category, type, undefined, customIcons)
  }, [customIcons])

  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set())
  const listContainerRef = useRef<HTMLDivElement>(null)

  const hasActiveAdvancedFilters = 
    filterCategory !== 'all' || 
    filterGoalCategory !== 'all' ||
    filterPaymentMethod !== 'all' || 
    filterSource !== 'all' || 
    filterRecurring !== 'all' || 
    groupBy !== 'none' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(minAmount) ||
    Boolean(maxAmount)

  const apiFilters = useMemo(() => {
    const filters: Record<string, string | number | undefined> = {}
    if (searchTerm) filters.search = searchTerm
    if (filterType !== 'all') filters.type = filterType
    if (filterCategory !== 'all') filters.category = filterCategory
    if (filterCategory === 'Goals' && filterGoalCategory !== 'all') filters.goalCategory = filterGoalCategory
    if (filterPaymentMethod !== 'all') filters.paymentMethod = filterPaymentMethod
    if (filterSource !== 'all') filters.source = filterSource
    if (filterRecurring !== 'all') filters.recurring = filterRecurring
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    if (minAmount && !isNaN(Number(minAmount))) filters.minAmount = Number(minAmount)
    if (maxAmount && !isNaN(Number(maxAmount))) filters.maxAmount = Number(maxAmount)

    if (sortOption) filters.sortBy = sortOption

    if (viewMode === 'month' && !startDate && !endDate) {
      if (selectedMonth !== undefined) filters.month = selectedMonth + 1
      if (selectedYear !== undefined) filters.year = selectedYear
    } else if (viewMode === 'year' && !startDate && !endDate) {
      if (selectedYear !== undefined) filters.year = selectedYear
    }

    return filters
  }, [
    searchTerm, filterType, filterCategory, filterGoalCategory, filterPaymentMethod, 
    filterSource, filterRecurring, startDate, endDate, minAmount, maxAmount, 
    viewMode, selectedMonth, selectedYear, sortOption
  ])

  const { transactions: fetchedTransactions, summary: apiSummary, pagination, isLoading, mutate } = useTransactions(
    groupBy !== 'none' ? 1 : currentPage,
    groupBy !== 'none' ? 10000 : pageSize,
    apiFilters
  )

  const activeMonthNumber = selectedMonth !== undefined ? selectedMonth + 1 : new Date().getMonth() + 1
  const activeYearNumber = selectedYear !== undefined ? selectedYear : new Date().getFullYear()
  const { summary: monthSummary } = useTransactionSummary(activeMonthNumber, activeYearNumber, true)

  const categoryOptions = useMemo(() => {
    const staticNames = [
      ...(staticData?.expenseCategories || []),
      ...(staticData?.incomeCategories || [])
    ]
      .filter(c => c && c.name && c.isActive !== false)
      .map(c => c.name.trim())

    const txnCategories = (fetchedTransactions || [])
      .filter(t => !t.goalContribution && t.category !== 'Goals')
      .map(t => t.category?.trim())
      .filter(Boolean) as string[]

    const allCategories = new Set([...staticNames, ...txnCategories])
    allCategories.add('Goals')

    return Array.from(allCategories)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [staticData?.expenseCategories, staticData?.incomeCategories, fetchedTransactions])

  const goalCategoryOptions = useMemo(() => {
    const cats = new Set<string>()
    if (Array.isArray(goals)) {
      goals.forEach((g: any) => {
        if (g.category?.trim()) cats.add(g.category.trim())
      })
    }
    (fetchedTransactions || []).forEach(t => {
      if (t.goalContribution?.goal?.category?.trim()) {
        cats.add(t.goalContribution.goal.category.trim())
      }
    })
    return Array.from(cats).sort((a, b) => a.localeCompare(b))
  }, [goals, fetchedTransactions])

  const paymentOptions = useMemo(() => {
    const staticNames = (staticData?.paymentMethods || [])
      .filter(p => p && p.name && p.isActive !== false)
      .map(p => p.name.trim())

    const txnPayments = (fetchedTransactions || [])
      .map(t => t.paymentMethod?.trim())
      .filter(Boolean) as string[]

    return Array.from(new Set([...staticNames, ...txnPayments]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [staticData?.paymentMethods, fetchedTransactions])

  const sourceOptions = useMemo(() => {
    const staticNames = (staticData?.incomeSources || [])
      .filter(s => s && s.name && s.isActive !== false)
      .map(s => s.name.trim())

    const txnSources = (fetchedTransactions || [])
      .map(t => t.source?.trim())
      .filter(Boolean) as string[]

    return Array.from(new Set([...staticNames, ...txnSources]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [staticData?.incomeSources, fetchedTransactions])

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
    let list = (fetchedTransactions || []).filter(t => !pendingDeleteIds.has(t.id))

    // Quick presets
    if (quickPreset === 'high-value') {
      list = list.filter(t => t.amount >= 1000)
    } else if (quickPreset === 'recurring') {
      list = list.filter(t => !!t.recurringTransactionId)
    } else if (quickPreset === 'notes') {
      list = list.filter(t => !!t.notes && t.notes.trim().length > 0)
    }

    // Client-side fallback for min/max
    if (minAmount && !isNaN(Number(minAmount))) {
      list = list.filter(t => t.amount >= Number(minAmount))
    }
    if (maxAmount && !isNaN(Number(maxAmount))) {
      list = list.filter(t => t.amount <= Number(maxAmount))
    }

    // Client-side fallback for Goals & goalCategory
    if (filterCategory === 'Goals') {
      list = list.filter(t => t.category === 'Goals' || !!t.goalContribution)
      if (filterGoalCategory !== 'all') {
        const target = filterGoalCategory.toLowerCase()
        list = list.filter(t => 
          t.goalContribution?.goal?.category?.toLowerCase() === target ||
          t.goalContribution?.goal?.name?.toLowerCase() === target
        )
      }
    } else if (filterCategory !== 'all') {
      list = list.filter(t => t.category?.toLowerCase() === filterCategory.toLowerCase() && !t.goalContribution)
    }

    // Multi-column sorting
    list = [...list].sort((a, b) => {
      if (sortOption === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortOption === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortOption === 'amount-desc') return b.amount - a.amount
      if (sortOption === 'amount-asc') return a.amount - b.amount
      if (sortOption === 'title-asc') return (a.title || a.description || '').localeCompare(b.title || b.description || '')
      if (sortOption === 'title-desc') return (b.title || b.description || '').localeCompare(a.title || a.description || '')
      if (sortOption === 'category-asc') return (a.category || '').localeCompare(b.category || '')
      if (sortOption === 'category-desc') return (b.category || '').localeCompare(a.category || '')
      return 0
    })

    return list
  }, [fetchedTransactions, pendingDeleteIds, quickPreset, minAmount, maxAmount, sortOption, filterCategory, filterGoalCategory])


  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netAmount = totalIncome - totalExpenses
  const expenseCount = filteredTransactions.filter(t => t.type === 'expense').length
  const avgExpense = expenseCount > 0 ? Math.round(totalExpenses / expenseCount) : 0

  const effectiveIncome = apiSummary?.income !== undefined ? apiSummary.income : totalIncome
  const effectiveExpenses = apiSummary?.expense !== undefined ? apiSummary.expense : totalExpenses
  const effectiveNet = apiSummary?.net !== undefined ? apiSummary.net : netAmount

  const isCustomFiltered = Boolean(
    startDate || 
    endDate || 
    (datePreset && datePreset !== 'all' && datePreset !== 'this-month') || 
    filterCategory !== 'all' || 
    filterPaymentMethod !== 'all' || 
    filterSource !== 'all' || 
    filterRecurring !== 'all' || 
    Boolean(minAmount) || 
    Boolean(maxAmount) || 
    Boolean(searchTerm)
  )

  const cashflowSpend = isCustomFiltered
    ? effectiveExpenses
    : (monthSummary?.period?.expense !== undefined ? monthSummary.period.expense : effectiveExpenses)
  const cashflowEarned = isCustomFiltered
    ? effectiveIncome
    : (monthSummary?.period?.income !== undefined ? monthSummary.period.income : effectiveIncome)
  const cashflowBalance = isCustomFiltered
    ? effectiveNet
    : (monthSummary?.period?.balance !== undefined ? monthSummary.period.balance : effectiveNet)

  const monthLabel = useMemo(() => {
    const d = new Date(activeYearNumber, activeMonthNumber - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short' })
  }, [activeMonthNumber, activeYearNumber])

  const periodLabel = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDateForDisplay(startDate)} – ${formatDateForDisplay(endDate)}`
    }
    if (startDate) {
      return `From ${formatDateForDisplay(startDate)}`
    }
    if (endDate) {
      return `Until ${formatDateForDisplay(endDate)}`
    }
    if (datePreset === 'this-month') return `${monthLabel} (This Month)`
    if (datePreset === 'last-30') return 'Last 30 Days'
    if (datePreset === 'last-month') return 'Last Month'
    if (datePreset === 'this-year') return `Year ${activeYearNumber}`
    if (datePreset === 'all' && (startDate || endDate)) return 'Custom Range'
    if (datePreset === 'all' && viewMode === 'month' && selectedMonth !== undefined && selectedYear !== undefined) {
      return `${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    }
    if (viewMode === 'month' && selectedMonth !== undefined && selectedYear !== undefined) {
      return `${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    }
    if (viewMode === 'year' && selectedYear !== undefined) {
      return `Year ${selectedYear}`
    }
    return `${monthLabel}`
  }, [startDate, endDate, datePreset, viewMode, selectedMonth, selectedYear, monthLabel, activeYearNumber])

  const handleColumnSort = (column: 'date' | 'title' | 'category' | 'amount') => {
    if (column === 'date') {
      setSortOption(prev => prev === 'date-desc' ? 'date-asc' : 'date-desc')
    } else if (column === 'title') {
      setSortOption(prev => prev === 'title-asc' ? 'title-desc' : 'title-asc')
    } else if (column === 'category') {
      setSortOption(prev => prev === 'category-asc' ? 'category-desc' : 'category-asc')
    } else if (column === 'amount') {
      setSortOption(prev => prev === 'amount-desc' ? 'amount-asc' : 'amount-desc')
    }
  }

  const renderSortIndicator = (col: 'date' | 'title' | 'category' | 'amount') => {
    const isCurrent = 
      (col === 'date' && (sortOption === 'date-desc' || sortOption === 'date-asc')) ||
      (col === 'title' && (sortOption === 'title-asc' || sortOption === 'title-desc')) ||
      (col === 'category' && (sortOption === 'category-asc' || sortOption === 'category-desc')) ||
      (col === 'amount' && (sortOption === 'amount-desc' || sortOption === 'amount-asc'))

    if (!isCurrent) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-neutral-600 opacity-40 group-hover:opacity-100 transition-opacity" />
    }

    const isAsc = sortOption === 'date-asc' || sortOption === 'title-asc' || sortOption === 'category-asc' || sortOption === 'amount-asc'
    return isAsc ? (
      <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    )
  }

  const groupedTransactions = useMemo((): GroupedTransactions => {
    if (groupBy === 'none') return {}

    const groups: GroupedTransactions = {}

    filteredTransactions.forEach(transaction => {
      let groupKey = ''

      switch (groupBy) {
        case 'date':
          groupKey = formatDateForDisplay(transaction.date)
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
                  title: t.title || t.description || '', notes: t.notes || null, paymentMethod: t.paymentMethod,
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
          title: (t.title || t.description || '') + ' (Copy)',
          notes: t.notes || null,
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
      // Use atomic batch deletion endpoint
      const response = await fetch(`/api/transactions?ids=${encodeURIComponent(ids.join(','))}`, { method: 'DELETE' })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete transactions')
      }

      const resData = await response.json().catch(() => ({}))
      triggerRefresh()

      toast.success(resData.message || `${ids.length} transactions deleted`, {
        action: deletedTxns.length > 0 ? {
          label: 'Undo',
          onClick: async () => {
            try {
              await Promise.all(deletedTxns.map(t => fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: t.type, amount: t.amount, category: t.category,
                  title: t.title || t.description || '', notes: t.notes || null, paymentMethod: t.paymentMethod,
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

  const handleBatchCategoryChange = async (targetCategory: string) => {
    if (!targetCategory || selectedTransactions.size === 0) return
    setIsBatchUpdating(true)
    try {
      const ids = Array.from(selectedTransactions)
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, category: targetCategory })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update transaction categories')
      }
      const data = await res.json()
      toast.success(data.message || `Updated ${ids.length} transactions to "${targetCategory}"`)
      setSelectedTransactions(new Set())
      setBatchCategoryModalOpen(false)
      triggerRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category')
    } finally {
      setIsBatchUpdating(false)
    }
  }

  const exportSelectedToCSV = () => {
    const targetSet = selectedTransactions.size > 0 
      ? selectedTransactions 
      : new Set(paginatedTransactions.map(t => t.id))

    const selectedList = (fetchedTransactions || []).filter(t => targetSet.has(t.id))
    if (selectedList.length === 0) {
      toast.error('No transactions to export')
      return
    }

    const headers = ['Date', 'Title/Description', 'Type', 'Category', 'Amount', 'Payment Method', 'Source', 'Notes', 'Recurring']
    const rows = selectedList.map(t => [
      t.date ? formatToDateString(new Date(t.date)) : '',
      `"${(t.title || t.description || '').replace(/"/g, '""')}"`,
      t.type,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.source || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.recurringTransactionId ? 'Yes' : 'No'
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `fincal_transactions_${formatToDateString(new Date())}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${selectedList.length} transactions to CSV`)
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

  const dateGroupedTransactions = useMemo(() => {
    const groups: { dateKey: string; label: string; subtotal: number; items: Transaction[] }[] = []
    const map = new Map<string, { dateKey: string; label: string; subtotal: number; items: Transaction[] }>()

    const now = new Date()
    const todayStr = formatToDateString(now)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = formatToDateString(yesterday)

    paginatedTransactions.forEach(t => {
      const dateKey = t.date
        ? (typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date)
            ? t.date
            : formatToDateString(new Date(t.date)))
        : 'unknown'
      let label = dateKey
      if (dateKey === todayStr) {
        label = 'Today'
      } else if (dateKey === yesterdayStr) {
        label = 'Yesterday'
      } else if (dateKey !== 'unknown') {
        const d = parseLocalDate(dateKey) || new Date(t.date)
        label = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        })
      }

      if (!map.has(dateKey)) {
        const newGroup = { dateKey, label, subtotal: 0, items: [] }
        map.set(dateKey, newGroup)
        groups.push(newGroup)
      }

      const g = map.get(dateKey)!
      g.items.push(t)
      g.subtotal += (t.type === 'income' ? t.amount : -t.amount)
    })

    return groups
  }, [paginatedTransactions])

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
    setFilterGoalCategory('all')
    setFilterPaymentMethod('all')
    setFilterSource('all')
    setFilterRecurring('all')
    setGroupBy('none')
    setSortOption('date-desc')
    setDatePreset('all')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setQuickPreset('all')
    setCurrentPage(1)
    onYearChange?.(undefined)
    onMonthChange?.(undefined)
  }

  const isAllCurrentSelected = paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedTransactions.has(t.id))
  const isSomeCurrentSelected = paginatedTransactions.some(t => selectedTransactions.has(t.id)) && !isAllCurrentSelected

  return (
    <div className="pb-6" ref={listContainerRef}>
      {/* Master Ledger Container */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs overflow-hidden">
        {/* Integrated Filter Command Center */}
        <TransactionFilters
          embedded
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterGoalCategory={filterGoalCategory}
          setFilterGoalCategory={setFilterGoalCategory}
          goalCategoryOptions={goalCategoryOptions}
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
          datePreset={datePreset}
          setDatePreset={setDatePreset}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          minAmount={minAmount}
          setMinAmount={setMinAmount}
          maxAmount={maxAmount}
          setMaxAmount={setMaxAmount}
          quickPreset={quickPreset}
          setQuickPreset={setQuickPreset}
          density={density}
          setDensity={setDensity}
        />

        {/* Desktop Ledger Status Ribbon (hidden on mobile) */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200/70 dark:border-white/[0.06] text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-400 dark:text-neutral-500 uppercase text-[10px] tracking-wider">
              Period:
            </span>
            <span className="font-bold text-slate-800 dark:text-neutral-200">
              {startDate && endDate 
                ? `${formatDateForDisplay(startDate)} – ${formatDateForDisplay(endDate)}`
                : viewMode === 'month' && selectedMonth !== undefined && selectedYear !== undefined
                ? `${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                : viewMode === 'year' && selectedYear !== undefined
                ? `${selectedYear}`
                : 'All Time'}
            </span>
            <span className="text-slate-300 dark:text-neutral-700">•</span>
            <span className="text-slate-600 dark:text-neutral-300 font-semibold tabular-nums">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}
            </span>
            {avgExpense > 0 && (
              <>
                <span className="text-slate-300 dark:text-neutral-700">•</span>
                <span className="text-slate-500 dark:text-neutral-400 font-medium">
                  Avg. Outflow: <span className="font-bold text-slate-700 dark:text-neutral-300 tabular-nums">{formatCurrency(avgExpense)}</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs tabular-nums font-semibold flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
              <span className="text-[10px] uppercase font-bold text-emerald-600/70 dark:text-emerald-400/70">In</span>
              <span className="font-bold">+{formatCurrency(effectiveIncome)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 text-rose-700 dark:text-rose-400">
              <span className="text-[10px] uppercase font-bold text-rose-600/70 dark:text-rose-400/70">Out</span>
              <span className="font-bold">-{formatCurrency(effectiveExpenses)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500">Net</span>
              <span className={`font-black ${effectiveNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {effectiveNet >= 0 ? '+' : ''}{formatCurrency(effectiveNet)}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Glanceable Period Cashflow Card (visible only on mobile) */}
        <div className="block md:hidden px-3.5 py-2.5 bg-slate-50/70 dark:bg-[#151518]/70 border-b border-slate-200/70 dark:border-white/[0.06]">
          <div className="flex items-center justify-between pb-1.5 px-0.5">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider truncate">
                {periodLabel} Cashflow
              </span>
            </div>
            <div className="text-[11px] font-semibold tabular-nums text-slate-500 dark:text-neutral-400 shrink-0">
              Net: <span className={`font-bold ${cashflowBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {cashflowBalance >= 0 ? '+' : ''}{formatCurrency(cashflowBalance)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Outflow / Total Spent */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/[0.06] dark:bg-rose-500/[0.1] border border-rose-200/70 dark:border-rose-900/40">
              <div className="h-7 w-7 rounded-lg bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-rose-600/90 dark:text-rose-400/90 uppercase tracking-wider">
                  Spent
                </div>
                <div className="text-xs sm:text-[13px] font-bold text-rose-700 dark:text-rose-300 tabular-nums truncate">
                  {formatCurrency(cashflowSpend)}
                </div>
              </div>
            </div>

            {/* Inflow / Total Earned */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/[0.06] dark:bg-emerald-500/[0.1] border border-emerald-200/70 dark:border-emerald-900/40">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400/90 uppercase tracking-wider">
                  Earned
                </div>
                <div className="text-xs sm:text-[13px] font-bold text-emerald-700 dark:text-emerald-300 tabular-nums truncate">
                  +{formatCurrency(cashflowEarned)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Action Bar if transactions selected */}
        {selectedTransactions.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-blue-50/90 dark:bg-blue-950/50 border-b border-blue-200/70 dark:border-blue-900/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[11px] tabular-nums">
                {selectedTransactions.size}
              </span>
              <span className="font-semibold text-blue-900 dark:text-blue-200">
                transactions selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedTransactions(new Set())}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
              >
                Deselect
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectAll(paginatedTransactions)}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors cursor-pointer"
              >
                {selectedTransactions.size === paginatedTransactions.length ? 'Deselect Page' : 'Select Page'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchCategoryValue('')
                  setBatchCategoryModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#18181b] border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <FolderEdit className="w-3.5 h-3.5" />
                <span>Category</span>
              </button>
              <button
                type="button"
                onClick={exportSelectedToCSV}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#18181b] border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handleMultiDelete}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Pagination Controls (shown when multiple pages exist) */}
        {totalPages > 1 && (
          <TransactionPagination
            pageSize={pageSize}
            setPageSize={setPageSize}
            paginationLabel={paginationLabel}
            safePage={safePage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            position="top"
          />
        )}

        {filteredTransactions.length > 0 ? (
          groupBy === 'none' ? (
            <>
              {/* Desktop Table View (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider select-none">
                      <th className="w-10 px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={isAllCurrentSelected}
                          ref={el => { if (el) el.indeterminate = isSomeCurrentSelected }}
                          onChange={() => handleSelectAll(paginatedTransactions)}
                          className="h-3.5 w-3.5 rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-[#18181b] text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleColumnSort('date')}>
                        <div className="flex items-center gap-1.5">
                          <span>Date</span>
                          {renderSortIndicator('date')}
                        </div>
                      </th>
                      <th className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleColumnSort('title')}>
                        <div className="flex items-center gap-1.5">
                          <span>Description / Merchant</span>
                          {renderSortIndicator('title')}
                        </div>
                      </th>
                      <th className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleColumnSort('category')}>
                        <div className="flex items-center gap-1.5">
                          <span>Category</span>
                          {renderSortIndicator('category')}
                        </div>
                      </th>
                      <th className="px-3 py-2.5">Payment</th>
                      <th className="px-4 py-2.5 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => handleColumnSort('amount')}>
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Amount</span>
                          {renderSortIndicator('amount')}
                        </div>
                      </th>
                      <th className="w-24 px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                    {isLoading ? (
                      Array.from({ length: density === 'compact' ? 8 : 6 }).map((_, i) => (
                        <tr key={`loading-row-${i}`} className="animate-pulse border-b border-slate-100 dark:border-white/[0.03]">
                          <td className="px-4 py-3"><div className="h-3.5 w-3.5 rounded bg-slate-200/70 dark:bg-white/[0.05]" /></td>
                          <td className="px-3 py-3"><div className="h-3 w-16 rounded bg-slate-200/70 dark:bg-white/[0.05]" /></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-lg bg-slate-200/70 dark:bg-white/[0.05] shrink-0" />
                              <div className="space-y-1.5 flex-1 max-w-xs">
                                <div className="h-3 w-32 rounded bg-slate-200/70 dark:bg-white/[0.05]" />
                                <div className="h-2 w-20 rounded bg-slate-200/50 dark:bg-white/[0.03]" />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><div className="h-3 w-20 rounded bg-slate-200/70 dark:bg-white/[0.05]" /></td>
                          <td className="px-3 py-3"><div className="h-3 w-16 rounded bg-slate-200/70 dark:bg-white/[0.05]" /></td>
                          <td className="px-4 py-3 text-right"><div className="h-3.5 w-16 rounded bg-slate-200/70 dark:bg-white/[0.05] ml-auto" /></td>
                          <td className="px-4 py-3 text-right"><div className="h-5 w-12 rounded bg-slate-200/50 dark:bg-white/[0.03] ml-auto" /></td>
                        </tr>
                      ))
                    ) : paginatedTransactions.map((transaction) => {
                      const visual = resolveVisual(transaction.category, transaction.type)
                      const VisualIcon = visual.icon
                      const isIncome = transaction.type === 'income'
                      const isSelected = selectedTransactions.has(transaction.id)

                      return (
                        <tr
                          key={transaction.id}
                          onClick={() => setInspectingTransaction(transaction)}
                          className={`group hover:bg-slate-50/90 dark:hover:bg-[#18181d] cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <td className={`px-4 ${density === 'compact' ? 'py-1.5' : 'py-2.5'}`} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectTransaction(transaction.id)}
                              className="h-3.5 w-3.5 rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-[#18181b] text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className={`px-3 ${density === 'compact' ? 'py-1.5' : 'py-2.5'} whitespace-nowrap text-xs text-slate-500 dark:text-neutral-400 tabular-nums font-medium`}>
                            {formatDateForDisplay(transaction.date)}
                          </td>
                          <td className={`px-3 ${density === 'compact' ? 'py-1.5' : 'py-2.5'}`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`${density === 'compact' ? 'h-6 w-6' : 'h-7 w-7'} rounded-lg flex items-center justify-center shrink-0 border ${visual.bg}`}>
                                <VisualIcon className={density === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                              </div>
                              <div className="min-w-0 max-w-xs xl:max-w-md">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                                    {transaction.title || transaction.description || 'Untitled Transaction'}
                                  </span>
                                  {transaction.recurringTransactionId && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                                      <RefreshCw className="h-2 w-2" />
                                      Recurring
                                    </span>
                                  )}
                                </div>
                                {transaction.notes && density === 'comfortable' && (
                                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate flex items-center gap-1 mt-0.5" title={transaction.notes}>
                                    <FileText className="h-2.5 w-2.5 shrink-0" />
                                    <span>{transaction.notes}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={`px-3 ${density === 'compact' ? 'py-1.5' : 'py-2.5'} whitespace-nowrap`}>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-neutral-300 border border-slate-200/60 dark:border-white/[0.06]">
                              {transaction.category}
                            </span>
                          </td>
                          <td className={`px-3 ${density === 'compact' ? 'py-1.5' : 'py-2.5'} whitespace-nowrap text-xs text-slate-500 dark:text-neutral-400`}>
                            {transaction.paymentMethod || '—'}
                          </td>
                          <td className={`px-4 ${density === 'compact' ? 'py-1.5' : 'py-2.5'} text-right whitespace-nowrap`}>
                            <span className={`text-xs sm:text-sm font-bold tabular-nums tracking-tight ${
                              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className={`px-4 ${density === 'compact' ? 'py-1.5' : 'py-2.5'} text-right whitespace-nowrap`} onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setEditingTransaction(transaction)}
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-[#202024] transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateTransaction(transaction)}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-[#202024] transition-colors cursor-pointer"
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTransaction(transaction.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-[#202024] transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stream (hidden on md+) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={`mob-loading-${i}`} className="animate-pulse p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="h-8 w-8 rounded-lg bg-slate-200/70 dark:bg-white/[0.05] shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 w-28 rounded bg-slate-200/70 dark:bg-white/[0.05]" />
                          <div className="h-2 w-16 rounded bg-slate-200/50 dark:bg-white/[0.03]" />
                        </div>
                      </div>
                      <div className="h-4 w-16 rounded bg-slate-200/70 dark:bg-white/[0.05]" />
                    </div>
                  ))
                ) : dateGroupedTransactions.map((group) => (
                  <div key={group.dateKey} className="relative">
                    {/* Connected Date Group Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between px-3.5 py-1.5 bg-slate-50/95 dark:bg-[#151518]/95 backdrop-blur-xs border-b border-slate-100 dark:border-white/[0.04] text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-slate-900 dark:text-white font-bold">{group.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-neutral-400 tabular-nums font-semibold">
                          {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="tabular-nums font-bold text-xs">
                        <span className={group.subtotal > 0 ? 'text-emerald-600 dark:text-emerald-400' : group.subtotal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-neutral-400'}>
                          {group.subtotal > 0 ? '+' : ''}{formatCurrency(group.subtotal)}
                        </span>
                      </div>
                    </div>

                    {/* Rows in this Date Group */}
                    <div className="divide-y divide-slate-100 dark:divide-white/[0.025]">
                      {group.items.map((transaction) => {
                        const visual = resolveVisual(transaction.category, transaction.type)
                        const VisualIcon = visual.icon
                        const isIncome = transaction.type === 'income'
                        const isSelected = selectedTransactions.has(transaction.id)

                        // Format time if timestamp exists and is non-midnight
                        let timeStr: string | null = null
                        if (transaction.date) {
                          const d = new Date(transaction.date)
                          if (!isNaN(d.getTime()) && !transaction.date.includes('T00:00:00') && (d.getHours() !== 0 || d.getMinutes() !== 0)) {
                            timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                          }
                        }

                        return (
                          <div
                            key={transaction.id}
                            onClick={() => {
                              if (selectedTransactions.size > 0) {
                                handleSelectTransaction(transaction.id)
                              } else {
                                setInspectingTransaction(transaction)
                              }
                            }}
                            className={`group relative flex items-center gap-2.5 px-3.5 ${
                              density === 'compact' ? 'py-1.5' : 'py-2.5'
                            } hover:bg-slate-50/90 dark:hover:bg-[#18181d] active:bg-slate-100/70 dark:active:bg-[#1e1e23] cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/50 dark:bg-blue-950/25' : ''
                            }`}
                          >
                            {/* Interactive Category Avatar with Built-in Selection State */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectTransaction(transaction.id)
                              }}
                              className={`relative rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                                density === 'compact' ? 'h-7 w-7' : 'h-8 w-8'
                              } ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                  : `${visual.bg} border-slate-200/60 dark:border-white/[0.08]`
                              }`}
                              title={isSelected ? 'Deselect' : 'Select'}
                            >
                              {isSelected ? (
                                <Check className={density === 'compact' ? 'h-3.5 w-3.5 stroke-[2.5]' : 'h-4 w-4 stroke-[2.5]'} />
                              ) : (
                                <VisualIcon className={density === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                              )}
                            </button>

                            {/* Middle Information (Generous Horizontal Space) */}
                            <div className="flex-1 min-w-0">
                              {/* Line 1: Title + Context Badges */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                                  {transaction.title || transaction.description || 'Untitled Transaction'}
                                </span>
                                {transaction.recurringTransactionId && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 shrink-0">
                                    <RefreshCw className="h-2 w-2" />
                                    Auto
                                  </span>
                                )}
                                {transaction.goalContribution && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 shrink-0">
                                    Goal
                                  </span>
                                )}
                              </div>

                              {/* Line 2: Category · Payment Method · Source */}
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                                <span className="font-medium text-slate-700 dark:text-neutral-300 truncate">
                                  {transaction.category}
                                </span>
                                {transaction.paymentMethod && (
                                  <>
                                    <span className="text-slate-300 dark:text-neutral-600">·</span>
                                    <span className="truncate">{transaction.paymentMethod}</span>
                                  </>
                                )}
                                {transaction.source && transaction.source !== transaction.paymentMethod && (
                                  <>
                                    <span className="text-slate-300 dark:text-neutral-600">·</span>
                                    <span className="truncate text-slate-400 dark:text-neutral-500">{transaction.source}</span>
                                  </>
                                )}
                              </div>

                              {/* Line 3: Notes preview (Comfortable density only) */}
                              {transaction.notes && density === 'comfortable' && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-neutral-500 truncate mt-0.5 italic">
                                  <FileText className="h-2.5 w-2.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                                  <span className="truncate">{transaction.notes}</span>
                                </div>
                              )}
                            </div>

                            {/* Right Amount & Time */}
                            <div className="flex flex-col items-end justify-center shrink-0 pl-1.5 text-right">
                              <span className={`text-[13px] sm:text-sm font-bold tabular-nums tracking-tight ${
                                isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </span>
                              {timeStr && (
                                <span className="text-[10px] text-slate-400 dark:text-neutral-500 tabular-nums mt-0.5 font-medium">
                                  {timeStr}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {paginatedGroups.map(([groupKey, group]) => (
                <div key={groupKey} className="relative">
                  <div
                    className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-slate-50/70 dark:bg-white/[0.02] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-[#18181d] transition-colors"
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
                    {/* Mobile 2-line layout (sm:hidden) */}
                    <div className="flex sm:hidden items-center justify-between w-full">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {groupKey}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-neutral-400 font-semibold tabular-nums shrink-0">
                            {group.count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] tabular-nums whitespace-nowrap">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{formatCurrency(group.income)}
                          </span>
                          <span className="text-slate-300 dark:text-neutral-700">•</span>
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            -{formatCurrency(group.expenses)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className={`text-xs font-bold tabular-nums whitespace-nowrap ${
                            group.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {group.balance >= 0 ? '+' : ''}{formatCurrency(group.balance)}
                          </div>
                          <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500">
                            Net
                          </div>
                        </div>
                        <span className="text-slate-400 dark:text-neutral-500">
                          {expandedGroups.has(groupKey) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                    </div>

                    {/* Desktop single-line layout (hidden sm:flex) */}
                    <div className="hidden sm:flex items-center justify-between w-full text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{groupKey}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-neutral-400 font-semibold tabular-nums">
                          {group.count}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs tabular-nums whitespace-nowrap">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          +{formatCurrency(group.income)}
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          -{formatCurrency(group.expenses)}
                        </span>
                        <span className={`font-black ${
                          group.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {group.balance >= 0 ? '+' : ''}{formatCurrency(group.balance)}
                        </span>
                        <span className="text-slate-400">
                          {expandedGroups.has(groupKey) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                    </div>
                  </div>

                  {expandedGroups.has(groupKey) && (
                    <div className="divide-y divide-slate-100 dark:divide-white/[0.025] bg-white dark:bg-[#121215]">
                      {group.transactions.map((transaction) => {
                        const visual = resolveVisual(transaction.category, transaction.type)
                        const VisualIcon = visual.icon
                        const isIncome = transaction.type === 'income'
                        const isSelected = selectedTransactions.has(transaction.id)

                        let timeStr: string | null = null
                        if (transaction.date) {
                          const d = new Date(transaction.date)
                          if (!isNaN(d.getTime()) && !transaction.date.includes('T00:00:00') && (d.getHours() !== 0 || d.getMinutes() !== 0)) {
                            timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                          }
                        }

                        return (
                          <div
                            key={transaction.id}
                            onClick={() => {
                              if (selectedTransactions.size > 0) {
                                handleSelectTransaction(transaction.id)
                              } else {
                                setInspectingTransaction(transaction)
                              }
                            }}
                            className={`group relative flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50/90 dark:hover:bg-[#18181d] active:bg-slate-100/70 dark:active:bg-[#1e1e23] cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/50 dark:bg-blue-950/25' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectTransaction(transaction.id)
                              }}
                              className={`relative rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer h-7 w-7 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                  : `${visual.bg} border-slate-200/60 dark:border-white/[0.08]`
                              }`}
                              title={isSelected ? 'Deselect' : 'Select'}
                            >
                              {isSelected ? (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              ) : (
                                <VisualIcon className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                                  {transaction.title || transaction.description || 'Untitled Transaction'}
                                </span>
                                {transaction.recurringTransactionId && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 shrink-0">
                                    <RefreshCw className="h-2 w-2" />
                                    Auto
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                                <span>{formatDateForDisplay(transaction.date)}</span>
                                <span className="text-slate-300 dark:text-neutral-600">·</span>
                                <span className="font-medium text-slate-700 dark:text-neutral-300 truncate">{transaction.category}</span>
                                {transaction.paymentMethod && (
                                  <>
                                    <span className="text-slate-300 dark:text-neutral-600">·</span>
                                    <span className="truncate">{transaction.paymentMethod}</span>
                                  </>
                                )}
                              </div>
                              {transaction.notes && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-neutral-500 truncate mt-0.5 italic">
                                  <FileText className="h-2.5 w-2.5 shrink-0 text-slate-400 dark:text-neutral-500" />
                                  <span className="truncate">{transaction.notes}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end justify-center shrink-0 pl-1.5 text-right">
                              <span className={`text-[13px] sm:text-sm font-bold tabular-nums tracking-tight ${
                                isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </span>
                              {timeStr && (
                                <span className="text-[10px] text-slate-400 dark:text-neutral-500 tabular-nums mt-0.5 font-medium">
                                  {timeStr}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center mb-3">
              <CreditCard className="h-5 w-5 text-slate-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No transactions found</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs">
              No records match your active filters. Try adjusting your search or filters.
            </p>
          </div>
        ) : null}

        {/* Integrated Pagination Footer */}
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
      </div>

      {showDateRangePicker && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Export Statement to CSV</h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">Download formatted financial statement</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDateRangePicker(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-3.5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-neutral-500 mb-2">Statement Range & Grouping</p>

                <div className="grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2">
                  <button
                    type="button"
                    onClick={() => setPdfExportType('category-current')}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      pdfExportType === 'category-current'
                        ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-[#18181b]'
                    }`}
                  >
                    Current View (Category)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfExportType('category-month')}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      pdfExportType === 'category-month'
                        ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-[#18181b]'
                    }`}
                  >
                    Category by Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfExportType('category-year')}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      pdfExportType === 'category-year'
                        ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-[#18181b]'
                    }`}
                  >
                    Category by Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfExportType('category-custom')}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      pdfExportType === 'category-custom'
                        ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-[#18181b]'
                    }`}
                  >
                    Category (Custom Range)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfExportType('month')}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      pdfExportType === 'month'
                        ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-[#18181b]'
                    }`}
                  >
                    Statement Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfExportType('year')}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      pdfExportType === 'year'
                        ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-[#18181b]'
                    }`}
                  >
                    Statement Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfExportType('custom')}
                    className={`col-span-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      pdfExportType === 'custom'
                        ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-[#18181b]'
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
                      placeholder="Start date (DD MMM YYYY)"
                      value={pdfStartDate}
                      onChange={setPdfStartDate}
                    />
                  </div>
                  <div>
                    <CustomDateField
                      label="End Date"
                      placeholder="End date (DD MMM YYYY)"
                      value={pdfEndDate}
                      onChange={setPdfEndDate}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowDateRangePicker(false)}
                  className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181b] px-4 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#202024] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={exportToPDF}
                  className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Batch Category Update Modal */}
      {batchCategoryModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={() => setBatchCategoryModalOpen(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Batch Category Update</h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Reassign category for {selectedTransactions.size} selected transactions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBatchCategoryModalOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-neutral-500">
                Choose Destination Category
              </p>
              <div className="max-h-56 overflow-y-auto pr-1 flex flex-wrap gap-1.5">
                {categoryOptions.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setBatchCategoryValue(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      batchCategoryValue === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-[#18181b] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#202024]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
                  Or Type Custom Category
                </label>
                <input
                  type="text"
                  value={batchCategoryValue}
                  onChange={e => setBatchCategoryValue(e.target.value)}
                  placeholder="e.g. Freelance, Health, Utilities"
                  className="w-full h-8 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181b] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setBatchCategoryModalOpen(false)}
                className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181b] px-4 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#202024] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!batchCategoryValue.trim() || isBatchUpdating}
                onClick={() => handleBatchCategoryChange(batchCategoryValue.trim())}
                className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isBatchUpdating ? 'Updating...' : 'Apply Category'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150" onClick={() => setEditingTransaction(null)}>
          <div className="bg-white dark:bg-[#121215] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden border-t sm:border border-slate-200/90 dark:border-white/[0.08]" onClick={(e) => e.stopPropagation()}>
            <AddTransactionForm
              initialData={{
                id: editingTransaction.id,
                type: (editingTransaction.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
                amount: editingTransaction.amount,
                category: editingTransaction.category,
                title: editingTransaction.title || editingTransaction.description || '',
                notes: editingTransaction.notes || '',
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

      {/* Transaction Detail Inspector Drawer */}
      {inspectingTransaction && (
        <TransactionDetailDrawer
          transaction={inspectingTransaction}
          onClose={() => setInspectingTransaction(null)}
          onEdit={(t) => {
            setInspectingTransaction(null)
            setEditingTransaction(t)
          }}
          onDelete={(id) => {
            setInspectingTransaction(null)
            deleteTransaction(id)
          }}
          onDuplicate={(t) => {
            setInspectingTransaction(null)
            duplicateTransaction(t)
          }}
        />
      )}
    </div>
  )
}
