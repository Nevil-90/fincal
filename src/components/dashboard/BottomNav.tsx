'use client'

import React from 'react'
import {
  BarChart3, CreditCard, Target, RefreshCw, Plus, PieChart, Calendar, Car, Settings, Shield
} from 'lucide-react'
import { useNavPreferences } from '@/hooks/useNavPreferences'

type DashboardTab = 'overview' | 'analytics' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'settings' | 'admin'

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
  'settings': { icon: Settings, label: 'Settings' },
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
        onClick={onAddTransaction}
        className="fixed bottom-20 right-4 z-50 md:hidden w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-white border-t border-slate-200 shadow-[0_-4px_24px_-4px_rgba(15,23,42,0.12)]">
          <div className={`grid ${gridColsClass} items-end`} style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
            {slots.map((tabStr, index) => {
              const tabDef = TAB_MAPPING[tabStr]
              if (!tabDef) return null
              
              const tab = tabStr as DashboardTab
              const Icon = tabDef.icon
              const label = tabDef.label

              return (
                <button
                  key={`${tab}-${index}`}
                  onClick={() => onTabChange(tab)}
                  className={`flex flex-col items-center justify-end gap-1 pt-2 pb-2 w-full transition-colors ${
                    activeTab === tab ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                    activeTab === tab ? 'bg-blue-50' : ''
                  }`}>
                    <Icon className="h-5 w-5" />
                    {activeTab === tab && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold leading-none truncate w-full px-0.5">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
})
