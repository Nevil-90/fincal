// Mobile-optimized view for listing active and completed savings goals.
import { Plus, Target, Trophy, TrendingUp, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { SavingsGoal, GoalContribution } from './types'
import { MobileActiveGoalModal } from './MobileActiveGoalModal'
import { CompletedGoalModal } from './CompletedGoalModal'

interface QuickContribution {
  amount: string
  date: string
  paymentMethod: string
  description: string
}

interface MobileGoalsViewProps {
  goalFilter: 'active' | 'achieved' | 'bulk_add' | string
  setGoalFilter: (filter: 'active' | 'achieved' | 'bulk_add' | string) => void
  setShowAddForm: (show: boolean) => void
  filteredGoals: SavingsGoal[]
  completedGoals: SavingsGoal[]
  selectedGoal: string | null
  setSelectedGoal: (id: string | null) => void
  selectedCompletedGoal: string | null
  setSelectedCompletedGoal: (id: string | null) => void
  // Props for Modals
  monthlySavingRequired: number
  monthlySavingPotential: number
  detailTab: 'quick' | 'history'
  setDetailTab: (tab: 'quick' | 'history') => void
  quickContribution: QuickContribution
  setQuickContribution: React.Dispatch<React.SetStateAction<QuickContribution>>
  handleQuickAddContribution: (e: React.FormEvent) => void
  handleDeleteContribution: (id: string, goalId: string) => void
  contributions: Record<string, GoalContribution[]>
  loadingContributions: string | null
  handleDeleteGoal: (goal: SavingsGoal) => void
}

export function MobileGoalsView({
  goalFilter,
  setGoalFilter,
  setShowAddForm,
  filteredGoals,
  completedGoals,
  selectedGoal,
  setSelectedGoal,
  selectedCompletedGoal,
  setSelectedCompletedGoal,
  monthlySavingRequired,
  monthlySavingPotential,
  detailTab,
  setDetailTab,
  quickContribution,
  setQuickContribution,
  handleQuickAddContribution,
  handleDeleteContribution,
  contributions,
  loadingContributions,
  handleDeleteGoal
}: MobileGoalsViewProps) {
  const currentGoal = filteredGoals.find(g => g.id === selectedGoal)

  return (
    <div className="lg:hidden pb-24 sm:pb-6 relative min-h-screen">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Goals</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-xs mt-0.5">Track and manage your savings</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white h-10 px-4 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-violet-500/25 transition-all active:scale-[0.96] text-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Goal</span>
        </button>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1.5 mb-5 p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl w-fit">
        {[
          { id: 'active', label: 'Active', count: filteredGoals.length, icon: <Target className="h-3.5 w-3.5" /> },
          { id: 'achieved', label: 'Achieved', count: completedGoals.length, icon: <Trophy className="h-3.5 w-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setGoalFilter(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              goalFilter === tab.id
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              goalFilter === tab.id
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                : 'bg-slate-200 dark:bg-neutral-700 text-slate-400 dark:text-neutral-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Goal Cards ── */}
      <div className="w-full">

        {/* Active Goals */}
        {goalFilter === 'active' && (
          filteredGoals.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl py-16 px-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Active Goals</h3>
              <p className="text-slate-500 dark:text-neutral-400 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                Create a savings goal to track progress towards your next big purchase or milestone.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 transition-all cursor-pointer active:scale-[0.97]"
              >
                + Create your first goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredGoals.map((goal) => {
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

                const progressColor = progress >= 75
                  ? 'from-emerald-500 to-teal-500'
                  : progress >= 40
                    ? 'from-violet-500 to-indigo-500'
                    : 'from-amber-500 to-orange-500'

                const badgeColor = progress >= 75
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : progress >= 40
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'

                return (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] flex flex-col gap-4"
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-11 w-11 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                          <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">{goal.name}</h4>
                          {goal.deadline && (
                            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                              By {new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${badgeColor}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>

                    {/* Amounts */}
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                          {formatCurrency(goal.currentAmount)}
                        </p>
                        <p className="text-sm text-slate-400 dark:text-neutral-500 font-medium">
                          / {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${progressColor} h-full rounded-full transition-all duration-1000`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                          {formatCurrency(remaining)} remaining
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-1 border-t border-slate-100 dark:border-neutral-800">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedGoal(goal.id) }}
                        className="w-full py-2.5 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/35 text-violet-700 dark:text-violet-400 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add Funds
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Achieved Goals */}
        {goalFilter === 'achieved' && (
          completedGoals.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl py-16 px-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Achieved Goals</h3>
              <p className="text-slate-500 dark:text-neutral-400 text-sm max-w-xs mx-auto leading-relaxed">
                Keep saving! Your completed goals will appear here once you hit your targets.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => setSelectedCompletedGoal(goal.id)}
                  className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] flex flex-col gap-3 ${
                    selectedCompletedGoal === goal.id
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/70 dark:bg-emerald-900/15 shadow-md'
                      : 'border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-900/15 dark:to-teal-900/10 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-11 w-11 bg-white dark:bg-neutral-900 rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform shrink-0">
                        <Trophy className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">{goal.name}</h4>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Achieved {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      ✓ Done
                    </span>
                  </div>

                  <div className="pt-3 border-t border-emerald-100/60 dark:border-emerald-900/30 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Target Reached</span>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <MobileActiveGoalModal
        selectedGoal={selectedGoal}
        setSelectedGoal={setSelectedGoal}
        currentGoal={currentGoal}
        monthlySavingRequired={monthlySavingRequired}
        monthlySavingPotential={monthlySavingPotential}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        quickContribution={quickContribution}
        setQuickContribution={setQuickContribution}
        handleQuickAddContribution={handleQuickAddContribution}
        handleDeleteContribution={handleDeleteContribution}
        contributions={contributions}
        loadingContributions={loadingContributions}
        handleDeleteGoal={handleDeleteGoal}
      />

      <CompletedGoalModal
        selectedCompletedGoal={selectedCompletedGoal}
        setSelectedCompletedGoal={setSelectedCompletedGoal}
        completedGoals={completedGoals}
        contributions={contributions}
        loadingContributions={loadingContributions}
        handleDeleteContribution={handleDeleteContribution}
        handleDeleteGoal={handleDeleteGoal}
      />
    </div>
  )
}
