'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, CreditCard, ChevronLeft, ChevronRight, History, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import CustomDateField from '@/components/ui/CustomDateField'
import CustomSelect from '@/components/ui/CustomSelect'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { SavingsGoal, GoalContribution } from './types'
import { calculateMonthlyRequired, formatTimeRemaining, getGoalPace } from './goal-utils'

interface GoalActivityDrawerProps {
  goal: SavingsGoal | null
  isOpen: boolean
  onClose: () => void
  contributions: GoalContribution[]
  loadingContributions: boolean
  onAddContribution: (goalId: string, amount: number, paymentMethod: string, description: string, date: string, action?: 'deposit' | 'withdrawal', reason?: string) => Promise<void>
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
  const [movementAction, setMovementAction] = useState<'deposit' | 'withdrawal'>('deposit')
  const [depositAmount, setDepositAmount] = useState('')
  const [description, setDescription] = useState('')
  const [reason, setReason] = useState('')
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
  const used = Number(goal.usedAmount) || 0
  const progressPct = Math.min(100, Math.round((current / target) * 100))
  const remainingAmount = Math.max(0, target - current)

  const totalHistoryPages = Math.max(1, Math.ceil(contributions.length / PAGE_SIZE))
  const paginatedContributions = contributions.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE)

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(depositAmount)
    if (isNaN(num) || num <= 0) return

    if (movementAction === 'withdrawal' && num > current) {
      return
    }

    setIsSubmitting(true)
    try {
      const pm = paymentMethod || staticData.paymentMethods.find(m => m.isActive)?.name || 'Cash'
      await onAddContribution(goal.id, num, pm, description, date, movementAction, reason)
      setDepositAmount('')
      setDescription('')
      setReason('')
      setHistoryPage(1)
      setActiveTab('history')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-xl bg-white dark:bg-[#121215] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">{goal.name}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${pace.badgeClass}`}>{pace.label}</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-400 uppercase tracking-wider mt-0.5 truncate">
                {goal.category || 'General'} · {countdown.text}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Overview Banner */}
          <div className="px-5 py-4 bg-slate-50/60 dark:bg-[#16161b] border-b border-slate-200/80 dark:border-white/[0.08] shrink-0">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Current Saved</span>
                <p className="text-base sm:text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(current)}</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Funds Used</span>
                <p className="text-base sm:text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">{formatCurrency(used)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">Target Goal</span>
                <p className="text-sm sm:text-base font-bold tabular-nums text-slate-700 dark:text-neutral-300">{formatCurrency(target)}</p>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-slate-600 dark:text-neutral-300 tabular-nums">
                  {remainingAmount > 0 ? `${formatCurrency(remainingAmount)} remaining` : 'Target 100% Achieved!'}
                </span>
                <span className="text-slate-900 dark:text-white tabular-nums font-bold">{progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${remainingAmount === 0 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/80 dark:border-white/[0.06] text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500">Monthly Run-rate</span>
                <p className="font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">{remainingAmount === 0 ? 'Fully Funded' : monthlyNeeded > 0 ? `${formatCurrency(monthlyNeeded)} / mo` : 'Flexible'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500">Timeline</span>
                <p className="font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">{goal.deadline ? formatDateForDisplay(goal.deadline) : 'No fixed date'}</p>
              </div>
            </div>
          </div>

          {/* Subtabs + Delete Action */}
          <div className="px-5 py-2.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] flex items-center justify-between shrink-0">
            <div className="flex p-0.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-xs font-bold gap-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${activeTab === 'history' ? 'bg-white dark:bg-[#18181b] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                History ({contributions.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('deposit')
                  setMovementAction('deposit')
                }}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${activeTab === 'deposit' && movementAction === 'deposit' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                + Deposit
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('deposit')
                  setMovementAction('withdrawal')
                }}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${activeTab === 'deposit' && movementAction === 'withdrawal' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                - Withdraw
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDeleteGoal(goal)}
              className="px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Goal</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4 no-scrollbar">
            {activeTab === 'history' && (
              <div className="space-y-3">
                {loadingContributions ? (
                  <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                    <span>Loading goal history...</span>
                  </div>
                ) : contributions.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200/80 dark:border-white/[0.08] p-4">
                    <History className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-neutral-600" />
                    <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">No activity recorded yet</p>
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1">Switch to "+ Deposit" tab above to record your first contribution.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      {paginatedContributions.map(item => {
                        const isWithdrawal = item.type === 'withdrawal' || item.transaction?.type === 'transfer'
                        const note = item.reason || item.description || item.transaction?.description || (isWithdrawal ? 'Funds used' : 'Savings contribution')
                        const pMethod = item.transaction?.paymentMethod || 'Direct'
                        return (
                          <div key={item.id} className="flex items-start justify-between p-3 rounded-xl bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-[#18181d] transition-all text-xs gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold tabular-nums text-xs sm:text-sm ${
                                  isWithdrawal ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {isWithdrawal ? `-${formatCurrency(item.amount)}` : `+${formatCurrency(item.amount)}`}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  isWithdrawal 
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {isWithdrawal ? 'Used' : 'Saved'}
                                </span>
                                <span className="text-[10px] sm:text-[11px] tabular-nums text-slate-400 dark:text-neutral-500">{formatDateForDisplay(item.date)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-slate-700 dark:text-neutral-300 font-medium truncate max-w-[200px] sm:max-w-sm">{note}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-neutral-400 border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-1">
                                  <CreditCard className="h-2.5 w-2.5" />
                                  {pMethod}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onDeleteContribution(item.id, goal.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                              title="Delete contribution"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {totalHistoryPages > 1 && (
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-white/[0.06] text-xs">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-neutral-500 tabular-nums">Page {historyPage} of {totalHistoryPages}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={historyPage <= 1}
                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-[#18181b] text-slate-700 dark:text-neutral-300 cursor-pointer"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={historyPage >= totalHistoryPages}
                            onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-[#18181b] text-slate-700 dark:text-neutral-300 cursor-pointer"
                          >
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
              <form onSubmit={handleDepositSubmit} className="space-y-3.5 bg-white dark:bg-[#151518] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
                {/* Movement Action Toggle */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1.5">Action</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => setMovementAction('deposit')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        movementAction === 'deposit'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      + Deposit Savings
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementAction('withdrawal')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        movementAction === 'withdrawal'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      - Withdraw / Use Money
                    </button>
                  </div>
                </div>

                {movementAction === 'deposit' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1.5">Quick Presets</label>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {PRESETS.map(val => (
                        <button
                          key={`drawer-preset-${val}`}
                          type="button"
                          onClick={() => setDepositAmount(String(val))}
                          className={`py-1.5 px-1 text-xs font-bold tabular-nums rounded-xl border transition-all truncate cursor-pointer ${
                            depositAmount === String(val)
                              ? 'bg-blue-600 text-white border-transparent shadow-xs'
                              : 'bg-slate-50 dark:bg-[#18181b] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#202024]'
                          }`}
                        >
                          +₹{val.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
                      {movementAction === 'withdrawal' ? 'Withdraw Amount (₹)' : 'Deposit Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={movementAction === 'withdrawal' ? current : undefined}
                      required
                      placeholder="e.g. 5,000"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      className="w-full h-8.5 px-3 text-xs tabular-nums font-bold bg-slate-50/70 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-blue-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <CustomSelect
                      label="Payment Method"
                      selectSize="xs"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      {staticData.paymentMethods.map(pm => (
                        <option key={pm.id} value={pm.name}>{pm.name}</option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div>
                    <CustomDateField
                      label="Date"
                      size="sm"
                      placeholder="Date"
                      required
                      value={date}
                      onChange={setDate}
                    />
                  </div>
                </div>

                {movementAction === 'withdrawal' ? (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
                      Usage Reason <span className="font-normal normal-case text-slate-400 dark:text-neutral-500">(What are you spending this on?)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Laptop replacement, Medical emergency..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full h-8.5 px-3 text-xs bg-slate-50/70 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                      🛡️ Modeled as non-distorting transfer: will not inflate income or expenses. Increases "Funds Used" on the goal.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
                      Description / Note <span className="font-normal normal-case text-slate-400 dark:text-neutral-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Salary allocation, Bonus..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full h-8.5 px-3 text-xs bg-slate-50/70 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !depositAmount || (movementAction === 'withdrawal' && parseFloat(depositAmount) > current)}
                  className={`w-full h-9 rounded-xl font-bold text-xs text-white disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    movementAction === 'withdrawal' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{movementAction === 'withdrawal' ? 'Record Withdrawal' : 'Record Deposit'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
