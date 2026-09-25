'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Layers, PieChart as PieChartIcon, Clock } from 'lucide-react'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import MonthlyInsights from './MonthlyInsights'
import OverviewHero from './overview/OverviewHero'
import CategoryBudgetList from './overview/CategoryBudgetList'
import CategoryDonutCard from './overview/CategoryDonutCard'
import RecentActivityCard from './overview/RecentActivityCard'
import CategoryDetailDrawer from './overview/CategoryDetailDrawer'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  paymentMethod: string | null
  source: string | null
  date: string
}

interface OverviewPeriod {
  year: number
  month?: number
}

interface OverviewTabProps {
  periodTxns: Transaction[]
  summary: Record<string, any>
  overviewPeriod: OverviewPeriod
  onPeriodChange: (period: OverviewPeriod) => void
  onTabChange: (tab: 'overview' | 'analytics' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'admin') => void
  onShowAddTransaction: () => void
  onOpenSettings: () => void
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default React.memo(function OverviewTab({
  periodTxns,
  summary,
  overviewPeriod,
  onPeriodChange,
  onTabChange,
  onShowAddTransaction,
  onOpenSettings
}: OverviewTabProps) {
  const { data: staticData } = useEnhancedStaticData()
  const now = new Date()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const activeYear = overviewPeriod.year
  const activeMonth = overviewPeriod.month ?? (now.getMonth() + 1)
  const isAllYear = overviewPeriod.month === undefined

  const daysInMonth = new Date(activeYear, activeMonth, 0).getDate()
  const dayOfMonth = overviewPeriod.month === (now.getMonth() + 1) && activeYear === now.getFullYear()
    ? now.getDate()
    : daysInMonth
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100)

  const categorySpend = (summary?.categorySpend || {}) as Record<string, number>

  const budgetRows = useMemo(() => {
    return staticData.budgetAmounts
      .filter(b => b.isActive && !['travelSettings', 'global'].includes(b.category))
      .map(b => {
        const spent = categorySpend[b.category] || 0
        const limit = isAllYear
          ? (b.period === 'yearly' ? b.amount : b.amount * 12)
          : (b.period === 'yearly' ? b.amount / 12 : b.amount)
        const pct = limit > 0 ? (spent / limit) * 100 : 0
        const remaining = limit - spent
        const status: 'over' | 'warn' | 'ok' | 'safe' =
          pct >= 100 ? 'over' : pct >= 80 ? 'warn' : pct >= 50 ? 'ok' : 'safe'
        return { ...b, spent, limit, pct, remaining, status }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [staticData.budgetAmounts, categorySpend, isAllYear])

  const totalBudgeted = budgetRows.reduce((s, r) => s + r.limit, 0)
  const totalSpentOnBudgeted = budgetRows.reduce((s, r) => s + r.spent, 0)
  const overallBudgetPct = totalBudgeted > 0 ? (totalSpentOnBudgeted / totalBudgeted) * 100 : 0

  const balanceInfo = {
    periodIncome:   isAllYear ? (summary?.year?.income   || 0) : (summary?.period?.income  || 0),
    periodExpenses: isAllYear ? (summary?.year?.expense  || 0) : (summary?.period?.expense || 0),
    periodBalance:  isAllYear ? (summary?.year?.balance  || 0) : (summary?.period?.balance || 0),
  }

  const savingsRate = balanceInfo.periodIncome > 0
    ? Math.round((balanceInfo.periodBalance / balanceInfo.periodIncome) * 100)
    : 0

  const availableYears = (summary?.availableYears || [now.getFullYear()]) as number[]

  const [showInsights, setShowInsights] = useState(false)
  const [expandedBudgetCat, setExpandedBudgetCat] = useState<string | null>(null)
  const [budgetCatTxns, setBudgetCatTxns] = useState<Record<string, any[]>>({})
  const [loadingBudgetCat, setLoadingBudgetCat] = useState<string | null>(null)

  // Mobile focused view tab: 'budgets' | 'breakdown' | 'activity'
  const [mobileTab, setMobileTab] = useState<'budgets' | 'breakdown' | 'activity'>('budgets')

  const handleBudgetCatClick = useCallback(async (category: string) => {
    if (expandedBudgetCat === category) {
      setExpandedBudgetCat(null)
      return
    }
    setExpandedBudgetCat(category)
    if (budgetCatTxns[category]) return
    setLoadingBudgetCat(category)
    try {
      let url = `/api/transactions?category=${encodeURIComponent(category)}&type=expense&limit=100`
      if (isAllYear) {
        url += `&year=${activeYear}`
      } else {
        url += `&month=${activeMonth}&year=${activeYear}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setBudgetCatTxns(prev => ({ ...prev, [category]: data.transactions || [] }))
      }
    } catch {
      setBudgetCatTxns(prev => ({ ...prev, [category]: [] }))
    } finally {
      setLoadingBudgetCat(null)
    }
  }, [expandedBudgetCat, budgetCatTxns, isAllYear, activeYear, activeMonth])

  useEffect(() => {
    setExpandedBudgetCat(null)
    setBudgetCatTxns({})
  }, [activeMonth, activeYear, isAllYear])

  const selectedCategoryRow = budgetRows.find(r => r.category === expandedBudgetCat)

  // Identify high-priority attention alerts (e.g. over budget items)
  const overBudgetItems = useMemo(() => budgetRows.filter(r => r.status === 'over'), [budgetRows])
  const overBudgetDelta = useMemo(() => overBudgetItems.reduce((s, i) => s + (i.spent - i.limit), 0), [overBudgetItems])

  return (
    <div className="space-y-2.5 pb-16 md:pb-0 font-sans">
      {/* 1. Main Executive Command Center Hero (Ultra-Compact) */}
      <OverviewHero
        balanceInfo={balanceInfo}
        totalBudgeted={totalBudgeted}
        totalSpentOnBudgeted={totalSpentOnBudgeted}
        overallBudgetPct={overallBudgetPct}
        savingsRate={savingsRate}
        isAllYear={isAllYear}
        monthProgress={monthProgress}
        overviewPeriod={overviewPeriod}
        activeYear={activeYear}
        activeMonth={activeMonth}
        availableYears={availableYears}
        monthNames={MONTH_NAMES}
        onPeriodChange={onPeriodChange}
        onShowAddTransaction={onShowAddTransaction}
        overBudgetCount={overBudgetItems.length}
        overBudgetDelta={overBudgetDelta}
        onInspectAlert={() => {
          if (overBudgetItems.length > 0) {
            handleBudgetCatClick(overBudgetItems[0].category)
          }
        }}
      />

      {/* 2. Mobile View Switcher (Only visible below lg breakpoint) */}
      <div className="flex lg:hidden items-center bg-slate-100 dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('budgets')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'budgets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Budgets</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('breakdown')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'breakdown'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChartIcon className="h-3.5 w-3.5" />
          <span>Breakdown</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('activity')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'activity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Activity</span>
        </button>
      </div>

      {/* 3. Balanced Cockpit: Left 58% (Budgets) + Right 42% (Stacked Distribution & Activity) on Desktop (lg+) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Wing: Category Budgets (lg:col-span-7) */}
        <div className={`min-w-0 flex flex-col ${mobileTab !== 'budgets' ? 'hidden lg:flex' : 'flex'} lg:col-span-7`}>
          <CategoryBudgetList
            budgetRows={budgetRows}
            isAllYear={isAllYear}
            onCategoryClick={handleBudgetCatClick}
            onOpenSettings={onOpenSettings}
          />
        </div>

        {/* Right Wing: Stacked Expense Distribution & Recent Activity (lg:col-span-5) */}
        <div className={`min-w-0 flex flex-col gap-3.5 lg:col-span-5 ${mobileTab === 'budgets' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Expense Distribution Donut */}
          <div className={`min-w-0 flex flex-col ${mobileTab !== 'breakdown' ? 'hidden lg:flex' : 'flex'}`}>
            <CategoryDonutCard
              budgetRows={budgetRows}
              isAllYear={isAllYear}
            />
          </div>

          {/* Recent Activity with Embedded Insights Trigger */}
          <div className={`min-w-0 flex flex-col ${mobileTab !== 'activity' ? 'hidden lg:flex' : 'flex'}`}>
            <RecentActivityCard
              periodTxns={periodTxns}
              onViewAll={() => onTabChange('transactions')}
              onOpenInsights={() => setShowInsights(true)}
              isAllYear={isAllYear}
              activeYear={activeYear}
              monthName={MONTH_NAMES[activeMonth - 1]}
            />
          </div>
        </div>
      </div>

      {/* Slide-over Detail Drawers (Slide from right without vertical page disruption) */}
      <CategoryDetailDrawer
        category={expandedBudgetCat}
        row={selectedCategoryRow}
        txns={expandedBudgetCat ? budgetCatTxns[expandedBudgetCat] || [] : []}
        loading={Boolean(loadingBudgetCat)}
        isAllYear={isAllYear}
        activeYear={activeYear}
        monthName={MONTH_NAMES[activeMonth - 1]}
        onClose={() => setExpandedBudgetCat(null)}
      />

      <MonthlyInsights
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        period={isAllYear ? 'year' : 'month'}
        month={activeMonth}
        year={activeYear}
        isAllYear={isAllYear}
        periodTxns={periodTxns}
        categorySpend={categorySpend}
        prevExpense={summary?.prevExpense || 0}
        onOpenCategoryDetail={handleBudgetCatClick}
      />
    </div>
  )
})
