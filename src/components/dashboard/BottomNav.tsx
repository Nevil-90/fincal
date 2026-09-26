'use client'

import React from 'react'
import {
  BarChart3, CreditCard, Target, RefreshCw, Plus, PieChart, Calendar, Car, Settings, Shield
} from 'lucide-react'
import { useNavPreferences } from '@/hooks/useNavPreferences'

type DashboardTab = 'overview' | 'analytics' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'admin'

interface BottomNavProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  onAddTransaction: () => void
}

const TAB_MAPPING: Record<string, { icon: any, label: string }> = {
  'overview': { icon: BarChart3, label: 'Overview' },
  'transactions': { icon: CreditCard, label: 'Expenses' },
  'goals': { icon: Target, label: 'Goals' },
  'recurring': { icon: RefreshCw, label: 'Recurring' },
  'analytics': { icon: PieChart, label: 'Analytics' },
  'calendar': { icon: Calendar, label: 'Calendar' },
  'traveling': { icon: Car, label: 'Traveling' },
  'admin': { icon: Shield, label: 'Admin' }
}

export default React.memo(function BottomNav({
  activeTab,
  onTabChange,
  onAddTransaction,
}: BottomNavProps) {
  const { slots } = useNavPreferences()

  // Generate grid column class based on number of slots (4 to 6)
  const gridColsClass = slots.length === 5 
    ? 'grid-cols-5' 
    : slots.length === 6 
      ? 'grid-cols-6' 
      : 'grid-cols-4'

  return (
    <>
      {/* Floating Add Button */}
      <button
        data-tour="add-transaction"
        onClick={onAddTransaction}
        aria-label="Log new transaction"
        style={{ bottom: 'calc(80px + max(env(safe-area-inset-bottom, 0px), 8px))' }}
        className="fixed right-4 sm:right-5 z-50 md:hidden h-12 w-12 bg-blue-600 hover:bg-blue-700 active:scale-90 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 ring-1 ring-white/20 dark:ring-white/10 transition-all duration-150"
      >
        <Plus className="h-5 w-5 stroke-[2.5]" />
      </button>

      {/* Bottom Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden select-none">
        <div className="bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-neutral-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className={`grid ${gridColsClass} items-center`} style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}>
            {slots.map((tabStr, index) => {
              const tabDef = TAB_MAPPING[tabStr]
              if (!tabDef) return null
              
              const tab = tabStr as DashboardTab
              const Icon = tabDef.icon
              const label = tabDef.label
              const isActive = activeTab === tab

              return (
                <button
                  key={`${tab}-${index}`}
                  data-tour={`bottomnav-${tab}`}
                  onClick={() => onTabChange(tab)}
                  className={`flex flex-col items-center justify-center pt-2 pb-1 w-full transition-colors active:scale-95 ${
                    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-neutral-500'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                    isActive ? 'bg-slate-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 font-bold' : ''
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight truncate w-full px-0.5 text-center mt-0.5 ${
                    isActive ? 'font-bold text-slate-900 dark:text-white' : ''
                  }`}>{label}</span>
                  <div className="h-1 flex items-center justify-center mt-0.5">
                    {isActive ? (
                      <span className="w-1.5 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                    ) : (
                      <span className="w-1.5 h-1 rounded-full bg-transparent" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
})
