import { Target, Trophy, Sparkles, Plus, Filter, History, Clock, Save, Loader2, Calendar, Trash2, Check, AlertTriangle, Lightbulb } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { SavingsGoal, GoalContribution, BulkEntry } from './types'
import { DesktopRightPane } from './DesktopRightPane'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'

interface QuickContribution {
  amount: string
  date: string
  paymentMethod: string
  description: string
}

interface DesktopGoalsViewProps {
  goalFilter: 'overview' | 'active' | 'achieved' | 'bulk_add'
  setGoalFilter: (filter: 'overview' | 'active' | 'achieved' | 'bulk_add') => void
  setShowAddForm: (show: boolean) => void
  filteredGoals: SavingsGoal[]
  completedGoals: SavingsGoal[]
  goals: SavingsGoal[]
  selectedGoal: string | null
  setSelectedGoal: (id: string | null) => void
  selectedCompletedGoal: string | null
  setSelectedCompletedGoal: (id: string | null) => void
  viewMode: 'cards' | 'list'
  setViewMode: (mode: 'cards' | 'list') => void
  desktopSort: 'priority' | 'deadline' | 'progress' | 'name'
  setDesktopSort: (sort: 'priority' | 'deadline' | 'progress' | 'name') => void
  getSortedGoals: (goalsList: SavingsGoal[]) => SavingsGoal[]
  overallProgress: number
  totalActiveSaved: number
  totalActiveTarget: number
  totalMonthlySavingRequired: number
  monthlySavingPotential: number
  nextMilestoneGoal?: SavingsGoal
  totalCompletedSaved: number
  calculatePace: (goal: SavingsGoal) => number
  // Props for DesktopRightPane
  contributions: Record<string, GoalContribution[]>
  loadingContributions: string | null
  detailTab: 'quick' | 'history'
  setDetailTab: (tab: 'quick' | 'history') => void
  quickContribution: QuickContribution
  setQuickContribution: React.Dispatch<React.SetStateAction<QuickContribution>>
  handleQuickAddContribution: (e: React.FormEvent) => void
  handleDeleteContribution: (id: string, goalId: string) => void
  handleDeleteGoal: (goal: SavingsGoal) => void
  availableBalance: number
  // Props for Bulk Add
  bulkEntries: BulkEntry[]
  handleBulkEntryChange: (entryId: string, field: keyof BulkEntry, value: string) => void
  handleSaveBulkAllocation: (e: React.FormEvent) => void
  handleAddBulkRow: (goalId: string) => void
  handleRemoveBulkRow: (entryId: string) => void
  bulkSaving: boolean
}

