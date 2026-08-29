'use client'

import React, { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { SavingsGoal } from './types'

interface DeleteGoalModalProps {
  goal: SavingsGoal | null
  isOpen: boolean
  onClose: () => void
  onConfirmDelete: (goal: SavingsGoal, deleteTransactions: boolean) => Promise<void>
  contributionsCount: number
}

export default function DeleteGoalModal({
  goal,
  isOpen,
  onClose,
  onConfirmDelete,
  contributionsCount
}: DeleteGoalModalProps) {
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen || !goal) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirmDelete(goal, deleteTransactions)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Delete Goal
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-white font-semibold">"{goal.name}"</strong>? This goal will be removed from your savings dashboard.
        </p>

        {/* Optional Checkbox */}
        {contributionsCount > 0 && (
          <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 dark:text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={deleteTransactions}
              onChange={e => setDeleteTransactions(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-neutral-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <span className="text-[11px] leading-tight text-slate-500 dark:text-neutral-400">
              Also delete {contributionsCount} linked deposit transaction{contributionsCount === 1 ? '' : 's'} from transaction history
            </span>
          </label>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
