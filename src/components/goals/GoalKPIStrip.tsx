'use client'

import React from 'react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { SavingsGoal } from './types'
import { calculateMonthlyRequired, formatTimeRemaining } from './goal-utils'

interface GoalKPIStripProps {
  goals: SavingsGoal[]
  completedGoals: SavingsGoal[]
}

export default function GoalKPIStrip({ goals, completedGoals }: GoalKPIStripProps) {
  const activeGoals = goals.filter(g => Number(g.currentAmount) < Number(g.targetAmount))
  const totalTarget = activeGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0)
  const totalSaved = activeGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0)
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0

  const totalMonthlyRequired = activeGoals.reduce((sum, g) => sum + calculateMonthlyRequired(g), 0)
  const totalAchievedAmount = completedGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0)

  // Nearest upcoming deadline goal
  const upcomingGoal = activeGoals
    .filter(g => g.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

  const upcomingCountdown = upcomingGoal ? formatTimeRemaining(upcomingGoal.deadline) : null

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-2xl p-3 sm:p-4.5 shadow-sm space-y-3">
      {/* 1. Overall Portfolio Progress (Mobile + Desktop) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-white shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Portfolio Savings
            </span>
          </div>
          <div className="flex items-baseline gap-1 font-mono text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalSaved)}
            </span>
            <span className="text-slate-400 dark:text-neutral-500 font-medium">
              / {formatCompactCurrency(totalTarget)}
            </span>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white ml-0.5">
              ({overallProgress}%)
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* 2. Key Metrics Row (Responsive 3-Column on Mobile & Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-100 dark:border-neutral-800 text-xs">
        {/* Metric 1: Monthly Run-rate */}
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block truncate">
            Monthly Target
          </span>
          <div className="flex items-baseline gap-1 font-mono mt-0.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalMonthlyRequired)}
            </span>
            <span className="text-[10px] text-slate-400">/mo</span>
          </div>
        </div>

        {/* Metric 2: Next Deadline */}
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block truncate">
            Next Milestone
          </span>
          {upcomingGoal ? (
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate max-w-[85px] sm:max-w-[120px]" title={upcomingGoal.name}>
                {upcomingGoal.name}
              </span>
              <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                upcomingCountdown?.isPast
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
              }`}>
                {upcomingCountdown?.text}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 block">Flexible</span>
          )}
        </div>

        {/* Metric 3: Completed Count */}
        <div className="col-span-2 sm:col-span-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block truncate">
            Completed Goals
          </span>
          <div className="flex items-center gap-1 font-mono mt-0.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {completedGoals.length}
            </span>
            <span className="text-[11px] text-slate-400">
              ({formatCompactCurrency(totalAchievedAmount)})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
