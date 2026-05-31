'use client'

import React, { useEffect } from 'react'
import { DollarSign, BarChart3, Activity, CreditCard, Target, RefreshCw, Calendar, Car, Settings, PieChart, LogOut, Shield } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

interface SidebarProps {
  sidebarOpen: boolean
  activeTab: 'overview' | 'analytics' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'settings' | 'admin'
  availableBalance: number
  onTabChange: (tab: 'overview' | 'analytics' | 'transactions' | 'goals' | 'recurring' | 'calendar' | 'traveling' | 'settings' | 'admin') => void
  onClose?: () => void
  user?: { firstName: string; lastName: string; email: string; role?: string } | null
  onLogout?: () => void
}


export default React.memo(function Sidebar({ sidebarOpen, activeTab, availableBalance, onTabChange, onClose, user, onLogout }: SidebarProps) {
  const handleTabClick = (tab: any) => {
    onTabChange(tab)
    if (onClose) {
      onClose()
    }
  }

  useEffect(() => {
    const handleScrollLock = () => {
      if (sidebarOpen && window.innerWidth < 768) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }
    }

    // Initial check
    handleScrollLock()

    // Listen for resize to re-evaluate
    window.addEventListener('resize', handleScrollLock)
    
    return () => {
      window.removeEventListener('resize', handleScrollLock)
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-[110] bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-xl md:shadow-sm md:sticky md:top-0 md:h-screen md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-16'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            {(!sidebarOpen ? (
              <span className="md:hidden font-bold text-slate-900">FinTracker</span>
            ) : (
              <div>
                <h1 className="text-xl font-bold text-slate-900">FinTracker</h1>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {[
              { id: 'overview', icon: BarChart3, label: 'Overview', activeColor: 'from-blue-500 to-blue-600' },
              { id: 'analytics', icon: PieChart, label: 'Analytics', activeColor: 'from-violet-500 to-violet-600' },
              { id: 'transactions', icon: CreditCard, label: 'Transactions', activeColor: 'from-emerald-500 to-emerald-600' },
              { id: 'goals', icon: Target, label: 'Goals', activeColor: 'from-purple-500 to-purple-600' },
              { id: 'recurring', icon: RefreshCw, label: 'Recurring', activeColor: 'from-indigo-500 to-indigo-600' },
              { id: 'calendar', icon: Calendar, label: 'Calendar', activeColor: 'from-sky-500 to-sky-600' },
              { id: 'traveling', icon: Car, label: 'Traveling', activeColor: 'from-orange-500 to-orange-600' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3 justify-start' : 'justify-center px-0'} py-2.5 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.activeColor} text-white shadow-sm`
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={!sidebarOpen ? tab.label : undefined}
                >
                  <Icon className={`${sidebarOpen ? 'h-5 w-5' : 'h-[22px] w-[22px]'} shrink-0`} />
                  <span className={`${!sidebarOpen ? 'md:hidden' : ''} font-medium`}>{tab.label}</span>
                </button>
              );
            })}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => handleTabClick('admin')}
                className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3 justify-start' : 'justify-center px-0'} py-2.5 rounded-xl text-left transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={!sidebarOpen ? 'Admin Panel' : undefined}
              >
                <Shield className={`${sidebarOpen ? 'h-5 w-5' : 'h-[22px] w-[22px]'} shrink-0`} />
                <span className={`${!sidebarOpen ? 'md:hidden' : ''} font-medium`}>Admin Panel</span>
              </button>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col gap-2">
          {sidebarOpen ? (
            <div className="flex items-center justify-between gap-2 min-w-0 w-full">
              {user ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm uppercase">
                    {user.firstName ? user.firstName[0] : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                  <div className="min-w-0 space-y-1">
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                    <div className="h-2 w-24 bg-slate-200 rounded" />
                  </div>
                </div>
              )}
              
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-500 transition-colors shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 w-full">
              {user ? (
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm uppercase" title={`${user.firstName} ${user.lastName}`}>
                  {user.firstName ? user.firstName[0] : 'U'}
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0 animate-pulse" />
              )}
              
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-8 h-8 mx-auto flex items-center justify-center hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          
          {sidebarOpen && (
            <div className="text-[11px] font-bold text-slate-500 truncate mt-1">
              Balance: {formatCurrency(availableBalance)}
            </div>
          )}
        </div>
      </div>
    </>
  )
})
