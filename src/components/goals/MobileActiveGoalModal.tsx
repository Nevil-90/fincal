// Mobile modal for viewing and managing an active savings goal.
import { Calendar, ChevronDown, Plus, History, TrendingUp, Trash2, Lightbulb, X } from 'lucide-react'
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

  useEffect(() => {
    if (selectedGoal && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [selectedGoal])

  if (!selectedGoal || !g) return null

  const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
  const remaining = Math.max(0, g.targetAmount - g.currentAmount)

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:sticky lg:top-6 lg:inset-auto lg:z-auto lg:p-0 lg:block lg:w-[420px] xl:w-[450px] lg:shrink-0 lg:flex-none">
      <div className="fixed inset-0 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity touch-none lg:hidden" onClick={() => setSelectedGoal(null)}></div>
      <div className="bg-white dark:bg-neutral-900 rounded-t-[32px] sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] lg:max-h-none lg:max-w-none relative z-10 animate-slide-up lg:animate-none shadow-2xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:border lg:border-gray-100 dark:lg:border-neutral-800 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20 shrink-0">
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{g.name}</h3>
            {g.deadline && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
                <Calendar className="h-3 w-3 text-purple-500" />
                Due: {new Date(g.deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDeleteGoal(g)}
              className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors lg:hidden"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={() => setSelectedGoal(null)} className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] lg:ml-4">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto min-h-0 overscroll-contain bg-gray-50 dark:bg-neutral-950 pb-safe">
          {/* Compressed Header for Master Stats & Insights */}
          <div className="p-4 bg-white dark:bg-neutral-900 shadow-sm mb-2 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{formatCurrency(g.currentAmount)}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 mt-1">Saved of {formatCurrency(g.targetAmount)}</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <div className="text-right border-r border-gray-100 dark:border-neutral-800 pr-2">
                  <p className="text-[10px] uppercase text-gray-400 dark:text-neutral-500 font-bold">Remaining</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(remaining)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-gray-400 dark:text-neutral-500 font-bold">Pace</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{monthlySavingRequired > 0 ? formatCurrency(monthlySavingRequired) : 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner flex items-center">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white dark:bg-neutral-900/20 w-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">

            {/* Tabs */}
            <div className="flex p-1 bg-gray-200/50 dark:bg-neutral-800/50 rounded-xl">
              <button
                onClick={() => setDetailTab('quick')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${detailTab === 'quick' ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'}`}
              >
                Quick Add
              </button>
              <button
                onClick={() => setDetailTab('history')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${detailTab === 'history' ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'}`}
              >
                History
              </button>
            </div>

            {/* Tab Content */}
            {detailTab === 'quick' && (
              <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-4 shadow-sm h-[380px] sm:h-[420px] flex flex-col justify-between overflow-y-auto">
                <form onSubmit={handleQuickAddContribution} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="1000"
                        step="0.01"
                        value={quickContribution.amount}
                        onChange={(e) => setQuickContribution({ ...quickContribution, amount: e.target.value })}
                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-gray-900 dark:text-white font-medium outline-none text-sm"
                        required
                      />
                    </div>
                    {monthlySavingPotential > 0 && (
                      <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 flex items-center gap-1 bg-gray-100/50 dark:bg-neutral-800/50 p-1.5 rounded-md">
                        <span className="flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5" /> Can safely add up to {formatCurrency(monthlySavingPotential)}.</span>
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="w-full">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Date</label>
                      <div className="relative w-full">
                        <div className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-gray-900 dark:text-white font-medium text-sm flex items-center justify-between pointer-events-none">
                          <span>
                            {quickContribution.date
                              ? new Date(quickContribution.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'Select Date'}
                          </span>
                          <Calendar className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
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
                    </div>
                    <div className="w-full">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Method</label>
                      <select
                        value={quickContribution.paymentMethod}
                        onChange={(e) => setQuickContribution({ ...quickContribution, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-gray-900 dark:text-white font-medium outline-none text-sm appearance-none truncate"
                      >
                        {staticData.paymentMethods.filter(pm => pm.isActive).map((method) => (
                          <option key={method.id} value={method.name}>{method.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Note</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={quickContribution.description}
                      onChange={(e) => setQuickContribution({ ...quickContribution, description: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors text-gray-900 dark:text-white font-medium outline-none text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 active:scale-[0.98] transition-all font-semibold shadow-md shadow-green-500/25 flex justify-center items-center gap-2 mt-2"
                  >
                    <Plus className="h-4 w-4" /> Add to Goal
                  </button>
                </form>
              </div>
            )}

            {detailTab === 'history' && (
              <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-4 shadow-sm h-[380px] sm:h-[420px] overflow-y-auto">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-500" /> Recent Activity
                </h5>
                {loadingContributions === selectedGoal ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex justify-between">
                        <div>
                          <div className="h-5 bg-gray-200 dark:bg-neutral-800 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded w-32"></div>
                        </div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-neutral-800 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contributions[selectedGoal]?.length > 0 ? (
                      contributions[selectedGoal].map((c) => (
                        <div key={c.id} className="flex justify-between items-center group p-3 -mx-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">+{formatCurrency(c.amount)}</p>
                              <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">
                                {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                {c.description ? ` • ${c.description}` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteContribution(c.id, selectedGoal)}
                            className="p-2 text-gray-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="h-12 w-12 bg-gray-100 dark:bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <History className="h-6 w-6 text-gray-400 dark:text-neutral-500" />
                        </div>
                        <p className="text-gray-500 dark:text-neutral-400 font-medium">No activity yet</p>
                        <p className="text-sm text-gray-400 dark:text-neutral-500">Add a contribution to get started!</p>
                      </div>
                    )}
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
