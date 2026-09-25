// Root dashboard shell. Manages tab routing, global state, the add-transaction
// modal, settings panel, and onboarding wizard. Lazy-loads heavy tabs via next/dynamic.
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { enhancedStaticDataManager } from '@/lib/enhanced-static-data-manager'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useNavPreferences } from '@/hooks/useNavPreferences'

import { formatCurrency } from '@/lib/financial-utils'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { useUser, useTransactionSummary, useTransactions, useGoals } from '@/hooks/useApi'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import AddEntryDispatcherModal from './AddEntryDispatcherModal'
import {
  SkeletonDashboard,
  SkeletonTransactions,
  SkeletonRecurring,
  SkeletonGoals,
  SkeletonCalendar,
  SkeletonTraveling,
  SkeletonAnalytics
} from './ui/SkeletonCard'

const RegularTransactionList = dynamic(() => import('./RegularTransactionList'), { ssr: false, loading: () => <SkeletonTransactions /> })
const RecurringTransactions = dynamic(() => import('./RecurringTransactions'), { ssr: false, loading: () => <SkeletonRecurring /> })
const SavingsGoalsNew = dynamic(() => import('./SavingsGoalsNew'), { ssr: false, loading: () => <SkeletonGoals /> })
const TravelingTab = dynamic(() => import('./TravelingTab'), { ssr: false, loading: () => <SkeletonTraveling /> })
const SettingsPanel = dynamic(() => import('./SettingsPanel').then(mod => mod.SettingsPanel), { ssr: false })
const CalendarTab = dynamic(() => import('./CalendarTab'), { ssr: false, loading: () => <SkeletonCalendar /> })
const AdminTab = dynamic(() => import('./dashboard/AdminTab'), { ssr: false })

import BottomNav from './dashboard/BottomNav'

import { TourProvider, useTour } from './tour/TourContext'
import { TourOverlay } from './tour/TourOverlay'
import Sidebar from './dashboard/Sidebar'
import DashboardHeader from './dashboard/DashboardHeader'
import OverviewTab from './dashboard/OverviewTab'
import CustomSelect from '@/components/ui/CustomSelect'
const AnalyticsTab = dynamic(() => import('./analytics/AnalyticsTab'), { ssr: false, loading: () => <SkeletonAnalytics /> })


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
  title?: string
  description?: string | null
  notes?: string | null
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
  'transactions',
  'analytics',
  'recurring',
  'goals',
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

    const latestTx = periodTxns?.[0]
    const latestDate = latestTx
      ? formatDateForDisplay(latestTx.date, '—')
      : '—'

    return {
      income: source?.income || 0,
      expense: source?.expense || 0,
      net: source?.balance || 0,
      categories: 0,
      latestDate,
      count: source?.count || 0
    }
  }, [txSummary, summary, advancedFilters, periodTxns])

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
    return <SkeletonDashboard activeTab={activeTab} />
  }

  return (
    <div className={`flex w-full bg-white dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 ${activeTab === 'overview' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}>

      <Sidebar
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        availableBalance={availableBalance}
        onTabChange={handleTabChange}
        user={user}
        onLogout={handleLogout}
        onClose={handleCloseSidebar}
        onQuickAdd={handleShowAddTransaction}
      />

      <div className={`flex min-w-0 flex-1 flex-col relative overflow-x-hidden ${activeTab === 'overview' ? 'h-[100dvh] md:h-screen overflow-hidden' : 'min-h-[100dvh]'
        }`}>

        <div className="sticky top-0 z-[60]">
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
          className={`flex-1 bg-transparent relative px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4 pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 overflow-y-auto overflow-x-hidden ${activeTab === 'overview' ? 'no-scrollbar' : 'custom-scrollbar'
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
                className="w-full min-w-0"
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
                className="w-full min-w-0"
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
                className="w-full min-w-0"
              >
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
                className="w-full min-w-0"
              >
                <RecurringTransactions />
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full min-w-0"
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
                className="w-full min-w-0"
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
                className="w-full min-w-0 overflow-x-hidden"
              >
                <AdminTab />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddTransaction={handleShowAddTransaction}
      />

      <AddEntryDispatcherModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={onTransactionAdded}
      />

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