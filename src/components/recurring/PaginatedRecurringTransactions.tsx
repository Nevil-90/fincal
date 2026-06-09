// Component for PaginatedRecurringTransactions.tsx
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Search, Filter, Plus, RefreshCw, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Repeat, X, ArrowDownLeft, ArrowUpRight, History, Pause, Play, Trash2, FileText, BarChart2 } from 'lucide-react'
import RecurringForm from './RecurringForm'
import PriceHistoryModal from './PriceHistoryModal'
import { formatCurrency } from '@/lib/financial-utils'
import { useUser } from '@/hooks/useApi'
import type { RecurringTransaction, RecurringFormData } from './types'

interface PaginatedRecurringResponse {
  data: (RecurringTransaction & {
    _count?: {
      transactions: number
    }
    priceChanges?: Array<{
      id: string
      oldAmount: number
      newAmount: number
      effectiveDate: string
      reason?: string
    }>
    totalSpent?: number
  })[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  filters: {
    categories: string[]
    frequencies: string[]
  }
}

interface Filters {
  status: 'all' | 'active' | 'inactive'
  type: 'all' | 'income' | 'expense'
  category: string
  frequency: string
}

export default function PaginatedRecurringTransactions() {
  // Data state
  const [recurringData, setRecurringData] = useState<PaginatedRecurringResponse | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Transaction history state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [transactionHistory, setTransactionHistory] = useState<{ 
    [key: string]: {
      transactions: Array<{
        id: string
        date: string
        amount: number
        description: string
        paymentMethod?: string
      }>
      pagination?: {
        currentPage: number
        totalPages: number
        totalCount: number
        hasNextPage: boolean
        hasPrevPage: boolean
      }
      totalCount?: number
    }
  }>({})
  const [loadingHistory, setLoadingHistory] = useState<{ [key: string]: boolean }>({})
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  
  // Filter state
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    type: 'all',
    category: '',
    frequency: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  
  // Price history modal state
  const [priceHistoryModal, setPriceHistoryModal] = useState<{
    isOpen: boolean;
    recurringTransaction: PaginatedRecurringResponse['data'][0] | null;
  }>({
    isOpen: false,
    recurringTransaction: null
  })
  
  const [analyticsRecurring, setAnalyticsRecurring] = useState<PaginatedRecurringResponse['data'][0] | null>(null)
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }
  
  // Form data
  const [formData, setFormData] = useState<RecurringFormData>({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    paymentMethod: '',
    source: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    splitType: 'personal',
  })

  const { user } = useUser()
  const isTourActive = user && !user.hasCompletedOnboarding

