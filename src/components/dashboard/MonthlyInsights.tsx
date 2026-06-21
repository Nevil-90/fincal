'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Award, Flame, Calendar, BarChart3, Star, ThumbsUp, AlertTriangle, PartyPopper } from 'lucide-react'
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

export default function MonthlyInsights({ periodTxns, categorySpend, prevExpense, month, year, isAllYear = false }: MonthlyInsightsProps) {
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
  const healthBg = healthScore >= 70 ? 'from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-900/50' : healthScore >= 40 ? 'from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-900/50' : 'from-rose-50 to-red-50 border-rose-200 dark:from-rose-900/20 dark:to-red-900/20 dark:border-rose-900/50'

  if (periodTxns.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/70 rounded-3xl p-6 text-center text-slate-400 dark:text-neutral-500">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-semibold">No transactions for {isAllYear ? `the year ${year}` : `${MONTH_NAMES[month - 1]} ${year}`}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Health Score */}
      <div className={`bg-gradient-to-r ${healthBg} border rounded-2xl p-4 flex items-center gap-4`}>
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" className="text-slate-200 dark:text-neutral-800" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26" fill="none"
              stroke={healthScore >= 70 ? '#22c55e' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}
              strokeWidth="6"
              strokeDasharray={`${(healthScore / 100) * 163.36} 163.36`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${healthColor}`}>
            {healthScore}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 truncate">Financial Health Score</p>
          <p className={`text-xl font-black truncate ${healthColor}`}>
            {healthScore >= 70 ? <span className="flex items-center gap-1">Excellent! <Star className="h-4 w-4 text-yellow-400 shrink-0" /></span> : healthScore >= 40 ? <span className="flex items-center gap-1">Good Progress <ThumbsUp className="h-4 w-4 text-blue-400 shrink-0" /></span> : <span className="flex items-center gap-1">Needs Attention <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" /></span>}
          </p>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 line-clamp-2">Based on savings rate and spending trends</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/70 rounded-2xl p-2.5 sm:p-3.5 text-center shadow-sm min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Income</p>
          <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate" title={formatCurrency(currentIncome)}>{formatCompactCurrency(currentIncome)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/70 rounded-2xl p-2.5 sm:p-3.5 text-center shadow-sm min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Expenses</p>
          <p className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 mt-1 truncate" title={formatCurrency(currentExpense)}>{formatCompactCurrency(currentExpense)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/70 rounded-2xl p-2.5 sm:p-3.5 text-center shadow-sm min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Saved</p>
          <p className={`text-sm sm:text-base font-black mt-1 truncate ${savings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`} title={formatCurrency(Math.abs(savings))}>
            {formatCompactCurrency(Math.abs(savings))}
          </p>
        </div>
      </div>

      {/* vs Last Month/Year */}
      {prevExpense > 0 && (
        <div className={`flex items-center gap-3 rounded-2xl p-3.5 border ${
          expenseChange < 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50'
        }`}>
          {expenseChange < 0 ? (
            <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${expenseChange < 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              You spent <strong>{Math.abs(expenseChange)}%</strong> {expenseChange < 0 ? 'less' : 'more'} than last {isAllYear ? 'year' : 'month'}.
              {expenseChange < 0 && <span className="flex items-center gap-1 mt-1"><PartyPopper className="h-3 w-3 text-emerald-500 dark:text-emerald-400 shrink-0" /> Great job!</span>}
            </p>
          </div>
        </div>
      )}

      {/* Savings Rate */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/70 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Savings Rate</p>
          <span className={`text-sm font-black ${savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : savingsRate >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {savingsRate}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">
          {savingsRate >= 20 ? 'Excellent! Targeting 20%+ savings is fantastic.' : savingsRate >= 10 ? 'Good. Aim for 20% for long-term wealth.' : 'Try to reduce expenses to save more.'}
        </p>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/70 rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" /> Top Spending Categories
          </p>
          {topCategories.map(([cat, amount], i) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 dark:text-neutral-500 w-4">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1 gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-neutral-300 truncate">{cat}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0" title={formatCurrency(amount)}>{formatCompactCurrency(amount)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-orange-400' : 'bg-amber-400'}`}
                    style={{ width: `${(amount / topCategories[0][1]) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Best/Worst Day */}
      {worstDay && (
        <div className="grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2">
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-3.5 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">Highest Spend Day</p>
            <p className="text-base font-black text-rose-700 dark:text-rose-400 mt-1 truncate" title={worstDay[0]}>{worstDay[0]}</p>
            <p className="text-xs text-rose-500 dark:text-rose-400 truncate" title={`${formatCurrency(worstDay[1])} avg`}>{formatCompactCurrency(worstDay[1])} avg</p>
          </div>
          {bestDay && bestDay[0] !== worstDay[0] && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-3.5 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">Lowest Spend Day</p>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-1 truncate" title={bestDay[0]}>{bestDay[0]}</p>
              <p className="text-xs text-emerald-500 dark:text-emerald-400 truncate" title={`${formatCurrency(bestDay[1])} avg`}>{formatCompactCurrency(bestDay[1])} avg</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-2xl">
        <Award className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          <strong>{periodTxns.length} transactions</strong> logged this {isAllYear ? 'year' : 'month'} across <strong>{new Set(periodTxns.map(t => t.category)).size} categories</strong>.
        </p>
      </div>
    </div>
  )
}
