// Right pane for desktop goals view, displaying goal details, history, and actions.
import { Target, Calendar, Clock, History, Trash2, Check, TrendingUp, Sparkles, Trophy, X, Plus, Zap } from 'lucide-react'
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

  // ── Active Goal Detail ──
  if (goalFilter === 'active' && selectedGoal) {
    const g = goals.find(goal => goal.id === selectedGoal)
    if (!g) return null

    const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
    const remaining = Math.max(0, g.targetAmount - g.currentAmount)
    const pace = calculatePace(g)

    const progressColor = progress >= 75
      ? 'from-emerald-500 to-teal-500'
      : progress >= 40
        ? 'from-violet-500 to-indigo-500'
        : 'from-amber-500 to-orange-500'

    return (
      <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-slide-in h-full">

        {/* ── Header ── */}
        <div className="p-4 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1 pr-3">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 rounded-full text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
                <Target className="h-2.5 w-2.5" /> Active Goal
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">{g.name}</h3>
              {g.deadline && (
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5 text-violet-400" />
                  Deadline: {new Date(g.deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleDeleteGoal(g)}
                className="p-1.5 bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title="Delete Goal"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setSelectedGoal(null)}
                className="p-1.5 bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 hover:bg-slate-200 dark:hover:bg-neutral-700 hover:text-slate-600 dark:hover:text-neutral-300 rounded-lg transition-colors cursor-pointer"
                title="Close Panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Progress Strip ── */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0 bg-slate-50/50 dark:bg-neutral-800/20">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-widest mb-0.5">Saved</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{formatCurrency(g.currentAmount)}</p>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">of {formatCurrency(g.targetAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-widest mb-0.5">Remaining</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{formatCurrency(remaining)}</p>
              {pace > 0 ? (
                <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">{formatCurrency(pace)}/mo needed</p>
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">No deadline set</p>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${progressColor} h-full rounded-full transition-all duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-500">{progress.toFixed(1)}% complete</span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-500">{(100 - progress).toFixed(1)}% remaining</span>
          </div>
        </div>

        {/* ── Tab Selector ── */}
        <div className="px-4 pt-3 shrink-0">
          <div className="flex p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl">
            <button
              onClick={() => setDetailTab('quick')}
              type="button"
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${detailTab === 'quick' ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'}`}
            >
              <Plus className="h-3.5 w-3.5" /> Add Contribution
            </button>
            <button
              onClick={() => setDetailTab('history')}
              type="button"
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${detailTab === 'history' ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'}`}
            >
              <History className="h-3.5 w-3.5" /> Activity History
            </button>
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">

          {/* Quick Add Form */}
          {detailTab === 'quick' && (
            <form onSubmit={handleQuickAddContribution} className="flex flex-col gap-4">

              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={quickContribution.amount}
                      onChange={(e) => {
                        let val = e.target.value
                        const num = parseFloat(val)
                        if (!isNaN(num) && num > remaining) val = remaining.toString()
                        setQuickContribution({ ...quickContribution, amount: val })
                      }}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-all text-slate-900 dark:text-white font-bold outline-none text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">Date</label>
                  <div className="relative">
                    <div className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white font-semibold flex items-center justify-between pointer-events-none text-xs">
                      <span className={quickContribution.date ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-neutral-500'}>
                        {quickContribution.date
                          ? new Date(quickContribution.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Select date'}
                      </span>
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      value={quickContribution.date}
                      onChange={(e) => setQuickContribution({ ...quickContribution, date: e.target.value })}
                      onClick={(e) => {
                        try { if ('showPicker' in HTMLInputElement.prototype) (e.target as HTMLInputElement).showPicker() } catch {}
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quick amount chips */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">Quick Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickContribution(prev => ({ ...prev, amount: amt.toString() }))}
                      className={`py-1.5 text-[11px] font-bold border rounded-lg transition-all cursor-pointer ${
                        quickContribution.amount === amt.toString()
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400 shadow-sm'
                          : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:border-violet-300 dark:hover:border-violet-700'
                      }`}
                    >
                      +{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">Payment Method</label>
                <select
                  value={quickContribution.paymentMethod}
                  onChange={(e) => setQuickContribution({ ...quickContribution, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-slate-900 dark:text-white font-semibold outline-none text-xs cursor-pointer"
                >
                  {staticData.paymentMethods.filter(pm => pm.isActive).map((method) => (
                    <option key={method.id} value={method.name}>{method.name}</option>
                  ))}
                </select>
              </div>

              {/* Note + Submit */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. salary bonus"
                    value={quickContribution.description || ''}
                    onChange={(e) => setQuickContribution({ ...quickContribution, description: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-slate-900 dark:text-white font-medium outline-none text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl active:scale-[0.97] transition-all font-bold shadow-md shadow-violet-500/20 flex items-center gap-1.5 shrink-0 text-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </form>
          )}

          {/* History Feed */}
          {detailTab === 'history' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-neutral-800 pb-2">
                <History className="h-3.5 w-3.5 text-violet-500" />
                <h5 className="font-bold text-slate-800 dark:text-neutral-200 text-xs">Recent Activity</h5>
              </div>

              {loadingContributions === selectedGoal ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-200 dark:bg-neutral-700 rounded-lg shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 dark:bg-neutral-700 rounded w-20 mb-1.5" />
                        <div className="h-2.5 bg-slate-100 dark:bg-neutral-800 rounded w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contributions[selectedGoal]?.length > 0 ? (
                <div className="space-y-2">
                  {contributions[selectedGoal].map((c) => (
                    <div key={c.id} className="flex justify-between items-center group p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">+{formatCurrency(c.amount)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 truncate max-w-[180px]">
                            {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {c.description ? ` • ${c.description}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteContribution(c.id, selectedGoal)}
                        className="p-1.5 text-slate-300 dark:text-neutral-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Remove entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <History className="h-5 w-5 text-slate-400 dark:text-neutral-500" />
                  </div>
                  <p className="text-slate-500 dark:text-neutral-400 font-semibold text-xs">No activity yet</p>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Make your first deposit to track growth.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Completed Goal Detail ──
  if (goalFilter === 'achieved' && selectedCompletedGoal) {
    const g = completedGoals.find(c => c.id === selectedCompletedGoal)
    if (!g) return null

    return (
      <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-slide-in h-full">

        {/* Celebratory Header */}
        <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex justify-between items-start">
            <div className="min-w-0 pr-3">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                <Trophy className="h-3 w-3 text-amber-300" /> Goal Achieved
              </div>
              <h3 className="text-base font-extrabold leading-snug truncate">{g.name}</h3>
              <p className="text-emerald-100 text-[11px] mt-1 font-medium">
                Completed {formatCurrency(g.targetAmount)} on {g.completedAt
                  ? new Date(g.completedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'recently'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleDeleteGoal(g)}
                className="p-1.5 bg-white/15 hover:bg-rose-500/70 text-white rounded-lg transition-colors cursor-pointer"
                title="Delete Goal"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setSelectedCompletedGoal(null)}
                className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Deposit History */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50/50 dark:bg-neutral-800/20 custom-scrollbar">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-neutral-800 pb-2 mb-3">
            <History className="h-3.5 w-3.5 text-emerald-500" />
            <h5 className="font-bold text-slate-800 dark:text-neutral-200 text-xs">Contribution Journey</h5>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-100 dark:border-neutral-800 p-3">
            {loadingContributions === selectedCompletedGoal ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-7 w-7 bg-slate-200 dark:bg-neutral-700 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 dark:bg-neutral-700 rounded w-24 mb-1" />
                      <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(contributions[selectedCompletedGoal] || g.contributions || []).map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">+{formatCurrency(c.amount)}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                          {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!contributions[selectedCompletedGoal] && !g.contributions?.length) && (
                  <p className="text-center py-6 text-slate-400 dark:text-neutral-500 text-[11px] font-medium">No deposit data stored.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
