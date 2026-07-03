// Root dashboard shell. Manages tab routing, global state, the add-transaction
// modal, settings panel, and onboarding wizard. Lazy-loads heavy tabs via next/dynamic.
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { enhancedStaticDataManager } from '@/lib/enhanced-static-data-manager'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useNavPreferences } from '@/hooks/useNavPreferences'

import { formatCurrency } from '@/lib/financial-utils'
import { useUser, useTransactionSummary, useTransactions, useGoals } from '@/hooks/useApi'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import AddTransactionForm from './AddTransactionForm'
const RegularTransactionList = dynamic(() => import('./RegularTransactionList'), { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 dark:bg-neutral-800 rounded-2xl h-[400px] w-full mt-4" /> })
const RecurringTransactions = dynamic(() => import('./RecurringTransactions'), { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 dark:bg-neutral-800 rounded-2xl h-[400px] w-full mt-4" /> })
const SavingsGoalsNew = dynamic(() => import('./SavingsGoalsNew'), { ssr: false })
const TravelingTab = dynamic(() => import('./TravelingTab'), { ssr: false })
const SettingsPanel = dynamic(() => import('./SettingsPanel').then(mod => mod.SettingsPanel), { ssr: false })
const CalendarTab = dynamic(() => import('./CalendarTab'), { ssr: false })
const AdminTab = dynamic(() => import('./dashboard/AdminTab'), { ssr: false })

import BottomNav from './dashboard/BottomNav'

import { TourProvider, useTour } from './tour/TourContext'
import { TourOverlay } from './tour/TourOverlay'

import CommandPalette from '@/components/ui/CommandPalette'
import Sidebar from './dashboard/Sidebar'
import DashboardHeader from './dashboard/DashboardHeader'
import OverviewTab from './dashboard/OverviewTab'
const AnalyticsTab = dynamic(() => import('./analytics/AnalyticsTab'), { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 dark:bg-neutral-800 rounded-2xl h-[400px] w-full" /> })
import { SkeletonDashboard } from './ui/SkeletonCard'


interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  priority: number
  deadline?: string
  isCompleted?: boolean
  completedAt?: string
  createdAt?: Date
  updatedAt?: Date
  contributions?: GoalContribution[]
}

interface GoalContribution {
  id: string
  goalId: string
  amount: number
  description: string | null
  date: string
  transaction?: {
    id: string
    paymentMethod: string | null
  }
}

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
}

type DashboardTab =
  | 'overview'
  | 'analytics'
  | 'transactions'
  | 'goals'
  | 'recurring'
  | 'calendar'
  | 'traveling'
  | 'admin'

const DASHBOARD_TABS: DashboardTab[] = [
  'overview',
  'analytics',
  'transactions',
  'goals',
  'recurring',
  'calendar',
  'traveling',
  'admin'
]


function ModernDashboardContent() {
  const { user, isLoading: isLoadingUser } = useUser()
  const [overviewPeriod, setOverviewPeriod] = useState<{
    year: number
    month?: number
  }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  const { summary, isLoading: loadingSummary, mutate: mutateSummary } = useTransactionSummary(overviewPeriod.month, overviewPeriod.year, true)
  const { transactions: periodTxns, mutate: mutatePeriodTxns } = useTransactions(1, 10, { month: overviewPeriod.month, year: overviewPeriod.year })

  const [advancedFilters, setAdvancedFilters] = useState<{
    year?: number
    month?: number
    category?: string
    type?: 'income' | 'expense'
  }>({})

  const hasAdvancedFilter = advancedFilters.year !== undefined
  const { summary: txSummary } = useTransactionSummary(
    hasAdvancedFilter ? (advancedFilters.month !== undefined ? advancedFilters.month + 1 : undefined) : null,
    hasAdvancedFilter ? advancedFilters.year : null,
    true
  )

  const { goals, isLoading: isLoadingGoals, mutate: mutateGoals } = useGoals()

  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const { startTour, isActive: isTourActive } = useTour()
  const { slots, isLoading: isLoadingNav } = useNavPreferences()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Only show the full-page skeleton on the initial load. SWR's isLoading can
  // flicker during key transitions; gating on missing data makes it bulletproof.
  const isInitialSummaryLoading = !summary && loadingSummary
  const isInitialUserLoading = !user && isLoadingUser
  const isInitialGoalsLoading = !goals && isLoadingGoals
  const loading = isInitialSummaryLoading || isInitialUserLoading || isInitialGoalsLoading

  useScrollLock(showAddTransaction || isTourActive)

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  useEffect(() => {
    const savedTab = localStorage.getItem('fintracker_active_tab')
    if (savedTab && DASHBOARD_TABS.includes(savedTab as DashboardTab)) {
      setActiveTab(savedTab as DashboardTab)
    }
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const filteredSummary = useMemo(() => {
    const yearOnly = advancedFilters.year !== undefined && advancedFilters.month === undefined
    const monthOnly = advancedFilters.month !== undefined
    const noFilter = !advancedFilters.year && !advancedFilters.month

    // Choose the right aggregate based on active filter:
    //  - no filter   → summary.global (always-fetched overview data, never undefined)
    //  - year only   → txSummary.year (year-level aggregate from filter fetch)
    //  - month+year  → txSummary.period (month-level aggregate)
    // Fallback chain ensures ₹0 never shows on initial load.
    let source
    if (noFilter) {
      source = summary?.global          // always available — no extra fetch needed
    } else if (monthOnly) {
      source = txSummary?.period ?? summary?.global
    } else if (yearOnly) {
      source = txSummary?.year ?? summary?.global
    } else {
      source = summary?.global
    }

    return {
      income: source?.income || 0,
      expense: source?.expense || 0,
      net: source?.balance || 0,
      categories: 0,
      latestDate: '—',
      count: source?.count || 0
    }
  }, [txSummary, summary, advancedFilters])

  const balanceInfo = useMemo(() => {
    return {
      periodIncome: summary?.period?.income || 0,
      periodExpenses: summary?.period?.expense || 0,
      periodBalance: summary?.period?.balance || 0,
      totalBalance: summary?.global?.balance || 0,
      transactionCount: summary?.period?.count || 0
    }
  }, [summary])

  const availableBalance = summary?.global?.balance || 0
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const yearsSet = new Set<number>([currentYear - 2, currentYear - 1, currentYear, currentYear + 1])
    if (summary?.availableYears) {
      summary.availableYears.forEach((y: number) => yearsSet.add(y))
    }
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [summary?.availableYears])

  const getFilteredTourSteps = useCallback(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const baseSteps = [
      {
        title: "Welcome to FinTracker! 🎉",
        content: "Let's take a quick tour to understand how everything works.",
        placement: "center",
        onBeforeActive: () => setActiveTab('overview')
      },
      {
        target: '[data-tour="overview-stats"]',
        title: "Your Financial Command Center",
        content: "This shows your overall health at a glance. Track income, expenses, and savings seamlessly.",
        placement: "bottom",
        onBeforeActive: () => setActiveTab('overview')
      },
      {
        target: '[data-tour="sidebar-transactions"], [data-tour="bottomnav-transactions"]',
        title: "Transactions",
        content: "Log and manage all your day-to-day income and expenses here.",
        placement: "right",
        onBeforeActive: () => setActiveTab('transactions')
      },
      {
        target: '[data-tour="add-transaction"]',
        title: "Add Transactions",
        content: "Whenever you spend or receive money, log it here to keep your records accurate.",
        placement: "top",
        onBeforeActive: () => setActiveTab('transactions')
      },
      {
        target: '[data-tour="sidebar-goals"], [data-tour="bottomnav-goals"]',
        title: "Savings Goals",
        content: "Set aside money for your dream purchases or emergency funds.",
        placement: "right",
        onBeforeActive: () => setActiveTab('goals')
      },
      {
        target: '[data-tour="sidebar-recurring"], [data-tour="bottomnav-recurring"]',
        title: "Recurring Bills",
        content: "Never miss a payment. Manage subscriptions and regular bills here.",
        placement: "right",
        onBeforeActive: () => setActiveTab('recurring')
      },
      {
        target: '[data-tour="sidebar-analytics"], [data-tour="bottomnav-analytics"]',
        title: "Analytics",
        content: "Deep dive into your spending habits with detailed charts and trends.",
        placement: "right",
        onBeforeActive: () => setActiveTab('analytics')
      },
      {
        target: '[data-tour="sidebar-calendar"], [data-tour="bottomnav-calendar"]',
        title: "Calendar View",
        content: "See your daily expenses and income at a glance on a monthly calendar.",
        placement: "right",
        onBeforeActive: () => setActiveTab('calendar')
      },
      {
        target: '[data-tour="sidebar-traveling"], [data-tour="bottomnav-traveling"]',
        title: "Traveling",
        content: "Log travel entries, track distances, and manage your vehicle or trip expenses effortlessly.",
        placement: "right",
        onBeforeActive: () => setActiveTab('traveling')
      },
      {
        title: "You're All Set! 🚀",
        content: "Let's set up your financial baseline to get started.",
        placement: "center",
        onBeforeActive: () => setActiveTab('overview'),
        inputs: [
          {
            id: 'openingBalance',
            label: 'Opening Balance (₹)',
            type: 'number',
            placeholder: 'e.g. 50000'
          },
          {
            id: 'monthlySpendingGoal',
            label: 'Monthly Spending Goal (₹)',
            type: 'number',
            placeholder: 'e.g. 20000'
          }
        ]
      }
    ] as any[];

    return baseSteps.filter(step => {
      if (!isMobile) return true;

      const titleToSlot: Record<string, string> = {
        "Transactions": 'transactions',
        "Savings Goals": 'goals',
        "Recurring Bills": 'recurring',
        "Analytics": 'analytics',
        "Calendar View": 'calendar',
        "Traveling": 'traveling'
      };

      const requiredSlot = titleToSlot[step.title];
      if (requiredSlot && !slots.includes(requiredSlot)) {
        return false; // Skip steps for tabs that are hidden in the mobile 'more' menu
      }
      return true;
    });
  }, [slots, setActiveTab]);

  useEffect(() => {
    if (user && !user.hasCompletedOnboarding && !isTourActive && !isLoadingNav) {
      startTour(getFilteredTourSteps())
    }
  }, [user, startTour, isTourActive, getFilteredTourSteps, isLoadingNav])

  // Process overdue recurring transactions once per calendar day.
  useEffect(() => {
    if (!user) return

    const processRecurringTransactions = async () => {
      try {
        const lastProcessDate = localStorage.getItem('lastRecurringProcessDate')
        const today = new Date().toISOString().split('T')[0]

        if (lastProcessDate !== today) {
          const response = await fetch('/api/recurring/process', { method: 'POST' })

          if (response.ok) {
            localStorage.setItem('lastRecurringProcessDate', today)
            const result = await response.json()
            if (result.processed > 0) {
              refreshAll()
            }
          }
        }
      } catch (error) {
        console.error('Failed to process recurring transactions:', error)
      }
    }

    processRecurringTransactions()
  }, [user])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (showAddTransaction) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showAddTransaction])


  useEffect(() => {
    const unsubscribe = enhancedStaticDataManager.subscribe(() => { })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshAll = async () => {
    await Promise.all([
      mutateSummary(undefined, { revalidate: true }),
      mutatePeriodTxns(undefined, { revalidate: true }),
      mutateGoals(undefined, { revalidate: true }),
      mutate((key: any) => typeof key === 'string' && key.startsWith('/api/transactions'), undefined, { revalidate: true }),
    ])
  }

  const onTransactionAdded = () => {
    refreshAll()
    setShowAddTransaction(false)
  }

  const onTransactionDeleted = () => {
    refreshAll()
  }

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        localStorage.clear()
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }, [])

  const handleTabChange = useCallback((newTab: DashboardTab) => {
    setActiveTab(newTab)

    try {
      localStorage.setItem('fintracker_active_tab', newTab)
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch (error) {
      console.warn('Failed to save active tab to localStorage:', error)
    }
  }, [])

  const handleCloseSidebar = useCallback(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const handleShowAddTransaction = useCallback(() => {
    setShowAddTransaction(true)
  }, [])

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  if (loading) {
    return <SkeletonDashboard />
  }

  return (
    <div className={`flex w-full bg-white dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 transition-colors duration-200 ${
      activeTab === 'overview' ? 'h-screen overflow-hidden' : 'min-h-screen'
    }`}>

      <Sidebar
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        availableBalance={availableBalance}
        onTabChange={handleTabChange}
        user={user}
        onLogout={handleLogout}
        onClose={handleCloseSidebar}
      />

      <div className={`flex min-w-0 flex-1 flex-col relative ${
        activeTab === 'overview' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}>

        <div className="sticky top-0 z-[60] bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-neutral-800/50 transition-colors duration-200">
          <DashboardHeader
            activeTab={activeTab as any}
            onToggleSidebar={handleToggleSidebar}
            onShowAddTransaction={handleShowAddTransaction}
            onTabChange={handleTabChange as any}
            onLogout={handleLogout}
            onOpenSettings={handleOpenSettings}
            user={user}
            isAdmin={user?.role === 'ADMIN'}
          />
        </div>

        <main
          className={`flex-1 bg-transparent relative ${
            activeTab === 'overview'
              ? 'px-4 py-4 overflow-y-auto no-scrollbar'
              : 'px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-6 overflow-y-auto'
          }`}
        >

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <OverviewTab
                  periodTxns={periodTxns}
                  summary={summary}
                  overviewPeriod={overviewPeriod}
                  onPeriodChange={setOverviewPeriod}
                  onTabChange={setActiveTab}
                  onShowAddTransaction={handleShowAddTransaction}
                  onOpenSettings={handleOpenSettings}
                />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <AnalyticsTab goals={goals} />
              </motion.div>
            )}

            {activeTab === 'goals' && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <SavingsGoalsNew
                  goals={goals}
                  availableBalance={availableBalance}
                  onRefresh={refreshAll}
                />
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 sm:gap-6"
              >
                <div className="rounded-2xl md:rounded-[28px] border border-slate-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-900/90 p-3 sm:p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.5)] dark:shadow-none sm:mb-0">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                    {/* Desktop Headers (Hidden on Mobile) */}
                    <div className="hidden sm:block">
                      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-500">Transactions</p>
                      <h3 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Dashboard</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Filter, inspect, and audit income and expense flows.</p>

                      {/* Desktop Summary Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
                        <div className="rounded-xl bg-slate-100 dark:bg-neutral-800 px-2.5 py-1.5 font-medium text-slate-700 dark:text-neutral-300">
                          {filteredSummary.count} Transactions
                        </div>

                        {advancedFilters.year && (
                          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1.5 font-medium text-blue-700 dark:text-blue-400">
                            Year: {advancedFilters.year}
                          </div>
                        )}

                        {advancedFilters.month !== undefined && (
                          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1.5 font-medium text-indigo-700 dark:text-indigo-400">
                            Month: {advancedFilters.month + 1}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Compact Controls (Txn count + Selects) */}
                    <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
                      {/* Mobile Active Date Range Label */}
                      <div className="sm:hidden flex items-center font-bold text-slate-800 dark:text-neutral-200 text-sm">
                        {!advancedFilters.year ? 'All Years' :
                          (advancedFilters.month !== undefined
                            ? `${new Date(2024, advancedFilters.month, 1).toLocaleDateString('en-US', { month: 'short' })} ${advancedFilters.year}`
                            : `Year: ${advancedFilters.year}`)}
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 flex-1 justify-end">
                        <select
                          value={advancedFilters.year || 'all'}
                          onChange={(e) => {
                            const year = e.target.value === 'all' ? undefined : parseInt(e.target.value)
                            setAdvancedFilters(prev => ({ ...prev, year, month: undefined }))
                          }}
                          className="w-full sm:w-auto min-w-[90px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-800 dark:text-neutral-200 shadow-sm transition-all focus:border-slate-300 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none appearance-none"
                        >
                          <option value="all">All Years</option>
                          {availableYears.map(year => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>

                        {advancedFilters.year && (
                          <select
                            value={advancedFilters.month !== undefined ? advancedFilters.month : 'all'}
                            onChange={(e) => {
                              const month = e.target.value === 'all' ? undefined : parseInt(e.target.value)
                              setAdvancedFilters(prev => ({ ...prev, month }))
                            }}
                            className="w-full sm:w-auto min-w-[90px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-800 dark:text-neutral-200 shadow-sm transition-all focus:border-slate-300 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none appearance-none"
                          >
                            <option value="all">All Months</option>
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i} value={i}>
                                {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' })}
                              </option>
                            ))}
                          </select>
                        )}

                        {(advancedFilters.year || advancedFilters.month !== undefined) && (
                          <button
                            onClick={() => setAdvancedFilters({})}
                            className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-neutral-700 shrink-0"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Full Card Grid */}
                  <div className="hidden sm:grid mt-5 grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-3 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Income</p>
                      <p className="mt-0.5 text-base font-black text-emerald-600 dark:text-emerald-500 truncate">{formatCurrency(filteredSummary.income)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-3 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Expense</p>
                      <p className="mt-0.5 text-base font-black text-rose-600 dark:text-rose-500 truncate">{formatCurrency(filteredSummary.expense)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-3 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Net</p>
                      <p className="mt-0.5 text-base font-black text-slate-900 dark:text-white truncate">{formatCurrency(filteredSummary.net)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-3 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Latest Entry</p>
                      <p className="mt-0.5 text-base font-black text-slate-900 dark:text-white truncate">{filteredSummary.latestDate}</p>
                    </div>
                  </div>

                  {/* Mobile: Modern segmented summary */}
                  <div className="mt-3 sm:hidden space-y-2.5">
                    {/* Income vs Expense bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400">Income</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(filteredSummary.income)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400">{formatCurrency(filteredSummary.expense)}</span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400">Expense</span>
                          <div className="h-2 w-2 rounded-full bg-rose-500" />
                        </div>
                      </div>
                      {/* Segmented bar */}
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full transition-all duration-400"
                          style={{ width: `${filteredSummary.income + filteredSummary.expense > 0 ? (filteredSummary.income / (filteredSummary.income + filteredSummary.expense)) * 100 : 50}%` }}
                        />
                        <div
                          className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-r-full transition-all duration-400"
                          style={{ width: `${filteredSummary.income + filteredSummary.expense > 0 ? (filteredSummary.expense / (filteredSummary.income + filteredSummary.expense)) * 100 : 50}%` }}
                        />
                      </div>
                    </div>
                    {/* Net + Count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Net</span>
                        <span className={`text-sm font-black ${filteredSummary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {filteredSummary.net >= 0 ? '+' : ''}{formatCurrency(filteredSummary.net)}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500">{filteredSummary.count} transactions</span>
                    </div>
                  </div>


                </div>

                <RegularTransactionList
                  selectedMonth={advancedFilters.month}
                  selectedYear={advancedFilters.year}
                  viewMode={advancedFilters.month !== undefined ? 'month' : (advancedFilters.year ? 'year' : 'all')}
                  onTransactionDeleted={onTransactionDeleted}
                  onYearChange={(year) => setAdvancedFilters(prev => ({ ...prev, year, month: undefined }))}
                  onMonthChange={(month) => setAdvancedFilters(prev => ({ ...prev, month }))}
                  availableYears={availableYears}
                />
              </motion.div>
            )}

            {activeTab === 'recurring' && (
              <motion.div
                key="recurring"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="rounded-[28px] border border-slate-200/70 dark:border-neutral-800/70 bg-white/85 dark:bg-neutral-900/90 p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.5)] dark:shadow-none backdrop-blur sm:p-6">
                  <RecurringTransactions />
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <CalendarTab />
              </motion.div>
            )}

            {activeTab === 'traveling' && (
              <motion.div
                key="traveling"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <TravelingTab />
              </motion.div>
            )}

            {activeTab === 'admin' && user?.role === 'ADMIN' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <AdminTab />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette
        onNavigate={handleTabChange}
        onAddTransaction={handleShowAddTransaction}
        onTransactionAdded={onTransactionAdded}
        isAdmin={user?.role === 'ADMIN'}
      />

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddTransaction={handleShowAddTransaction}
      />

      {showAddTransaction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 dark:bg-neutral-950/80 p-3 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
            <AddTransactionForm
              onTransactionAdded={onTransactionAdded}
              onClose={() => setShowAddTransaction(false)}
            />
          </div>
        </div>
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChange={refreshAll}
        isAdmin={user?.role === 'ADMIN'}
      />
    </div>
  )
}

export default function ModernDashboard() {
  return (
    <TourProvider>
      <ModernDashboardContent />
      <TourOverlay />
    </TourProvider>
  )
}