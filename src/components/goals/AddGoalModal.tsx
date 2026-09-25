'use client'

import React from 'react'
import { Target, X, Plus, ArrowLeft } from 'lucide-react'
import CustomDateField from '@/components/ui/CustomDateField'

interface NewGoal {
  name: string
  targetAmount: string
  deadline: string
  category: string
}

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  newGoal: NewGoal
  setNewGoal: (goal: NewGoal) => void
  handleAddGoal: (e: React.FormEvent) => void
  availableCategories?: string[]
}

export function AddGoalModal({
  isOpen,
  onClose,
  onBack,
  newGoal,
  setNewGoal,
  handleAddGoal,
}: AddGoalModalProps) {

  if (!isOpen) return null

  const presetAmounts = [10000, 50000, 100000, 500000]

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-white/[0.08] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden transform transition-all text-slate-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#16161a]/60 shrink-0">
          <div className="flex items-center gap-2.5">
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
            <div className="h-9 w-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Target className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                New Savings Goal
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Plan a realistic target and timeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAddGoal} className="p-5 overflow-y-auto space-y-4 flex-1 [scrollbar-width:thin]">
          {/* Goal Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5">
              Goal Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Reserve, Japan Trip, MacBook Pro..."
              value={newGoal.name}
              onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200/90 dark:border-white/[0.08] rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition-colors"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5">
              Target Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 1,00,000"
              value={newGoal.targetAmount}
              onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
              className="w-full px-3.5 py-2.5 text-base sm:text-xs tabular-nums font-semibold bg-slate-50 dark:bg-[#18181b] border border-slate-200/90 dark:border-white/[0.08] rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition-colors"
            />
            {/* Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetAmounts.map(val => (
                <button
                  key={`add-preset-${val}`}
                  type="button"
                  onClick={() => setNewGoal({ ...newGoal, targetAmount: String(val) })}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all tabular-nums ${
                    newGoal.targetAmount === String(val)
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-[#18181b] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ₹{val >= 100000 ? `${val / 100000}L` : `${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5">
              Category
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Investment, Emergency Fund, Vacation..."
              value={newGoal.category}
              onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
              className="w-full px-3.5 py-2.5 text-base sm:text-xs font-medium bg-slate-50 dark:bg-[#18181b] border border-slate-200/90 dark:border-white/[0.08] rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition-colors"
            />
          </div>

          {/* Target Date */}
          <div>
            <CustomDateField
              label="Target Deadline (Optional)"
              placeholder="Target date (e.g. 31 Dec 2026)"
              value={newGoal.deadline}
              onChange={val => setNewGoal({ ...newGoal, deadline: val })}
              size="sm"
            />
          </div>

          <div
            className="flex gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/[0.06] mt-2"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-900/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Goal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
