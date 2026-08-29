// Component for RecurringForm.tsx
'use client'

import { RecurringFormData } from './types'
import { useScrollLock } from '@/hooks/useScrollLock'
import { Calendar, Lightbulb, X } from 'lucide-react'
import CustomDateField from '@/components/ui/CustomDateField'
import CustomSelect from '@/components/ui/CustomSelect'

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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 dark:bg-neutral-950/80 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Recurring Transaction</h3>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={onSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Income</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expense</span>
              </label>
            </div>
          </div>

          {/* Amount and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="1000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white bg-white dark:bg-neutral-950"
                  step="0.01"
                  required
                />
              </div>
              {formData.amount && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {formData.frequency} amount: ₹{parseFloat(formData.amount).toFixed(2)}
                </p>
              )}
            </div>

            <CustomSelect
              label="Category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select category</option>
              {formData.type === 'income' ? (
                <>
                  <option value="Salary">Salary</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Business">Business</option>
                  <option value="Investment">Investment</option>
                  <option value="Rental">Rental</option>
                  <option value="Other Income">Other Income</option>
                </>
              ) : (
                <>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Travel">Travel</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Investments">Investments</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Rent">Rent</option>
                  <option value="EMI">EMI</option>
                  <option value="Other Expense">Other Expense</option>
                </>
              )}
            </CustomSelect>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g., Netflix subscription, Salary from ABC Corp"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold outline-none transition-all"
            />
          </div>

          {/* Payment Method and Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              {formData.type === 'income' ? (
                <CustomSelect
                  label="Source"
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="">Select source</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Other">Other</option>
                </CustomSelect>
              ) : (
                <CustomSelect
                  label="Payment Method"
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="">Select payment method</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                  <option value="Auto Debit">Auto Debit</option>
                  <option value="Other">Other</option>
                </CustomSelect>
              )}
            </div>

            <div>
              <CustomSelect
                label="Frequency"
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
          </div>

          {/* Start Date */}
          <div>
            <CustomDateField
              label="Start Date"
              required
              value={formData.startDate}
              onChange={(val) => setFormData({ ...formData, startDate: val })}
            />
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5">
              Transactions will be created automatically starting from this date
            </p>
          </div>

          {/* Price History Feature Info */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="flex items-start gap-1.5"><Lightbulb className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" /> <span><strong>Coming Soon:</strong> Price history support will allow you to add price changes over time.</span></span>
              The system will automatically apply the correct amount for each billing period.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? 'Adding...' : 'Add Recurring'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}
