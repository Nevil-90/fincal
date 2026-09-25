'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from 'next-themes'
import { Plus, Menu, User, Settings, Shield, LogOut, Car, Calendar, PieChart, BarChart3, CreditCard, Target, RefreshCw, Sun, Moon } from 'lucide-react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useNavPreferences } from '@/hooks/useNavPreferences'
import ProfileModal from '@/components/ProfileModal'

type DashboardTab = 'overview' | 'analytics' | 'insights' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'settings' | 'admin'

const ALL_TABS: Array<{ id: DashboardTab, icon: any, label: string, adminOnly?: boolean, color?: string }> = [
  { id: 'overview', icon: BarChart3, label: 'Overview' },
  { id: 'transactions', icon: CreditCard, label: 'Expenses' },
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'recurring', icon: RefreshCw, label: 'Recurring' },
  { id: 'analytics', icon: PieChart, label: 'Analytics' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'traveling', icon: Car, label: 'Traveling' },
  { id: 'admin', icon: Shield, label: 'Admin', adminOnly: true, color: 'red' }
]

interface DashboardHeaderProps {
  activeTab: DashboardTab
  onToggleSidebar: () => void
  onShowAddTransaction: () => void
  onTabChange?: (tab: DashboardTab) => void
  onLogout?: () => void
  onOpenSettings?: () => void
  isAdmin?: boolean
  user?: { firstName: string; lastName: string; email: string } | null
}

export default React.memo(function DashboardHeader({
  activeTab,
  onToggleSidebar,
  onShowAddTransaction,
  onTabChange,
  onLogout,
  onOpenSettings,
  isAdmin,
  user
}: DashboardHeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { slots } = useNavPreferences()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark'

  useScrollLock(showMobileMenu)

  const moreMenuTabs = ALL_TABS.filter(tab => {
    if (tab.adminOnly && !isAdmin) return false
    if (slots.includes(tab.id)) return false
    return true
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    return user?.firstName ? `${greeting}, ${user.firstName}` : greeting
  }

  const handleTabAndClose = (tab: DashboardTab) => {
    if (onTabChange) onTabChange(tab)
    setShowMobileMenu(false)
  }

  const getHeaderSubtitle = () => {
    return `Here's your financial overview for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
  }

  return (
    <>
      <header className="bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-neutral-800/80 px-4 sm:px-6 h-16 flex items-center justify-between shrink-0">
        {/* Left: Rail toggle & contextual breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            aria-label="Toggle Navigation Rail"
            title="Toggle Navigation Rail"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 dark:text-neutral-500">
              Finacal
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-300 dark:text-neutral-600">/</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate capitalize">
              {activeTab === 'overview' ? 'Overview' : activeTab === 'transactions' ? 'Transactions' : activeTab === 'recurring' ? 'Recurring Bills' : activeTab === 'goals' ? 'Goals' : activeTab === 'calendar' ? 'Calendar' : activeTab === 'traveling' ? 'Travel & Fuel' : activeTab}
            </h1>
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700 ml-1.5 tabular-nums">
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Add Transaction Button */}
          <button
            data-tour="add-transaction"
            onClick={onShowAddTransaction}
            className="flex items-center gap-1.5 py-1.5 px-3 sm:px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log Entry</span>
            <span className="sm:hidden">Log</span>
          </button>

          {/* Theme Quick Toggle (Desktop) */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="hidden md:flex items-center justify-center h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            title="System Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Profile Avatar */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="hidden md:flex items-center justify-center h-8 w-8 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 transition-all font-bold text-xs uppercase"
            title="Profile & Identity"
          >
            {user?.firstName ? user.firstName[0] : <User className="h-3.5 w-3.5" />}
          </button>

          {/* Mobile Profile Trigger (opens bottom sheet) */}
          <button
            data-tour="mobile-more-menu"
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 font-bold text-xs uppercase"
          >
            {user?.firstName ? user.firstName[0] : <User className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* Mobile Profile & More Menu (Bottom Sheet) */}
      {showMobileMenu && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden" onClick={() => setShowMobileMenu(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm transition-opacity -z-10" />

          {/* Sheet */}
          <div
            className="relative w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl animate-slide-up pb-safe flex flex-col max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-slate-200 dark:bg-neutral-700" />
            </div>

            {/* User info header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 uppercase shadow-sm border-2 border-white dark:border-neutral-800">
                {user?.firstName ? user.firstName[0] : <User className="h-6 w-6" />}
              </div>
              <div
                className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setShowMobileMenu(false)
                  setShowProfileModal(true)
                }}
              >
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'My Profile'}
                </p>
                <p className="text-xs text-blue-600 font-medium truncate mt-0.5 hover:underline">Edit Profile</p>
              </div>
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors shrink-0"
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}
            </div>

            {/* Navigation Grid */}
            <div className="p-5 grid grid-cols-3 gap-3 overflow-y-auto">
              {moreMenuTabs.length > 0 ? (
                moreMenuTabs.map(tab => {
                  const Icon = tab.icon
                  const isRed = tab.color === 'red'
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabAndClose(tab.id)}
                      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${isActive
                          ? isRed
                            ? 'border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-sm'
                            : 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                          : 'border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${isActive
                          ? isRed ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border border-slate-100 dark:border-neutral-700 shadow-sm'
                        }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-bold">{tab.label}</span>
                    </button>
                  )
                })
              ) : (
                <div className="col-span-3 py-4 text-center">
                  <p className="text-xs text-slate-500">All available tabs are already in your bottom navigation!</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-5 pb-5 pt-2 flex gap-3 shrink-0">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 active:bg-slate-100 dark:active:bg-neutral-600 transition-all shadow-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false)
                  if (onLogout) onLogout()
                }}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-100 active:bg-rose-200 transition-all shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          user={user as any}
          onUserUpdate={() => window.location.reload()}
        />
      )}
    </>
  )
})
