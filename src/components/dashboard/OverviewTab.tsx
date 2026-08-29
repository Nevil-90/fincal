'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { BarChart3, X } from 'lucide-react'
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

  return (
    <div className="space-y-3 pb-16 md:pb-0 font-sans">
      {/* Main Executive Grid: Begins immediately at the top with Hero Card */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3">
        {/* Left Column: Hero Balance Card + Spacious Category Budgets */}
        <div className="space-y-3 sm:space-y-4 min-w-0">
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
          />

          <CategoryBudgetList
            budgetRows={budgetRows}
            isAllYear={isAllYear}
            onCategoryClick={handleBudgetCatClick}
            onOpenSettings={onOpenSettings}
          />
        </div>

        {/* Right Column: Spending Breakdown Donut + Recent Activity + Insights Launcher */}
        <div className="space-y-3 sm:space-y-4 min-w-0">
          <CategoryDonutCard
            budgetRows={budgetRows}
            isAllYear={isAllYear}
          />

          <RecentActivityCard
            periodTxns={periodTxns}
            onViewAll={() => onTabChange('transactions')}
          />

          {/* Insights Report Launcher */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInsights(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 dark:hover:bg-neutral-800/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {isAllYear ? `${activeYear} Annual Report` : `${MONTH_NAMES[activeMonth - 1]} ${activeYear} Report`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                  View health score and spending patterns.
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 px-3 py-1 rounded-xl shrink-0">
                View →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Insights Slide-over Drawer */}
      {mounted && showInsights && createPortal(
        <div className="fixed inset-0 z-[500] flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/50 dark:bg-black/85 backdrop-blur-sm transition-opacity"
            onClick={() => setShowInsights(false)}
          />
          <div
            className="relative w-full max-w-md bg-white dark:bg-neutral-950 shadow-2xl h-full flex flex-col sm:rounded-l-2xl overflow-hidden border-l border-slate-200 dark:border-neutral-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200/80 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900 shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isAllYear ? `${activeYear} Annual Insights` : `${MONTH_NAMES[activeMonth - 1]} ${activeYear} Insights`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInsights(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <MonthlyInsights
                periodTxns={periodTxns}
                categorySpend={categorySpend}
                prevExpense={summary?.period?.prevExpense || 0}
                month={activeMonth}
                year={activeYear}
                isAllYear={isAllYear}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Category Drilldown Drawer */}
      {mounted && expandedBudgetCat && (
        <CategoryDetailDrawer
          category={expandedBudgetCat}
          row={selectedCategoryRow}
          txns={budgetCatTxns[expandedBudgetCat] || []}
          loading={loadingBudgetCat === expandedBudgetCat}
          isAllYear={isAllYear}
          activeYear={activeYear}
          monthName={MONTH_NAMES[activeMonth - 1]}
          onClose={() => setExpandedBudgetCat(null)}
        />
      )}
    </div>
  )
})
