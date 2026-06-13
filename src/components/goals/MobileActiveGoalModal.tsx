// Mobile modal for viewing and managing an active savings goal.
import { Calendar, Plus, History, TrendingUp, Trash2, Lightbulb, X, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { SavingsGoal, GoalContribution } from './types'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { useEffect } from 'react'

interface QuickContribution {
  amount: string
  date: string
  paymentMethod: string
  description: string
}

interface MobileActiveGoalModalProps {
  selectedGoal: string | null
  setSelectedGoal: (id: string | null) => void
  currentGoal?: SavingsGoal
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

export function MobileActiveGoalModal({
  selectedGoal,
  setSelectedGoal,
  currentGoal: g,
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
}: MobileActiveGoalModalProps) {
  const { data: staticData } = useEnhancedStaticData()

  // Prevent background scrolling strictly
  useEffect(() => {
    if (!selectedGoal || window.innerWidth >= 1024) return

    // Save original styles
    const bodyOverflow = document.body.style.overflow
    const htmlOverflow = document.documentElement.style.overflow

    // Apply strict hidden
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    // Prevent touch movement globally to freeze the background UI (since modal is 100% static)
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault()
    }

    document.addEventListener('touchmove', preventScroll, { passive: false })

    return () => { 
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = htmlOverflow
      document.removeEventListener('touchmove', preventScroll)
    }
  }, [selectedGoal])

  if (!selectedGoal || !g) return null

  const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
  const remaining = Math.max(0, g.targetAmount - g.currentAmount)

  const progressColor = progress >= 75
    ? 'from-emerald-500 to-teal-500'
    : progress >= 40
      ? 'from-violet-500 to-indigo-500'
      : 'from-amber-500 to-orange-500'

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 touch-none overscroll-none lg:sticky lg:top-6 lg:inset-auto lg:z-auto lg:p-0 lg:block lg:w-[420px] xl:w-[450px] lg:shrink-0 lg:flex-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => setSelectedGoal(null)}
      />

      {/* Sheet */}
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl relative z-10 animate-slide-up lg:animate-none shadow-2xl lg:shadow-sm lg:border lg:border-slate-200/70 dark:lg:border-neutral-800 flex flex-col">

        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-9 h-1 bg-slate-200 dark:bg-neutral-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
              <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{g.name}</h3>
              {g.deadline && (
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-violet-400" />
                  {new Date(g.deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button
              onClick={() => handleDeleteGoal(g)}
              className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/35 rounded-lg transition-colors lg:hidden cursor-pointer"
              title="Delete goal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedGoal(null)}
              className="p-1.5 text-slate-400 dark:text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-600 dark:hover:text-neutral-300 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="bg-slate-50 dark:bg-neutral-950 pb-safe pb-4">

          {/* Progress section */}
          <div className="px-5 pt-4 pb-3 bg-white dark:bg-neutral-900 shadow-sm border-b border-slate-100 dark:border-neutral-800">
            <div className="flex justify-between items-end mb-2.5">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{formatCurrency(g.currentAmount)}</p>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Saved of {formatCurrency(g.targetAmount)}</p>
              </div>
              <div className="text-right flex items-stretch gap-3">
                <div className="border-r border-slate-100 dark:border-neutral-800 pr-3">
                  <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-wider">Remaining</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{formatCurrency(remaining)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-wider">Monthly Pace</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {monthlySavingRequired > 0 ? formatCurrency(monthlySavingRequired) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className={`bg-gradient-to-r ${progressColor} h-full rounded-full transition-all duration-1000`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">{progress.toFixed(1)}% complete</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">{(100 - progress).toFixed(1)}% remaining</span>
            </div>
          </div>

          <div className="px-4 pt-3 space-y-3">
            {/* Tab Selector */}
            <div className="flex p-1 bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-xl shadow-sm">
              <button
                onClick={() => setDetailTab('quick')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${detailTab === 'quick'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
                  }`}
              >
                <Plus className="h-4 w-4" /> Quick Add
              </button>
              <button
                onClick={() => setDetailTab('history')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${detailTab === 'history'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
                  }`}
              >
                <History className="h-4 w-4" /> History
              </button>
            </div>

            {/* Quick Add Form */}
            {detailTab === 'quick' && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl p-4 shadow-sm">
                <form onSubmit={handleQuickAddContribution} className="flex flex-col space-y-3">
                  
                  {/* Amount field */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        placeholder="1000"
                        step="0.01"
                        value={quickContribution.amount}
                        onChange={(e) => {
                          let val = e.target.value
                          const num = parseFloat(val)
                          if (!isNaN(num) && num > remaining) val = remaining.toString()
                          setQuickContribution({ ...quickContribution, amount: val })
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-slate-900 dark:text-white font-semibold outline-none text-sm"
                        required
                      />
                    </div>

                    {/* Quick chips */}
                    <div className="flex gap-2 mt-1.5">
                      {[500, 1000, 5000, 10000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setQuickContribution(prev => ({ ...prev, amount: amt.toString() }))}
                          className={`flex-1 py-1 text-xs font-bold border rounded-lg transition-all cursor-pointer ${quickContribution.amount === amt.toString()
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400'
                            : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-500 dark:text-neutral-400'
                            }`}
                        >
                          +{amt >= 1000 ? `${amt / 1000}k` : amt}
                        </button>
                      ))}
                    </div>

                    {monthlySavingPotential > 0 && (
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1.5 flex items-center gap-1 bg-slate-50 dark:bg-neutral-800/50 p-1.5 rounded-lg">
                        <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
                        Safely add up to {formatCurrency(monthlySavingPotential)} this month.
                      </p>
                    )}
                  </div>

                  {/* Date + Method row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Date</label>
                      <div className="relative">
                        <div className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white font-medium text-xs flex items-center justify-between pointer-events-none">
                          <span className={quickContribution.date ? '' : 'text-slate-400 dark:text-neutral-500'}>
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
                            try { if ('showPicker' in HTMLInputElement.prototype) (e.target as HTMLInputElement).showPicker() } catch { }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Method</label>
                      <select
                        value={quickContribution.paymentMethod}
                        onChange={(e) => setQuickContribution({ ...quickContribution, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-slate-900 dark:text-white font-medium outline-none text-xs cursor-pointer appearance-none"
                      >
                        {staticData.paymentMethods.filter(pm => pm.isActive).map((method) => (
                          <option key={method.id} value={method.name}>{method.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Note (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. monthly savings"
                      value={quickContribution.description}
                      onChange={(e) => setQuickContribution({ ...quickContribution, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-slate-900 dark:text-white font-medium outline-none text-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-violet-500/25 flex justify-center items-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Plus className="h-4 w-4" /> Add to Goal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* History */}
            {detailTab === 'history' && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl shadow-sm flex flex-col">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-2 shrink-0">
                  <History className="h-4 w-4 text-violet-500" />
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Recent Activity</h5>
                </div>
                <div className="p-3">
                  {loadingContributions === selectedGoal ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-200 dark:bg-neutral-800 rounded-xl" />
                            <div>
                              <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-20 mb-2" />
                              <div className="h-3 bg-slate-100 dark:bg-neutral-700 rounded w-28" />
                            </div>
                          </div>
                          <div className="h-8 w-8 bg-slate-200 dark:bg-neutral-800 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : contributions[selectedGoal]?.length > 0 ? (
                    <div className="space-y-2">
                      {contributions[selectedGoal].slice(0, 5).map((c) => (
                        <div key={c.id} className="flex justify-between items-center group p-3 -mx-1 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">+{formatCurrency(c.amount)}</p>
                              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                                {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                {c.description ? ` • ${c.description}` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteContribution(c.id, selectedGoal)}
                            className="p-2 text-slate-300 dark:text-neutral-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {contributions[selectedGoal].length > 5 && (
                        <p className="text-center text-xs text-slate-400 dark:text-neutral-500 pt-2 border-t border-slate-100 dark:border-neutral-800 mt-3">
                          Showing last 5 transactions
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="h-12 w-12 bg-slate-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <History className="h-6 w-6 text-slate-400 dark:text-neutral-500" />
                      </div>
                      <p className="text-slate-500 dark:text-neutral-400 font-semibold text-sm">No activity yet</p>
                      <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Add a contribution to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
