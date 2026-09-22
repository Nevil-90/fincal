// Component for RecurringForm.tsx
'use client'

import { RecurringFormData } from './types'
import { useScrollLock } from '@/hooks/useScrollLock'
import { X } from 'lucide-react'
import CustomDateField from '@/components/ui/CustomDateField'
import CustomSelect from '@/components/ui/CustomSelect'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'

interface RecurringFormProps {
  formData: RecurringFormData
  setFormData: (data: RecurringFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  formLoading: boolean
}

export default function RecurringForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  formLoading
}: RecurringFormProps) {
  useScrollLock(true)
  const { data: staticData } = useEnhancedStaticData()

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

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/45 dark:bg-neutral-950/80 p-3 sm:p-4 backdrop-blur-sm overflow-hidden" onClick={onCancel}>
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Recurring Transaction</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 bg-white dark:bg-neutral-900">
          <div className="flex-1 overflow-y-auto px-5 py-3.5 no-scrollbar">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {/* Type Toggle */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
                  Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      formData.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-neutral-800/50 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      formData.type === 'expense'
                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-neutral-800/50 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="col-span-2">
                <label htmlFor="rec-description" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="rec-description"
                  required
                  placeholder="e.g. Internet, Rent, Gym, Salary"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold transition-all"
                />
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="rec-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
                  Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-bold">₹</span>
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
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <CustomSelect
                id="rec-category"
                label="Category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </CustomSelect>

              {/* Frequency */}
              <CustomSelect
                id="rec-frequency"
                label="Frequency"
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

              {/* Payment Method / Source */}
              {formData.type === 'income' ? (
                <CustomSelect
                  id="rec-source"
                  label="Source (Optional)"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="">Select source</option>
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
                  <option value="">Select payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </CustomSelect>
              )}

              {/* Start Date */}
              <div className="col-span-2">
                <CustomDateField
                  id="rec-startDate"
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(val) => setFormData({ ...formData, startDate: val })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 p-4 border-t border-slate-100 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-700 dark:text-neutral-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading || !formData.amount || !formData.category || !formData.startDate || !formData.description.trim()}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {formLoading ? 'Adding...' : 'Add Recurring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
