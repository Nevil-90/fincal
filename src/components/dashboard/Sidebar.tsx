'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Target,
  CalendarDays,
  Gauge,
  LineChart,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  Plus
} from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

interface SidebarProps {
  sidebarOpen: boolean
  activeTab: 'overview' | 'analytics' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'admin'
  availableBalance: number
  onTabChange: (tab: 'overview' | 'analytics' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'admin') => void
  onClose?: () => void
  user?: { firstName: string; lastName: string; email: string; role?: string } | null
  onLogout?: () => void
  onQuickAdd?: () => void
}

interface NavItem {
  id: 'overview' | 'analytics' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'admin'
  icon: React.ElementType
  label: string
  adminOnly?: boolean
}

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
      { id: 'transactions', icon: Receipt, label: 'Transactions' },
      { id: 'recurring', icon: Repeat, label: 'Recurring Bills' },
      { id: 'goals', icon: Target, label: 'Goals' },
      { id: 'analytics', icon: LineChart, label: 'Analytics' },
      { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
      { id: 'traveling', icon: Gauge, label: 'Travel & Fuel' },
      { id: 'admin', icon: ShieldCheck, label: 'Admin', adminOnly: true }
    ]
  }
]

export default React.memo(function Sidebar({
  sidebarOpen,
  activeTab,
  availableBalance,
  onTabChange,
  onClose,
  user,
  onLogout,
  onQuickAdd
}: SidebarProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark'

  const handleTabClick = (tab: any) => {
    onTabChange(tab)
    if (onClose) onClose()
  }

  useEffect(() => {
    const handleScrollLock = () => {
      if (sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }
    }
    handleScrollLock()
    window.addEventListener('resize', handleScrollLock)
    return () => {
      window.removeEventListener('resize', handleScrollLock)
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-slate-950/50 dark:bg-neutral-950/80 backdrop-blur-sm md:hidden transition-opacity duration-200"
        />
      )}

      {/* Rail Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-[110] bg-white dark:bg-[#09090b] border-r border-slate-200/80 dark:border-neutral-800/80 transition-all duration-300 flex flex-col md:sticky md:top-0 md:h-screen select-none ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-[72px]'
        }`}
      >
        {/* Brand Crest */}
        <div className="h-16 px-4 border-b border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <span className="font-black text-sm tracking-tighter">FN</span>
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white block truncate">
                  Finacal
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 block">
                  Personal Finance
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Add CTA on expanded sidebar */}
        {sidebarOpen && onQuickAdd && (
          <div className="px-3.5 pt-3.5 pb-1 shrink-0">
            <button
              onClick={onQuickAdd}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Transaction</span>
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5 no-scrollbar">
          {NAV_SECTIONS.map((section, sIndex) => {
            const filteredItems = section.items.filter(i => !i.adminOnly || user?.role === 'ADMIN')
            if (filteredItems.length === 0) return null

            return (
              <div key={sIndex} className="space-y-1">
                {sidebarOpen && (
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                    {section.title}
                  </p>
                )}
                {filteredItems.map(item => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      title={!sidebarOpen ? item.label : undefined}
                      className={`w-full flex items-center rounded-xl transition-all duration-150 ${
                        sidebarOpen
                          ? 'gap-3 px-3 py-2 text-left'
                          : 'justify-center h-10 w-10 mx-auto'
                      } ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-white font-semibold shadow-2xs'
                          : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800/70 hover:text-slate-900 dark:hover:text-white font-medium'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                      {sidebarOpen && (
                        <span className="text-xs truncate flex-1">{item.label}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Liquidity Pulse Badge (Desktop Expanded) */}
        {sidebarOpen && (
          <div className="px-3 pb-2 shrink-0">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800/80">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                <span>Net Liquidity</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                {formatCurrency(availableBalance)}
              </p>
            </div>
          </div>
        )}

        {/* User & Theme Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-neutral-800/80 shrink-0 bg-slate-50/50 dark:bg-neutral-950/50">
          {sidebarOpen ? (
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-200 text-xs font-black shrink-0 uppercase border border-slate-300 dark:border-neutral-700">
                  {user?.firstName ? user.firstName[0] : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user ? `${user.firstName} ${user.lastName}` : 'Finacal User'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">
                    {user?.email || 'Logged In'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {mounted && (
                  <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-neutral-800 transition-colors"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-200 text-xs font-black uppercase border border-slate-300 dark:border-neutral-700"
                title={user ? `${user.firstName} ${user.lastName}` : undefined}
              >
                {user?.firstName ? user.firstName[0] : 'U'}
              </div>
              {mounted && (
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
})
