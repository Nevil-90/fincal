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
  Zap,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { SavingsGoal } from './types'
import { calculateMonthlyRequired, formatTimeRemaining, getGoalPace } from './goal-utils'

interface GoalHorizonStageViewProps {
  goals: SavingsGoal[]
  onOpenDrawer: (goal: SavingsGoal, tab: 'deposit' | 'history') => void
}

export default function GoalHorizonStageView({
  goals,
  onOpenDrawer
}: GoalHorizonStageViewProps) {
  // Categorize goals into 3 distinct operational horizons
  const horizons = React.useMemo(() => {
    const immediate: SavingsGoal[] = [] // < 180 days (6 months)
    const medium: SavingsGoal[] = []    // 180 - 540 days (6 - 18 months)
    const strategic: SavingsGoal[] = [] // > 540 days or open target
    const completed: SavingsGoal[] = []

    goals.forEach(goal => {
      const isAchieved = goal.isCompleted || Number(goal.currentAmount) >= Number(goal.targetAmount)
      if (isAchieved) {
        completed.push(goal)
        return
      }

      if (!goal.deadline) {
        strategic.push(goal)
        return
      }

      const countdown = formatTimeRemaining(goal.deadline)
      if (countdown.daysLeft <= 180) {
        immediate.push(goal)
      } else if (countdown.daysLeft <= 540) {
        medium.push(goal)
      } else {
        strategic.push(goal)
      }
    })

    return { immediate, medium, strategic, completed }
  }, [goals])

  const renderGoalStrip = (goal: SavingsGoal, isImmediate = false) => {
    const pace = getGoalPace(goal)
    const monthlyNeeded = calculateMonthlyRequired(goal)
    const countdown = formatTimeRemaining(goal.deadline)
    const target = Number(goal.targetAmount) || 1
    const current = Number(goal.currentAmount) || 0
    const progressPct = Math.min(100, Math.round((current / target) * 100))
    const remainingAmount = Math.max(0, target - current)
    const latestDeposit = goal.contributions?.[0]

    return (
      <div
        key={goal.id}
        className="group relative bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-2xl p-4 sm:p-5 shadow-sm transition-all space-y-3.5"
      >
        {/* Top Header: Title, Horizon Countdown, Category, Pacing Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <h4
              onClick={() => onOpenDrawer(goal, 'history')}
              className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{goal.name}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400 shrink-0" />
            </h4>

            {goal.category && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.06]">
                {goal.category}
              </span>
            )}

            {goal.deadline ? (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md tabular-nums border ${
                countdown.isPast
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20'
                  : countdown.daysLeft <= 60
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20'
                  : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-white/[0.06]'
              }`}>
                <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
                <span>{countdown.text}</span>
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                Open Horizon
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${
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

            {monthlyNeeded > 0 && (
              <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white bg-slate-100 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06] px-2.5 py-0.5 rounded-md">
                {formatCurrency(monthlyNeeded)}<span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">/mo</span>
              </span>
            )}
          </div>
        </div>

        {/* Visual Milestone Runway & Numbers */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs sm:text-sm font-bold tabular-nums">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg text-slate-900 dark:text-white">
                {formatCurrency(current)}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                / {formatCurrency(target)}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                {remainingAmount > 0 ? `${formatCurrency(remainingAmount)} remaining` : 'Fully funded'}
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {progressPct}%
              </span>
            </div>
          </div>

          {/* Full Runway Precision Track */}
          <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goal.isCompleted || progressPct >= 100
                  ? 'bg-emerald-500'
                  : isImmediate
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Interactive Quick Allocation Dock & Ledger Shortcut */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06]">
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
            {latestDeposit ? (
              <span className="tabular-nums">
                Latest deposit: <strong className="text-slate-900 dark:text-white">+{formatCurrency(latestDeposit.amount)}</strong> on {formatDateForDisplay(latestDeposit.date)}
              </span>
            ) : (
              <span>No contributions logged yet</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!goal.isCompleted && (
              <button
                type="button"
                onClick={() => onOpenDrawer(goal, 'deposit')}
                className="flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Contribution</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenDrawer(goal, 'history')}
              className="flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#16161a] dark:hover:bg-[#202026] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Imminent / Active Horizons (< 6 Months) */}
      {horizons.immediate.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                Active Milestones · Next 6 Months
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 tabular-nums">
                {horizons.immediate.length} targets
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:inline">
              Requires active monthly contribution to achieve on time
            </span>
          </div>

          <div className="space-y-3">
            {horizons.immediate.map(goal => renderGoalStrip(goal, true))}
          </div>
        </div>
      )}

      {/* 2. Medium-Term Horizons (6–18 Months) */}
      {horizons.medium.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                Medium-Term Runway · 6 to 18 Months
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 tabular-nums">
                {horizons.medium.length} targets
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {horizons.medium.map(goal => renderGoalStrip(goal, false))}
          </div>
        </div>
      )}

      {/* 3. Strategic & Open-Ended Targets (> 18 Months / Open) */}
      {horizons.strategic.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                Strategic Horizons & Ongoing Targets
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 tabular-nums">
                {horizons.strategic.length} targets
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {horizons.strategic.map(goal => renderGoalStrip(goal, false))}
          </div>
        </div>
      )}

      {/* 4. Conquered Milestones (Achieved Goals) */}
      {horizons.completed.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                Conquered Milestones
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                {horizons.completed.length} achieved
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
              Total capital accumulated: {formatCurrency(horizons.completed.reduce((s, g) => s + Number(g.targetAmount || 0), 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {horizons.completed.map(goal => (
              <div
                key={goal.id}
                onClick={() => onOpenDrawer(goal, 'history')}
                className="bg-white dark:bg-[#121215] border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {goal.name}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Achieved
                    </span>
                  </div>
                  <p className="text-xs font-bold tabular-nums text-slate-500 dark:text-zinc-400 mt-1">
                    {formatCurrency(goal.targetAmount)} funded
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
