'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, CreditCard, ChevronLeft, ChevronRight, ChevronDown, History, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { SavingsGoal, GoalContribution } from './types'
import { calculateMonthlyRequired, formatTimeRemaining, getGoalPace } from './goal-utils'

interface GoalActivityDrawerProps {
  goal: SavingsGoal | null
  isOpen: boolean
  onClose: () => void
  contributions: GoalContribution[]
  loadingContributions: boolean
  onAddContribution: (goalId: string, amount: number, paymentMethod: string, description: string, date: string) => Promise<void>
  onDeleteContribution: (id: string, goalId: string) => Promise<void>
  onDeleteGoal: (goal: SavingsGoal) => void
  initialTab?: 'deposit' | 'history'
}

const PAGE_SIZE = 8
const PRESETS = [500, 1000, 2500, 5000]

export default function GoalActivityDrawer({
  goal,
  isOpen,
  onClose,
  contributions,
  loadingContributions,
  onAddContribution,
  onDeleteContribution,
  onDeleteGoal,
  initialTab = 'history'
}: GoalActivityDrawerProps) {
  const { data: staticData } = useEnhancedStaticData()
  const [activeTab, setActiveTab] = useState<'deposit' | 'history'>(initialTab)
  const [depositAmount, setDepositAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)

  useEffect(() => { if (initialTab) setActiveTab(initialTab) }, [initialTab, isOpen])

  useEffect(() => {
    if (staticData.paymentMethods.length > 0 && !paymentMethod) {
      const active = staticData.paymentMethods.find(m => m.isActive) || staticData.paymentMethods[0]
      if (active) setPaymentMethod(active.name)
    }
  }, [staticData, paymentMethod])

  if (!isOpen || !goal) return null

  const pace = getGoalPace(goal)
  const monthlyNeeded = calculateMonthlyRequired(goal)
  const countdown = formatTimeRemaining(goal.deadline)
  const target = Number(goal.targetAmount) || 1
  const current = Number(goal.currentAmount) || 0
  const progressPct = Math.min(100, Math.round((current / target) * 100))
  const remainingAmount = Math.max(0, target - current)

  const totalHistoryPages = Math.max(1, Math.ceil(contributions.length / PAGE_SIZE))
  const paginatedContributions = contributions.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE)

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(depositAmount)
    if (isNaN(num) || num <= 0) return

    setIsSubmitting(true)
    try {
      const pm = paymentMethod || staticData.paymentMethods.find(m => m.isActive)?.name || 'Cash'
      await onAddContribution(goal.id, num, pm, description, date)
      setDepositAmount('')
      setDescription('')
      setHistoryPage(1)
      setActiveTab('history')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/50 dark:bg-black/85 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-xl bg-white dark:bg-neutral-950 border-l border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900 flex items-center justify-between shrink-0">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">{goal.name}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${pace.badgeClass}`}>{pace.label}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-neutral-400 uppercase tracking-wider mt-0.5 truncate">
                {goal.category || 'General'} · {countdown.text}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Overview Banner */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50/50 dark:bg-neutral-900/50 border-b border-slate-200/80 dark:border-neutral-800 shrink-0">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Current Saved</span>
                <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">{formatCurrency(current)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Target Goal</span>
                <p className="text-sm sm:text-base font-bold font-mono text-slate-700 dark:text-neutral-300">{formatCurrency(target)}</p>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-slate-600 dark:text-neutral-300 font-mono">
                  {remainingAmount > 0 ? `${formatCurrency(remainingAmount)} remaining` : 'Target 100% Achieved!'}
                </span>
                <span className="text-slate-900 dark:text-white font-mono font-bold">{progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${remainingAmount === 0 ? 'bg-emerald-500' : 'bg-slate-900 dark:bg-white'}`} style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/80 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">Monthly Run-rate</span>
                <p className="font-bold font-mono text-slate-900 dark:text-white mt-0.5">{remainingAmount === 0 ? 'Fully Funded' : monthlyNeeded > 0 ? `${formatCurrency(monthlyNeeded)} / mo` : 'Flexible'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">Timeline</span>
                <p className="font-bold font-mono text-slate-900 dark:text-white mt-0.5">{goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No fixed date'}</p>
              </div>
            </div>
          </div>

          {/* Subtabs + Delete Action */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between shrink-0">
            <div className="flex bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-0.5 rounded-xl text-xs font-bold">
              <button type="button" onClick={() => setActiveTab('history')} className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-xs ${activeTab === 'history' ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}>
                History ({contributions.length})
              </button>
              <button type="button" onClick={() => setActiveTab('deposit')} className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-xs ${activeTab === 'deposit' ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}>
                + Deposit
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDeleteGoal(goal)}
              className="px-2 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Goal</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-4 [scrollbar-width:thin]">
            {activeTab === 'history' && (
              <div className="space-y-3">
                {loadingContributions ? (
                  <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading deposit history...</span>
                  </div>
                ) : contributions.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4">
                    <History className="h-8 w-8 mx-auto mb-2 text-slate-400 dark:text-neutral-600" />
                    <p className="text-sm font-bold text-slate-700 dark:text-neutral-300">No deposits recorded yet</p>
                    <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Switch to "+ Deposit" tab above to record your first contribution.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedContributions.map(item => {
                        const note = item.description || item.transaction?.description || 'Savings contribution'
                        const pMethod = item.transaction?.paymentMethod || 'Direct'
                        return (
                          <div key={item.id} className="flex items-start justify-between p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 transition-all text-xs gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold font-mono text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">+{formatCurrency(item.amount)}</span>
                                <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-neutral-500">{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-slate-700 dark:text-neutral-300 font-medium truncate max-w-[200px] sm:max-w-sm">{note}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200/60 dark:border-neutral-700/60 flex items-center gap-1">
                                  <CreditCard className="h-2.5 w-2.5" />
                                  {pMethod}
                                </span>
                              </div>
                            </div>
                            <button type="button" onClick={() => onDeleteContribution(item.id, goal.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0" title="Delete this contribution">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {totalHistoryPages > 1 && (
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-neutral-800 text-xs">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-neutral-500 font-mono">Page {historyPage} of {totalHistoryPages}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" disabled={historyPage >= totalHistoryPages} onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))} className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'deposit' && (
              <form onSubmit={handleDepositSubmit} className="space-y-3.5 bg-white dark:bg-neutral-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">Quick Presets</label>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {PRESETS.map(val => (
                      <button key={`drawer-preset-${val}`} type="button" onClick={() => setDepositAmount(String(val))} className={`py-2 px-1 text-[11px] sm:text-xs font-bold font-mono rounded-xl border transition-all truncate ${depositAmount === String(val) ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900 border-slate-900 dark:border-white shadow-sm' : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}>
                        +₹{val.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Amount (₹)</label>
                    <input type="number" step="0.01" min="1" required placeholder="0.00" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full px-3 py-2.5 text-sm font-mono font-bold bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl focus:ring-1 focus:ring-slate-900 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Payment Method</label>
                    <div className="relative">
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full appearance-none [-webkit-appearance:none] pl-3 pr-7 py-2.5 text-xs font-medium bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white cursor-pointer">
                        {staticData.paymentMethods.map(pm => (
                          <option key={pm.id} value={pm.name} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">{pm.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Date</label>
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Description / Note <span className="font-normal normal-case text-slate-400 dark:text-neutral-500">(Optional)</span></label>
                  <input type="text" placeholder="e.g. Salary allocation, Bonus..." value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-600" />
                </div>

                <button type="submit" disabled={isSubmitting || !depositAmount} className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-slate-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                  <Plus className="h-4 w-4" />
                  <span>Record Deposit</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
