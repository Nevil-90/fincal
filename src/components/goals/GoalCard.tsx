'use client'

import React from 'react'
import { Calendar, Plus, History, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { SavingsGoal } from './types'
import { calculateMonthlyRequired, formatTimeRemaining, getGoalPace } from './goal-utils'

interface GoalCardProps {
  goal: SavingsGoal
  contributionsCount: number
  onOpenDrawer: (goal: SavingsGoal, tab: 'deposit' | 'history') => void
}

export default function GoalCard({
  goal,
  contributionsCount,
  onOpenDrawer
}: GoalCardProps) {
  const pace = getGoalPace(goal)
  const monthlyNeeded = calculateMonthlyRequired(goal)
  const countdown = formatTimeRemaining(goal.deadline)
  const target = Number(goal.targetAmount) || 1
  const current = Number(goal.currentAmount) || 0
  const progressPct = Math.min(100, Math.round((current / target) * 100))
  const remainingAmount = Math.max(0, target - current)

  const realCount = goal._count?.contributions ?? contributionsCount
  const latestDeposit = goal.contributions?.[0]

  return (
    <div
      onClick={() => onOpenDrawer(goal, 'history')}
      className="group bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between font-sans"
    >
      <div>
        {/* Header: Name, Category & Status */}
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
              {goal.name}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400 shrink-0" />
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {goal.category && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 border border-slate-200/80 dark:border-white/[0.06]">
                  {goal.category}
                </span>
              )}
              {goal.deadline && (
                <span className="text-[11px] tabular-nums text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400 dark:text-neutral-500" />
                  <span>{countdown.text}</span>
                </span>
              )}
            </div>
          </div>

          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 border ${
            pace.status === 'completed'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : pace.status === 'overdue'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              : pace.status === 'needs_boost'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-white/[0.08]'
          }`}>
            {pace.label}
          </span>
        </div>

        {/* Progress Bar & Amounts */}
        <div className="mt-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(current)}
              </span>
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium">
                / {formatCompactCurrency(target)}
              </span>
            </div>
            <span className="text-xs font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {progressPct}%
            </span>
          </div>

          {/* Precision Track */}
          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goal.isCompleted || progressPct >= 100
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Remaining & Monthly Rate Context */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 mt-2 tabular-nums">
            <span>
              {remainingAmount > 0 ? `${formatCurrency(remainingAmount)} left` : 'Fully funded'}
            </span>
            <span>
              {goal.isCompleted || remainingAmount === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Achieved
                </span>
              ) : monthlyNeeded > 0 ? (
                <span className="font-semibold text-slate-800 dark:text-neutral-200">
                  {formatCurrency(monthlyNeeded)}/mo
                </span>
              ) : (
                'Flexible pace'
              )}
            </span>
          </div>

          {/* Last Deposit Hint */}
          {latestDeposit && (
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 tabular-nums truncate">
              Latest deposit: {formatCurrency(latestDeposit.amount)} on {formatDateForDisplay(latestDeposit.date)}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
        {!goal.isCompleted && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onOpenDrawer(goal, 'deposit')
            }}
            className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Deposit</span>
          </button>
        )}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onOpenDrawer(goal, 'history')
          }}
          className={`py-1.5 px-3 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            goal.isCompleted ? 'w-full' : ''
          }`}
        >
          <History className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-400" />
          <span>Ledger ({realCount})</span>
        </button>
      </div>
    </div>
  )
}
