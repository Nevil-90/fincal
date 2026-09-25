// Component for PaginatedRecurringTransactions.tsx
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Search, Filter, Plus, RefreshCw, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Repeat, X, ArrowDownLeft, ArrowUpRight, History, Pause, Play, Trash2, FileText, BarChart2, CalendarDays, Utensils, ShoppingBag, Car, Film, HeartPulse, Home, Zap, Tag, Edit2 } from 'lucide-react'
import RecurringForm from './RecurringForm'
import PriceHistoryModal from './PriceHistoryModal'
import RecurringDetailDrawer from './RecurringDetailDrawer'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { useUser } from '@/hooks/useApi'
import useSWR from 'swr'
import type { RecurringTransaction, RecurringFormData } from './types'
import CustomSelect from '@/components/ui/CustomSelect'
import { getCategoryVisual } from '@/lib/category-icons'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { SkeletonRecurring } from '@/components/ui/SkeletonCard'
import CustomDateField from '@/components/ui/CustomDateField'

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
  // Pagination state
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
  const [selectedRecurringForDrawer, setSelectedRecurringForDrawer] = useState<PaginatedRecurringResponse['data'][0] | null>(null)
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
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
  const params = useMemo(() => new URLSearchParams({
    page: currentPage.toString(),
    limit: pageSize.toString(),
    ...Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value && value !== 'all')
    )
  }), [currentPage, pageSize, filters])

  const { data: recurringData, isLoading: loading, mutate } = useSWR<PaginatedRecurringResponse>(
    isTourActive ? null : `/api/recurring/paginated?${params.toString()}`,
    (url: string) => fetch(url).then(res => res.json()),
    { keepPreviousData: true }
  )

  // One-time subscription costs state & query
  const [subscriptionView, setSubscriptionView] = useState<'recurring' | 'one-time'>('recurring')
  const [showAddOneTimeModal, setShowAddOneTimeModal] = useState(false)
  const [oneTimeLoading, setOneTimeLoading] = useState(false)
  const [oneTimeForm, setOneTimeForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    notes: ''
  })

  const { data: oneTimeData, mutate: mutateOneTime, isLoading: loadingOneTime } = useSWR<{
    transactions: Array<{
      id: string
      title: string
      description?: string
      notes?: string
      amount: number
      paymentMethod: string | null
      date: string
      category: string
      isOneTimeSubscription?: boolean
    }>
  }>(
    isTourActive ? null : '/api/transactions?category=Subscriptions&recurring=non-recurring&limit=100',
    (url: string) => fetch(url).then(res => res.json())
  )

  const oneTimeTransactions = useMemo(() => {
    return oneTimeData?.transactions || []
  }, [oneTimeData])

  const totalOneTimeSpent = useMemo(() => {
    return oneTimeTransactions.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0)
  }, [oneTimeTransactions])

  const handleAddOneTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oneTimeForm.title.trim() || !oneTimeForm.amount) {
      showToast('Please provide a title and amount', 'error')
      return
    }
    setOneTimeLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          category: 'Subscriptions',
          title: oneTimeForm.title.trim(),
          amount: parseFloat(oneTimeForm.amount),
          date: oneTimeForm.date,
          paymentMethod: oneTimeForm.paymentMethod || null,
          notes: oneTimeForm.notes.trim() || null,
          isOneTimeSubscription: true
        })
      })
      if (res.ok) {
        showToast('One-time subscription cost recorded!', 'success')
        setShowAddOneTimeModal(false)
        setOneTimeForm({
          title: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: '',
          notes: ''
        })
        mutateOneTime()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save one-time cost', 'error')
      }
    } catch {
      showToast('Network error saving one-time cost', 'error')
    } finally {
      setOneTimeLoading(false)
    }
  }

  const handleDeleteOneTime = async (id: string) => {
    if (!confirm('Are you sure you want to delete this one-time subscription cost?')) return
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('One-time cost deleted', 'success')
        mutateOneTime()
      } else {
        showToast('Failed to delete transaction', 'error')
      }
    } catch {
      showToast('Network error deleting transaction', 'error')
    }
  }

  const fetchRecurringTransactions = useCallback((page?: number) => {
    if (page) setCurrentPage(page)
    mutate()
  }, [mutate])

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
    setCurrentPage(1)
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

  const handleStartEdit = (recurring: PaginatedRecurringResponse['data'][0]) => {
    setEditingRecurringId(recurring.id)
    setFormData({
      type: recurring.type as any,
      amount: recurring.amount.toString(),
      category: recurring.category,
      description: recurring.description || '',
      paymentMethod: recurring.paymentMethod || '',
      source: recurring.source || '',
      frequency: recurring.frequency,
      startDate: new Date(recurring.startDate || recurring.nextDue).toISOString().split('T')[0],
      splitType: (recurring as any).splitType || 'personal',
    })
    setShowAddForm(true)
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

    if (formData.frequency === 'one-time') {
      setFormLoading(true)
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            category: formData.category || 'Subscriptions',
            title: formData.description.trim() || 'One-Time Subscription',
            amount,
            date: formData.startDate,
            paymentMethod: formData.paymentMethod || null,
            source: formData.source || null,
            notes: formData.notes || null,
            isOneTimeSubscription: true
          }),
        })

        if (response.ok) {
          showToast('One-time subscription cost recorded!', 'success')
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
          mutateOneTime()
          fetchRecurringTransactions(1)
        } else {
          const result = await response.json()
          showToast(`Failed to record one-time cost: ${result.error || 'Unknown error occurred'}`, 'error')
        }
      } catch (error) {
        console.error('Error saving one-time transaction:', error)
        showToast('Error saving one-time transaction. Please try again.', 'error')
      } finally {
        setFormLoading(false)
      }
      return
    }

    setFormLoading(true)
    try {
      const isEditing = Boolean(editingRecurringId)
      const response = await fetch('/api/recurring', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: editingRecurringId, ...formData } : formData),
      })

      if (response.ok) {
        showToast(isEditing ? 'Recurring item updated successfully' : 'Recurring item created successfully', 'success')

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
        setEditingRecurringId(null)
        setShowAddForm(false)
        fetchRecurringTransactions(isEditing ? currentPage : 1)
      } else {
        const result = await response.json()
        showToast(`Failed to ${isEditing ? 'update' : 'create'} recurring transaction\n\n${result.error || 'Unknown error occurred'}`, 'error')
      }
    } catch (error) {
      console.error('Error saving recurring transaction:', error)
      showToast('Error saving recurring transaction. Please try again.', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const { activeSubscriptions, inactiveCount, monthlyCost, monthlyIncome, totalSpent } = useMemo(() => {
    if (!recurringData || !recurringData.data.length) {
      return { activeSubscriptions: [], inactiveCount: 0, monthlyCost: 0, monthlyIncome: 0, totalSpent: 0 }
    }
    const active = recurringData.data.filter(r => r.isActive && !r.isPaused)
    const inactive = recurringData.data.filter(r => !r.isActive || r.isPaused).length

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
          case 'quarterly': monthlyMultiplier = 1 / 3; break;
          case 'yearly': monthlyMultiplier = 1 / 12; break;
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

  const { data: staticData } = useEnhancedStaticData()
  const customIcons = useMemo(() => {
    try {
      return JSON.parse(staticData?.userSettings?.custom_category_icons || '{}')
    } catch {
      return {}
    }
  }, [staticData?.userSettings?.custom_category_icons])

  // 14-day upcoming schedule horizon
  const upcomingSchedule = useMemo(() => {
    if (!recurringData?.data) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)

      const itemsOnDay = recurringData.data.filter(item => {
        if (!item.isActive || item.isPaused) return false
        const itemDue = new Date(item.nextDue)
        return itemDue.getFullYear() === d.getFullYear() &&
               itemDue.getMonth() === d.getMonth() &&
               itemDue.getDate() === d.getDate()
      })

      const totalDayCost = itemsOnDay.reduce((acc, curr) => curr.type === 'expense' ? acc + curr.amount : acc - curr.amount, 0)

      days.push({
        date: d,
        dayNum: d.getDate(),
        dayLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        items: itemsOnDay,
        hasBills: itemsOnDay.length > 0,
        totalCost: totalDayCost
      })
    }
    return days
  }, [recurringData?.data])

  const groupedSubscriptions = useMemo(() => {
    if (!recurringData?.data) return []
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const groups: {
      id: string
      title: string
      badge: string
      items: typeof recurringData.data
    }[] = [
      { id: 'week', title: 'Due in Next 7 Days', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20', items: [] },
      { id: 'month', title: 'Due Later This Month', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20', items: [] },
      { id: 'upcoming', title: 'Upcoming Subscriptions', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20', items: [] },
      { id: 'overdue', title: 'Action Required (Past Due)', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20', items: [] },
      { id: 'paused', title: 'Paused Subscriptions', badge: 'bg-neutral-500/10 text-neutral-500 border border-neutral-500/20', items: [] },
    ]

    recurringData.data.forEach(item => {
      if (!item.isActive || item.isPaused) {
        groups[4].items.push(item)
        return
      }
      const due = new Date(item.nextDue)
      due.setHours(0, 0, 0, 0)
      const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        groups[3].items.push(item)
      } else if (diffDays <= 7) {
        groups[0].items.push(item)
      } else if (diffDays <= 30) {
        groups[1].items.push(item)
      } else {
        groups[2].items.push(item)
      }
    })

    return groups.filter(g => g.items.length > 0)
  }, [recurringData?.data])

  const getDueBadge = (nextDueDateStr: string, isActive: boolean, isPaused?: boolean) => {
    if (!isActive || isPaused) {
      return { text: 'Paused', className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700' }
    }
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const due = new Date(nextDueDateStr)
    due.setHours(0, 0, 0, 0)
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return { text: 'Due Today', className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 font-bold' }
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 font-bold' }
    }
    if (diffDays > 1 && diffDays <= 7) {
      return { text: `In ${diffDays} days`, className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/30' }
    }
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d Overdue`, className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 font-bold' }
    }
    return { text: `In ${diffDays} days`, className: 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700' }
  }

  if (loading && !recurringData) {
    return <SkeletonRecurring />
  }

  const netRemaining = monthlyIncome - monthlyCost
  const isDeficit = netRemaining < 0

  return (
    <div className="space-y-4">
      {/* Header with Title and Executive Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Recurring Bills & Subscriptions
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Track scheduled commitments, upcoming bills, and monthly cashflow predictability.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              showFilters || Object.values(filters).some(v => v && v !== 'all')
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
                : 'bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-neutral-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {Object.values(filters).some(v => v && v !== 'all') && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => fetchRecurringTransactions()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (subscriptionView === 'one-time') {
                setShowAddOneTimeModal(true)
              } else {
                setEditingRecurringId(null)
                setShowAddForm(true)
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{subscriptionView === 'one-time' ? 'New One-Time Cost' : 'New Bill'}</span>
          </button>
        </div>
      </div>

      {/* 14-Day Calendar Forecast Horizon */}
      {upcomingSchedule.some(d => d.hasBills) && (
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-neutral-900/80 backdrop-blur-sm shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Upcoming 14-Day Schedule</span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-neutral-500">
              {upcomingSchedule.reduce((acc, d) => acc + d.items.length, 0)} bills due next 2 weeks
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {upcomingSchedule.map((day, idx) => (
              <div
                key={`forecast-${idx}`}
                className={`flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-xl min-w-[70px] border transition-all ${
                  day.hasBills
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/50 text-blue-950 dark:text-blue-100 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-neutral-900/40 border-slate-100 dark:border-white/[0.04] text-slate-400 dark:text-neutral-500'
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider">{day.dayLabel}</span>
                <span className={`text-base font-bold tabular-nums mt-0.5 ${day.hasBills ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  {day.dayNum}
                </span>
                {day.hasBills ? (
                  <span className="text-[10px] font-bold tabular-nums text-blue-700 dark:text-blue-300 mt-0.5 truncate max-w-[65px]">
                    {formatCompactCurrency(day.totalCost)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300 dark:text-neutral-600 mt-0.5">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash Flow Projection Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 block truncate">
            Monthly Commitments
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(monthlyCost)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">/ mo</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 tabular-nums">
            {activeSubscriptions.filter(s => s.type === 'expense').length} scheduled outflows
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">
            Monthly Inflow
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(monthlyIncome)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">/ mo</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 tabular-nums">
            {activeSubscriptions.filter(s => s.type === 'income').length} scheduled inflows
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 block truncate">
            Net Monthly Buffer
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-base sm:text-lg font-bold tabular-nums ${isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isDeficit ? '-' : '+'}{formatCurrency(Math.abs(netRemaining))}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              isDeficit
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
            }`}>
              {isDeficit ? 'Deficit' : 'Surplus'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 tabular-nums">
            {monthlyIncome > 0 ? `${((monthlyCost / monthlyIncome) * 100).toFixed(0)}% committed` : 'No periodic income'}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 block truncate">
            Lifetime Spent
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(totalSpent + totalOneTimeSpent)}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 tabular-nums">
            {activeSubscriptions.length} recurring • {oneTimeTransactions.length} one-time
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-[#121215] p-3.5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-white/[0.08] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <CustomSelect
              selectSize="sm"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </CustomSelect>

            <CustomSelect
              selectSize="sm"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </CustomSelect>

            <CustomSelect
              selectSize="sm"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {recurringData?.filters.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </CustomSelect>

            <CustomSelect
              selectSize="sm"
              value={filters.frequency}
              onChange={(e) => handleFilterChange('frequency', e.target.value)}
            >
              <option value="">All Frequencies</option>
              {recurringData?.filters.frequencies.map(frequency => (
                <option key={frequency} value={frequency}>{frequency}</option>
              ))}
            </CustomSelect>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* View Switcher: Recurring Bills vs. One-Time Costs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121215] p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubscriptionView('recurring')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subscriptionView === 'recurring'
                ? 'bg-white dark:bg-[#16161a] text-blue-600 dark:text-blue-400 border border-slate-200/80 dark:border-blue-500/30 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`}
          >
            <Repeat className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Recurring Subscriptions</span>
            <span className="sm:hidden">Recurring</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              subscriptionView === 'recurring'
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300'
            }`}>
              {recurringData?.data?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubscriptionView('one-time')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subscriptionView === 'one-time'
                ? 'bg-white dark:bg-[#16161a] text-amber-600 dark:text-amber-400 border border-slate-200/80 dark:border-amber-500/30 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`}
          >
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">One-Time Costs</span>
            <span className="sm:hidden">One-Time</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              subscriptionView === 'one-time'
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300'
            }`}>
              {oneTimeTransactions.length}
            </span>
          </button>
        </div>

        {subscriptionView === 'one-time' && (
          <button
            type="button"
            onClick={() => setShowAddOneTimeModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-500 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add One-Time Cost</span>
          </button>
        )}
      </div>

      {subscriptionView === 'one-time' ? (
        <div className="space-y-4">
          {/* Quick Metrics Bar for One-Time Costs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 block truncate">
                Total One-Time Spend
              </span>
              <div className="text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalOneTimeSpent)}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 tabular-nums">
                Lifetime one-off purchases
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 block truncate">
                Total Items Logged
              </span>
              <div className="text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                {oneTimeTransactions.length}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 tabular-nums">
                Licenses, domains & software
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 block truncate">
                Average Cost
              </span>
              <div className="text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                {oneTimeTransactions.length > 0
                  ? formatCurrency(totalOneTimeSpent / oneTimeTransactions.length)
                  : '₹0'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 tabular-nums">
                Per one-time purchase
              </div>
            </div>
          </div>

          {/* List of One-Time Costs */}
          {oneTimeTransactions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#121215] rounded-2xl shadow-xs border border-slate-200/80 dark:border-white/[0.08]">
              <Tag className="h-10 w-10 text-slate-300 dark:text-neutral-700 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                No One-Time Costs Logged
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto mb-4">
                Record one-off software licenses, lifetime deals, domains, or non-recurring subscription expenses.
              </p>
              <button
                type="button"
                onClick={() => setShowAddOneTimeModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-500 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add One-Time Cost</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {oneTimeTransactions.map((tx: any) => {
                const visual = getCategoryVisual('Subscriptions', 'expense', undefined, customIcons)
                const Icon = visual.icon

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs hover:border-slate-300 dark:hover:border-white/15 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {tx.title || tx.description || 'Subscription Cost'}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                            One-Time
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                          <span className="tabular-nums">
                            {formatDateForDisplay(tx.date)}
                          </span>
                          {tx.paymentMethod && (
                            <>
                              <span>•</span>
                              <span>{tx.paymentMethod}</span>
                            </>
                          )}
                          {tx.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px] text-slate-400 dark:text-zinc-500">{tx.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                          One-off payment
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteOneTime(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Pagination */}
      {recurringData && recurringData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#121215] px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs text-xs">
          <div className="tabular-nums text-slate-500 dark:text-neutral-400">
            Showing {((recurringData.pagination.currentPage - 1) * recurringData.pagination.limit) + 1} to{' '}
            {Math.min(recurringData.pagination.currentPage * recurringData.pagination.limit, recurringData.pagination.totalCount)} of{' '}
            {recurringData.pagination.totalCount} bills
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(recurringData.pagination.currentPage - 1)}
              disabled={!recurringData.pagination.hasPrevPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="tabular-nums font-semibold text-slate-700 dark:text-neutral-300 px-1">
              {recurringData.pagination.currentPage} / {recurringData.pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={() => goToPage(recurringData.pagination.currentPage + 1)}
              disabled={!recurringData.pagination.hasNextPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Subscriptions Stream */}
      <div className="space-y-6">
        {recurringData?.data.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#121215] rounded-2xl shadow-xs border border-slate-200/80 dark:border-white/[0.08]">
            <Repeat className="h-10 w-10 text-slate-300 dark:text-neutral-700 mx-auto mb-3 opacity-60" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
              No Recurring Bills Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
              Add your subscriptions, utility bills, or scheduled income to track cashflow predictability.
            </p>
          </div>
        ) : (
          groupedSubscriptions.map((group) => (
            <div key={group.id} className="space-y-2.5">
              {/* Group Horizon Header */}
              <div className="flex items-center gap-2 px-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${group.badge}`}>
                  {group.title}
                </span>
                <span className="text-xs font-bold tabular-nums text-slate-400 dark:text-neutral-500">
                  ({group.items.length})
                </span>
                <div className="h-px bg-slate-200/70 dark:bg-white/[0.06] flex-1 ml-2" />
              </div>

              {/* Group Items Feed */}
              <div className="space-y-2">
                {group.items.map((recurring) => {
                  const dueInfo = getDueBadge(recurring.nextDue, recurring.isActive, recurring.isPaused)
                  const isIncome = recurring.type === 'income'
                  const visual = getCategoryVisual(recurring.category, recurring.type, undefined, customIcons)
                  const Icon = visual.icon
                  const isPaused = !recurring.isActive || recurring.isPaused

                  return (
                    <div
                      key={recurring.id}
                      onClick={() => setSelectedRecurringForDrawer(recurring)}
                      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-[#18181b] hover:border-slate-300 dark:hover:border-white/[0.15] transition-all cursor-pointer shadow-sm"
                    >
                      {/* Left: Avatar, Title, Metadata */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${visual.bg}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {recurring.description || recurring.category}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md ${dueInfo.className} shrink-0`}>
                              {dueInfo.text}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-neutral-400">
                            <span className="font-semibold text-slate-700 dark:text-neutral-300">
                              {recurring.category}
                            </span>
                            <span>·</span>
                            <span className="capitalize">{recurring.frequency}</span>
                            {recurring.paymentMethod && (
                              <>
                                <span>·</span>
                                <span>{recurring.paymentMethod}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="tabular-nums">
                              Next: {formatDateForDisplay(recurring.nextDue)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Quick Pause/Resume */}
                      <div className="flex items-center gap-4 shrink-0 pl-2">
                        <div className="text-right">
                          <div className={`text-base sm:text-lg font-bold tabular-nums ${
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {isIncome ? '+' : ''}{formatCurrency(recurring.amount)}
                          </div>
                          <div className="text-[11px] tabular-nums text-slate-400 dark:text-neutral-500">
                            {formatCurrency(recurring.totalSpent || 0)} spent
                          </div>
                        </div>

                        {/* Inline Pause Button (stopPropagation) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRecurringStatus(recurring.id, recurring.isActive && !recurring.isPaused)
                          }}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                            isPaused
                              ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                              : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                          }`}
                          title={isPaused ? 'Resume subscription' : 'Pause subscription'}
                        >
                          {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {recurringData && recurringData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#121215] px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs text-xs">
          <div className="tabular-nums text-slate-500 dark:text-neutral-400">
            Showing {((recurringData.pagination.currentPage - 1) * recurringData.pagination.limit) + 1} to{' '}
            {Math.min(recurringData.pagination.currentPage * recurringData.pagination.limit, recurringData.pagination.totalCount)} of{' '}
            {recurringData.pagination.totalCount} bills
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(recurringData.pagination.currentPage - 1)}
              disabled={!recurringData.pagination.hasPrevPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="tabular-nums font-semibold text-slate-700 dark:text-neutral-300 px-1">
              {recurringData.pagination.currentPage} / {recurringData.pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={() => goToPage(recurringData.pagination.currentPage + 1)}
              disabled={!recurringData.pagination.hasNextPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Slide-out Subscription Inspector Drawer */}
      {selectedRecurringForDrawer && (
        <RecurringDetailDrawer
          recurring={{
            id: selectedRecurringForDrawer.id,
            type: selectedRecurringForDrawer.type,
            amount: selectedRecurringForDrawer.amount,
            category: selectedRecurringForDrawer.category,
            description: selectedRecurringForDrawer.description,
            paymentMethod: selectedRecurringForDrawer.paymentMethod,
            frequency: selectedRecurringForDrawer.frequency,
            startDate: selectedRecurringForDrawer.startDate || selectedRecurringForDrawer.nextDue,
            nextDue: selectedRecurringForDrawer.nextDue,
            isActive: selectedRecurringForDrawer.isActive,
            isPaused: selectedRecurringForDrawer.isPaused || false,
            totalSpent: selectedRecurringForDrawer.totalSpent || 0,
            executionCount: selectedRecurringForDrawer._count?.transactions || 0,
            priceHistory: selectedRecurringForDrawer.priceChanges?.map(pc => ({
              id: pc.id,
              amount: pc.newAmount,
              effectiveDate: pc.effectiveDate,
              reason: pc.reason
            }))
          }}
          onClose={() => setSelectedRecurringForDrawer(null)}
          onEdit={(item) => {
            const original = recurringData?.data.find(r => r.id === item.id)
            if (original) handleStartEdit(original)
          }}
          onDelete={(id) => deleteRecurring(id)}
          onTogglePause={(id, currentPaused) => toggleRecurringStatus(id, !currentPaused)}
          onShowPriceHistory={(item) => {
            const original = recurringData?.data.find(r => r.id === item.id)
            if (original) showPriceHistory(original)
          }}
        />
      )}

      {/* Add / Edit Form Modal */}
      {showAddForm && typeof document !== 'undefined' && createPortal(
        <RecurringForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddRecurring}
          onCancel={() => {
            setShowAddForm(false)
            setEditingRecurringId(null)
          }}
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

      {/* Add One-Time Cost Modal */}
      {showAddOneTimeModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setShowAddOneTimeModal(false)}
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 shadow-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Add One-Time Subscription Cost
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Record lifetime licenses, domain renewals, or one-off software fees
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOneTimeModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddOneTimeSubmit} className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#121215]">
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 no-scrollbar space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Service / Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={oneTimeForm.title}
                    onChange={e => setOneTimeForm({ ...oneTimeForm, title: e.target.value })}
                    className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 text-xs bg-slate-50/70 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors font-semibold"
                    placeholder="e.g. Lifetime Notion License, Domain Registration"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={oneTimeForm.amount}
                      onChange={e => setOneTimeForm({ ...oneTimeForm, amount: e.target.value })}
                      className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 text-xs bg-slate-50/70 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors font-semibold tabular-nums"
                      placeholder="0.00"
                    />
                  </div>

                  <CustomDateField
                    id="oneTimeDate"
                    label="Date Paid"
                    value={oneTimeForm.date}
                    onChange={d => setOneTimeForm({ ...oneTimeForm, date: d })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <CustomSelect
                  id="oneTimePaymentMethod"
                  label="Payment Method"
                  required
                  value={oneTimeForm.paymentMethod}
                  onChange={e => setOneTimeForm({ ...oneTimeForm, paymentMethod: e.target.value })}
                >
                  <option value="">Select payment method</option>
                  {staticData.paymentMethods.filter(p => p.isActive).map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </CustomSelect>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Notes <span className="text-slate-400 dark:text-zinc-500 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={oneTimeForm.notes}
                    onChange={e => setOneTimeForm({ ...oneTimeForm, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors resize-none"
                    placeholder="License key details, renewal term, or remarks..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3.5">
                <button
                  type="button"
                  onClick={() => setShowAddOneTimeModal(false)}
                  className="flex-1 h-9 sm:h-9.5 px-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={oneTimeLoading}
                  className="flex-1 h-9 sm:h-9.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{oneTimeLoading ? 'Saving...' : 'Save One-Time Cost'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold border ${toast.type === 'success'
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
