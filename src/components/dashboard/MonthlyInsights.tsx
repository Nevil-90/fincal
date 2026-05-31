'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Award, Flame, Calendar, BarChart3, Star, ThumbsUp, AlertTriangle, PartyPopper } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

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
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function MonthlyInsights({ periodTxns, categorySpend, prevExpense, month, year }: MonthlyInsightsProps) {
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

  const healthColor = healthScore >= 70 ? 'text-emerald-600' : healthScore >= 40 ? 'text-amber-600' : 'text-rose-600'
  const healthBg = healthScore >= 70 ? 'from-emerald-50 to-green-50 border-emerald-200' : healthScore >= 40 ? 'from-amber-50 to-yellow-50 border-amber-200' : 'from-rose-50 to-red-50 border-rose-200'

  if (periodTxns.length === 0) {
    return (
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 text-center text-slate-400">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-semibold">No transactions for {MONTH_NAMES[month - 1]} {year}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Month Label */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-black text-slate-900">{MONTH_NAMES[month - 1]} {year} — Monthly Report</h3>
      </div>

      {/* Health Score */}
      <div className={`bg-gradient-to-r ${healthBg} border rounded-2xl p-4 flex items-center gap-4`}>
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="6" />
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
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Financial Health Score</p>
          <p className={`text-xl font-black ${healthColor}`}>
            {healthScore >= 70 ? <span className="flex items-center gap-1">Excellent! <Star className="h-4 w-4 text-yellow-400" /></span> : healthScore >= 40 ? <span className="flex items-center gap-1">Good Progress <ThumbsUp className="h-4 w-4 text-blue-400" /></span> : <span className="flex items-center gap-1">Needs Attention <AlertTriangle className="h-4 w-4 text-orange-400" /></span>}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Based on savings rate and spending trends</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/70 rounded-2xl p-3.5 text-center shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Income</p>
          <p className="text-base font-black text-emerald-600 mt-1">{formatCurrency(currentIncome)}</p>
        </div>
        <div className="bg-white border border-slate-200/70 rounded-2xl p-3.5 text-center shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expenses</p>
          <p className="text-base font-black text-rose-600 mt-1">{formatCurrency(currentExpense)}</p>
        </div>
        <div className="bg-white border border-slate-200/70 rounded-2xl p-3.5 text-center shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Saved</p>
          <p className={`text-base font-black mt-1 ${savings >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatCurrency(Math.abs(savings))}
          </p>
        </div>
      </div>

      {/* vs Last Month */}
      {prevExpense > 0 && (
        <div className={`flex items-center gap-3 rounded-2xl p-3.5 border ${
          expenseChange < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          {expenseChange < 0 ? (
            <TrendingDown className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <TrendingUp className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <p className={`text-sm font-semibold ${expenseChange < 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            You spent <strong>{Math.abs(expenseChange)}%</strong> {expenseChange < 0 ? 'less' : 'more'} than last month.
            {expenseChange < 0 && <span className="flex items-center gap-1 mt-1"><PartyPopper className="h-3 w-3 text-emerald-500" /> Great job!</span>}
          </p>
        </div>
      )}

      {/* Savings Rate */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Savings Rate</p>
          <span className={`text-sm font-black ${savingsRate >= 20 ? 'text-emerald-600' : savingsRate >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
            {savingsRate}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {savingsRate >= 20 ? 'Excellent! Targeting 20%+ savings is fantastic.' : savingsRate >= 10 ? 'Good. Aim for 20% for long-term wealth.' : 'Try to reduce expenses to save more.'}
        </p>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" /> Top Spending Categories
          </p>
          {topCategories.map(([cat, amount], i) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 w-4">{i + 1}.</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">{cat}</span>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(amount)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Highest Spend Day</p>
            <p className="text-base font-black text-rose-700 mt-1">{worstDay[0]}</p>
            <p className="text-xs text-rose-500">{formatCurrency(worstDay[1])} avg</p>
          </div>
          {bestDay && bestDay[0] !== worstDay[0] && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Lowest Spend Day</p>
              <p className="text-base font-black text-emerald-700 mt-1">{bestDay[0]}</p>
              <p className="text-xs text-emerald-500">{formatCurrency(bestDay[1])} avg</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <Award className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-xs text-slate-500">
          <strong>{periodTxns.length} transactions</strong> logged this month across <strong>{new Set(periodTxns.map(t => t.category)).size} categories</strong>.
        </p>
      </div>
    </div>
  )
}
