'use client'

import React from 'react'
import { Calendar, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { SavingsGoal } from './types'
import { formatTimeRemaining, getGoalPace, calculateMonthlyRequired } from './goal-utils'

interface GoalMilestoneTimelineProps {
  goals: SavingsGoal[]
  onOpenDrawer: (goal: SavingsGoal, tab: 'deposit' | 'history') => void
}

export default function GoalMilestoneTimeline({ goals, onOpenDrawer }: GoalMilestoneTimelineProps) {
  // Sort goals by deadline (those with deadlines first chronologically, then open targets)
  const sortedGoals = [...goals].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  if (sortedGoals.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-8 text-center text-slate-500 dark:text-neutral-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs font-semibold">No goals to plot on the milestone runway.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.06] pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            Milestone Runway & Target Horizon
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
            Chronological target distribution to forecast required capital.
          </p>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/[0.08]">
        {sortedGoals.map((goal, idx) => {
          const pace = getGoalPace(goal)
          const countdown = formatTimeRemaining(goal.deadline)
          const target = Number(goal.targetAmount) || 1
          const current = Number(goal.currentAmount) || 0
          const progressPct = Math.min(100, Math.round((current / target) * 100))
          const remainingAmount = Math.max(0, target - current)
          const monthly = calculateMonthlyRequired(goal)

          return (
            <div
              key={goal.id}
              onClick={() => onOpenDrawer(goal, 'history')}
              className="relative group bg-slate-50/80 dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-3 sm:p-3.5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              {/* Timeline pin indicator */}
              <div
                className={`absolute -left-6 sm:-left-8 top-4 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#121215] transition-transform group-hover:scale-125 ${
                  goal.isCompleted || progressPct >= 100
                    ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                    : pace.status === 'overdue'
                    ? 'bg-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-blue-500 ring-2 ring-blue-500/30'
                }`}
              />

              {/* Goal metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {goal.name}
                  </span>
                  {goal.category && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 border border-slate-200/80 dark:border-white/[0.06]">
                      {goal.category}
                    </span>
                  )}
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    goal.isCompleted
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : pace.status === 'overdue'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300'
                  }`}>
                    {pace.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-neutral-400 mt-1 tabular-nums flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400 dark:text-neutral-500" />
                    {goal.deadline
                      ? formatDateForDisplay(goal.deadline)
                      : 'Open horizon'}
                  </span>
                  <span>•</span>
                  <span>{countdown.text}</span>
                  {monthly > 0 && !goal.isCompleted && (
                    <>
                      <span>•</span>
                      <span className="text-slate-800 dark:text-neutral-300 font-semibold">{formatCurrency(monthly)}/mo</span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress & Quick Action */}
              <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                <div className="w-32 sm:w-40 text-right">
                  <div className="flex items-baseline justify-between text-xs tabular-nums mb-1">
                    <span className="text-slate-500 dark:text-neutral-400 font-medium">{progressPct}%</span>
                    <span className="text-slate-900 dark:text-white font-bold">{formatCompactCurrency(current)} / {formatCompactCurrency(target)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/80 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.isCompleted || progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="p-1 text-slate-400 hover:text-slate-900 dark:text-neutral-500 dark:hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
