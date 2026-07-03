// Budget command center component visualizing monthly progress,
// category-specific budget limits vs actuals, and insights/burn-rate.
'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Plus, BarChart2, BarChart3, Calendar, Target, AlertCircle, TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, ArrowRight, ArrowUpRight, ArrowDownRight, ArrowDownLeft, Activity, PieChart, ShieldAlert, Zap, AlertTriangle, CheckCircle, ClipboardList, Banknote, Clock, Sparkles, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Receipt } from 'lucide-react'
import { formatCurrency, formatCompactCurrency, formatCompactNumber } from '@/lib/financial-utils'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { useUser } from '@/hooks/useApi'
import MonthlyInsights from './MonthlyInsights'

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

interface BalanceInfo {
  periodIncome: number
  periodExpenses: number
  periodBalance: number
  totalBalance: number
  transactionCount: number
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

const SpendGauge = React.memo(function SpendGauge({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100)
  const r = 66
  const circ = 2 * Math.PI * r
  const stroke = circ * (1 - clamped / 100)
  const color = clamped >= 100 ? '#ef4444' : clamped >= 80 ? '#f97316' : clamped >= 60 ? '#eab308' : '#22c55e'
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0 drop-shadow-sm">
      <circle cx="80" cy="80" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      <circle
        cx="80" cy="80" r={r} fill="none"
        stroke={color} strokeWidth="14"
        strokeDasharray={circ}
        strokeDashoffset={stroke}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
      />
      <text x="80" y="74" textAnchor="middle" fontSize="24" fontWeight="900" className="fill-slate-900 dark:fill-white">{Math.round(clamped)}%</text>
      <text x="80" y="96" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-slate-400 dark:fill-neutral-400">of budget</text>
    </svg>
  )
})

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

  const daysInMonth = new Date(activeYear, activeMonth, 0).getDate()
  const dayOfMonth = overviewPeriod.month === (now.getMonth() + 1) && activeYear === now.getFullYear()
    ? now.getDate()
    : daysInMonth
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100)

  const categorySpend = (summary?.categorySpend || {}) as Record<string, number>

  const isAllYear = overviewPeriod.month === undefined

  const budgetRows = useMemo(() => {
    return staticData.budgetAmounts
      .filter(b => b.isActive && !['travelSettings', 'global'].includes(b.category))
      .map(b => {
        const spent = categorySpend[b.category] || 0
        // All Year view: use full yearly amount; monthly view: monthly amount
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
  const overCount = budgetRows.filter(r => r.status === 'over').length
  const warnCount = budgetRows.filter(r => r.status === 'warn').length

  const unbudgetedSpend = useMemo(() => {
    const budgetedCats = new Set(staticData.budgetAmounts.filter(b => b.isActive).map(b => b.category))
    return Object.entries(categorySpend)
      .filter(([cat]) => !budgetedCats.has(cat))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [categorySpend, staticData.budgetAmounts])

  const balanceInfo = {
    periodIncome: summary?.period?.income || 0,
    periodExpenses: summary?.period?.expense || 0,
    periodBalance: summary?.period?.balance || 0,
  }

  const savingsRate = balanceInfo.periodIncome > 0
    ? Math.round((balanceInfo.periodBalance / balanceInfo.periodIncome) * 100)
    : 0

  // For All Year mode: use months elapsed in the year for burn rate calc
  const monthsElapsed = isAllYear
    ? (activeYear === now.getFullYear() ? now.getMonth() + 1 : 12)
    : 1
  const daysElapsed = isAllYear
    ? (activeYear === now.getFullYear() ? Math.floor((now.getTime() - new Date(activeYear, 0, 1).getTime()) / 86400000) + 1 : 365)
    : dayOfMonth
  const daysInPeriod = isAllYear ? (activeYear === now.getFullYear() ? 365 : 365) : daysInMonth

  const actualDailyBurn = daysElapsed > 0 ? balanceInfo.periodExpenses / daysElapsed : 0
  const expectedDailyBurn = daysInPeriod > 0 ? totalBudgeted / daysInPeriod : 0
  // All Year: show avg monthly burn instead of daily
  const actualMonthlyBurn = monthsElapsed > 0 ? balanceInfo.periodExpenses / monthsElapsed : 0
  const expectedMonthlyBurn = 12 > 0 ? totalBudgeted / 12 : 0

  const monthlySpendingGoal = Number(staticData.userSettings?.monthlySpendingGoal) || 0
  // In All Year mode, annual goal = monthlySpendingGoal * 12
  const periodSpendingGoal = isAllYear ? monthlySpendingGoal * 12 : monthlySpendingGoal
  const monthlySpendingGoalPct = periodSpendingGoal > 0 ? (balanceInfo.periodExpenses / periodSpendingGoal) * 100 : 0
  const monthlySpendingGoalStatus = monthlySpendingGoalPct >= 100 ? 'over' : monthlySpendingGoalPct >= 80 ? 'warn' : monthlySpendingGoalPct >= 50 ? 'ok' : 'safe'

  const availableYears = (summary?.availableYears || [now.getFullYear()]) as number[]

  const STATUS_CONFIG = {
    over: { bar: 'bg-red-500', label: 'Over budget', badge: 'bg-red-50 dark:bg-red-900/20  text-red-700 dark:text-red-400  border-red-200' },
    warn: { bar: 'bg-orange-500', label: 'Near limit', badge: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200' },
    ok: { bar: 'bg-yellow-400', label: 'On track', badge: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200' },
    safe: { bar: 'bg-emerald-500', label: 'Under control', badge: 'bg-emerald-50 dark:bg-emerald-900/20  text-emerald-700 dark:text-emerald-400  border-emerald-200' },
  }

  const [showInsights, setShowInsights] = useState(false)

  // Category drill-down state for Budget Breakdown
  const [expandedBudgetCat, setExpandedBudgetCat] = useState<string | null>(null)
  const [budgetCatTxns, setBudgetCatTxns] = useState<Record<string, any[]>>({})
  const [loadingBudgetCat, setLoadingBudgetCat] = useState<string | null>(null)

  const handleBudgetCatClick = useCallback(async (category: string) => {
    if (expandedBudgetCat === category) {
      setExpandedBudgetCat(null)
      return
    }
    setExpandedBudgetCat(category)
    if (budgetCatTxns[category]) return // already cached
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

  // Reset drill-down when period changes
  useEffect(() => {
    setExpandedBudgetCat(null)
    setBudgetCatTxns({})
  }, [activeMonth, activeYear, isAllYear])

  const [rolloverAmount, setRolloverAmount] = useState(0)

  const fetchRollover = useCallback(async () => {
    try {
      const res = await fetch(`/api/budgets/rollover?month=${activeMonth}&year=${activeYear}`)
      if (res.ok) {
        const data = await res.json()
        setRolloverAmount(data.carryOver || 0)
      }
    } catch (err) {
      console.error('Failed to fetch rollover', err)
    }
  }, [activeMonth, activeYear])

  const rolloverCalculatedRef = useRef<string | null>(null)
  const thisMonthKey = `${activeMonth}-${activeYear}`
  const { user } = useUser()
  const isTourActive = user && !user.hasCompletedOnboarding

  useEffect(() => {
    if (isTourActive) return
    if (rolloverCalculatedRef.current === thisMonthKey) return // already done
    rolloverCalculatedRef.current = thisMonthKey

    fetch('/api/budgets/rollover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: activeMonth, year: activeYear })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.carryOver !== undefined) {
          setRolloverAmount(data.carryOver)
        }
      })
      .catch(err => console.error('Failed to calculate rollover', err))
  }, [activeMonth, activeYear, thisMonthKey])

  const carryOver = rolloverAmount

  const getDynamicInsight = () => {
    if (overallBudgetPct >= 100) {
      return {
        icon: AlertTriangle,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50',
        text: `You've exceeded your total budget by ${formatCurrency(totalSpentOnBudgeted - totalBudgeted)}. Consider adjusting your limits or tightening spending.`
      }
    }
    if (monthProgress < 100 && overallBudgetPct > monthProgress + 15) {
      return {
        icon: TrendingUp,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50',
        text: `Your spending is outpacing the month. You've used ${Math.round(overallBudgetPct)}% of your budget, but we're only ${monthProgress}% through the month.`
      }
    }
    if (savingsRate >= 20) {
      return {
        icon: Sparkles,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50',
        text: `Excellent! You're saving ${savingsRate}% of your income this period. You're building solid financial habits.`
      }
    }
    return {
      icon: CheckCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50',
      text: `You're on track. Spending is balanced and within your planned limits for this period.`
    }
  }

  const insight = getDynamicInsight()
  const InsightIcon = insight.icon

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 md:pb-6">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white ">Budget Overview</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400  mt-0.5">Track real spending against your budget limits in real time.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">

          {/* ── Month navigator with arrow buttons ── */}
          <div className="flex items-center bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-sm h-9">
            <button
              onClick={() => {
                const prev = activeMonth === 1 ? 12 : activeMonth - 1
                const prevYear = activeMonth === 1 ? activeYear - 1 : activeYear
                onPeriodChange({ year: prevYear, month: prev })
              }}
              className="px-2 h-full flex items-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Clickable label backed by hidden <select> */}
            <div className="relative flex items-center px-1">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 min-w-[60px] text-center select-none pointer-events-none">
                {MONTH_NAMES[activeMonth - 1]}
              </span>
              <select
                value={activeMonth}
                onChange={e => onPeriodChange({ year: activeYear, month: Number(e.target.value) })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Pick month"
              >
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>

            <button
              onClick={() => {
                const next = activeMonth === 12 ? 1 : activeMonth + 1
                const nextYear = activeMonth === 12 ? activeYear + 1 : activeYear
                onPeriodChange({ year: nextYear, month: next })
              }}
              className="px-2 h-full flex items-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* ── Year pill with hidden select ── */}
          <div className="relative flex items-center h-9 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-sm px-3">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 select-none pointer-events-none">
              {activeYear}
            </span>
            <select
              value={activeYear}
              onChange={e => onPeriodChange({ year: Number(e.target.value), month: overviewPeriod.month })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Pick year"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* ── All Year toggle ── */}
          <button
            onClick={() => onPeriodChange(
              overviewPeriod.month === undefined
                ? { year: activeYear, month: now.getMonth() + 1 }
                : { year: activeYear, month: undefined }
            )}
            className={`h-9 px-3.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer shadow-sm ${overviewPeriod.month === undefined
              ? 'bg-slate-900 dark:bg-blue-600 text-white border-transparent'
              : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700'
              }`}
          >
            All Year
          </button>

          <button
            onClick={onShowAddTransaction}
            className="flex items-center gap-1.5 bg-slate-900 dark:bg-neutral-700 text-white text-xs font-bold px-3.5 h-9 rounded-xl cursor-pointer hover:bg-slate-800 dark:hover:bg-neutral-600 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Dynamic Actionable Insight */}
      {/* <div className={`flex items-start gap-3 p-3.5 rounded-2xl border ${insight.bg} transition-colors animate-fade-in`}>
        <InsightIcon className={`h-5 w-5 shrink-0 ${insight.color} mt-0.5`} />
        <div>
          <h4 className={`text-xs font-bold ${insight.color}`}>Smart Insight</h4>
          <p className="text-sm font-medium text-slate-700 dark:text-neutral-300 mt-0.5">{insight.text}</p>
        </div>
      </div> */}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 sm:gap-5">

        <div className="space-y-4 sm:space-y-5 min-w-0">

          <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80  bg-white dark:bg-neutral-800 p-4 sm:p-5 shadow-sm" data-tour="overview-stats">

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                <SpendGauge pct={overallBudgetPct} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Overall {isAllYear ? 'Annual' : 'Monthly'} Budget Usage</p>
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 pr-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 break-words">{isAllYear ? 'Year Progress' : 'Month Progress'}</span>
                    </div>
                    {isAllYear
                      ? <span className="text-xs font-black text-slate-700 dark:text-neutral-300 shrink-0">Month {monthsElapsed} / 12</span>
                      : <span className="text-xs font-black text-slate-700 dark:text-neutral-300 shrink-0">Day {dayOfMonth} / {daysInMonth}</span>
                    }
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 dark:bg-neutral-500 rounded-full transition-all duration-700"
                      style={{ width: isAllYear ? `${Math.round((monthsElapsed / 12) * 100)}%` : `${monthProgress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 p-3">
                    <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">{isAllYear ? 'Annual Spent' : 'Spent'}</p>
                    <p className="text-base font-black text-rose-700 dark:text-rose-400 mt-0.5 tabular-nums truncate" title={formatCurrency(balanceInfo.periodExpenses)}>{formatCompactCurrency(balanceInfo.periodExpenses)}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-3">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{isAllYear ? 'Annual Income' : 'Income'}</p>
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums truncate" title={formatCurrency(balanceInfo.periodIncome)}>{formatCompactCurrency(balanceInfo.periodIncome)}</p>
                  </div>
                  {!isAllYear && (
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-3">
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Rollover</p>
                      <p className="text-base font-black text-blue-700 dark:text-blue-400 mt-0.5 tabular-nums truncate" title={`+${formatCurrency(carryOver)}`}>+{formatCompactCurrency(carryOver)}</p>
                    </div>
                  )}
                  {isAllYear ? (
                    <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/50 p-3">
                      <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Avg/Month</p>
                      <p className="text-base font-black text-violet-700 dark:text-violet-400 mt-0.5 tabular-nums truncate" title={formatCurrency(actualMonthlyBurn)}>{formatCompactCurrency(actualMonthlyBurn)}</p>
                      {expectedMonthlyBurn > 0 && (
                        <p className={`text-[10px] font-bold mt-0.5 truncate ${actualMonthlyBurn > expectedMonthlyBurn ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {actualMonthlyBurn > expectedMonthlyBurn ? '▲' : '▼'} Budgeted: {formatCompactCurrency(expectedMonthlyBurn)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-600 p-3">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Daily Burn</p>
                      <p className="text-base font-black text-slate-800 dark:text-neutral-200 mt-0.5 tabular-nums truncate" title={`${formatCurrency(actualDailyBurn)}/d`}>{formatCompactCurrency(actualDailyBurn)}/d</p>
                      {expectedDailyBurn > 0 && (
                        <p className={`text-[10px] font-bold mt-0.5 truncate ${actualDailyBurn > expectedDailyBurn ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} title={`Budget: ${formatCurrency(expectedDailyBurn)}/d`}>
                          {actualDailyBurn > expectedDailyBurn ? '▲' : '▼'} Budget: {formatCompactCurrency(expectedDailyBurn)}/d
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {(overCount > 0 || warnCount > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {overCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 dark:bg-red-900/20  text-red-700 dark:text-red-400  border border-red-200 px-2.5 py-1 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> {overCount} over budget
                      </span>
                    )}
                    {warnCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 px-2.5 py-1 rounded-full">
                        <Zap className="h-3 w-3" /> {warnCount} near limit
                      </span>
                    )}
                  </div>
                )}
                {overCount === 0 && warnCount === 0 && budgetRows.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20  text-emerald-700 dark:text-emerald-400  border border-emerald-200 px-2.5 py-1 rounded-full w-fit">
                    <CheckCircle className="h-3 w-3" /> All budgets on track
                  </span>
                )}
              </div>
            </div>
          </div>

          {monthlySpendingGoal > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80  bg-white dark:bg-neutral-800 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400 " />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200">{isAllYear ? 'Annual Spending Goal' : 'Monthly Spending Goal'}</h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[monthlySpendingGoalStatus].badge}`}>
                  {STATUS_CONFIG[monthlySpendingGoalStatus].label}
                </span>
              </div>

              <div className="flex items-end justify-between mb-2 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-bold">Spent so far</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1 truncate" title={`${formatCurrency(balanceInfo.periodExpenses)} / ${formatCurrency(periodSpendingGoal)}`}>
                    {formatCompactCurrency(balanceInfo.periodExpenses)}
                    <span className="text-sm font-medium text-slate-400 dark:text-neutral-500 ml-1">/ {formatCompactCurrency(periodSpendingGoal)}</span>
                  </p>
                </div>
                <div className="text-right shrink-0 min-w-0 max-w-[40%]">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-bold">Remaining</p>
                  <p className={`text-sm font-bold mt-1 truncate ${monthlySpendingGoalStatus === 'over' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                    title={monthlySpendingGoalStatus === 'over'
                      ? `-${formatCurrency(balanceInfo.periodExpenses - periodSpendingGoal)}`
                      : formatCurrency(periodSpendingGoal - balanceInfo.periodExpenses)}>
                    {monthlySpendingGoalStatus === 'over'
                      ? `-${formatCompactCurrency(balanceInfo.periodExpenses - periodSpendingGoal)}`
                      : formatCompactCurrency(periodSpendingGoal - balanceInfo.periodExpenses)}
                  </p>
                </div>
              </div>

              {isAllYear && (
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mb-2">
                  Annual goal = {formatCurrency(monthlySpendingGoal)}/mo × 12 = {formatCurrency(periodSpendingGoal)}
                </p>
              )}
              <div className="h-2.5 bg-slate-100 dark:bg-neutral-800 dark:bg-neutral-700 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${STATUS_CONFIG[monthlySpendingGoalStatus].bar}`}
                  style={{ width: `${Math.min(100, monthlySpendingGoalPct)}%` }}
                />
              </div>
            </div>
          )}

          {budgetRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-8 text-center">
              <ClipboardList className="h-8 w-8 text-slate-400 dark:text-neutral-500  mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-300 ">No budgets configured</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400  mt-1 mb-4">Set budget limits in Settings to track spending here.</p>
              <button
                onClick={onOpenSettings}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400  bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Go to Settings →
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80  bg-white dark:bg-neutral-800 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-neutral-800 dark:border-neutral-700 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">{isAllYear ? 'Annual Budget vs Actual' : 'Budget vs Actual'}</p>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">Category Breakdown
                    <span className="ml-2 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full align-middle hidden sm:inline-block">click to view details</span>
                  </h3>
                </div>
                <button
                  onClick={onOpenSettings}
                  className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:text-neutral-200 bg-slate-50 dark:bg-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-600 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  Manage Limits
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-neutral-700 max-h-[600px] overflow-y-auto overscroll-contain">
                {budgetRows.map(row => {
                  const cfg = STATUS_CONFIG[row.status]
                  const isExpanded = expandedBudgetCat === row.category
                  return (
                    <div key={row.id}>
                      {/* Clickable category row */}
                      <div
                        className={`px-4 sm:px-5 py-3.5 cursor-pointer transition-colors group ${
                          isExpanded ? 'bg-indigo-50/70 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-neutral-700/30'
                        }`}
                        onClick={() => handleBudgetCatClick(row.category)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${cfg.badge} shrink-0`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200 truncate">{row.category}</span>
                            {row.pct >= 90 && (
                              <span className="relative flex h-2.5 w-2.5 ml-1 shrink-0" title="Critical budget utilization">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(row.spent)}</span>
                              <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium"> / {formatCurrency(row.limit)}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-neutral-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                            style={{ width: `${Math.min(row.pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">{Math.round(row.pct)}% used</span>
                          <span className={`text-[10px] font-bold ${row.remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {row.remaining < 0 ? `${formatCurrency(Math.abs(row.remaining))} over` : `${formatCurrency(row.remaining)} left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 sm:space-y-3 min-w-0">

          <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80  bg-white dark:bg-neutral-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">{isAllYear ? "This Year's Health" : "This Month's Health"}</p>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">Financial Pulse</h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke={savingsRate >= 20 ? '#22c55e' : savingsRate >= 10 ? '#eab308' : savingsRate >= 0 ? '#f97316' : '#ef4444'}
                    strokeWidth="7"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.max(Math.min(savingsRate, 100), 0) / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-black text-slate-800 dark:text-neutral-200 px-0.5 text-center text-[11px] truncate">{formatCompactNumber(savingsRate)}%</span>
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{isAllYear ? 'Annual' : 'Monthly'} Savings Rate</p>
                <p className={`text-xs font-bold mt-0.5 ${savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : savingsRate >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                  {savingsRate >= 20 ? '✓ Excellent — above 20% target' : savingsRate >= 10 ? '~ Good — near target' : savingsRate >= 0 ? `↓ Low — aim for 20%` : `✗ Overspending this ${isAllYear ? 'year' : 'month'}`}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-neutral-800 dark:border-neutral-700 pt-3 space-y-2">
              <div className="flex items-start justify-between text-xs gap-2 min-w-0">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-medium shrink-0 pt-0.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> {isAllYear ? 'Annual Income' : 'Period Income'}</span>
                <span className="font-black text-slate-900 dark:text-white tabular-nums truncate text-right" title={formatCurrency(balanceInfo.periodIncome)}>{formatCompactCurrency(balanceInfo.periodIncome)}</span>
              </div>
              <div className="flex items-start justify-between text-xs gap-2 min-w-0">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-medium shrink-0 pt-0.5"><TrendingDown className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" /> {isAllYear ? 'Annual Expenses' : 'Period Expenses'}</span>
                <span className="font-black text-slate-900 dark:text-white tabular-nums truncate text-right" title={formatCurrency(balanceInfo.periodExpenses)}>{formatCompactCurrency(balanceInfo.periodExpenses)}</span>
              </div>
              {isAllYear && (
                <div className="flex items-start justify-between text-xs gap-2 min-w-0">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-medium shrink-0 pt-0.5"><Activity className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" /> Avg/Month Expense</span>
                  <span className="font-black text-slate-900 dark:text-white tabular-nums truncate text-right">{formatCompactCurrency(actualMonthlyBurn)}</span>
                </div>
              )}
              <div className="flex items-start justify-between text-xs border-t border-slate-100 dark:border-neutral-800 dark:border-neutral-700 pt-2 mt-1 gap-2 min-w-0">
                <span className="font-bold text-slate-700 dark:text-neutral-300 shrink-0 pt-0.5">{isAllYear ? 'Annual Net Saved' : 'Net Saved'}</span>
                <span className={`font-black tabular-nums truncate text-right ${balanceInfo.periodBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`} title={formatCurrency(balanceInfo.periodBalance)}>{formatCompactCurrency(balanceInfo.periodBalance)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800 shadow-sm overflow-hidden">

            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-neutral-800 dark:border-neutral-700">
              <p className="text-xs font-black text-slate-900 dark:text-white ">Recent Activity</p>
              <button
                onClick={() => onTabChange('transactions')}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400  bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/50 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                All →
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-neutral-700 max-h-[240px] overflow-y-auto overscroll-contain">
              {periodTxns.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <div className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20  ' : 'bg-rose-50 dark:bg-rose-900/20 '}`}>
                    {t.type === 'income' ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400  dark:text-emerald-500  " /> : <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400 dark:text-rose-500 " />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white  truncate">{t.description || t.category}</p>
                    <p className="text-[10px] text-slate-400 dark:text-neutral-500  font-medium">{t.category}</p>
                  </div>
                  <span className={`text-xs font-black tabular-nums shrink-0 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400  dark:text-emerald-500  ' : 'text-rose-600 dark:text-rose-400 dark:text-rose-500 '}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
              {periodTxns.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-neutral-500  font-semibold">No transactions this period</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/70  rounded-3xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowInsights(true)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:bg-neutral-800/50 dark:hover:bg-neutral-700/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500 dark:text-blue-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-800 dark:text-neutral-200 truncate">
                    {isAllYear ? `${activeYear} Annual Insights Report` : `${MONTH_NAMES[activeMonth - 1]} ${activeYear} Insights Report`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 pl-7 pr-2 line-clamp-2">Deep dive into your financial health, savings rate, and spending patterns.</p>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/30 px-3 py-1 rounded-xl shrink-0 ml-3">
                View →
              </span>
            </button>
          </div>
        </div>
      </div>

      {mounted && showInsights && createPortal(
        <div className="fixed inset-0 z-[500] flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setShowInsights(false)}
          />
          <div
            className="relative w-full max-w-md bg-slate-50 dark:bg-neutral-900 shadow-2xl h-full flex flex-col animate-slide-left sm:rounded-l-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isAllYear ? `${activeYear} Annual Insights` : `${MONTH_NAMES[activeMonth - 1]} ${activeYear} Insights`}
                </h2>
              </div>
              <button
                onClick={() => setShowInsights(false)}
                className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
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

      {mounted && expandedBudgetCat && (() => {
        const row = budgetRows.find(r => r.category === expandedBudgetCat);
        if (!row) return null;
        const txns = budgetCatTxns[expandedBudgetCat] || [];
        const cfg = STATUS_CONFIG[row.status];
        return createPortal(
          <div className="fixed inset-0 z-[500] flex justify-end">
            <div
              className="absolute inset-0 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity animate-fade-in"
              onClick={() => setExpandedBudgetCat(null)}
            />
            <div
              className="relative w-full max-w-md bg-slate-50 dark:bg-neutral-950/90 backdrop-blur-md shadow-2xl h-full flex flex-col animate-slide-left sm:rounded-l-3xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-150 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {row.category}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 mt-0.5 uppercase tracking-wider">
                      {isAllYear ? `${activeYear} Annual Budget` : `${MONTH_NAMES[activeMonth - 1]} ${activeYear}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedBudgetCat(null)}
                  className="rounded-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Main Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5 scrollbar-thin">
                
                {/* Budget Summary Card */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/80 rounded-2xl p-4 shadow-sm space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400">{Math.round(row.pct)}% utilized</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-widest">Total Spent</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">{formatCurrency(row.spent)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-widest">Budget Limit</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">{formatCurrency(row.limit)}</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                      style={{ width: `${Math.min(row.pct, 100)}%` }}
                    />
                  </div>

                  <div className="text-right pt-0.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      row.remaining < 0 
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400' 
                        : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {row.remaining < 0 
                        ? `${formatCurrency(Math.abs(row.remaining))} Over Limit` 
                        : `${formatCurrency(row.remaining)} Left`}
                    </span>
                  </div>
                </div>

                {/* Transactions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                      Transaction History ({txns.length})
                    </h3>
                  </div>

                  {loadingBudgetCat === expandedBudgetCat ? (
                    <div className="space-y-2.5">
                      {[...Array(4)].map((_, si) => (
                        <div key={si} className="animate-pulse bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-xl p-3 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-slate-200 dark:bg-neutral-800 rounded-xl" />
                            <div>
                              <div className="h-3.5 bg-slate-200 dark:bg-neutral-800 rounded w-28 mb-1.5" />
                              <div className="h-2.5 bg-slate-150 dark:bg-neutral-700 rounded w-20" />
                            </div>
                          </div>
                          <div className="h-3.5 bg-slate-200 dark:bg-neutral-800 rounded w-16" />
                        </div>
                      ))}
                    </div>
                  ) : txns.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
                      <Receipt className="h-8 w-8 text-slate-400 dark:text-neutral-500 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">No transactions recorded for this period</p>
                    </div>
                  ) : (() => {
                    // Group transactions by date
                    const groups: Record<string, any[]> = {};
                    txns.forEach((txn: any) => {
                      const d = new Date(txn.date);
                      const today = new Date();
                      const yesterday = new Date();
                      yesterday.setDate(today.getDate() - 1);

                      let dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      if (d.toDateString() === today.toDateString()) {
                        dateLabel = 'Today';
                      } else if (d.toDateString() === yesterday.toDateString()) {
                        dateLabel = 'Yesterday';
                      }
                      if (!groups[dateLabel]) {
                        groups[dateLabel] = [];
                      }
                      groups[dateLabel].push(txn);
                    });

                    // Payment method badge color generator
                    const renderPaymentMethod = (method: string | null) => {
                      if (!method) return null;
                      const lower = method.toLowerCase();
                      let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
                      if (lower.includes('credit') || lower.includes('card') || lower.includes('cc')) {
                        color = 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/50';
                      } else if (lower.includes('cash')) {
                        color = 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
                      } else if (lower.includes('upi') || lower.includes('gpay') || lower.includes('phone') || lower.includes('paytm')) {
                        color = 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
                      } else if (lower.includes('bank') || lower.includes('net') || lower.includes('transfer')) {
                        color = 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900/50';
                      }
                      return (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${color} inline-block leading-none`}>
                          {method}
                        </span>
                      );
                    };

                    return (
                      <div className="space-y-5">
                        {Object.entries(groups).map(([dateLabel, groupTxns]) => (
                          <div key={dateLabel} className="space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500 pl-1">
                              {dateLabel}
                            </div>
                            <div className="space-y-2">
                              {groupTxns.map((txn: any) => {
                                const isLarge = txn.amount >= 2000;
                                return (
                                  <div
                                    key={txn.id}
                                    className={`flex items-center gap-3 bg-white dark:bg-neutral-900 border rounded-xl p-3 shadow-sm hover:border-slate-350 dark:hover:border-neutral-700 transition-all ${
                                      isLarge 
                                        ? 'border-l-4 border-l-rose-500 border-rose-100 dark:border-rose-900/40 dark:border-l-rose-500 bg-rose-50/10 dark:bg-rose-950/5' 
                                        : 'border-slate-200/50 dark:border-neutral-800/80'
                                    }`}
                                  >
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                      isLarge 
                                        ? 'bg-rose-100/70 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' 
                                        : 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'
                                    }`}>
                                      <ArrowUpRight className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate">
                                          {txn.description || txn.category}
                                        </p>
                                        {isLarge && (
                                          <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-350 text-[8px] font-extrabold px-1 py-0.5 rounded uppercase tracking-wider shrink-0 leading-none">
                                            Large Spend
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        {renderPaymentMethod(txn.paymentMethod)}
                                        {txn.source && (
                                          <span className="text-[9px] font-medium text-slate-400 dark:text-neutral-500 truncate">
                                            via {txn.source}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`text-xs tabular-nums ${
                                        isLarge 
                                          ? 'font-black text-rose-600 dark:text-rose-400 text-sm' 
                                          : 'font-extrabold text-slate-800 dark:text-slate-200'
                                      }`}>
                                        -{formatCurrency(txn.amount)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  )
})
