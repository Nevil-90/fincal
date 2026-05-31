'use client'

import { ArrowUpRight, ArrowDownRight, Activity, Wallet, CreditCard, TrendingUp, TrendingDown, Banknote, HeartOff, Gem } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

interface BalanceInfo {
  periodIncome: number
  periodExpenses: number
  periodBalance: number
  totalBalance: number
  transactionCount: number
}

interface OverviewPeriod {
  year: number
  month?: number
}

interface StatsCardsProps {
  balanceInfo: BalanceInfo
  overviewPeriod: OverviewPeriod
}

export default function StatsCards({ balanceInfo, overviewPeriod }: StatsCardsProps) {
  return (
    <>
      <div className="sm:hidden grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Period Income</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(balanceInfo.periodIncome)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Period Expense</p>
          <p className="mt-1 text-lg font-bold text-rose-600">{formatCurrency(balanceInfo.periodExpenses)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Period Balance</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(balanceInfo.periodBalance)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Total Balance</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(balanceInfo.totalBalance)}</p>
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* Period Income */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md border border-emerald-400/20 text-white col-span-1">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-xs text-emerald-100">Period Income</h3>
            <div className="bg-white/20 rounded-lg p-1.5 shrink-0">
              <ArrowUpRight className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-2xl font-black text-white">{formatCurrency(balanceInfo.periodIncome)}</p>
            <p className="text-[10px] sm:text-xs flex items-center gap-1 text-emerald-100/90 font-medium">
              <TrendingUp className="h-3 w-3" />
              {overviewPeriod.month ? 'Monthly' : 'Yearly'} Total
            </p>
          </div>
        </div>
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.15] pointer-events-none select-none">
          <Banknote className="w-32 h-32 transform -rotate-12" />
        </div>
      </div>

      {/* Period Expenses */}
      <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md border border-rose-400/20 text-white col-span-1">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-xs text-rose-100">Period Expenses</h3>
            <div className="bg-white/20 rounded-lg p-1.5 shrink-0">
              <ArrowDownRight className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-2xl font-black text-white">{formatCurrency(balanceInfo.periodExpenses)}</p>
            <p className="text-[10px] sm:text-xs flex items-center gap-1 text-rose-100/90 font-medium">
              <TrendingDown className="h-3 w-3" />
              {overviewPeriod.month ? 'Monthly' : 'Yearly'} Total
            </p>
          </div>
        </div>
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.15] pointer-events-none select-none">
          <Banknote className="w-32 h-32 transform -rotate-12" />
        </div>
      </div>

      {/* Period Balance */}
      <div className={`${balanceInfo.periodBalance >= 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400/20' : 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400/20'} rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md border text-white col-span-1`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold text-xs ${balanceInfo.periodBalance >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>Period Balance</h3>
            <div className="bg-white/20 rounded-lg p-1.5 shrink-0">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-2xl font-black text-white">{formatCurrency(balanceInfo.periodBalance)}</p>
            <p className={`text-[10px] sm:text-xs flex items-center gap-1 font-medium ${balanceInfo.periodBalance >= 0 ? 'text-blue-100/90' : 'text-orange-100/90'}`}>
              {balanceInfo.periodBalance >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {overviewPeriod.month ? 'Monthly' : 'Yearly'} Net
            </p>
          </div>
        </div>
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.15] pointer-events-none select-none">
          {balanceInfo.periodBalance >= 0 ? <TrendingUp className="w-32 h-32 transform -rotate-12" /> : <TrendingDown className="w-32 h-32 transform -rotate-12" />}
        </div>
      </div>

      {/* Net Balance (Cumulative) */}
      <div className={`${balanceInfo.totalBalance >= 0 ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-400/20' : 'bg-gradient-to-br from-red-500 to-red-600 border-red-400/20'} rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md border text-white col-span-1`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold text-xs ${balanceInfo.totalBalance >= 0 ? 'text-indigo-100' : 'text-red-100'}`}>Closing Balance</h3>
            <div className="bg-white/20 rounded-lg p-1.5 shrink-0">
              <Wallet className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-2xl font-black text-white">{formatCurrency(balanceInfo.totalBalance)}</p>
            <p className={`text-[10px] sm:text-xs font-medium ${balanceInfo.totalBalance >= 0 ? 'text-indigo-100/90' : 'text-red-100/90'}`}>
              Up to {overviewPeriod.month ? 'month end' : 'year end'}
            </p>
          </div>
        </div>
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.15] pointer-events-none select-none">
          {balanceInfo.totalBalance >= 0 ? <Wallet className="w-32 h-32 transform -rotate-12" /> : <HeartOff className="w-32 h-32 transform -rotate-12" />}
        </div>
      </div>

      {/* Savings Rate */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md border border-purple-400/20 text-white col-span-2 sm:col-span-2 lg:col-span-1">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-xs text-purple-100">Savings Rate</h3>
            <div className="bg-white/20 rounded-lg p-1.5 shrink-0">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-2xl font-black text-white">
              {balanceInfo.periodIncome > 0 ? Math.round((balanceInfo.periodBalance / balanceInfo.periodIncome) * 100) : 0}%
            </p>
            <p className="text-[10px] sm:text-xs text-purple-100/90 font-medium">
              {balanceInfo.transactionCount} transactions
            </p>
          </div>
        </div>
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.15] pointer-events-none select-none">
          <Gem className="w-32 h-32 transform -rotate-12" />
        </div>
      </div>
      </div>
    </>
  )
}
