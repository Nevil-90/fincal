'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, Flame, Star, ThumbsUp, AlertTriangle, PartyPopper } from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  date: string
}

interface MonthlyInsightsProps {
  periodTxns: any[]
  categorySpend: Record<string, number>
  prevExpense: number
  month: number
  year: number
  isAllYear?: boolean
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function MonthlyInsights({
  periodTxns,
  categorySpend,
  prevExpense,
  month,
  year,
  isAllYear = false
}: MonthlyInsightsProps) {
  const currentIncome = periodTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const currentExpense = periodTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const savings = currentIncome - currentExpense
  const savingsRate = currentIncome > 0 ? Math.round((savings / currentIncome) * 100) : 0
  const expenseChange = prevExpense > 0 ? Math.round(((currentExpense - prevExpense) / prevExpense) * 100) : 0

  // Health score (0-100)
  const healthScore = useMemo(() => {
    let score = 50
    if (savingsRate >= 20) score += 30
    else if (savingsRate >= 10) score += 15
    else if (savingsRate < 0) score -= 30

    if (expenseChange < 0) score += 20 // spending less than last month
    else if (expenseChange > 20) score -= 20

    return Math.max(0, Math.min(100, score))
  }, [savingsRate, expenseChange])

  // Top categories from server
  const topCategories = useMemo(() => {
    return Object.entries(categorySpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [categorySpend])

  // Best and worst spending day
  const dayMap = useMemo(() => {
    const map: Record<string, number> = {}
    periodTxns.filter(t => t.type === 'expense').forEach(t => {
      const day = new Date(t.date).toLocaleDateString('en-IN', { weekday: 'long' })
      map[day] = (map[day] || 0) + Number(t.amount)
    })
    return map
  }, [periodTxns])

  const worstDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]
  const bestDay = Object.entries(dayMap).sort((a, b) => a[1] - b[1])[0]

  const healthColor = healthScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'

  if (periodTxns.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-8 text-center text-slate-400 dark:text-neutral-500 shadow-sm">
        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p className="text-xs font-semibold">No transactions for {isAllYear ? `the year ${year}` : `${MONTH_NAMES[month - 1]} ${year}`}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3.5 font-sans">
      {/* 1. Health Score Card */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" className="stroke-slate-100 dark:stroke-neutral-800" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26" fill="none"
              stroke={healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}
              strokeWidth="6"
              strokeDasharray={`${(healthScore / 100) * 163.36} 163.36`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-sm font-black font-mono ${healthColor}`}>
            {healthScore}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 block truncate">
            Financial Health Score
          </span>
          <p className={`text-base font-black truncate mt-0.5 ${healthColor}`}>
            {healthScore >= 70 ? (
              <span className="flex items-center gap-1">Excellent <Star className="h-4 w-4 text-amber-400 shrink-0" /></span>
            ) : healthScore >= 40 ? (
              <span className="flex items-center gap-1">Good Progress <ThumbsUp className="h-4 w-4 text-indigo-400 shrink-0" /></span>
            ) : (
              <span className="flex items-center gap-1">Needs Attention <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" /></span>
            )}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
            Based on savings rate and spending velocity
          </p>
        </div>
      </div>

      {/* 2. Key Stats 3-Column */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 text-center shadow-sm min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">Income</span>
          <p className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 truncate" title={formatCurrency(currentIncome)}>
            {formatCompactCurrency(currentIncome)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 text-center shadow-sm min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 block truncate">Expenses</span>
          <p className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 truncate" title={formatCurrency(currentExpense)}>
            {formatCompactCurrency(currentExpense)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 text-center shadow-sm min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block truncate">Net Saved</span>
          <p className={`text-xs sm:text-sm font-black font-mono mt-0.5 truncate ${savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} title={formatCurrency(Math.abs(savings))}>
            {formatCompactCurrency(savings)}
          </p>
        </div>
      </div>

      {/* 3. Variance vs Prior Period */}
      {prevExpense > 0 && (
        <div className={`flex items-center gap-2.5 rounded-xl p-3 border text-xs ${
          expenseChange < 0
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-400'
        }`}>
          {expenseChange < 0 ? (
            <TrendingDown className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <TrendingUp className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <div className="flex-1 min-w-0">
            <span>
              Spending is <strong>{Math.abs(expenseChange)}% {expenseChange < 0 ? 'lower' : 'higher'}</strong> than last {isAllYear ? 'year' : 'month'}.
            </span>
          </div>
        </div>
      )}

      {/* 4. Savings Rate */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">Savings Rate</span>
          <span className={`text-sm font-black font-mono ${savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : savingsRate >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {savingsRate}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-neutral-400">
          {savingsRate >= 20 ? 'Excellent! Above the 20% savings benchmark.' : savingsRate >= 10 ? 'Fair. Aim for 20% to build wealth faster.' : 'Deficit or tight margin. Tighten discretionary spend.'}
        </p>
      </div>

      {/* 5. Top Categories */}
      {topCategories.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" /> Top Spending Categories
          </span>
          <div className="space-y-2.5">
            {topCategories.map(([cat, amount], i) => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs gap-2">
                  <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                    {i + 1}. {cat}
                  </span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white shrink-0" title={formatCurrency(amount)}>
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${(amount / topCategories[0][1]) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Best/Worst Day */}
      {worstDay && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800 rounded-xl p-3 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 block truncate">Highest Spend Day</span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">{worstDay[0]}</p>
            <p className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 mt-0.5 truncate">{formatCurrency(worstDay[1])}</p>
          </div>
          {bestDay && bestDay[0] !== worstDay[0] && (
            <div className="bg-slate-50 dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800 rounded-xl p-3 min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">Lowest Spend Day</span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">{bestDay[0]}</p>
              <p className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 mt-0.5 truncate">{formatCurrency(bestDay[1])}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
