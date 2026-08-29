import { SavingsGoal } from './types'

/**
 * Calculates accurate required monthly contribution to reach target amount by deadline.
 */
export function calculateMonthlyRequired(goal: SavingsGoal): number {
  if (goal.isCompleted || Number(goal.currentAmount) >= Number(goal.targetAmount)) return 0
  if (!goal.deadline) return 0

  const remainingAmount = Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount))
  const today = new Date()
  const deadline = new Date(goal.deadline)

  const diffTime = deadline.getTime() - today.getTime()
  if (diffTime <= 0) return remainingAmount

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const monthsRemaining = Math.max(0.5, diffDays / 30.4375)

  return Math.round(remainingAmount / monthsRemaining)
}

/**
 * Formats time remaining in a human-friendly format (e.g. "14d left", "3 mo left", "Due today").
 */
export function formatTimeRemaining(deadline?: string | null): { text: string; isPast: boolean; daysLeft: number } {
  if (!deadline) return { text: 'Open Target', isPast: false, daysLeft: Infinity }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(deadline)
  target.setHours(0, 0, 0, 0)

  const diffMs = target.getTime() - today.getTime()
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft)
    return { text: `${overdueDays}d overdue`, isPast: true, daysLeft }
  }
  if (daysLeft === 0) {
    return { text: 'Due today', isPast: false, daysLeft: 0 }
  }
  if (daysLeft === 1) {
    return { text: '1d left', isPast: false, daysLeft: 1 }
  }
  if (daysLeft < 30) {
    return { text: `${daysLeft}d left`, isPast: false, daysLeft }
  }
  if (daysLeft < 365) {
    const months = Math.round(daysLeft / 30.4)
    return { text: `${months}mo left`, isPast: false, daysLeft }
  }
  const years = (daysLeft / 365).toFixed(1)
  return { text: `${years}y left`, isPast: false, daysLeft }
}

/**
 * Evaluates pacing status using clean, restrained fintech styling:
 * 'completed' | 'on_track' | 'needs_boost' | 'overdue'
 */
export function getGoalPace(goal: SavingsGoal): {
  status: 'completed' | 'on_track' | 'needs_boost' | 'overdue'
  label: string
  badgeClass: string
  dotClass: string
} {
  const target = Number(goal.targetAmount) || 1
  const current = Number(goal.currentAmount) || 0
  const progressPct = (current / target) * 100

  if (goal.isCompleted || progressPct >= 100) {
    return {
      status: 'completed',
      label: 'Achieved',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-500/20',
      dotClass: 'bg-emerald-500'
    }
  }

  if (!goal.deadline) {
    return {
      status: 'on_track',
      label: 'Flexible',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700',
      dotClass: 'bg-slate-400'
    }
  }

  const { isPast } = formatTimeRemaining(goal.deadline)
  if (isPast) {
    return {
      status: 'overdue',
      label: 'Past Due',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-500/20',
      dotClass: 'bg-rose-500'
    }
  }

  const createdTime = goal.createdAt ? new Date(goal.createdAt).getTime() : new Date().getTime() - (30 * 86400000)
  const targetTime = new Date(goal.deadline).getTime()
  const totalDuration = Math.max(1, targetTime - createdTime)
  const timeElapsed = Math.max(0, new Date().getTime() - createdTime)
  const expectedProgress = Math.min(100, (timeElapsed / totalDuration) * 100)

  if (progressPct >= expectedProgress - 5) {
    return {
      status: 'on_track',
      label: 'On Track',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-500/20',
      dotClass: 'bg-emerald-500'
    }
  }

  return {
    status: 'needs_boost',
    label: 'Needs Boost',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-500/20',
    dotClass: 'bg-amber-500'
  }
}
