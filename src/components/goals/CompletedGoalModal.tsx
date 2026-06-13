// Component for CompletedGoalModal.tsx
import { Trophy, History, Trash2, X, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { SavingsGoal, GoalContribution } from './types'
import { useEffect } from 'react'

interface CompletedGoalModalProps {
  selectedCompletedGoal: string | null
  completedGoals: SavingsGoal[]
  setSelectedCompletedGoal: (id: string | null) => void
  loadingContributions: string | null
  contributions: Record<string, GoalContribution[]>
  handleDeleteGoal: (goal: SavingsGoal) => void
  handleDeleteContribution?: (id: string, goalId: string) => void
}

export function CompletedGoalModal({
  selectedCompletedGoal,
  completedGoals,
  setSelectedCompletedGoal,
  loadingContributions,
  contributions,
  handleDeleteGoal,
  handleDeleteContribution
}: CompletedGoalModalProps) {
  useEffect(() => {
    if (selectedCompletedGoal && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [selectedCompletedGoal])

  if (!selectedCompletedGoal) return null
  const g = completedGoals.find(c => c.id === selectedCompletedGoal)
  if (!g) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:sticky lg:top-6 lg:inset-auto lg:z-auto lg:p-0 lg:block lg:w-[420px] xl:w-[450px] lg:shrink-0 lg:flex-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity touch-none lg:hidden"
        onClick={() => setSelectedCompletedGoal(null)}
      />

      {/* Sheet */}
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] lg:max-h-none lg:max-w-none relative z-10 animate-slide-up lg:animate-none shadow-2xl lg:shadow-sm lg:border lg:border-slate-200/70 dark:lg:border-neutral-800 flex flex-col overflow-hidden">

        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-9 h-1 bg-slate-200 dark:bg-neutral-700 rounded-full" />
        </div>

        {/* Celebratory Header */}
        <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative flex justify-between items-start sticky top-0 z-20 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 min-w-0 flex-1 pr-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Trophy className="h-3 w-3 text-amber-300" /> Goal Achieved 🎉
            </div>
            <h3 className="text-xl font-bold leading-snug truncate">{g.name}</h3>
            <p className="text-emerald-100 text-sm mt-1.5 font-medium">
              {formatCurrency(g.targetAmount)} completed on{' '}
              {g.completedAt ? new Date(g.completedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 relative z-10 shrink-0">
            <button
              onClick={() => handleDeleteGoal(g)}
              className="p-1.5 bg-white/15 hover:bg-rose-500/70 text-white rounded-lg transition-colors cursor-pointer"
              title="Delete Completed Goal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedCompletedGoal(null)}
              className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contribution History */}
        <div className="overflow-y-auto min-h-0 overscroll-contain bg-slate-50 dark:bg-neutral-950 p-5 pb-safe flex-1 custom-scrollbar">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-emerald-500" />
            <h5 className="font-bold text-slate-900 dark:text-white text-sm">Contribution Journey</h5>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            {loadingContributions === selectedCompletedGoal ? (
              <div className="p-5 animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-200 dark:bg-neutral-700 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-neutral-700 rounded w-24 mb-1.5" />
                      <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {(contributions[selectedCompletedGoal] || g.contributions || []).length > 0 ? (
                  <div className="divide-y divide-slate-50 dark:divide-neutral-800">
                    {(contributions[selectedCompletedGoal] || g.contributions || []).map((c) => (
                      <div key={c.id} className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">+{formatCurrency(c.amount)}</p>
                            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                              {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-5">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <History className="h-6 w-6 text-slate-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-slate-500 dark:text-neutral-400 font-semibold">No contribution data found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
