'use client'

import React from 'react'
import { ArrowUpRight, ArrowDownLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import PeriodSelector from './PeriodSelector'

interface OverviewPeriod {
  year: number
  month?: number
}

interface OverviewHeroProps {
  balanceInfo: {
    periodIncome: number
    periodExpenses: number
    periodBalance: number
  }
  totalBudgeted: number
  totalSpentOnBudgeted: number
  overallBudgetPct: number
  savingsRate: number
  isAllYear: boolean
  monthProgress: number
  overviewPeriod: OverviewPeriod
  activeYear: number
  activeMonth: number
  availableYears: number[]
  monthNames: string[]
  onPeriodChange: (period: OverviewPeriod) => void
  onShowAddTransaction: () => void
  overBudgetCount?: number
  overBudgetDelta?: number
  onInspectAlert?: () => void
}

export default React.memo(function OverviewHero({
  balanceInfo,
  totalBudgeted,
  totalSpentOnBudgeted,
  overallBudgetPct,
  savingsRate,
  isAllYear,
  monthProgress,
  overviewPeriod,
  activeYear,
  activeMonth,
  availableYears,
  monthNames,
  onPeriodChange,
  onShowAddTransaction,
  overBudgetCount = 0,
  overBudgetDelta = 0,
  onInspectAlert
}: OverviewHeroProps) {
  const budgetRemaining = Math.max(0, totalBudgeted - totalSpentOnBudgeted)
  const isOverBudget = totalSpentOnBudgeted > totalBudgeted && totalBudgeted > 0

  // Calculate daily burn rate context
  const now = new Date()
  const daysInMonth = new Date(activeYear, activeMonth, 0).getDate()
  const currentDay = overviewPeriod.month === (now.getMonth() + 1) && activeYear === now.getFullYear()
    ? now.getDate()
    : daysInMonth
  const daysRemaining = Math.max(1, daysInMonth - currentDay)
  const dailyBurnAllowed = budgetRemaining > 0 ? Math.round(budgetRemaining / daysRemaining) : 0

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
      {/* 1. Header Toolbar: Title, Inline Alert Chip, Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/70 dark:border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight shrink-0">
            {isAllYear ? `${activeYear} Overview` : `${monthNames[activeMonth - 1]} ${activeYear} Overview`}
          </h2>

          {/* Inline Health / Alert Chip */}
          {overBudgetCount > 0 ? (
            <button
              type="button"
              onClick={onInspectAlert}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-[10px] font-semibold hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <AlertTriangle className="h-3 w-3 text-rose-500 dark:text-rose-400 shrink-0" />
              <span>{overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over limit (+{formatCurrency(overBudgetDelta)})</span>
            </button>
          ) : totalBudgeted > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Budgets on track ({formatCurrency(budgetRemaining)} buffer)</span>
            </div>
          ) : null}
        </div>

        <PeriodSelector
          overviewPeriod={overviewPeriod}
          activeYear={activeYear}
          activeMonth={activeMonth}
          availableYears={availableYears}
          monthNames={monthNames}
          onPeriodChange={onPeriodChange}
          onShowAddTransaction={onShowAddTransaction}
        />
      </div>

      {/* 2. Unified Liquidity & Pacing Matrix (4 Columns Desktop, 2x2 Grid Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: Total Outflow */}
        <div className="bg-slate-50/80 dark:bg-[#16161a]/80 hover:bg-slate-100/90 dark:hover:bg-[#18181f] border border-slate-200/70 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-3 flex flex-col justify-between transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Outflow
            </span>
            <div className="w-4 h-4 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <h3 className="text-base sm:text-lg font-bold tabular-nums tracking-tight text-rose-600 dark:text-rose-400">
              -{formatCurrency(balanceInfo.periodExpenses)}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate mt-0.5">
              Debited spend
            </p>
          </div>
        </div>

        {/* Metric 2: Total Inflow */}
        <div className="bg-slate-50/80 dark:bg-[#16161a]/80 hover:bg-slate-100/90 dark:hover:bg-[#18181f] border border-slate-200/70 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-3 flex flex-col justify-between transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Inflow
            </span>
            <div className="w-4 h-4 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <h3 className="text-base sm:text-lg font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(balanceInfo.periodIncome)}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate mt-0.5">
              Credited income
            </p>
          </div>
        </div>

        {/* Metric 3: Net Cashflow */}
        <div className="bg-slate-50/80 dark:bg-[#16161a]/80 hover:bg-slate-100/90 dark:hover:bg-[#18181f] border border-slate-200/70 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-3 flex flex-col justify-between transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {isAllYear ? 'Net Saved' : 'Net Flow'}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              savingsRate >= 20
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : savingsRate > 0
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
              {savingsRate}% saved
            </span>
          </div>
          <div className="mt-1.5">
            <h3 className={`text-base sm:text-lg font-bold tabular-nums tracking-tight ${
              balanceInfo.periodBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {balanceInfo.periodBalance >= 0 ? '+' : ''}{formatCurrency(balanceInfo.periodBalance)}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate mt-0.5">
              {balanceInfo.periodBalance >= 0 ? 'Retained in liquidity' : 'Deficit this period'}
            </p>
          </div>
        </div>

        {/* Metric 4: Budget Run-Rate Pacing */}
        <div className="bg-slate-50/80 dark:bg-[#16161a]/80 hover:bg-slate-100/90 dark:hover:bg-[#18181f] border border-slate-200/70 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-3 flex flex-col justify-between transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Budget Run-Rate
            </span>
            {totalBudgeted > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isOverBudget
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : overallBudgetPct > 80
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {Math.round(overallBudgetPct)}% used
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between text-xs font-bold tabular-nums text-slate-900 dark:text-white">
              <span>{formatCurrency(totalSpentOnBudgeted)}</span>
              <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-500">of {formatCurrency(totalBudgeted)}</span>
            </div>
            {totalBudgeted > 0 ? (
              <div className="space-y-1 mt-1">
                <div className="h-1.5 w-full bg-slate-200/80 dark:bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOverBudget
                        ? 'bg-rose-500'
                        : overallBudgetPct > 80
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(overallBudgetPct, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 dark:text-zinc-400 truncate">
                  {isOverBudget ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Exceeded by {formatCurrency(totalSpentOnBudgeted - totalBudgeted)}</span>
                  ) : (
                    <span>~{formatCurrency(dailyBurnAllowed)}/day allowable</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 truncate">No active limits</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
