'use client'

import React from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  paymentMethod: string | null
  source: string | null
  date: string
}

interface RecentActivityCardProps {
  periodTxns: Transaction[]
  onViewAll: () => void
}

export default React.memo(function RecentActivityCard({
  periodTxns,
  onViewAll
}: RecentActivityCardProps) {
  const displayedTxns = periodTxns.slice(0, 4)

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-neutral-800">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          Recent Activity
        </h4>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          View All →
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-neutral-800/70">
        {displayedTxns.map(t => (
          <div key={t.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
            <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
              t.type === 'income'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}>
              {t.type === 'income' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {t.description || t.category}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium truncate">
                {t.category} {t.paymentMethod ? `· ${t.paymentMethod}` : ''}
              </p>
            </div>
            <span className={`text-xs font-bold font-mono shrink-0 ${
              t.type === 'income'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-900 dark:text-white'
            }`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
          </div>
        ))}
        {displayedTxns.length === 0 && (
          <div className="px-4 py-4 text-center text-xs text-slate-400 dark:text-neutral-500">
            No transactions recorded
          </div>
        )}
      </div>
    </div>
  )
})
