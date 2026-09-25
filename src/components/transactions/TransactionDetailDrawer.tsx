'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Calendar,
  CreditCard,
  Briefcase,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  FileText,
  Car,
  Target
} from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { getCategoryVisual } from '@/lib/category-icons'
import { formatDateForDisplay } from '@/lib/dateUtils'

import type { Transaction } from '@/components/RegularTransactionList'

interface TransactionDetailDrawerProps {
  transaction: Transaction | null
  onClose: () => void
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onDuplicate: (transaction: Transaction) => void
}

export default function TransactionDetailDrawer({
  transaction,
  onClose,
  onEdit,
  onDelete,
  onDuplicate
}: TransactionDetailDrawerProps) {
  useEffect(() => {
    if (!transaction) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [transaction, onClose])

  if (!transaction) return null

  const isIncome = transaction.type === 'income'
  const displayTitle = transaction.title || transaction.description || 'Untitled Transaction'
  const visual = getCategoryVisual(transaction.category, transaction.type, undefined)
  const VisualIcon = visual.icon
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#121215] text-slate-900 dark:text-zinc-100 shadow-2xl h-full flex flex-col sm:rounded-l-2xl border-l border-slate-200/90 dark:border-white/[0.08] overflow-hidden z-10 animate-slide-left duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 shadow-xs ${visual.bgClass} ${visual.borderClass}`}>
              <VisualIcon className={`w-4 h-4 ${visual.colorClass}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Transaction Details
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {isIncome ? 'Income Record' : 'Expense Record'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5 custom-scrollbar">
          {/* Identity & Amount Hero Card */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#16161a]/80 border border-slate-200/90 dark:border-white/[0.08] space-y-3 shadow-xs">
            {/* Top row: Name & Category */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                  {displayTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${visual.bgClass} ${visual.borderClass} ${visual.colorClass}`}>
                    <VisualIcon className="w-3 h-3" />
                    <span>{transaction.category}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">•</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    {formattedDate}
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    isIncome
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Settled</span>
                </span>
              </div>
            </div>

            {/* Bottom row: Amount Hero */}
            <div className="pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06] flex items-baseline justify-between">
              <div>
                <span
                  className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
                    isIncome
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {isIncome ? 'Inflow' : 'Outflow'}
              </span>
            </div>
          </div>

          {/* Structured Metadata Specs */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.06] bg-white dark:bg-[#16161a]/40 overflow-hidden text-xs shadow-xs">
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Payment Method</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {transaction.paymentMethod || 'Not specified'}
              </span>
            </div>

            {transaction.source && (
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Source / Payee</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {transaction.source}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Transaction Date</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">
                {formatDateForDisplay(transaction.date)}
              </span>
            </div>

            {transaction.recurringTransactionId && (
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="font-medium">Recurring Schedule</span>
                </div>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {transaction.recurringTransaction?.frequency || 'Active'} Bill
                </span>
              </div>
            )}

            {transaction.travelEntry && (
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Car className="w-3.5 h-3.5" />
                  <span className="font-medium">Travel & Mileage</span>
                </div>
                <span className="font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                  {(Number(transaction.travelEntry.endKm) - Number(transaction.travelEntry.startKm)).toFixed(1)} km ({Number(transaction.travelEntry.liters)}L)
                </span>
              </div>
            )}

            {transaction.goalContribution && (
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Target className="w-3.5 h-3.5" />
                  <span className="font-medium">Goal Allocation</span>
                </div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {transaction.goalContribution.goal?.name || 'Goal'} ({transaction.goalContribution.type})
                </span>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#16161a]/60 border border-slate-200/80 dark:border-white/[0.08] text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
              {transaction.notes ? (
                <p className="whitespace-pre-wrap">{transaction.notes}</p>
              ) : (
                <p className="text-slate-400 dark:text-zinc-500 italic">No notes attached to this transaction.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 flex items-center justify-between gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onDuplicate(transaction)
                onClose()
              }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#18181b] hover:bg-slate-100 dark:hover:bg-[#222226] text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(transaction.id)
                onClose()
              }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-white dark:bg-[#18181b] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Delete transaction"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onEdit(transaction)
              onClose()
            }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Transaction</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
