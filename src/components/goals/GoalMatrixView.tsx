'use client'

import React from 'react'
import {
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronRight
} from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { SavingsGoal } from './types'
import { calculateMonthlyRequired, formatTimeRemaining, getGoalPace } from './goal-utils'

interface GoalMatrixViewProps {
  goals: SavingsGoal[]
  onOpenDrawer: (goal: SavingsGoal, tab: 'deposit' | 'history') => void
}

export default function GoalMatrixView({
  goals,
  onOpenDrawer
}: GoalMatrixViewProps) {
  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Desktop Table Header */}
      <div className="hidden lg:grid grid-cols-[1.8fr_1fr_1.4fr_1fr_1fr_1.2fr] items-center px-4 py-3 bg-slate-50 dark:bg-[#16161a] border-b border-slate-200/80 dark:border-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        <div>Milestone & Horizon</div>
        <div>Pacing Status</div>
        <div>Target & Capital</div>
        <div>Progress %</div>
        <div>Required Run-Rate</div>
        <div className="text-right">Actions</div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
        {goals.map(goal => {
          const pace = getGoalPace(goal)
          const monthlyNeeded = calculateMonthlyRequired(goal)
          const countdown = formatTimeRemaining(goal.deadline)
          const target = Number(goal.targetAmount) || 1
          const current = Number(goal.currentAmount) || 0
          const progressPct = Math.min(100, Math.round((current / target) * 100))
          const remainingAmount = Math.max(0, target - current)

          return (
            <div
              key={goal.id}
              className="p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-[#16161a] transition-colors flex flex-col lg:grid lg:grid-cols-[1.8fr_1fr_1.4fr_1fr_1fr_1.2fr] lg:items-center gap-3"
            >
              {/* Col 1: Name & Horizon */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    onClick={() => onOpenDrawer(goal, 'history')}
                    className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer truncate"
                  >
                    {goal.name}
                  </h4>
                  {goal.category && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.06]">
                      {goal.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                  <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                  <span>{countdown.text}</span>
                  {goal.deadline && (
                    <span className="text-slate-400 dark:text-zinc-500">
                      ({formatDateForDisplay(goal.deadline, '', { month: 'short', year: 'numeric' })})
                    </span>
                  )}
                </div>
              </div>

              {/* Col 2: Pacing Status */}
              <div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                  pace.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : pace.status === 'overdue'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    : pace.status === 'needs_boost'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-white/[0.08]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pace.dotClass}`} />
                  <span>{pace.label}</span>
                </span>
              </div>

              {/* Col 3: Target & Capital */}
              <div className="tabular-nums">
                <div className="flex items-baseline gap-1 text-xs font-bold text-slate-900 dark:text-white">
                  <span>{formatCurrency(current)}</span>
                  <span className="text-[10px] font-normal text-slate-400 dark:text-zinc-500">/ {formatCurrency(target)}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {remainingAmount > 0 ? `${formatCurrency(remainingAmount)} left` : 'Fully funded'}
                </span>
              </div>

              {/* Col 4: Progress % */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                  <span className="text-blue-600 dark:text-blue-400">{progressPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      goal.isCompleted || progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Col 5: Monthly Rate */}
              <div className="tabular-nums">
                {monthlyNeeded > 0 ? (
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(monthlyNeeded)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">per month</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-zinc-500">Flexible</span>
                )}
              </div>

              {/* Col 6: Actions */}
              <div className="flex items-center justify-end gap-1.5 self-end lg:self-auto">
                {!goal.isCompleted && (
                  <button
                    type="button"
                    onClick={() => onOpenDrawer(goal, 'deposit')}
                    className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Deposit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenDrawer(goal, 'history')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="View ledger"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
