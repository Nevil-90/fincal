'use client'

import React from 'react'
import { Target, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { SavingsGoal } from './types'
import { calculateMonthlyRequired, formatTimeRemaining } from './goal-utils'

interface GoalKPIStripProps {
  goals: SavingsGoal[]
  completedGoals: SavingsGoal[]
}

export default function GoalKPIStrip({ goals, completedGoals }: GoalKPIStripProps) {
  const activeGoals = goals.filter(g => Number(g.currentAmount) < Number(g.targetAmount))
  const totalTarget = activeGoals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0)
  const totalSaved = activeGoals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0)
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0

  const totalMonthlyRequired = activeGoals.reduce((sum, g) => sum + calculateMonthlyRequired(g), 0)
  const totalAchievedAmount = completedGoals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0)

  // Nearest upcoming deadline goal
  const upcomingGoal = activeGoals
    .filter(g => g.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

  const upcomingCountdown = upcomingGoal ? formatTimeRemaining(upcomingGoal.deadline) : null

  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 font-sans">
      {/* 1. Overall Portfolio Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-neutral-300 uppercase tracking-wider">
              Portfolio Funded
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 tabular-nums text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalSaved)}
            </span>
            <span className="text-slate-500 dark:text-neutral-500 font-medium">
              / {formatCompactCurrency(totalTarget)}
            </span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 ml-0.5">
              ({overallProgress}%)
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* 2. Key Telemetry Grid: 2x2 on Mobile, 4-col on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-200/70 dark:border-white/[0.06] text-xs">
        {/* Metric 1: Monthly Commitment */}
        <div className="bg-slate-50/80 dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.04] rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> Monthly Pace
          </span>
          <div className="flex items-baseline gap-1 tabular-nums mt-1">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalMonthlyRequired)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-neutral-500">/mo</span>
          </div>
        </div>

        {/* Metric 2: Next Horizon */}
        <div className="bg-slate-50/80 dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.04] rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Next Milestone
          </span>
          {upcomingGoal ? (
            <div className="flex items-center gap-1.5 mt-1 min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[80px] sm:max-w-[110px]" title={upcomingGoal.name}>
                {upcomingGoal.name}
              </span>
              <span className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${
                upcomingCountdown?.isPast
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300'
              }`}>
                {upcomingCountdown?.text}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 dark:text-neutral-500 mt-1 block">No deadline</span>
          )}
        </div>

        {/* Metric 3: Active Goals */}
        <div className="bg-slate-50/80 dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.04] rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1">
            <Target className="w-3 h-3 text-amber-500 dark:text-amber-400" /> In Progress
          </span>
          <div className="flex items-baseline gap-1.5 tabular-nums mt-1">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {activeGoals.length}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-neutral-500">goals</span>
          </div>
        </div>

        {/* Metric 4: Achieved Capital */}
        <div className="bg-slate-50/80 dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.04] rounded-xl p-2.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> Achieved
          </span>
          <div className="flex items-baseline gap-1.5 tabular-nums mt-1">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {completedGoals.length}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-neutral-500">
              ({formatCompactCurrency(totalAchievedAmount)})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
