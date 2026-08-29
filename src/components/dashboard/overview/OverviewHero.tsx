'use client'

import React from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import SpendGauge from './SpendGauge'
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
  onShowAddTransaction
}: OverviewHeroProps) {
  const budgetRemaining = Math.max(0, totalBudgeted - totalSpentOnBudgeted)
  const isOverBudget = totalSpentOnBudgeted > totalBudgeted && totalBudgeted > 0

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* 1. Header Toolbar Inside Hero Card (Saves Top Space) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-neutral-800 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            {isAllYear ? `${activeYear} Overview` : `${monthNames[activeMonth - 1]} ${activeYear}`}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Cashflow
          </span>
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

      {/* 2. Core Metrics: Donut Spend Gauge + Net Balance + Income/Expenses */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Left: Circular Donut Ring Gauge */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <SpendGauge pct={overallBudgetPct} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 text-center">
            {isAllYear ? 'Annual Pace' : 'Budget Pace'}
          </span>
        </div>

        {/* Right: Net Balance, Income, Expenses & Target */}
        <div className="flex-1 w-full min-w-0 space-y-3">
          {/* Net Saved */}
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                {isAllYear ? 'Annual Net Saved' : 'Net Balance'}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h2 className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${balanceInfo.periodBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                  {balanceInfo.periodBalance >= 0 ? '+' : ''}{formatCurrency(balanceInfo.periodBalance)}
                </h2>
                {balanceInfo.periodIncome > 0 && (
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.2 rounded-full ${savingsRate >= 20
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                      : savingsRate >= 10
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                    }`}>
                    {savingsRate}% of income
                  </span>
                )}
              </div>
            </div>

            {totalBudgeted > 0 && (
              <div className="text-right font-mono hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-400 block">
                  Budget Target
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                  {formatCurrency(totalBudgeted)}
                </span>
              </div>
            )}
          </div>

          {/* Income vs Expenses Grid */}
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200/70 dark:border-neutral-800 p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-400 flex items-center gap-1">
                <ArrowDownLeft className="h-3 w-3 text-emerald-500" /> Income
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {formatCurrency(balanceInfo.periodIncome)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200/70 dark:border-neutral-800 p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-400 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-rose-500" /> Expenses
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {formatCurrency(balanceInfo.periodExpenses)}
              </p>
            </div>
          </div>

          {/* Budget Pace Footer */}
          {totalBudgeted > 0 && (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400 pt-0.5">
              <span>
                {isOverBudget
                  ? <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(totalSpentOnBudgeted - totalBudgeted)} over planned budget</strong>
                  : <span>{formatCurrency(budgetRemaining)} remaining in budget</span>}
              </span>
              <span>
                {isAllYear ? '' : `Day ${Math.round(monthProgress * 0.31 || 1)} / 31 (${monthProgress}%)`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