  // Fetch data with pagination and filters
  const fetchRecurringTransactions = useCallback(async (page: number = 1, signal?: AbortSignal) => {
    if (isTourActive) {
      setRecurringData({
        data: [],
        pagination: { currentPage: 1, totalPages: 1, totalCount: 0, limit: pageSize, hasNextPage: false, hasPrevPage: false },
        filters: { categories: [], frequencies: [] }
      })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value && value !== 'all')
        )
      })

      const response = await fetch(`/api/recurring/paginated?${params}`, { signal })
      if (response.ok) {
        const data = await response.json()
        setRecurringData(data)
        setCurrentPage(page)
      } else {
        console.error('Failed to fetch recurring transactions')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted due to React Strict Mode or component unmount');
        return; // Ignore abort errors
      }
      console.error('Error fetching recurring transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [pageSize, filters, isTourActive]) // Include filters dependency

  useEffect(() => {
    const controller = new AbortController()
    fetchRecurringTransactions(1, controller.signal)
    
    return () => {
      // Abort the fetch if the component unmounts or effect re-runs (React Strict Mode)
      controller.abort()
    }
  }, [fetchRecurringTransactions])

  // Filter handlers
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      category: '',
      frequency: ''
    })
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= (recurringData?.pagination.totalPages || 1)) {
      fetchRecurringTransactions(page)
    }
  }

  // Transaction history handlers
  const toggleRowExpansion = async (recurringId: string) => {
    const newExpanded = new Set(expandedRows)
    
    if (expandedRows.has(recurringId)) {
      // Collapse row
      newExpanded.delete(recurringId)
    } else {
      // Expand row and fetch history if not already loaded
      newExpanded.add(recurringId)
      
      if (!transactionHistory[recurringId]) {
        await fetchTransactionHistory(recurringId)
      }
    }
    
    setExpandedRows(newExpanded)
  }

  const fetchTransactionHistory = async (recurringId: string, page: number = 1, limit: number = 10) => {
    setLoadingHistory(prev => ({ ...prev, [recurringId]: true }))
    
    try {
      const response = await fetch(`/api/transactions?recurringId=${recurringId}&page=${page}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        
        // Handle both paginated and non-paginated responses
        const transactions = data.transactions || data
        const pagination = data.pagination || null
        
        setTransactionHistory(prev => ({
          ...prev,
          [recurringId]: {
            transactions: Array.isArray(transactions) ? transactions.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ) : [],
            pagination,
            totalCount: data.totalCount || transactions.length
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error)
    } finally {
      setLoadingHistory(prev => ({ ...prev, [recurringId]: false }))
    }
  }

  // CRUD handlers
  const toggleRecurringStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPaused: currentStatus }), // If currently active, pause it
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[SUCCESS] ${currentStatus ? 'Paused' : 'Resumed'} recurring transaction:`, result)
        fetchRecurringTransactions(currentPage) // Refresh current page
      } else {
        const error = await response.json()
        showToast(`Failed to ${currentStatus ? 'pause' : 'resume'} transaction: ${error.error || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('Error updating recurring transaction:', error)
      showToast(`Error ${currentStatus ? 'pausing' : 'resuming'} transaction. Please try again.`, 'error')
    }
  }

  const deleteRecurring = async (id: string) => {
    if (!confirm('[WARNING] Delete Recurring Transaction\n\nThis will permanently delete this recurring transaction and stop future automatic transactions. Existing transaction history will be preserved.\n\nContinue?')) return

    try {
      const response = await fetch(`/api/recurring?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Recurring transaction deleted successfully!', 'success')
        fetchRecurringTransactions(currentPage) // Refresh current page
      } else {
        const result = await response.json()
        showToast(`Failed to delete recurring transaction\n\n${result.error || 'Unknown error occurred'}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting recurring transaction:', error)
      showToast('Error deleting recurring transaction. Please try again.', 'error')
    }
  }

  const showPriceHistory = (recurring: RecurringTransaction) => {
    setPriceHistoryModal({
      isOpen: true,
      recurringTransaction: recurring
    })
  }

  const closePriceHistory = () => {
    setPriceHistoryModal({
      isOpen: false,
      recurringTransaction: null
    })
  }

  const calculateMonthlyEquivalent = (recurring: RecurringTransaction) => {
    switch (recurring.frequency.toLowerCase()) {
      case 'daily':
        return recurring.amount * 30
      case 'weekly':
        return recurring.amount * 4.33
      case 'monthly':
        return recurring.amount
      case 'quarterly':
        return recurring.amount / 3
      case 'yearly':
        return recurring.amount / 12
      default:
        return recurring.amount
    }
  }

  const calculateYearlyEquivalent = (recurring: RecurringTransaction) => {
    switch (recurring.frequency.toLowerCase()) {
      case 'daily':
        return recurring.amount * 365
      case 'weekly':
        return recurring.amount * 52
      case 'monthly':
        return recurring.amount * 12
      case 'quarterly':
        return recurring.amount * 4
      case 'yearly':
        return recurring.amount
      default:
        return recurring.amount * 12
    }
  }

  const handlePriceChangeAdded = async () => {
    // Refresh the current page data to show updated price changes
    await fetchRecurringTransactions(currentPage)
    
    // Also refresh any expanded transaction history to show new amounts
    const expandedRecurringIds = Array.from(expandedRows)
    for (const recurringId of expandedRecurringIds) {
      await fetchTransactionHistory(recurringId, 1, 10)
    }
  }

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('[WARNING] Delete Transaction\n\nThis will permanently delete this transaction from your records. This action cannot be undone.\n\nContinue?')) return

    try {
      const response = await fetch(`/api/transactions?id=${transactionId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        showToast('Transaction deleted successfully!', 'success')
        
        // Refresh both recurring data and clear transaction history cache
        fetchRecurringTransactions(currentPage)
        setTransactionHistory({})
        setExpandedRows(new Set()) // Collapse all expanded rows
      } else {
        showToast(`Failed to delete transaction\n\n${result.error || 'Unknown error occurred'}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      showToast('Error deleting transaction. Please try again.', 'error')
    }
  }

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || !formData.category) {
      showToast('Please fill in all required fields (Amount and Category)', 'error')
      return
    }

    const amount = parseFloat(formData.amount)
    if (amount <= 0) {
      showToast('Amount must be greater than 0', 'error')
      return
    }

    if (amount > 1000000) {
      showToast('Amount seems too large. Please check the value.', 'error')
      return
    }

    setFormLoading(true)
    try {
      const response = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        showToast(`Recurring transaction created successfully!\n\n${result.message || 'Transaction will be processed automatically.'}`, 'success')
        
        // Reset form
        setFormData({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          paymentMethod: '',
          source: '',
          frequency: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          splitType: 'personal',
        })
        
        setShowAddForm(false)
        fetchRecurringTransactions(1) // Go to first page to see new transaction
      } else {
        const result = await response.json()
        showToast(`Failed to create recurring transaction\n\n${result.error || 'Unknown error occurred'}`, 'error')
      }
    } catch (error) {
      console.error('Error creating recurring transaction:', error)
      showToast('Error creating recurring transaction. Please try again.', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const { activeSubscriptions, inactiveCount, monthlyCost, monthlyIncome, totalSpent } = useMemo(() => {
    if (!recurringData || !recurringData.data.length) {
      return { activeSubscriptions: [], inactiveCount: 0, monthlyCost: 0, monthlyIncome: 0, totalSpent: 0 }
    }
    const active = recurringData.data.filter(r => r.isActive)
    const inactive = recurringData.data.filter(r => !r.isActive).length
    
    let totalMonthlyCost = 0
    let totalMonthlyIncome = 0
    
    active.forEach(subscription => {
      let cost = 0
      if (subscription.frequency.toLowerCase() === 'daily') {
        cost = subscription.amount * 30
      } else {
        let monthlyMultiplier = 1
        switch (subscription.frequency.toLowerCase()) {
          case 'weekly': monthlyMultiplier = 4.33; break;
          case 'monthly': monthlyMultiplier = 1; break;
          case 'quarterly': monthlyMultiplier = 1/3; break;
          case 'yearly': monthlyMultiplier = 1/12; break;
        }
        cost = subscription.amount * monthlyMultiplier
      }
      
      if (subscription.type === 'expense') {
        totalMonthlyCost += cost
      } else if (subscription.type === 'income') {
        totalMonthlyIncome += cost
      }
    })

    let totalSpentAmount = 0
    recurringData.data.forEach(recurring => {
      if (recurring.type === 'expense') {
        totalSpentAmount += recurring.totalSpent || 0
      }
    })

    return { activeSubscriptions: active, inactiveCount: inactive, monthlyCost: totalMonthlyCost, monthlyIncome: totalMonthlyIncome, totalSpent: totalSpentAmount }
  }, [recurringData])

  if (loading && !recurringData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recurring Transactions</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded">
            {recurringData?.pagination.totalCount || 0} total
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={() => {
              fetchRecurringTransactions()
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Recurring
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm ring-1 ring-gray-100 dark:ring-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:[&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">All Categories</option>
              {recurringData?.filters.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* Frequency Filter */}
            <select
              value={filters.frequency}
              onChange={(e) => handleFilterChange('frequency', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">All Frequencies</option>
              {recurringData?.filters.frequencies.map(frequency => (
                <option key={frequency} value={frequency}>{frequency}</option>
              ))}
            </select>
          </div>
          
          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Premium Cashflow Widget */}
      {recurringData && recurringData.data.length > 0 && (
        (() => {
          const expensePercentage = monthlyIncome > 0 ? Math.min(100, (monthlyCost / monthlyIncome) * 100) : (monthlyCost > 0 ? 100 : 0);
          const incomePercentage = Math.max(0, 100 - expensePercentage);
          const netRemaining = monthlyIncome - monthlyCost;
          const isNegative = netRemaining < 0;

          return (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm ring-1 ring-gray-100 dark:ring-neutral-800">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start lg:items-center">
                
                {/* Left: Net Remaining */}
                <div className="flex-1 w-full min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Net Cashflow</h3>
                    <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-md ${isNegative ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                      {isNegative ? 'Deficit' : 'Surplus'}
                    </span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white truncate block">
                    {isNegative ? '-' : ''}{formatCurrency(Math.abs(netRemaining))}
                  </span>
                </div>

                {/* Middle: Progress Bar */}
                <div className="w-full lg:w-[45%] bg-gray-50 dark:bg-neutral-800/50 p-3 sm:p-4 rounded-xl ring-1 ring-gray-200/60 dark:ring-neutral-700/50 shrink-0">
                  <div className="flex justify-between items-end mb-2">
                    <div className="min-w-0">
                      <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Income</p>
                      <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-none mt-0.5 truncate">{formatCurrency(monthlyIncome)}</p>
                    </div>
                    <div className="text-right min-w-0 pl-2">
                      <p className="text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">Cost</p>
                      <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-none mt-0.5 truncate">{formatCurrency(monthlyCost)}</p>
                    </div>
                  </div>
                  
                  <div className="h-2 w-full bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${incomePercentage}%` }}></div>
                    <div className="h-full bg-rose-500 transition-all duration-1000 ease-out" style={{ width: `${expensePercentage}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-medium text-gray-500 dark:text-gray-400 pt-2">
                    <p>Utilizing {expensePercentage.toFixed(1)}%</p>
                    {expensePercentage > 50 && monthlyIncome > 0 && (
                      <span className={`${expensePercentage > 80 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-amber-600 dark:text-amber-400'}`}>
                        {expensePercentage > 80 ? 'Critical usage' : 'High usage'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Sub/Spent Stats */}
                <div className="flex-1 w-full flex lg:flex-col justify-between lg:justify-center gap-4 lg:gap-3 border-t border-gray-100 dark:border-neutral-800 pt-4 lg:border-t-0 lg:pt-0 lg:pl-4 lg:border-l min-w-0">
                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Active Subs</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
                      {activeSubscriptions.length} <Repeat className="w-3 h-3 text-blue-500 shrink-0" />
                    </p>
                  </div>
                  <div className="text-right lg:text-left min-w-0">
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Lifetime Spent</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>

              </div>
            </div>
          )
        })()
      )}

      {/* Recurring Transactions List */}
      <div className="space-y-4">
        {recurringData?.data.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-neutral-800">
            <RefreshCw className="h-12 w-12 text-slate-300 dark:text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Recurring Transactions</h3>
            <p className="text-gray-600 dark:text-gray-400">Add your first recurring transaction to get started</p>
          </div>
        ) : (
          recurringData?.data.map((recurring) => (
            <div key={recurring.id} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-neutral-800 overflow-hidden">
              <div className="flex flex-col">
                {/* Compact Transaction Header */}
                <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-neutral-800/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`inline-flex px-2.5 py-1.5 text-xs font-medium rounded-full shrink-0 ${
                        recurring.type === 'income' 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-900/50' 
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/50'
                      }`}>
                        {recurring.type === 'income' ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAnalyticsRecurring(recurring)}
                        className="flex-1 text-left group min-w-0 cursor-pointer"
                      >
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {recurring.description || recurring.category}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{recurring.category}</p>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-4 border-t border-slate-200/60 dark:border-neutral-700 pt-3 md:border-t-0 md:pt-0">
                      <div className="text-left md:text-right">
                        <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                          {formatCurrency(recurring.amount)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 capitalize font-medium">
                          {recurring.frequency}
                        </div>
                      </div>
                      
                      {/* Individual Total Spent */}
                      <div className="text-left md:text-right border-l border-gray-200 dark:border-neutral-700 pl-4">
                        <span className={`text-sm font-semibold mt-1 ${recurring.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-neutral-100'}`}>
                          {formatCurrency(recurring.totalSpent || 0)}
                        </span>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Total Spent
                        </div>
                      </div>
                      
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        (recurring.isActive && !recurring.isPaused)
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-900/30' 
                          : 'bg-slate-50 dark:bg-neutral-800/50 text-slate-600 dark:text-neutral-400 border border-slate-200/50 dark:border-neutral-700'
                      }`}>
                        {(recurring.isActive && !recurring.isPaused) ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Compact Info Row */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-neutral-700 md:border-t-0 md:pt-0 md:mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <span>Start: {new Date(recurring.startDate || recurring.nextDue).toLocaleDateString()}</span>
                      <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                      <span>Next: {new Date(recurring.nextDue).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-1.5 mt-3 sm:mt-0 w-full sm:w-auto">
                      <button
                        onClick={() => showPriceHistory(recurring)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 px-1.5 sm:px-2.5 py-1.5 sm:py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg text-[11px] sm:text-xs transition-colors"
                        title="Price History"
                      >
                        <span className="flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"><BarChart2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> History</span>
                      </button>
                      <button
                        onClick={() => toggleRecurringStatus(recurring.id, recurring.isActive && !recurring.isPaused)}
                        className={`px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-[11px] sm:text-xs transition-colors border ${
                          (recurring.isActive && !recurring.isPaused)
                            ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                            : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                        }`}
                      >
                        {(recurring.isActive && !recurring.isPaused) ? <span className="flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"><Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Pause</span> : <span className="flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"><Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Resume</span>}
                      </button>
                      <button
                        onClick={() => deleteRecurring(recurring.id)}
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 px-1.5 sm:px-2.5 py-1.5 sm:py-1 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg text-[11px] sm:text-xs transition-colors"
                        title="Delete"
                      >
                        <span className="flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Del</span>
                      </button>
                      <button
                        onClick={() => toggleRowExpansion(recurring.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 px-1.5 sm:px-2.5 py-1.5 sm:py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"
                      >
                        {expandedRows.has(recurring.id) ? (
                          <><ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Hide ({recurring._count?.transactions || 0})</>
                        ) : (
                          <><ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> View ({recurring._count?.transactions || 0})</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Transaction History */}
                {expandedRows.has(recurring.id) && (
                  <div className="p-4 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction History</h4>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {transactionHistory[recurring.id]?.transactions?.length || 0} transactions
                      </div>
                    </div>
                    
                    <div className="relative min-h-[100px]">
                      {loadingHistory[recurring.id] && transactionHistory[recurring.id]?.transactions ? (
                        <div className="absolute inset-0 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : null}

                      {!transactionHistory[recurring.id] && loadingHistory[recurring.id] ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : transactionHistory[recurring.id]?.transactions?.length > 0 ? (
                        <div className="space-y-3">
                          {/* Compact Transaction List */}
                          <div className="space-y-1 rounded-xl ring-1 ring-gray-100 dark:ring-neutral-800 overflow-hidden">
                            {transactionHistory[recurring.id].transactions.map((transaction) => (
                              <div key={`tx-${transaction.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 border-b border-gray-100 dark:border-neutral-800 last:border-b-0 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </div>
                                  <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-[10px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wider">
                                    {transaction.paymentMethod || 'N/A'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-sm font-black text-gray-900 dark:text-white">
                                    {formatCurrency(transaction.amount)}
                                  </div>
                                  <button
                                    onClick={() => deleteTransaction(transaction.id)}
                                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
                                    title="Delete transaction"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Compact Pagination */}
                          {transactionHistory[recurring.id]?.pagination && transactionHistory[recurring.id].pagination!.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-neutral-700">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Page {transactionHistory[recurring.id].pagination!.currentPage} of {transactionHistory[recurring.id].pagination!.totalPages}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => fetchTransactionHistory(recurring.id, transactionHistory[recurring.id].pagination!.currentPage - 1)}
                                  disabled={!transactionHistory[recurring.id].pagination!.hasPrevPage}
                                  className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50"
                                >
                                  ‹
                                </button>
                                <button
                                  onClick={() => fetchTransactionHistory(recurring.id, transactionHistory[recurring.id].pagination!.currentPage + 1)}
                                  disabled={!transactionHistory[recurring.id].pagination!.hasNextPage}
                                  className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50"
                                >
                                  ›
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-800/50 rounded">
                          <FileText className="h-8 w-8 text-slate-300 dark:text-neutral-600 mx-auto mb-2" />
                          <p className="text-sm">No transaction history yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {recurringData && recurringData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-neutral-900 px-4 py-3 rounded-xl shadow-sm ring-1 ring-gray-100 dark:ring-neutral-800">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            Showing {((recurringData.pagination.currentPage - 1) * recurringData.pagination.limit) + 1} to{' '}
            {Math.min(recurringData.pagination.currentPage * recurringData.pagination.limit, recurringData.pagination.totalCount)} of{' '}
            {recurringData.pagination.totalCount} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(recurringData.pagination.currentPage - 1)}
              disabled={!recurringData.pagination.hasPrevPage}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {recurringData.pagination.currentPage} of {recurringData.pagination.totalPages}
            </span>
            
            <button
              onClick={() => goToPage(recurringData.pagination.currentPage + 1)}
              disabled={!recurringData.pagination.hasNextPage}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Recurring Form Modal */}
      {showAddForm && typeof document !== 'undefined' && createPortal(
        <RecurringForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddRecurring}
          onCancel={() => setShowAddForm(false)}
          formLoading={formLoading}
        />,
        document.body
      )}

      {/* Price History Modal */}
      {priceHistoryModal.isOpen && priceHistoryModal.recurringTransaction && typeof document !== 'undefined' && createPortal(
        <PriceHistoryModal
          isOpen={priceHistoryModal.isOpen}
          recurringTransaction={priceHistoryModal.recurringTransaction}
          onClose={closePriceHistory}
          onPriceChangeAdded={handlePriceChangeAdded}
        />,
        document.body
      )}

      {/* Recurring Analytics Modal */}
      {analyticsRecurring && recurringData && typeof document !== 'undefined' && createPortal(
        (() => {
          const totalSpent = analyticsRecurring.totalSpent || 0
          const monthlyEquivalent = calculateMonthlyEquivalent(analyticsRecurring)
          const yearlyEquivalent = calculateYearlyEquivalent(analyticsRecurring)
          const allRecurringSpent = recurringData.data.reduce((sum, item) => sum + (item.totalSpent || 0), 0)
          const shareOfRecurringSpend = allRecurringSpent > 0 ? (totalSpent / allRecurringSpent) * 100 : 0
          const transactionCount = analyticsRecurring._count?.transactions || 0
          const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0
          const startDate = new Date(analyticsRecurring.startDate || analyticsRecurring.nextDue)
          const nextDueDate = new Date(analyticsRecurring.nextDue)
          const activeDays = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
          const dailyAverage = totalSpent / activeDays

          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl ring-1 ring-gray-200 dark:ring-neutral-800">
                <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-6 backdrop-blur">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Recurring Analytics</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsRecurring.description || analyticsRecurring.category}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {analyticsRecurring.category} · {analyticsRecurring.frequency} · Next due {nextDueDate.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnalyticsRecurring(null)}
                    className="rounded-full p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                    <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 ring-1 ring-blue-100 dark:ring-blue-900/50">
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">Total Spent</p>
                      <p className="mt-1 text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 ring-1 ring-green-100 dark:ring-green-900/50">
                      <p className="text-xs sm:text-sm text-green-700 dark:text-green-400">Monthly Impact</p>
                      <p className="mt-1 text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(monthlyEquivalent)}</p>
                    </div>
                    <div className="rounded-2xl bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 ring-1 ring-purple-100 dark:ring-purple-900/50">
                      <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400">Yearly Impact</p>
                      <p className="mt-1 text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(yearlyEquivalent)}</p>
                    </div>
                    <div className="rounded-2xl bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 ring-1 ring-orange-100 dark:ring-orange-900/50">
                      <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400">Share of Recurring</p>
                      <p className="mt-1 text-lg sm:text-2xl font-bold text-orange-900 dark:text-orange-100">{shareOfRecurringSpend.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                    <div className="rounded-2xl bg-white dark:bg-neutral-800 p-3 sm:p-4 ring-1 ring-gray-100 dark:ring-neutral-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Transactions Created</p>
                      <p className="mt-1 text-base sm:text-xl font-semibold text-gray-900 dark:text-white">{transactionCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-neutral-800 p-3 sm:p-4 ring-1 ring-gray-100 dark:ring-neutral-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Average Transaction</p>
                      <p className="mt-1 text-base sm:text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(averageTransaction)}</p>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-neutral-800 p-3 sm:p-4 ring-1 ring-gray-100 dark:ring-neutral-700 col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Daily Average Since Start</p>
                      <p className="mt-1 text-base sm:text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(dailyAverage)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-neutral-800 p-5 ring-1 ring-gray-100 dark:ring-neutral-700">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Subscription Details</h4>
                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <div className="flex justify-between rounded-xl bg-gray-50 dark:bg-neutral-700/50 p-3">
                        <span className="text-gray-500 dark:text-gray-400">Current amount</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(analyticsRecurring.amount)}</span>
                      </div>
                      <div className="flex justify-between rounded-xl bg-gray-50 dark:bg-neutral-700/50 p-3">
                        <span className="text-gray-500 dark:text-gray-400">Frequency</span>
                        <span className="font-medium capitalize text-gray-900 dark:text-white">{analyticsRecurring.frequency}</span>
                      </div>
                      <div className="flex justify-between rounded-xl bg-gray-50 dark:bg-neutral-700/50 p-3">
                        <span className="text-gray-500 dark:text-gray-400">Start date</span>
                        <span className="font-medium text-gray-900 dark:text-white">{startDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between rounded-xl bg-gray-50 dark:bg-neutral-700/50 p-3">
                        <span className="text-gray-500 dark:text-gray-400">Status</span>
                        <span className="font-medium text-gray-900 dark:text-white">{analyticsRecurring.isActive && !analyticsRecurring.isPaused ? 'Active' : 'Paused'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })(),
        document.body
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold border ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
