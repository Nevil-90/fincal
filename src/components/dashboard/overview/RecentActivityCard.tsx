'use client'

import React, { useMemo } from 'react'
import {
  BarChart3,
  ChevronRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { getCategoryVisual } from '@/lib/category-icons'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { formatDateForDisplay } from '@/lib/dateUtils'

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
  onOpenInsights?: () => void
  isAllYear?: boolean
  activeYear?: number
  monthName?: string
}

export default React.memo(function RecentActivityCard({
  periodTxns,
  onViewAll,
  onOpenInsights,
  isAllYear,
  activeYear,
  monthName
}: RecentActivityCardProps) {
  const { data: staticData } = useEnhancedStaticData()
  const customIcons = useMemo(() => {
    try {
      return JSON.parse(staticData?.userSettings?.custom_category_icons || '{}')
    } catch {
      return {}
    }
  }, [staticData?.userSettings?.custom_category_icons])

  const displayedTxns = periodTxns.slice(0, 5)

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-sm flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200/70 dark:border-white/[0.06]">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
          Recent Activity
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          View All →
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
        {displayedTxns.map(t => {
          const visual = getCategoryVisual(t.category, t.type, undefined, customIcons)
          const Icon = visual.icon
          const isIncome = t.type === 'income'

          return (
            <div key={t.id} className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#16161a] transition-colors">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${visual.bg}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {t.description || t.category}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500 font-medium truncate">
                  <span>{t.category}</span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {formatDateForDisplay(t.date)}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold tabular-nums shrink-0 ${
                isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
              }`}>
                {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
            </div>
          )
        })}
        {displayedTxns.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
            No activity recorded
          </div>
        )}
      </div>

      {/* Embedded Insights Trigger in Card Footer */}
      {onOpenInsights && (
        <button
          type="button"
          onClick={onOpenInsights}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50/80 dark:bg-[#16161a] hover:bg-slate-100 dark:hover:bg-[#1c1c21] border-t border-slate-200/70 dark:border-white/[0.06] transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white truncate">
              {isAllYear ? `${activeYear} Insights` : `${monthName} Insights Report`}
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      )}
    </div>
  )
})
