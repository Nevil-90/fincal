import { Trophy, ChevronDown, History, Trash2 } from 'lucide-react'
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity touch-none lg:hidden" onClick={() => setSelectedCompletedGoal(null)}></div>
      <div className="bg-white rounded-t-[32px] sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] lg:max-h-none lg:max-w-none relative z-10 animate-slide-up lg:animate-none shadow-2xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:border lg:border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white flex justify-between items-start sticky top-0 z-20">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Trophy className="h-3.5 w-3.5" /> Goal Achieved
            </div>
            <h3 className="text-3xl font-bold leading-tight">{g.name}</h3>
            <p className="text-green-50 mt-2 font-medium">
              {formatCurrency(g.targetAmount)} completed on {g.completedAt ? new Date(g.completedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDeleteGoal(g)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              title="Delete Completed Goal"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={() => setSelectedCompletedGoal(null)} className="p-2.5 bg-black/10 hover:bg-black/20 rounded-full transition-colors backdrop-blur-md lg:ml-2">
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto min-h-0 overscroll-contain bg-gray-50 p-6 pb-safe">
          <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" /> Contribution Journey
          </h5>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            {loadingContributions === selectedCompletedGoal ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {(contributions[selectedCompletedGoal] || g.contributions || []).map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-3 -mx-3 rounded-2xl hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm">
                        +
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{formatCurrency(c.amount)}</p>
                        <p className="text-xs font-medium text-gray-500">
                          {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!contributions[selectedCompletedGoal] && !g.contributions?.length) && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-medium">No contribution data found</p>
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
