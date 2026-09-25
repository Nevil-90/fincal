'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Calendar,
  CreditCard,
  Clock,
  Play,
  Pause,
  Trash2,
  Edit2,
  TrendingUp,
  History,
  ArrowRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { getCategoryVisual } from '@/lib/category-icons'
import { formatDateForDisplay } from '@/lib/dateUtils'

interface RecurringTransaction {
  id: string
  type: string
  amount: number
  category: string
  description?: string | null
  paymentMethod?: string | null
  frequency: string
  startDate: string
  nextDue: string
  isActive: boolean
  isPaused: boolean
  totalSpent?: number
  executionCount?: number
  priceHistory?: Array<{ id: string; amount: number; effectiveDate: string; reason?: string | null }>
}

interface RecurringDetailDrawerProps {
  recurring: RecurringTransaction | null
  onClose: () => void
  onEdit: (recurring: RecurringTransaction) => void
  onDelete: (id: string) => void
  onTogglePause: (id: string, currentPaused: boolean) => void
  onShowPriceHistory?: (recurring: RecurringTransaction) => void
}

export default function RecurringDetailDrawer({
  recurring,
  onClose,
  onEdit,
  onDelete,
  onTogglePause,
  onShowPriceHistory
}: RecurringDetailDrawerProps) {
  useEffect(() => {
    if (!recurring) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [recurring, onClose])

  if (!recurring) return null

  const displayTitle = recurring.description || recurring.category || 'Recurring Item'
  const visual = getCategoryVisual(recurring.category, recurring.type || 'expense', undefined)
  const VisualIcon = visual.icon
  const isPaused = !recurring.isActive || recurring.isPaused

  // Calculate days until next due
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const dueDate = new Date(recurring.nextDue)
  dueDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let dueText = `In ${diffDays} days`
  if (diffDays === 0) dueText = 'Due Today'
  else if (diffDays === 1) dueText = 'Due Tomorrow'
  else if (diffDays < 0) dueText = `${Math.abs(diffDays)}d Overdue`

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
                Subscription Details
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {recurring.type === 'income' ? 'Scheduled Income' : 'Recurring Bill'}
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

        {/* Content Body - Compact and neatly spaced */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5 custom-scrollbar">
          {/* Unified Identity & Amount Hero Card */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#16161a]/80 border border-slate-200/90 dark:border-white/[0.08] space-y-3 shadow-xs">
            {/* Top row: Icon + Name + Category */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                  {displayTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${visual.bgClass} ${visual.borderClass} ${visual.colorClass}`}>
                    <VisualIcon className="w-3 h-3" />
                    <span>{recurring.category}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">•</span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 capitalize">
                    {recurring.frequency}
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isPaused
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08]'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-zinc-400' : 'bg-emerald-500 animate-pulse'}`} />
                  {isPaused ? 'Paused' : 'Active'}
                </span>
                {!isPaused && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 tabular-nums">
                    {dueText}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom row: Prominent Cost */}
            <div className="pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06] flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {formatCurrency(recurring.amount)}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 ml-1.5 lowercase">
                  / {recurring.frequency}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500 block">
                  Next Due
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 tabular-nums">
                  {formatDateForDisplay(recurring.nextDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Structured Detail Specifications */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.06] bg-white dark:bg-[#16161a]/40 overflow-hidden text-xs shadow-xs">
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Billing Cadence</span>
              </div>
              <span className="font-semibold capitalize text-slate-800 dark:text-zinc-200">
                {recurring.frequency}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Payment Account</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {recurring.paymentMethod || 'Default / Not set'}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Start Date</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">
                {formatDateForDisplay(recurring.startDate)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Lifetime Runs</span>
              </div>
              <span className="font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                {recurring.executionCount || 0} cycles
              </span>
            </div>

            {recurring.totalSpent !== undefined && (
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium">Total Spent to Date</span>
                </div>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(recurring.totalSpent)}
                </span>
              </div>
            )}
          </div>

          {/* Price History Action Tile */}
          {onShowPriceHistory && (
            <button
              type="button"
              onClick={() => {
                onShowPriceHistory(recurring)
                onClose()
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#16161a]/60 border border-slate-200/80 dark:border-white/[0.08] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all text-xs font-semibold text-slate-700 dark:text-zinc-300 group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Price History & Inflation
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                    Track price hikes, plan changes, or adjustments
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 flex items-center justify-between gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onTogglePause(recurring.id, recurring.isPaused)
                onClose()
              }}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                isPaused
                  ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  : 'border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#18181b] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#222226]'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDelete(recurring.id)
                onClose()
              }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-white dark:bg-[#18181b] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Delete subscription"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onEdit(recurring)
              onClose()
            }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Schedule</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
