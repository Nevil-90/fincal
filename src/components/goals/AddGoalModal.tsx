'use client'

import React, { useState } from 'react'
import { Target, X, Calendar, ChevronDown, Plus } from 'lucide-react'

interface NewGoal {
  name: string
  targetAmount: string
  deadline: string
  category: string
}

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
  newGoal: NewGoal
  setNewGoal: (goal: NewGoal) => void
  handleAddGoal: (e: React.FormEvent) => void
  availableCategories: string[]
}

export function AddGoalModal({
  isOpen,
  onClose,
  newGoal,
  setNewGoal,
  handleAddGoal,
  availableCategories = []
}: AddGoalModalProps) {
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')

  if (!isOpen) return null

  const presetAmounts = [10000, 50000, 100000, 500000]

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-neutral-800 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-slate-800 dark:text-neutral-200">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                New Savings Goal
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                Plan a realistic target and timeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAddGoal} className="p-5 overflow-y-auto space-y-4 flex-1 [scrollbar-width:thin]">
          {/* Goal Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Goal Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Reserve, Japan Trip, MacBook Pro..."
              value={newGoal.name}
              onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Target Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 100000"
              value={newGoal.targetAmount}
              onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none text-slate-900 dark:text-white"
            />
            {/* Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetAmounts.map(val => (
                <button
                  key={`add-preset-${val}`}
                  type="button"
                  onClick={() => setNewGoal({ ...newGoal, targetAmount: String(val) })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    newGoal.targetAmount === String(val)
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 border-slate-900 dark:border-white shadow-sm'
                      : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-750'
                  }`}
                >
                  ₹{val >= 100000 ? `${val / 100000}L` : `${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                Category
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory)
                  if (!isCustomCategory) {
                    setNewGoal({ ...newGoal, category: customCategoryInput })
                  }
                }}
                className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 hover:underline"
              >
                {isCustomCategory ? 'Choose from existing' : '+ Custom Category'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                required
                placeholder="e.g. Wedding, Real Estate, Crypto..."
                value={customCategoryInput}
                onChange={e => {
                  setCustomCategoryInput(e.target.value)
                  setNewGoal({ ...newGoal, category: e.target.value })
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none text-slate-900 dark:text-white"
              />
            ) : (
              <div className="relative">
                <select
                  value={newGoal.category}
                  onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full appearance-none [-webkit-appearance:none] pl-3 pr-8 py-2.5 text-xs font-semibold bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-none text-slate-900 dark:text-white cursor-pointer capitalize"
                  required
                >
                  {availableCategories.length > 0 ? (
                    availableCategories.map(cat => (
                      <option key={cat} value={cat} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white capitalize">
                        {cat}
                      </option>
                    ))
                  ) : (
                    <option value="General" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">General</option>
                  )}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Target Deadline <span className="normal-case font-normal text-slate-400">(Optional)</span>
            </label>
            <div className="relative w-full">
              <div className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white flex items-center justify-between pointer-events-none transition-colors">
                <span className={newGoal.deadline ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-neutral-500'}>
                  {newGoal.deadline
                    ? new Date(newGoal.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Select Target Date'}
                </span>
                <Calendar className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
              </div>
              <input
                type="date"
                value={newGoal.deadline}
                onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                onClick={e => {
                  try {
                    if ('showPicker' in HTMLInputElement.prototype) {
                      (e.target as HTMLInputElement).showPicker()
                    }
                  } catch {}
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-slate-100 shadow-sm transition-all"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
