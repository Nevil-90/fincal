'use client'

import React, { useState } from 'react'
import { Plus, Menu, User, Settings, Shield, LogOut, Car, Calendar, PieChart, BarChart3, CreditCard, Target, RefreshCw } from 'lucide-react'
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

  useScrollLock(showMobileMenu)

  const moreMenuTabs = ALL_TABS.filter(tab => {
    if (tab.adminOnly && !isAdmin) return false
    if (slots.includes(tab.id)) return false
    return true
  })

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Financial Overview'
      case 'analytics': return 'Financial Analytics'
      case 'insights': return 'Insights Workspace'
      case 'transactions': return 'Transaction History'
      case 'goals': return 'Savings Goals'
      case 'recurring': return 'Recurring Transactions'
      case 'calendar': return 'Calendar View'
      case 'traveling': return 'Traveling'
      case 'settings': return 'Settings'
      case 'admin': return 'System Administration'
      default: return 'Dashboard'
    }
  }

  const handleTabAndClose = (tab: DashboardTab) => {
    if (onTabChange) onTabChange(tab)
    setShowMobileMenu(false)
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold text-slate-900 truncate">
                {getTabTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Desktop Add Transaction Button */}
            <button
              onClick={onShowAddTransaction}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm text-sm font-semibold whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </button>

            {/* Desktop Profile Icon */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-200 transition-all"
              title="Edit Profile"
            >
              {user?.firstName ? (
                <span className="text-sm font-black uppercase">{user.firstName[0]}</span>
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>

            {/* Desktop Settings Icon */}
            <button
              onClick={onOpenSettings}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-200 transition-all"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Mobile Settings Icon */}
            <button
              onClick={onOpenSettings}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-200 transition-all"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Mobile Profile Icon */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-200 transition-all"
            >
              {user?.firstName ? (
                <span className="text-xs font-black uppercase">{user.firstName[0]}</span>
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Profile & More Menu (Bottom Sheet) */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] md:hidden" onClick={() => setShowMobileMenu(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-slide-up pb-safe"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-slate-200" />
            </div>

            {/* User info header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 uppercase shadow-sm border-2 border-white">
                {user?.firstName ? user.firstName[0] : <User className="h-6 w-6" />}
              </div>
              <div
                className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setShowMobileMenu(false)
                  setShowProfileModal(true)
                }}
              >
                <p className="text-base font-bold text-slate-900 truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'My Profile'}
                </p>
                <p className="text-xs text-blue-600 font-medium truncate mt-0.5 hover:underline">Edit Profile</p>
              </div>
            </div>

            {/* Navigation Grid */}
            <div className="p-5 grid grid-cols-3 gap-3">
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
                            ? 'border-red-200 bg-red-50 text-red-700 shadow-sm'
                            : 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${isActive
                          ? isRed ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          : 'bg-white text-slate-500 border border-slate-100 shadow-sm'
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
            <div className="px-5 pb-5 pt-2 flex gap-3">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 active:bg-slate-100 transition-all shadow-sm"
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
        </div>
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
