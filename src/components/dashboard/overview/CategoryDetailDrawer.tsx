'use client'

import React from 'react'
import { X, Receipt, CreditCard, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

interface BudgetRow {
  id: string
  category: string
  amount: number
  period: string
  spent: number
  limit: number
  pct: number
  remaining: number
  status: 'over' | 'warn' | 'ok' | 'safe'
}

interface CategoryDetailDrawerProps {
  category: string | null
  row: BudgetRow | undefined
  txns: any[]
  loading: boolean
  isAllYear: boolean
  activeYear: number
  monthName: string
  onClose: () => void
}

const STATUS_CONFIG = {
  over: { bar: 'bg-rose-500', label: 'Over budget', badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40' },
  warn: { bar: 'bg-amber-500', label: 'Near limit', badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40' },
  ok: { bar: 'bg-indigo-500', label: 'On track', badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/40' },
  safe: { bar: 'bg-emerald-500', label: 'Under control', badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40' },
}

export default function CategoryDetailDrawer({
  category,
  row,
  txns,
  loading,
  isAllYear,
  activeYear,
  monthName,
  onClose
}: CategoryDetailDrawerProps) {
  if (!category || !row) return null
  const cfg = STATUS_CONFIG[row.status]

  return (
    <div className="fixed inset-0 z-[500] overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-950/50 dark:bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          className="w-screen max-w-full sm:max-w-md bg-white dark:bg-neutral-950 border-l border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col h-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {row.category}
                </h2>
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-neutral-400 uppercase tracking-wider mt-0.5">
                  {isAllYear ? `${activeYear} Annual Budget` : `${monthName} ${activeYear}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 [scrollbar-width:thin]">
            {/* Overview Card */}
            <div className="bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-neutral-400">{Math.round(row.pct)}% utilized</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-wider">Total Spent</span>
                  <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">{formatCurrency(row.spent)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-wider">Budget Limit</span>
                  <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">{formatCurrency(row.limit)}</p>
                </div>
              </div>

              <div className="h-2 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                  style={{ width: `${Math.min(row.pct, 100)}%` }}
                />
              </div>

              <div className="text-right pt-0.5">
                <span className={`text-xs font-mono font-bold ${
                  row.remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {row.remaining < 0 ? `${formatCurrency(Math.abs(row.remaining))} Over Limit` : `${formatCurrency(row.remaining)} Left`}
                </span>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                Transaction History ({txns.length})
              </h3>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading transactions...</div>
              ) : txns.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-neutral-900/40 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">No transactions recorded for this period</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {txns.map((txn: any) => {
                    const isLarge = txn.amount >= 2000
                    return (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 transition-all text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {txn.description || txn.category}
                            </span>
                            {isLarge && (
                              <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-rose-200/60 dark:border-rose-900/40">
                                Large
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                            <span>{new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                            {txn.paymentMethod && <span>· {txn.paymentMethod}</span>}
                          </div>
                        </div>
                        <span className="font-black font-mono text-slate-900 dark:text-white shrink-0">
                          -{formatCurrency(txn.amount)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
