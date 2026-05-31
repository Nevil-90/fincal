'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { enhancedStaticDataManager } from '@/lib/enhanced-static-data-manager'
import { useScrollLock } from '@/hooks/useScrollLock'

import { formatCurrency } from '@/lib/financial-utils'
import { useUser, useTransactionSummary, useTransactions, useGoals } from '@/hooks/useApi'
import dynamic from 'next/dynamic'
import AddTransactionForm from './AddTransactionForm'
import RegularTransactionList from './RegularTransactionList'
import RecurringTransactions from './RecurringTransactions'
const SavingsGoalsNew = dynamic(() => import('./SavingsGoalsNew'), { ssr: false })
const TravelingTab = dynamic(() => import('./TravelingTab'), { ssr: false })
const SettingsPanel = dynamic(() => import('./SettingsPanel').then(mod => mod.SettingsPanel), { ssr: false })
const CalendarTab = dynamic(() => import('./CalendarTab'), { ssr: false })
const AdminTab = dynamic(() => import('./dashboard/AdminTab'), { ssr: false })
import OnboardingWizard from './OnboardingWizard'
import BottomNav from './dashboard/BottomNav'

import Sidebar from './dashboard/Sidebar'
import DashboardHeader from './dashboard/DashboardHeader'
import OverviewTab from './dashboard/OverviewTab'
const AnalyticsTab = dynamic(() => import('./analytics/AnalyticsTab'), { ssr: false, loading: () => <div className="animate-pulse bg-slate-100 rounded-2xl h-[400px] w-full" /> })
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
  | 'settings'
  | 'admin'

const DASHBOARD_TABS: DashboardTab[] = [
  'overview',
  'analytics',
  'transactions',
  'goals',
  'recurring',
  'calendar',
  'traveling',
  'settings',
  'admin'
]


