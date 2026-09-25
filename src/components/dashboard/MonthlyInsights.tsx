'use client'

import React, { useMemo } from 'react'
import { X, TrendingUp, TrendingDown, Calendar, Flame, Star, ThumbsUp, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'

interface MonthlyInsightsProps {
  isOpen?: boolean
  onClose?: () => void
  period?: 'month' | 'year'
  month: number
  year: number
  isAllYear?: boolean
  periodTxns?: any[]
  categorySpend?: Record<string, number>
  prevExpense?: number
  onOpenCategoryDetail?: (cat: string) => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function MonthlyInsights({
  isOpen = true,
  onClose,
  period = 'month',
  month,
  year,
  isAllYear = false,
  periodTxns = [],
  categorySpend = {},
  prevExpense = 0,
  onOpenCategoryDetail
}: MonthlyInsightsProps) {
  if (!isOpen) return null

  const currentIncome = useMemo(() => {
    return periodTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
  }, [periodTxns])

  const currentExpense = useMemo(() => {
    return periodTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
  }, [periodTxns])

  const savings = currentIncome - currentExpense
  const savingsRate = currentIncome > 0 ? Math.round((savings / currentIncome) * 100) : 0
  const expenseChange = prevExpense > 0 ? Math.round(((currentExpense - prevExpense) / prevExpense) * 100) : 0

  // Health score (0-100)
  const healthScore = useMemo(() => {
    let score = 50
    if (savingsRate >= 20) score += 30
    else if (savingsRate >= 10) score += 15
    else if (savingsRate < 0) score -= 30

    if (expenseChange < 0) score += 20
    else if (expenseChange > 20) score -= 20

    return Math.max(0, Math.min(100, score))
  }, [savingsRate, expenseChange])

  // Top categories from server
  const topCategories = useMemo(() => {
    return Object.entries(categorySpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [categorySpend])

  // Best and worst spending day
  const dayMap = useMemo(() => {
    const map: Record<string, number> = {}
    periodTxns.filter(t => t.type === 'expense').forEach(t => {
      const day = new Date(t.date).toLocaleDateString('en-IN', { weekday: 'long' })
      map[day] = (map[day] || 0) + Number(t.amount || 0)
    })
    return map
  }, [periodTxns])

  const sortedDays = Object.entries(dayMap).sort((a, b) => b[1] - a[1])
  const worstDay = sortedDays[0]
  const bestDay = sortedDays[sortedDays.length - 1]

  const healthColor = healthScore >= 70 ? 'text-emerald-500' : healthScore >= 40 ? 'text-amber-500' : 'text-rose-500'
  const strokeColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'

  const periodLabel = isAllYear || period === 'year' ? `Year ${year}` : `${MONTH_NAMES[month - 1]} ${year}`

  return (
    <div className="fixed inset-0 z-[500] overflow-hidden">
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          className="w-screen max-w-full sm:max-w-md bg-white dark:bg-[#121215] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Pacing & Intelligence
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Monthly Insights
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-neutral-400">
                  {periodLabel}
                </span>
              </h2>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
            {periodTxns.length === 0 && topCategories.length === 0 ? (
              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-8 text-center text-slate-400 dark:text-neutral-500">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No transactions recorded for {periodLabel}</p>
              </div>
            ) : (
              <>
                {/* 1. Health Score Card */}
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 flex items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="26" fill="none" className="stroke-slate-200 dark:stroke-white/[0.08]" strokeWidth="6" />
                      <circle
                        cx="32" cy="32" r="26" fill="none"
                        stroke={strokeColor}
                        strokeWidth="6"
                        strokeDasharray={`${(healthScore / 100) * 163.36} 163.36`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums ${healthColor}`}>
                      {healthScore}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block truncate">
                      Financial Health Index
                    </span>
                    <p className={`text-sm font-bold truncate mt-0.5 ${healthColor}`}>
                      {healthScore >= 70 ? (
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> Robust Position</span>
                      ) : healthScore >= 40 ? (
                        <span className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4 text-amber-500 shrink-0" /> Stable Progress</span>
                      ) : (
                        <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" /> Budget Strain</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                      Synthesized from savings rate & velocity
                    </p>
                  </div>
                </div>

                {/* 2. Key Stats 3-Col */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2.5 text-center min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">Inflow</span>
                    <p className="text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-white mt-0.5 truncate" title={formatCurrency(currentIncome)}>
                      {formatCompactCurrency(currentIncome)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2.5 text-center min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 block truncate">Outflow</span>
                    <p className="text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-white mt-0.5 truncate" title={formatCurrency(currentExpense)}>
                      {formatCompactCurrency(currentExpense)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2.5 text-center min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block truncate">Net Saved</span>
                    <p className={`text-xs sm:text-sm font-bold tabular-nums mt-0.5 truncate ${savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} title={formatCurrency(Math.abs(savings))}>
                      {formatCompactCurrency(savings)}
                    </p>
                  </div>
                </div>

                {/* 3. Variance vs Prior Period */}
                {prevExpense > 0 && (
                  <div className={`flex items-center gap-2.5 rounded-xl p-3 border text-xs ${
                    expenseChange < 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                  }`}>
                    {expenseChange < 0 ? (
                      <TrendingDown className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span>
                        Outflow is <strong className="tabular-nums font-semibold">{Math.abs(expenseChange)}% {expenseChange < 0 ? 'lower' : 'higher'}</strong> than prior period.
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Savings Rate */}
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Net Retention Rate</span>
                    <span className={`text-sm font-bold tabular-nums ${savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 10 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {savingsRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    {savingsRate >= 20 ? 'Solid performance: exceeding the standard 20% benchmark.' : savingsRate >= 10 ? 'Modest surplus: consider reducing discretionary outflow.' : 'Capital deficit: outflows exceeded inflows.'}
                  </p>
                </div>

                {/* 5. Top Categories */}
                {topCategories.length > 0 && (
                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-500" /> Leading Burn Drivers
                    </span>
                    <div className="space-y-2.5">
                      {topCategories.map(([cat, amount], i) => (
                        <div
                          key={cat}
                          onClick={() => onOpenCategoryDetail?.(cat)}
                          className="group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs gap-2 mb-1">
                            <span className="font-medium text-slate-800 dark:text-neutral-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                              {cat}
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${(amount / topCategories[0][1]) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Day Variance */}
                {worstDay && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-3 min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 block truncate">Peak Day</span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">{worstDay[0]}</p>
                      <p className="text-[11px] tabular-nums text-slate-400 dark:text-neutral-500 mt-0.5 truncate">{formatCurrency(worstDay[1])}</p>
                    </div>
                    {bestDay && bestDay[0] !== worstDay[0] && (
                      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-3 min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">Lowest Day</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">{bestDay[0]}</p>
                        <p className="text-[11px] tabular-nums text-slate-400 dark:text-neutral-500 mt-0.5 truncate">{formatCurrency(bestDay[1])}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
