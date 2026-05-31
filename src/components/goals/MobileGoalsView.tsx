import { Plus, Target, Trophy } from 'lucide-react'
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goals</h2>
          <p className="text-gray-500 text-sm mt-1">Track and manage your savings</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-5 rounded-2xl font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 animate-slide-in"
        >
          <Plus className="h-5 w-5" /> <span className="hidden sm:inline">New Goal</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setGoalFilter('active')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${goalFilter === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Active
        </button>
        <button
          onClick={() => setGoalFilter('achieved')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${goalFilter === 'achieved' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Achieved
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative items-start w-full">
        {/* Left Side: Goals List */}
        <div className={`transition-all duration-300 ease-in-out ${(selectedGoal || selectedCompletedGoal) ? 'w-full lg:flex-1' : 'w-full'}`}>
          {/* Goal Cards Grid */}
          {goalFilter === 'active' && (
            filteredGoals.length === 0 ? (
              <div className="text-center py-20 px-4 bg-white border border-gray-100 rounded-[32px] shadow-sm">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Goals</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">Create a savings goal to track your progress towards your next big purchase or milestone.</p>
                <button onClick={() => setShowAddForm(true)} className="text-purple-600 font-bold hover:text-purple-700">
                  + Create your first goal
                </button>
              </div>
            ) : (
              <div className={`grid gap-5 ${selectedGoal ? 'grid-cols-1 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2 lg:grid-cols-1 lg:[&>*:last-child:nth-child(odd)]:col-span-1 2xl:grid-cols-2 2xl:[&>*:last-child:nth-child(odd)]:col-span-2' : 'grid-cols-1 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2 lg:grid-cols-3 lg:[&>*:last-child:nth-child(odd)]:col-span-1'}`}>
                {filteredGoals.map((goal) => {
                  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                  return (
                    <div
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Target className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{goal.name}</h4>
                            {goal.deadline && (
                              <p className="text-xs font-medium text-gray-500">
                                By {new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mb-2 flex flex-wrap justify-between items-end gap-x-2">
                        <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
                          {formatCurrency(goal.currentAmount)}
                        </p>
                        <p className="text-sm font-semibold text-gray-400 mb-1">
                          / {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-4 border-t border-gray-100 pt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGoal(goal.id);
                          }}
                          className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
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

          {goalFilter === 'achieved' && (
            completedGoals.length === 0 ? (
              <div className="text-center py-20 px-4 bg-white border border-gray-100 rounded-[32px] shadow-sm">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Achieved Goals</h3>
                <p className="text-gray-500">Keep saving! Your completed goals will appear here.</p>
              </div>
            ) : (
              <div className={`grid gap-5 ${(selectedGoal || selectedCompletedGoal) ? 'grid-cols-1 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2 lg:grid-cols-1 lg:[&>*:last-child:nth-child(odd)]:col-span-1 xl:grid-cols-2 xl:[&>*:last-child:nth-child(odd)]:col-span-2' : 'grid-cols-1 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2 lg:grid-cols-3 lg:[&>*:last-child:nth-child(odd)]:col-span-1'}`}>
                {completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedCompletedGoal(goal.id)}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                          <Trophy className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-green-950 text-lg">{goal.name}</h4>
                          <p className="text-xs font-semibold text-green-600">
                            Achieved {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200/50 flex flex-wrap justify-between items-end gap-x-2">
                      <p className="text-2xl font-extrabold text-green-700 tracking-tight">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Right Side: Detail Panels */}
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
    </div>
  )
}