export default function ModernDashboard() {
  const { user, isLoading: isLoadingUser } = useUser()
  const [overviewPeriod, setOverviewPeriod] = useState<{
    year: number
    month?: number
  }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  
  const { summary, isLoading: loadingSummary, mutate: mutateSummary } = useTransactionSummary(overviewPeriod.month, overviewPeriod.year)
  const { transactions: periodTxns, mutate: mutatePeriodTxns } = useTransactions(1, 10, { month: overviewPeriod.month, year: overviewPeriod.year })
  
  // For the transactions tab
  const [advancedFilters, setAdvancedFilters] = useState<{
    year?: number
    month?: number
    category?: string
    type?: 'income' | 'expense'
  }>({})

  const { summary: txSummary, isLoading: loadingTxSummary } = useTransactionSummary(
    advancedFilters.month !== undefined ? advancedFilters.month + 1 : undefined,
    advancedFilters.year
  )

  const { goals, isLoading: isLoadingGoals, mutate: mutateGoals } = useGoals()
  
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  const loading = loadingSummary || loadingTxSummary || isLoadingUser || isLoadingGoals

  useScrollLock(showAddTransaction || showOnboarding)

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  useEffect(() => {
    const savedTab = localStorage.getItem('fintracker_active_tab')
    if (savedTab && DASHBOARD_TABS.includes(savedTab as DashboardTab)) {
      setActiveTab(savedTab as DashboardTab)
    }
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const filteredSummary = useMemo(() => {
    // Determine the summary data source based on if filters are applied
    const source = (advancedFilters.month !== undefined || advancedFilters.year !== undefined) 
      ? txSummary?.period 
      : txSummary?.global

    return {
      income: source?.income || 0,
      expense: source?.expense || 0,
      net: source?.balance || 0,
      categories: 0, // Cannot easily compute without full dataset, not critical for summary
      latestDate: '—', // Or fetch a single latest transaction
      count: source?.count || 0
    }
  }, [txSummary, advancedFilters])

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
  const availableYears = (summary?.availableYears || [new Date().getFullYear()]) as number[]

  useEffect(() => {
    if (user && !user.hasCompletedOnboarding) {
      setShowOnboarding(true)
    }
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
    // Only subscribe to static data changes for relevant dashboard updates,
    // we don't need to fetch goals on every setting change.
    const unsubscribe = enhancedStaticDataManager.subscribe(() => {
      // Intentionally left empty or handle specific static data changes if needed
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshAll = async () => {
    // Refresh goals or summary if needed
    mutateSummary()
    mutatePeriodTxns()
    mutateGoals()
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
    return (
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <div className="hidden md:flex w-64 shrink-0 bg-white border-r border-slate-200 animate-pulse" />
        <div className="flex-1 overflow-hidden">
          <SkeletonDashboard />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-white text-slate-900">
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        availableBalance={availableBalance}
        onTabChange={handleTabChange}
        user={user}
        onLogout={handleLogout}
        onClose={handleCloseSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col min-h-screen relative">
        <div className="sticky top-0 z-[60] bg-white">
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

        <main className="flex-1 bg-transparent px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <OverviewTab
                periodTxns={periodTxns}
                summary={summary}
                overviewPeriod={overviewPeriod}
                onPeriodChange={setOverviewPeriod}
                onTabChange={setActiveTab}
                onShowAddTransaction={handleShowAddTransaction}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsTab goals={goals} />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <SavingsGoalsNew
                goals={goals}
                availableBalance={availableBalance}
                onRefresh={refreshAll}
              />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="rounded-2xl md:rounded-[28px] border border-slate-200/70 bg-white/90 p-4 sm:p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.5)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blue-600">Transactions</p>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">Ledger Command Center</h3>
                    <p className="mt-1 text-sm text-slate-500">Filter, inspect, and audit income and expense flows.</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <div className="rounded-xl bg-slate-100 px-2.5 py-1.5 font-medium text-slate-700">
                        {filteredSummary.count} Transactions
                      </div>

                      {advancedFilters.year && (
                        <div className="rounded-xl bg-blue-50 px-2.5 py-1.5 font-medium text-blue-700">
                          Year: {advancedFilters.year}
                        </div>
                      )}

                      {advancedFilters.month !== undefined && (
                        <div className="rounded-xl bg-indigo-50 px-2.5 py-1.5 font-medium text-indigo-700">
                          Month: {advancedFilters.month + 1}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 lg:mt-0 w-full lg:w-auto">
                    <select
                      value={advancedFilters.year || 'all'}
                      onChange={(e) => {
                        const year = e.target.value === 'all' ? undefined : parseInt(e.target.value)
                        setAdvancedFilters(prev => ({ ...prev, year, month: undefined }))
                      }}
                      className="flex-1 lg:flex-initial min-w-[110px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition-all focus:border-slate-300 focus:bg-white focus:outline-none"
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
                        className="flex-1 lg:flex-initial min-w-[110px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition-all focus:border-slate-300 focus:bg-white focus:outline-none"
                      >
                        <option value="all">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>
                            {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    )}

                    {(advancedFilters.year || advancedFilters.month !== undefined) && (
                      <button
                        onClick={() => setAdvancedFilters({})}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Income</p>
                    <p className="mt-0.5 text-base font-black text-emerald-600">{formatCurrency(filteredSummary.income)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expense</p>
                    <p className="mt-0.5 text-base font-black text-rose-600">{formatCurrency(filteredSummary.expense)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net</p>
                    <p className="mt-0.5 text-base font-black text-slate-900">{formatCurrency(filteredSummary.net)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Latest Entry</p>
                    <p className="mt-0.5 text-base font-black text-slate-900 truncate">{filteredSummary.latestDate}</p>
                  </div>
                </div>
              </div>

              <RegularTransactionList
                selectedMonth={advancedFilters.month}
                selectedYear={advancedFilters.year}
                viewMode={advancedFilters.month !== undefined ? 'month' : (advancedFilters.year ? 'year' : 'all')}
                onTransactionDeleted={onTransactionDeleted}
              />
            </div>
          )}

          {activeTab === 'recurring' && (
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.5)] backdrop-blur sm:p-6">
                <RecurringTransactions />
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <CalendarTab />
            </div>
          )}

          {activeTab === 'traveling' && (
            <div className="space-y-6">
              <TravelingTab />
            </div>
          )}

          {activeTab === 'admin' && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <AdminTab />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddTransaction={handleShowAddTransaction}
      />

      {showAddTransaction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-3 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
            <AddTransactionForm
              onTransactionAdded={onTransactionAdded}
              onClose={() => setShowAddTransaction(false)}
            />
          </div>
        </div>
      )}

      {/* Global Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChange={refreshAll}
        isAdmin={user?.role === 'ADMIN'}
      />

      {/* Onboarding Wizard - shown only once per user (server-tracked) */}
      {showOnboarding && user && (
        <OnboardingWizard
          user={user as any}
          onComplete={() => {
            setShowOnboarding(false)
            refreshAll()
          }}
        />
      )}
    </div>
  )
}