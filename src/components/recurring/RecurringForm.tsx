// Component for RecurringForm.tsx
'use client'

import React, { useEffect } from 'react'
import { RecurringFormData } from './types'
import { useScrollLock } from '@/hooks/useScrollLock'
import { X, Repeat, ArrowUpRight, ArrowDownRight, Plus, ArrowLeft, Zap } from 'lucide-react'
import CustomDateField from '@/components/ui/CustomDateField'
import CustomSelect from '@/components/ui/CustomSelect'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { getCategoryVisual } from '@/lib/category-icons'

interface RecurringFormProps {
  formData: RecurringFormData
  setFormData: (data: RecurringFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  onBack?: () => void
  formLoading: boolean
}

export default function RecurringForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  onBack,
  formLoading
}: RecurringFormProps) {
  useScrollLock(true)
  const { data: staticData } = useEnhancedStaticData()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const categories = Array.from(new Set(formData.type === 'income'
    ? (staticData.incomeCategories.filter(c => c.isActive).map(c => c.name).length > 0
        ? staticData.incomeCategories.filter(c => c.isActive).map(c => c.name)
        : ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Other Income'])
    : (staticData.expenseCategories.filter(c => c.isActive).map(c => c.name).length > 0
        ? staticData.expenseCategories.filter(c => c.isActive).map(c => c.name)
        : ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Insurance', 'Investments', 'Subscriptions', 'Rent', 'EMI', 'Other Expense'])
  ))

  const sourcesOrPurposes = Array.from(new Set(formData.type === 'income'
    ? (staticData.incomeSources.filter(c => c.isActive).map(c => c.name).length > 0
        ? staticData.incomeSources.filter(c => c.isActive).map(c => c.name)
        : ['Bank Transfer', 'Cash', 'Cheque', 'UPI', 'Other'])
    : (staticData.expensePurposes.filter(c => c.isActive).map(c => c.name).length > 0
        ? staticData.expensePurposes.filter(c => c.isActive).map(c => c.name)
        : ['General', 'Personal', 'Family', 'Bills', 'Other'])
  ))

  const paymentMethods = Array.from(new Set(
    staticData.paymentMethods.filter(c => c.isActive).map(c => c.name).length > 0
      ? staticData.paymentMethods.filter(c => c.isActive).map(c => c.name)
      : ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash', 'Auto Debit', 'Other']
  ))

  const isOneTime = formData.frequency === 'one-time'
  const categoryVisual = formData.category ? getCategoryVisual(formData.category, formData.type, undefined) : null
  const CategoryIcon = categoryVisual?.icon

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/75 dark:bg-black/90 backdrop-blur-sm sm:backdrop-blur-md p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer shrink-0"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 shadow-xs ${
              isOneTime
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : formData.type === 'income'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {isOneTime ? (
                <Zap className="w-4 h-4" />
              ) : formData.type === 'income' ? (
                <ArrowDownRight className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {isOneTime ? 'New One-Time Cost' : formData.type === 'income' ? 'New Recurring Income' : 'New Recurring Bill'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {isOneTime
                  ? 'Record lifetime license, one-off subscription fee, or single payment'
                  : formData.type === 'income'
                    ? 'Automate monthly salary, client retainers, or rental inflow'
                    : 'Automate recurring bills, subscriptions, or commitments'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#121215]">
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 no-scrollbar space-y-3 sm:space-y-3.5">
            {/* Unified Single Mode Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  type: 'expense',
                  frequency: isOneTime ? 'monthly' : formData.frequency
                })}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${
                  !isOneTime && formData.type === 'expense'
                    ? 'bg-white dark:bg-[#16161a] text-blue-600 dark:text-blue-400 border border-slate-200/80 dark:border-blue-500/30 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-transparent font-medium'
                }`}
              >
                <Repeat className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Recurring Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  type: 'expense',
                  frequency: 'one-time',
                  category: formData.category || 'Subscriptions'
                })}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${
                  isOneTime
                    ? 'bg-white dark:bg-[#16161a] text-amber-600 dark:text-amber-400 border border-slate-200/80 dark:border-amber-500/30 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-transparent font-medium'
                }`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">One-Time Cost</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  type: 'income',
                  frequency: isOneTime ? 'monthly' : formData.frequency
                })}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${
                  !isOneTime && formData.type === 'income'
                    ? 'bg-white dark:bg-[#16161a] text-emerald-600 dark:text-emerald-400 border border-slate-200/80 dark:border-emerald-500/30 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-transparent font-medium'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Income / Salary</span>
              </button>
            </div>

            {/* Amount Hero Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="rec-amount" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  {isOneTime ? 'Amount' : 'Recurring Amount'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isOneTime
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : formData.type === 'income'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {isOneTime ? '⚡ One-Time' : formData.type === 'income' ? '+ Inflow' : '- Outflow'}
                </span>
              </div>
              <div className={`relative flex items-center rounded-xl border bg-slate-50/70 dark:bg-[#16161a] transition-all px-3.5 py-1.5 sm:py-2 ${
                isOneTime
                  ? 'border-slate-200/90 dark:border-white/[0.08] focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20'
                  : formData.type === 'income'
                    ? 'border-slate-200/90 dark:border-white/[0.08] focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20'
                    : 'border-slate-200/90 dark:border-white/[0.08] focus-within:border-rose-500/60 focus-within:ring-2 focus-within:ring-rose-500/20'
              }`}>
                <span className={`text-lg sm:text-xl font-bold select-none mr-2 ${
                  isOneTime
                    ? 'text-amber-600 dark:text-amber-400'
                    : formData.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-zinc-500'
                }`}>
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  id="rec-amount"
                  value={formData.amount}
                  onFocus={(e) => {
                    if (e.target.value === '0' || e.target.value === '') {
                      setFormData({ ...formData, amount: '' })
                    }
                  }}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9.]/g, '')
                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                      val = val.replace(/^0+/, '')
                    }
                    const parts = val.split('.')
                    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
                    setFormData({ ...formData, amount: val })
                  }}
                  className="w-full text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums placeholder:text-slate-300 dark:placeholder:text-zinc-600 bg-transparent outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Title / Description */}
            <div>
              <label htmlFor="rec-description" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                {isOneTime
                  ? 'Item / License Name'
                  : formData.type === 'income'
                    ? 'Income / Deposit Name'
                    : 'Subscription / Bill Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="rec-description"
                required
                placeholder={
                  isOneTime
                    ? "e.g. Lifetime License, Domain Renewal, Annual Software Fee"
                    : formData.type === 'income'
                      ? "e.g. Monthly Salary, Freelance Retainer, Rental Deposit"
                      : "e.g. Netflix Premium, Gym Membership, House Rent"
                }
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a] text-base sm:text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors"
              />
            </div>

            {/* Mode-Specific Structured Fields */}
            {isOneTime ? (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 items-start">
                  <div>
                    <CustomSelect
                      id="rec-category"
                      label="Category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      leftIcon={CategoryIcon ? <CategoryIcon className={`w-3.5 h-3.5 ${categoryVisual.colorClass}`} /> : undefined}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </CustomSelect>
                  </div>

                  <CustomDateField
                    id="rec-paymentDate"
                    label="Payment Date"
                    placeholder="Date paid"
                    value={formData.startDate}
                    onChange={(val) => setFormData({ ...formData, startDate: val })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 items-start">
                  <CustomSelect
                    id="rec-paymentMethod"
                    label="Payment Method"
                    required
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="">Select Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </CustomSelect>

                  <div>
                    <label htmlFor="rec-notes" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                      Notes <span className="text-slate-400 dark:text-zinc-500 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="rec-notes"
                      placeholder="License key, remarks..."
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a] text-base sm:text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 items-start">
                  <div>
                    <CustomSelect
                      id="rec-category"
                      label="Category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      leftIcon={CategoryIcon ? <CategoryIcon className={`w-3.5 h-3.5 ${categoryVisual.colorClass}`} /> : undefined}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </CustomSelect>
                  </div>

                  <CustomSelect
                    id="rec-frequency"
                    label="Cadence / Frequency"
                    required
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </CustomSelect>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 items-start">
                  {formData.type === 'income' ? (
                    <CustomSelect
                      id="rec-source"
                      label="Source (Optional)"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                      <option value="">Select Source</option>
                      {sourcesOrPurposes.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </CustomSelect>
                  ) : (
                    <CustomSelect
                      id="rec-paymentMethod"
                      label="Payment Method"
                      required
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="">Select Method</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </CustomSelect>
                  )}

                  <CustomDateField
                    id="rec-startDate"
                    label="Start Date"
                    placeholder="Billing start date"
                    value={formData.startDate}
                    onChange={(val) => setFormData({ ...formData, startDate: val })}
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Sticky Modal Actions Footer */}
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3.5">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 sm:h-9.5 px-4 sm:px-5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading || !formData.amount || !formData.category || !formData.startDate || !formData.description.trim()}
              className={`flex-1 h-9 sm:h-9.5 rounded-xl active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                isOneTime
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : formData.type === 'income'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isOneTime ? <Zap className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>
                {formLoading
                  ? 'Saving...'
                  : isOneTime
                    ? 'Save One-Time Cost'
                    : formData.type === 'income'
                      ? 'Create Recurring Income'
                      : 'Create Recurring Bill'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