export function DesktopGoalsView({
  goalFilter,
  setGoalFilter,
  setShowAddForm,
  filteredGoals,
  completedGoals,
  goals,
  selectedGoal,
  setSelectedGoal,
  selectedCompletedGoal,
  setSelectedCompletedGoal,
  viewMode,
  setViewMode,
  desktopSort,
  setDesktopSort,
  getSortedGoals,
  overallProgress,
  totalActiveSaved,
  totalActiveTarget,
  totalMonthlySavingRequired,
  monthlySavingPotential,
  nextMilestoneGoal,
  totalCompletedSaved,
  calculatePace,
  contributions,
  loadingContributions,
  detailTab,
  setDetailTab,
  quickContribution,
  setQuickContribution,
  handleQuickAddContribution,
  handleDeleteContribution,
  handleDeleteGoal,
  availableBalance,
  bulkEntries,
  handleBulkEntryChange,
  handleSaveBulkAllocation,
  handleAddBulkRow,
  handleRemoveBulkRow,
  bulkSaving
}: DesktopGoalsViewProps) {
  const { data: staticData } = useEnhancedStaticData()

  // Calculate bulk total on the fly
  const currentBulkTotal = bulkEntries.reduce((sum, entry) => {
    const amt = parseFloat(entry.amount)
    return sum + (isNaN(amt) ? 0 : amt)
  }, 0)

  return (
    <div className="hidden lg:flex flex-col gap-4 relative h-[calc(100vh-200px)] overflow-hidden text-slate-800 animate-fade-in w-full">
      {/* 1. Header Row */}
      <div className="flex justify-between items-center w-full">
        <div className="min-w-0 pr-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 truncate">
            Goals Dashboard <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Pro</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 truncate">Redesigned financial target tracking and velocity analyzer.</p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-9 px-4 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 hover:shadow-lg transition-all active:scale-[0.98] text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Goal
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-row items-center gap-2 overflow-x-auto w-full border-b border-slate-200 pb-2 shrink-0">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'active', label: `Active Goals (${filteredGoals.length})` },
          { id: 'achieved', label: `Achieved (${completedGoals.length})` },
          { id: 'bulk_add', label: 'Bulk Add' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setGoalFilter(tab.id as any)
              if (tab.id !== 'active') setSelectedGoal(null)
              if (tab.id !== 'achieved') setSelectedCompletedGoal(null)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              goalFilter === tab.id 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden w-full gap-5">
        
        {/* OVERVIEW TAB CONTENT */}
        {goalFilter === 'overview' && (
          <div className="flex flex-col gap-5 w-full h-full overflow-y-auto pr-2 custom-scrollbar">
            {/* Executive Summary Metrics Grid */}
            <div className="grid grid-cols-4 gap-4 shrink-0">
              {/* Card 1: Portfolio Progress */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Portfolio Progress</span>
                  <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Target className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {overallProgress.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {formatCurrency(totalActiveSaved)} / {formatCurrency(totalActiveTarget)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card 2: Savings Velocity Analyzer */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Savings Velocity</span>
                  {monthlySavingPotential >= totalMonthlySavingRequired ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md uppercase tracking-wider">
                      On Track
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md uppercase tracking-wider">
                      Under Pace
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Monthly Needed</span>
                      <span className="text-base font-black text-slate-900 leading-none mt-1">
                        {formatCurrency(totalMonthlySavingRequired)}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Savings Capacity</span>
                      <span className="text-xs font-bold text-slate-600 leading-none mt-1">
                        {formatCurrency(monthlySavingPotential)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 truncate">
                    {monthlySavingPotential >= totalMonthlySavingRequired 
                      ? <span className="flex items-center gap-1"><Check className="h-2.5 w-2.5 text-emerald-500" /> Capability covers required pace.</span>
                      : <span className="flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5 text-orange-500" /> Increase savings or extend deadlines.</span>}
                  </p>
                </div>
              </div>

              {/* Card 3: Landmark Milestone */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next Landmark</span>
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  {nextMilestoneGoal ? (
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs truncate leading-none mb-2">{nextMilestoneGoal.name}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] font-semibold text-slate-400">
                          Due: {new Date(nextMilestoneGoal.deadline!).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded leading-none">
                          {Math.min((nextMilestoneGoal.currentAmount / nextMilestoneGoal.targetAmount) * 100, 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-2">No active deadline goals.</p>
                  )}
                </div>
              </div>

              {/* Card 4: Achievements */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Achievements</span>
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Trophy className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-black text-slate-900 leading-none">{completedGoals.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Goals Achieved</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    Total saved: {formatCurrency(totalCompletedSaved)}
                  </p>
                </div>
              </div>
            </div>

            {/* Goal Coach Panel */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Goal Coach & Insights</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Personal Finance assistant</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 [&>*:last-child:nth-child(odd)]:col-span-2">
                {/* Advice column */}
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-indigo-50/75 to-purple-50/40 border border-indigo-100/50 rounded-2xl">
                    <p className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5 mb-2">
                      <span className="flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Coach Allocation Advice</span>
                    </p>
                    
                    {(() => {
                      const readyToCompleteGoal = goals
                        .filter(g => !g.isCompleted)
                        .find(g => (g.targetAmount - g.currentAmount) <= availableBalance)

                      const highestProgressGoal = [...goals]
                        .filter(g => !g.isCompleted)
                        .sort((a, b) => {
                          const progA = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : 0
                          const progB = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : 0
                          return progB - progA
                        })[0]

                      if (readyToCompleteGoal) {
                        return (
                          <p className="text-xs text-slate-700 leading-relaxed">
                            Fantastic! You have an available balance of <strong>{formatCurrency(availableBalance)}</strong>, which is enough to immediately achieve your <strong>"{readyToCompleteGoal.name}"</strong> goal (needs {formatCurrency(readyToCompleteGoal.targetAmount - readyToCompleteGoal.currentAmount)}). Head to the Active Goals tab to fund it!
                          </p>
                        )
                      } else if (highestProgressGoal) {
                        return (
                          <p className="text-xs text-slate-700 leading-relaxed">
                            Your goal <strong>"{highestProgressGoal.name}"</strong> is currently closest to the finish line at <strong>{((highestProgressGoal.currentAmount / highestProgressGoal.targetAmount) * 100).toFixed(0)}%</strong>. Consider allocating some of your <strong>{formatCurrency(availableBalance)}</strong> available balance to speed it up.
                          </p>
                        )
                      } else {
                        return (
                          <p className="text-xs text-slate-700 leading-relaxed">
                            No active savings goals found. Create a savings goal and we will analyze your available balance to help you pace your contributions.
                          </p>
                        )
                      }
                    })()}
                  </div>

                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl">
                    <p className="text-xs text-purple-700 leading-relaxed font-medium">
                      <Lightbulb className="h-4 w-4 shrink-0 text-yellow-600 mt-0.5" /> <span><strong>Smart Tip:</strong> Automated weekly contributions are statistically proven to help complete goals 40% faster than monthly transfers. Try creating a recurring payment!</span>
                    </p>
                  </div>
                </div>

                {/* Priority List Column */}
                <div className="flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Active Targets Hierarchy</h5>
                  {goals.filter(g => !g.isCompleted).length > 0 ? (
                    <div className="space-y-2.5">
                      {goals
                        .filter(g => !g.isCompleted)
                        .slice(0, 4)
                        .map((g) => {
                          const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
                          return (
                            <div key={g.id} className="flex flex-col gap-1.5 p-2.5 bg-white border border-slate-100 rounded-xl">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-800 truncate">{g.name}</span>
                                <span className="text-[10px] font-semibold text-slate-500">{formatCurrency(g.currentAmount)}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full transition-all" style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-slate-400 text-sm">No active targets to display.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE GOALS TAB CONTENT */}
        {goalFilter === 'active' && (
          <>
            {/* Left Column (List) */}
            <div className={`bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col min-h-0 overflow-hidden ${selectedGoal ? 'w-[60%] shrink-0' : 'flex-1'} transition-all duration-300`}>
              
              {/* Header controls (Sorting, View Toggle) */}
              <div className="h-[60px] px-5 flex justify-between items-center border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" /> Sort:
                  </span>
                  <select
                    value={desktopSort}
                    onChange={(e) => setDesktopSort(e.target.value as any)}
                    className="border border-slate-200 rounded-xl text-xs font-bold px-2.5 py-1 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="priority">Priority</option>
                    <option value="deadline">Target Date</option>
                    <option value="progress">Progress %</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
                
                <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Card Grid View"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Spreadsheet List View"
                  >
                    <History className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* List / Grid Display */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5 custom-scrollbar">
                {filteredGoals.length === 0 ? (
                  <div className="text-center py-16 px-5 flex-1 flex flex-col justify-center items-center h-full">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                      <Target className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1.5">No Active Goals</h3>
                    <p className="text-slate-500 text-xs max-w-sm mb-5 leading-relaxed">Create a savings goal to start tracking progress towards your financial landmarks.</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-xs shadow-md cursor-pointer"
                    >
                      Create your first savings goal
                    </button>
                  </div>
                ) : viewMode === 'cards' ? (
                  /* Card Grid View */
                  <div className={`grid ${selectedGoal ? 'grid-cols-1 xl:grid-cols-2 xl:[&>*:last-child:nth-child(odd)]:col-span-2' : 'grid-cols-2 xl:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 xl:[&>*:last-child:nth-child(odd)]:col-span-1'} gap-4 content-start animate-fade-in`}>
                    {getSortedGoals(filteredGoals).map((goal) => {
                      const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
                      const isSelected = selectedGoal === goal.id

                      return (
                        <div
                          key={goal.id}
                          onClick={() => setSelectedGoal(goal.id)}
                          className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-200 cursor-pointer group active:scale-[0.99] transition-all flex flex-col justify-between min-h-[130px] ${isSelected ? 'border-2 border-purple-600 bg-purple-50/10 shadow-purple-500/5' : 'border-slate-100'}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${isSelected ? 'bg-purple-100 text-purple-600' : 'bg-slate-50 text-slate-600'}`}>
                                <Target className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-900 text-xs truncate pr-2">{goal.name}</h4>
                                {goal.deadline ? (
                                  <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Calendar className="h-3 w-3" /> By {new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                  </p>
                                ) : (
                                  <p className="text-[10px] font-semibold text-slate-300 mt-0.5">No date limit</p>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${progress >= 75 ? 'bg-emerald-100 text-emerald-700' : progress >= 40 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>

                          <div className="mt-auto">
                            <div className="flex justify-between items-baseline mb-1.5">
                              <span className="text-lg font-black text-slate-900 tracking-tight">
                                {formatCurrency(goal.currentAmount)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Target: {formatCurrency(goal.targetAmount)}
                              </span>
                            </div>
                            
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGoal(goal.id);
                                }}
                                className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5" /> Add Funds
                              </button>
                            </div>

                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-3">
                              <span>Remaining: <strong className="text-slate-700 font-extrabold text-[10px] ml-1">{formatCurrency(remaining)}</strong></span>
                              {goal.deadline && (
                                <span>Pace: <strong className="text-slate-700 font-extrabold text-[10px] ml-1">{formatCurrency(calculatePace(goal))}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* List View (Table Layout) */
                  <div className="overflow-x-auto animate-fade-in">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="pb-2 font-extrabold px-2">Goal Name</th>
                          <th className="pb-2 font-extrabold px-2">Progress</th>
                          <th className="pb-2 font-extrabold px-2 text-right">Saved</th>
                          <th className="pb-2 font-extrabold px-2 text-right">Target</th>
                          <th className="pb-2 font-extrabold px-2 text-right">Remaining</th>
                          <th className="pb-2 font-extrabold px-2">Target Date</th>
                          <th className="pb-2 font-extrabold px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {getSortedGoals(filteredGoals).map((goal) => {
                          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
                          const isSelected = selectedGoal === goal.id

                          return (
                            <tr
                              key={goal.id}
                              onClick={() => setSelectedGoal(goal.id)}
                              className={`hover:bg-slate-50/70 transition-colors cursor-pointer group ${isSelected ? 'bg-purple-50/20' : ''}`}
                            >
                              <td className="py-3 px-2 font-bold text-slate-900 text-xs max-w-[180px] truncate">
                                {goal.name}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                                      style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {progress.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-right font-semibold text-slate-700 text-xs">
                                {formatCurrency(goal.currentAmount)}
                              </td>
                              <td className="py-3 px-2 text-right font-semibold text-slate-400 text-xs">
                                {formatCurrency(goal.targetAmount)}
                              </td>
                              <td className="py-3 px-2 text-right font-bold text-slate-900 text-xs">
                                {formatCurrency(remaining)}
                              </td>
                              <td className="py-3 px-2 text-slate-500 text-[10px] font-semibold">
                                {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <span className="text-[10px] font-bold text-purple-600 group-hover:underline">
                                  Manage
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Details) */}
            {selectedGoal && (
              <div className="flex-1 min-w-0 h-full">
                <DesktopRightPane
                  goalFilter={goalFilter}
                  selectedGoal={selectedGoal}
                  setSelectedGoal={setSelectedGoal}
                  selectedCompletedGoal={selectedCompletedGoal}
                  setSelectedCompletedGoal={setSelectedCompletedGoal}
                  goals={goals}
                  completedGoals={completedGoals}
                  contributions={contributions}
                  loadingContributions={loadingContributions}
                  detailTab={detailTab}
                  setDetailTab={setDetailTab}
                  quickContribution={quickContribution}
                  setQuickContribution={setQuickContribution}
                  handleQuickAddContribution={handleQuickAddContribution}
                  handleDeleteContribution={handleDeleteContribution}
                  handleDeleteGoal={handleDeleteGoal}
                  calculatePace={calculatePace}
                  availableBalance={availableBalance}
                  monthlySavingPotential={monthlySavingPotential}
                />
              </div>
            )}
          </>
        )}

        {/* ACHIEVED GOALS TAB CONTENT */}
        {goalFilter === 'achieved' && (
          <>
            {/* Left Column (List) */}
            <div className={`bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col min-h-0 overflow-hidden ${selectedCompletedGoal ? 'w-[60%] shrink-0' : 'flex-1'} transition-all duration-300`}>
              <div className="flex-1 min-h-0 overflow-y-auto p-5 custom-scrollbar">
                {completedGoals.length === 0 ? (
                  <div className="text-center py-16 px-5 flex-1 flex flex-col justify-center items-center h-full">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                      <Trophy className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1.5">No Achieved Goals Yet</h3>
                    <p className="text-slate-500 text-xs max-w-sm leading-relaxed">Every small contribution counts. Keep saving to hit your targets and they will appear here!</p>
                  </div>
                ) : (
                  <div className={`grid ${selectedCompletedGoal ? 'grid-cols-1 xl:grid-cols-2 xl:[&>*:last-child:nth-child(odd)]:col-span-2' : 'grid-cols-2 xl:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 xl:[&>*:last-child:nth-child(odd)]:col-span-1'} gap-4 content-start animate-fade-in`}>
                    {completedGoals.map((goal) => {
                      const isSelected = selectedCompletedGoal === goal.id
                      return (
                        <div
                          key={goal.id}
                          onClick={() => setSelectedCompletedGoal(goal.id)}
                          className={`border rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer group active:scale-[0.99] transition-all flex flex-col justify-between min-h-[120px] bg-gradient-to-br from-emerald-50/30 to-green-50/10 hover:border-emerald-200 ${isSelected ? 'border-2 border-emerald-500 shadow-emerald-500/5' : 'border-slate-100'}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 bg-white shadow-sm shrink-0 ${isSelected ? 'text-emerald-600' : 'text-emerald-500'}`}>
                                <Trophy className="h-4 w-4 text-yellow-500" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-xs truncate">{goal.name}</h4>
                                <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 truncate">
                                  Achieved {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                              100% Completed
                            </span>
                          </div>
                          
                          <div className="border-t border-slate-100/50 pt-2 flex justify-between items-baseline mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Reached</span>
                            <span className="text-lg font-black text-emerald-700 tracking-tight">
                              {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Details) */}
            {selectedCompletedGoal && (
              <div className="flex-1 min-w-0 h-full">
                <DesktopRightPane
                  goalFilter={goalFilter}
                  selectedGoal={selectedGoal}
                  setSelectedGoal={setSelectedGoal}
                  selectedCompletedGoal={selectedCompletedGoal}
                  setSelectedCompletedGoal={setSelectedCompletedGoal}
                  goals={goals}
                  completedGoals={completedGoals}
                  contributions={contributions}
                  loadingContributions={loadingContributions}
                  detailTab={detailTab}
                  setDetailTab={setDetailTab}
                  quickContribution={quickContribution}
                  setQuickContribution={setQuickContribution}
                  handleQuickAddContribution={handleQuickAddContribution}
                  handleDeleteContribution={handleDeleteContribution}
                  handleDeleteGoal={handleDeleteGoal}
                  calculatePace={calculatePace}
                  availableBalance={availableBalance}
                  monthlySavingPotential={monthlySavingPotential}
                />
              </div>
            )}
          </>
        )}

        {/* BULK ADD TAB CONTENT */}
        {goalFilter === 'bulk_add' && (
          <div className="flex-1 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-x-auto p-5">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-2 font-extrabold px-2">Goal Name</th>
                    <th className="pb-2 font-extrabold px-2">Amount (₹)</th>
                    <th className="pb-2 font-extrabold px-2">Date</th>
                    <th className="pb-2 font-extrabold px-2">Payment Method</th>
                    <th className="pb-2 font-extrabold px-2">Notes</th>
                    <th className="pb-2 font-extrabold text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bulkEntries.map((entry) => {
                    const goal = goals.find(g => g.id === entry.goalId)
                    if (!goal) return null
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-2 w-[22%] align-top">
                          <h4 className="font-bold text-slate-900 text-xs truncate max-w-[160px]">{goal.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-400">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 w-[18%] align-top">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={entry.amount}
                            onChange={(e) => handleBulkEntryChange(entry.id, 'amount', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors text-slate-900 font-bold outline-none text-xs"
                          />
                        </td>
                        <td className="py-3 px-2 w-[15%] align-top">
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => handleBulkEntryChange(entry.id, 'date', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors text-slate-900 font-semibold outline-none text-xs"
                          />
                        </td>
                        <td className="py-3 px-2 w-[18%] align-top">
                          <select
                            value={entry.paymentMethod}
                            onChange={(e) => handleBulkEntryChange(entry.id, 'paymentMethod', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors text-slate-900 font-semibold outline-none text-xs cursor-pointer"
                          >
                            {staticData.paymentMethods.filter(pm => pm.isActive).map((method) => (
                              <option key={method.id} value={method.name}>{method.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-2 w-[18%] align-top">
                          <input
                            type="text"
                            placeholder="Optional"
                            value={entry.description}
                            onChange={(e) => handleBulkEntryChange(entry.id, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors text-slate-900 font-medium outline-none text-xs"
                          />
                        </td>
                        <td className="py-3 px-2 align-top text-right">
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <button
                              onClick={() => handleAddBulkRow(goal.id)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                              title="Add another entry for this goal"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveBulkRow(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="Remove this entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                Total Allocation:
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-200 text-sm">
                  {formatCurrency(currentBulkTotal)}
                </span>
              </div>
              <button
                onClick={handleSaveBulkAllocation}
                disabled={bulkSaving || currentBulkTotal === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs cursor-pointer"
              >
                {bulkSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save All Contributions
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
