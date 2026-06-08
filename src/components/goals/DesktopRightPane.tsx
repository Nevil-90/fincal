// Right pane for desktop goals view, displaying goal details, history, and actions.
import { Target, Calendar, Clock, History, Trash2, Check, TrendingUp, Sparkles, Trophy, ChevronRight, X, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { SavingsGoal, GoalContribution } from './types'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'

interface QuickContribution {
  amount: string
  date: string
  paymentMethod: string
  description: string
}

interface DesktopRightPaneProps {
  goalFilter: 'overview' | 'active' | 'achieved' | 'bulk_add'
  selectedGoal: string | null
  setSelectedGoal: (id: string | null) => void
  selectedCompletedGoal: string | null
  setSelectedCompletedGoal: (id: string | null) => void
  goals: SavingsGoal[]
  completedGoals: SavingsGoal[]
  contributions: Record<string, GoalContribution[]>
  loadingContributions: string | null
  detailTab: 'quick' | 'history'
  setDetailTab: (tab: 'quick' | 'history') => void
  quickContribution: QuickContribution
  setQuickContribution: React.Dispatch<React.SetStateAction<QuickContribution>>
  handleQuickAddContribution: (e: React.FormEvent) => void
  handleDeleteContribution: (id: string, goalId: string) => void
  handleDeleteGoal: (goal: SavingsGoal) => void
  calculatePace: (goal: SavingsGoal) => number
  availableBalance: number
  monthlySavingPotential: number
}

export function DesktopRightPane({
  goalFilter,
  selectedGoal,
  setSelectedGoal,
  selectedCompletedGoal,
  setSelectedCompletedGoal,
  goals,
  completedGoals,
  contributions,
  loadingContributions,
  detailTab,
  setDetailTab,
  quickContribution,
  setQuickContribution,
  handleQuickAddContribution,
  handleDeleteContribution,
  handleDeleteGoal,
  calculatePace,
  availableBalance,
  monthlySavingPotential
}: DesktopRightPaneProps) {
  const { data: staticData } = useEnhancedStaticData()

  // 1. Active Goal Selected
  if (goalFilter === 'active' && selectedGoal) {
    const g = goals.find(goal => goal.id === selectedGoal)
    if (!g) return null
    
    const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
    const remaining = Math.max(0, g.targetAmount - g.currentAmount)
    const pace = calculatePace(g)

    return (
      <div className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden flex flex-col animate-slide-in h-full">
        {/* Header */}
        <div className="p-3 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50 dark:bg-neutral-800/50 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
              <Target className="h-3 w-3" /> Active Goal
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[280px]">{g.name}</h3>
            {g.deadline && (
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1 font-semibold">
                <Calendar className="h-3 w-3 text-purple-500" />
                Target: {new Date(g.deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-4">
            <button
              onClick={() => handleDeleteGoal(g)}
              className="p-1.5 bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
              title="Delete Goal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedGoal(null)}
              className="p-1.5 bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 hover:bg-slate-200 hover:text-slate-600 dark:text-neutral-400 rounded-xl transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 grid grid-cols-2 gap-4 shrink-0">
          <div>
            <p className="text-[10px] uppercase text-slate-400 dark:text-neutral-500 font-bold tracking-wider mb-0.5">Current Saved</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(g.currentAmount)}</p>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">of {formatCurrency(g.targetAmount)} target</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-400 dark:text-neutral-500 font-bold tracking-wider mb-0.5">Remaining</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(remaining)}</p>
            {pace > 0 ? (
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">Requires {formatCurrency(pace)}/mo</p>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">No deadline set</p>
            )}
          </div>
        </div>

        <div className="p-3 flex-1 min-h-0 flex flex-col gap-2">
          {/* Tab selection */}
          <div className="flex p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl shrink-0">
            <button
              onClick={() => setDetailTab('quick')}
              type="button"
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${detailTab === 'quick' ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:text-neutral-300'}`}
            >
              Add Contribution
            </button>
            <button
              onClick={() => setDetailTab('history')}
              type="button"
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${detailTab === 'history' ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:text-neutral-300'}`}
            >
              Activity History
            </button>
          </div>

          {/* Quick Add Form */}
          {detailTab === 'quick' && (
            <form onSubmit={handleQuickAddContribution} className="flex flex-col gap-4 mt-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                
                {/* Row 1: Amount & Date */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-extrabold text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="Amount"
                    step="0.01"
                    value={quickContribution.amount}
                    onChange={(e) => setQuickContribution({ ...quickContribution, amount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:bg-neutral-900 transition-all text-slate-900 dark:text-white font-bold outline-none text-xs h-[40px]"
                    required
                  />
                </div>

                <div className="relative w-full">
                  <div className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white font-semibold flex items-center justify-between pointer-events-none transition-colors text-xs h-[40px]">
                    <span className={quickContribution.date ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-neutral-500'}>
                      {quickContribution.date
                        ? new Date(quickContribution.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Select Date'}
                    </span>
                    <Calendar className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                  </div>
                  <input
                    type="date"
                    value={quickContribution.date}
                    onChange={(e) => setQuickContribution({ ...quickContribution, date: e.target.value })}
                    onClick={(e) => {
                      try {
                        if ('showPicker' in HTMLInputElement.prototype) {
                          (e.target as HTMLInputElement).showPicker();
                        }
                      } catch (err) {}
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                </div>

                {/* Row 2: Chips & Payment Method */}
                <div className="grid grid-cols-4 gap-1.5 h-[40px]">
                  {[500, 1000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickContribution(prev => ({ ...prev, amount: amt.toString() }))}
                      className={`h-full text-[11px] font-bold border rounded-xl transition-all ${quickContribution.amount === amt.toString() ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-extrabold shadow-sm' : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-400'}`}
                    >
                      +{amt >= 1000 ? `${amt/1000}k` : amt}
                    </button>
                  ))}
                </div>

                <select
                  value={quickContribution.paymentMethod}
                  onChange={(e) => setQuickContribution({ ...quickContribution, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:bg-neutral-900 transition-colors text-slate-900 dark:text-white font-semibold outline-none text-xs cursor-pointer h-[40px]"
                >
                  {staticData.paymentMethods.filter(pm => pm.isActive).map((method) => (
                    <option key={method.id} value={method.name}>{method.name}</option>
                  ))}
                </select>

              </div>

              {/* Row 3: Notes & Save */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Notes (Optional)"
                    value={quickContribution.description || ''}
                    onChange={(e) => setQuickContribution({ ...quickContribution, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:bg-neutral-900 transition-colors text-slate-900 dark:text-white font-medium outline-none text-xs h-[40px]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-xl active:scale-[0.98] transition-all font-bold shadow-md shadow-purple-500/25 flex justify-center items-center gap-1.5 shrink-0 text-xs cursor-pointer h-[40px]"
                >
                  <Plus className="h-4 w-4" /> Save
                </button>
              </div>
            </form>
          )}

          {/* History Feed */}
          {detailTab === 'history' && (
            <div className="space-y-3 flex-1 min-h-0 flex flex-col">
              <h5 className="font-bold text-slate-800 dark:text-neutral-200 text-[11px] flex items-center gap-1.5 border-b border-slate-100 dark:border-neutral-800 pb-1.5 mb-2">
                <History className="h-3.5 w-3.5 text-purple-500" /> Recent Goal Activity
              </h5>
              {loadingContributions === selectedGoal ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex justify-between">
                      <div>
                        <div className="h-3.5 bg-slate-200 rounded w-16 mb-1.5"></div>
                        <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-24"></div>
                      </div>
                      <div className="h-7 w-7 bg-slate-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                  {contributions[selectedGoal]?.length > 0 ? (
                    contributions[selectedGoal].map((c) => (
                      <div key={c.id} className="flex justify-between items-center group p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-800/50 transition-colors border border-transparent hover:border-slate-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs">+{formatCurrency(c.amount)}</p>
                            <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 truncate max-w-[180px] mt-0.5">
                              {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {c.description ? ` • ${c.description}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteContribution(c.id, selectedGoal)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 bg-slate-50 dark:bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <History className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                      </div>
                      <p className="text-slate-500 dark:text-neutral-400 font-bold text-xs">No activity logged</p>
                      <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Make your first deposit to track historical growth.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 2. Completed Goal Selected
  if (goalFilter === 'achieved' && selectedCompletedGoal) {
    const g = completedGoals.find(c => c.id === selectedCompletedGoal)
    if (!g) return null

    return (
      <div className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden flex flex-col animate-slide-in h-full">
        {/* Confetti Banner */}
        <div className="p-4 bg-gradient-to-br from-emerald-500 to-indigo-600 text-white flex justify-between items-center relative shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-neutral-900/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
              <Trophy className="h-3 w-3 text-yellow-300" /> Target Reached
            </div>
            <h3 className="text-lg font-extrabold leading-tight truncate max-w-[280px]">{g.name}</h3>
            <p className="text-emerald-100 text-[11px] mt-1 font-semibold">
              Completed {formatCurrency(g.targetAmount)} on {g.completedAt ? new Date(g.completedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'recently'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-4 relative z-10">
            <button
              onClick={() => handleDeleteGoal(g)}
              className="p-1.5 bg-white dark:bg-neutral-900/10 hover:bg-rose-500/80 text-white rounded-lg transition-colors cursor-pointer"
              title="Delete Goal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedCompletedGoal(null)}
              className="p-1.5 bg-white dark:bg-neutral-900/10 hover:bg-white dark:bg-neutral-900/20 text-white rounded-lg transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 bg-slate-50 dark:bg-neutral-800/50 flex-1 min-h-0 flex flex-col overflow-hidden">
          <h5 className="font-bold text-slate-800 dark:text-neutral-200 text-[11px] flex items-center gap-1.5 border-b border-slate-100 dark:border-neutral-800 pb-1.5 shrink-0">
            <History className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Historical Deposits
          </h5>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loadingContributions === selectedCompletedGoal ? (
              <div className="animate-pulse space-y-3">
                <div className="h-3.5 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-1/4"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {(contributions[selectedCompletedGoal] || g.contributions || []).map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-800/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-[10px]">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">+{formatCurrency(c.amount)}</p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 mt-0.5">
                          {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!contributions[selectedCompletedGoal] && !g.contributions?.length) && (
                  <p className="text-center py-6 text-slate-400 dark:text-neutral-500 text-[11px] font-semibold">No deposition data stored.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // If nothing is selected, we don't render anything in the right pane
  // The Coach insights are now shown in the Overview tab.
  return null
}
