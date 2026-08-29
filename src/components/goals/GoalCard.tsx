'use client'

import React from 'react'
import { Calendar, Plus, History, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
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

  return (
    <div
      onClick={() => onOpenDrawer(goal, 'history')}
      className="group bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      {/* 1. Header: Name & Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {goal.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              {goal.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200/60 dark:border-neutral-700/60">
                  {goal.category}
                </span>
              )}
              {goal.deadline && (
                <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{countdown.text}</span>
                </span>
              )}
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${pace.badgeClass}`}>
            {pace.label}
          </span>
        </div>

        {/* 2. Progress Numbers & Bar */}
        <div className="mt-3.5">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {formatCurrency(current)}
              </span>
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium">
                / {formatCurrency(target)}
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              {progressPct}%
            </span>
          </div>

          {/* Precision Track */}
          <div className="h-2 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goal.isCompleted || progressPct >= 100
                  ? 'bg-emerald-500'
                  : 'bg-slate-900 dark:bg-white'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Remaining & Monthly Rate */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 mt-2 font-mono">
            <span>
              {remainingAmount > 0 ? `${formatCurrency(remainingAmount)} left` : 'Fully funded'}
            </span>
            <span>
              {goal.isCompleted || remainingAmount === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-sans font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Achieved
                </span>
              ) : monthlyNeeded > 0 ? (
                <span className="font-bold text-slate-800 dark:text-neutral-200">
                  {formatCurrency(monthlyNeeded)}/mo
                </span>
              ) : (
                'Flexible pace'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-2">
        {!goal.isCompleted && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onOpenDrawer(goal, 'deposit')
            }}
            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-slate-100 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Money</span>
          </button>
        )}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onOpenDrawer(goal, 'history')
          }}
          className={`py-1.5 px-3 rounded-xl text-xs font-semibold border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-all flex items-center justify-center gap-1.5 ${
            goal.isCompleted ? 'w-full' : ''
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>History ({contributionsCount})</span>
        </button>
      </div>
    </div>
  )
}
