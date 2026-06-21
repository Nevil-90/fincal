// Budget command center component visualizing monthly progress,
// category-specific budget limits vs actuals, and insights/burn-rate.
'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, BarChart2, BarChart3, Calendar, Target, AlertCircle, TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, ArrowRight, ArrowUpRight, ArrowDownRight, ArrowDownLeft, Activity, PieChart, ShieldAlert, Zap, AlertTriangle, CheckCircle, ClipboardList, Banknote, Clock, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react'
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

  const actualDailyBurn = dayOfMonth > 0 ? balanceInfo.periodExpenses / dayOfMonth : 0
  const expectedDailyBurn = daysInMonth > 0 ? totalBudgeted / daysInMonth : 0

  const monthlySpendingGoal = Number(staticData.userSettings?.monthlySpendingGoal) || 0
  const monthlySpendingGoalPct = monthlySpendingGoal > 0 ? (balanceInfo.periodExpenses / monthlySpendingGoal) * 100 : 0
  const monthlySpendingGoalStatus = monthlySpendingGoalPct >= 100 ? 'over' : monthlySpendingGoalPct >= 80 ? 'warn' : monthlySpendingGoalPct >= 50 ? 'ok' : 'safe'

  const availableYears = (summary?.availableYears || [now.getFullYear()]) as number[]

  const STATUS_CONFIG = {
    over: { bar: 'bg-red-500', label: 'Over budget', badge: 'bg-red-50 dark:bg-red-900/20  text-red-700 dark:text-red-400  border-red-200' },
    warn: { bar: 'bg-orange-500', label: 'Near limit', badge: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200' },
    ok: { bar: 'bg-yellow-400', label: 'On track', badge: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200' },
    safe: { bar: 'bg-emerald-500', label: 'Under control', badge: 'bg-emerald-50 dark:bg-emerald-900/20  text-emerald-700 dark:text-emerald-400  border-emerald-200' },
  }

  const [showInsights, setShowInsights] = useState(false)

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
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Overall Budget Usage</p>
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 pr-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 break-words">Month Progress</span>
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-neutral-300 shrink-0">Day {dayOfMonth} / {daysInMonth}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 dark:bg-neutral-500 rounded-full transition-all duration-700" style={{ width: `${monthProgress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 p-3">
                    <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Spent</p>
                    <p className="text-base font-black text-rose-700 dark:text-rose-400 mt-0.5 tabular-nums truncate" title={formatCurrency(balanceInfo.periodExpenses)}>{formatCompactCurrency(balanceInfo.periodExpenses)}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-3">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Income</p>
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums truncate" title={formatCurrency(balanceInfo.periodIncome)}>{formatCompactCurrency(balanceInfo.periodIncome)}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-3">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Rollover</p>
                    <p className="text-base font-black text-blue-700 dark:text-blue-400 mt-0.5 tabular-nums truncate" title={`+${formatCurrency(carryOver)}`}>+{formatCompactCurrency(carryOver)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-600 p-3">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Daily Burn</p>
                    <p className="text-base font-black text-slate-800 dark:text-neutral-200 mt-0.5 tabular-nums truncate" title={`${formatCurrency(actualDailyBurn)}/d`}>{formatCompactCurrency(actualDailyBurn)}/d</p>
                    {expectedDailyBurn > 0 && (
                      <p className={`text-[10px] font-bold mt-0.5 truncate ${actualDailyBurn > expectedDailyBurn ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} title={`Budget: ${formatCurrency(expectedDailyBurn)}/d`}>
                        {actualDailyBurn > expectedDailyBurn ? '▲' : '▼'} Budget: {formatCompactCurrency(expectedDailyBurn)}/d
                      </p>
                    )}
                  </div>
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
                  <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200 ">Monthly Spending Goal</h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[monthlySpendingGoalStatus].badge}`}>
                  {STATUS_CONFIG[monthlySpendingGoalStatus].label}
                </span>
              </div>

              <div className="flex items-end justify-between mb-2 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-bold">Spent so far</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1 truncate" title={`${formatCurrency(balanceInfo.periodExpenses)} / ${formatCurrency(monthlySpendingGoal)}`}>
                    {formatCompactCurrency(balanceInfo.periodExpenses)}
                    <span className="text-sm font-medium text-slate-400 dark:text-neutral-500 ml-1">/ {formatCompactCurrency(monthlySpendingGoal)}</span>
                  </p>
                </div>
                <div className="text-right shrink-0 min-w-0 max-w-[40%]">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-bold">Remaining</p>
                  <p className={`text-sm font-bold mt-1 truncate ${monthlySpendingGoalStatus === 'over' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} title={monthlySpendingGoalStatus === 'over'
                    ? `-${formatCurrency(balanceInfo.periodExpenses - monthlySpendingGoal)}`
                    : formatCurrency(monthlySpendingGoal - balanceInfo.periodExpenses)}>
                    {monthlySpendingGoalStatus === 'over'
                      ? `-${formatCompactCurrency(balanceInfo.periodExpenses - monthlySpendingGoal)}`
                      : formatCompactCurrency(monthlySpendingGoal - balanceInfo.periodExpenses)}
                  </p>
                </div>
              </div>

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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 ">Budget vs Actual</p>
                  <h3 className="text-base font-black text-slate-900 dark:text-white  mt-0.5">Category Breakdown</h3>
                </div>
                <button
                  onClick={onOpenSettings}
                  className="text-[10px] font-bold text-slate-500 dark:text-neutral-400  hover:text-slate-800 dark:text-neutral-200 dark:hover:text-neutral-200 bg-slate-50 dark:bg-neutral-800/50 dark:bg-neutral-700 hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-600 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  Manage Limits
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-neutral-700 max-h-[420px] overflow-y-auto overscroll-contain">
                {budgetRows.map(row => {
                  const cfg = STATUS_CONFIG[row.status]
                  return (
                    <div key={row.id} className="px-4 sm:px-5 py-3.5 hover:bg-slate-50 dark:bg-neutral-800/50 dark:hover:bg-neutral-700/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${cfg.badge} shrink-0`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200  truncate">{row.category}</span>
                          {row.pct >= 90 && (
                            <span className="relative flex h-2.5 w-2.5 ml-1 shrink-0" title="Critical budget utilization">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-xs font-black text-slate-900 dark:text-white  tabular-nums">{formatCurrency(row.spent)}</span>
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500  font-medium"> / {formatCurrency(row.limit)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-neutral-800 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                          style={{ width: `${Math.min(row.pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500  font-medium">{Math.round(row.pct)}% used</span>
                        <span className={`text-[10px] font-bold ${row.remaining < 0 ? 'text-red-600 dark:text-red-400  ' : 'text-emerald-600 dark:text-emerald-400  '}`}>
                          {row.remaining < 0 ? `${formatCurrency(Math.abs(row.remaining))} over` : `${formatCurrency(row.remaining)} left`}
                        </span>
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 ">This Month's Health</p>
              <h3 className="text-base font-black text-slate-900 dark:text-white  mt-0.5">Financial Pulse</h3>
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
                <p className="text-sm font-black text-slate-900 dark:text-white ">Savings Rate</p>
                <p className={`text-xs font-bold mt-0.5 ${savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400 ' : savingsRate >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400 '}`}>
                  {savingsRate >= 20 ? '✓ Excellent — above 20% target' : savingsRate >= 10 ? '~ Good — near target' : savingsRate >= 0 ? '↓ Low — aim for 20%' : '✗ Overspending this month'}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-neutral-800 dark:border-neutral-700 pt-3 space-y-2">
              <div className="flex items-start justify-between text-xs gap-2 min-w-0">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-medium shrink-0 pt-0.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Period Income</span>
                <span className="font-black text-slate-900 dark:text-white tabular-nums truncate text-right" title={formatCurrency(balanceInfo.periodIncome)}>{formatCompactCurrency(balanceInfo.periodIncome)}</span>
              </div>
              <div className="flex items-start justify-between text-xs gap-2 min-w-0">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-medium shrink-0 pt-0.5"><TrendingDown className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" /> Period Expenses</span>
                <span className="font-black text-slate-900 dark:text-white tabular-nums truncate text-right" title={formatCurrency(balanceInfo.periodExpenses)}>{formatCompactCurrency(balanceInfo.periodExpenses)}</span>
              </div>
              <div className="flex items-start justify-between text-xs border-t border-slate-100 dark:border-neutral-800 dark:border-neutral-700 pt-2 mt-1 gap-2 min-w-0">
                <span className="font-bold text-slate-700 dark:text-neutral-300 shrink-0 pt-0.5">Net Saved</span>
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
                  <span className="text-sm font-bold text-slate-800 dark:text-neutral-200 truncate">{MONTH_NAMES[activeMonth - 1]} {activeYear} Insights Report</span>
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
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{MONTH_NAMES[activeMonth - 1]} {activeYear} Insights</h2>
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
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})
