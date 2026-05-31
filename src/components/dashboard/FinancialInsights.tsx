'use client'

import { CreditCard, Target, RefreshCw } from 'lucide-react'
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
  recurringTransactionId?: string
}

interface BalanceInfo {
  periodIncome: number
  periodExpenses: number
  periodBalance: number
  totalBalance: number
  transactionCount: number
}

interface FinancialInsightsProps {
  transactions: Transaction[]
  balanceInfo: BalanceInfo
  onTabChange: (tab: 'overview' | 'insights' | 'transactions' | 'goals' | 'recurring') => void
  onShowAddTransaction: () => void
}

export default function FinancialInsights({
  transactions,
  balanceInfo,
  onTabChange,
  onShowAddTransaction
}: FinancialInsightsProps) {
  const savingsRate = balanceInfo.periodIncome > 0 ? (balanceInfo.periodBalance / balanceInfo.periodIncome) * 100 : 0

  const expenseCategories: { [key: string]: number } = {}
  transactions.forEach((transaction) => {
    if (transaction.type === 'expense') {
      expenseCategories[transaction.category] = (expenseCategories[transaction.category] || 0) + transaction.amount
    }
  })

  const topCategories = Object.entries(expenseCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  const totalExpenses = Object.values(expenseCategories).reduce((sum, amount) => sum + amount, 0)
  const progressWidth = `${Math.min(Math.max(savingsRate, 0), 100)}%`
  const savingsStatus =
    savingsRate >= 20
      ? { label: 'Excellent', message: 'Saving above the recommended 20%', tone: 'text-emerald-700 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' }
      : savingsRate >= 10
        ? { label: 'Good', message: 'Close to recommended saving range', tone: 'text-amber-700 bg-amber-50 border-amber-100', bar: 'bg-amber-500' }
        : savingsRate >= 0
          ? { label: 'Needs attention', message: 'Savings rate is below 10%', tone: 'text-orange-700 bg-orange-50 border-orange-100', bar: 'bg-orange-500' }
          : { label: 'Overspending', message: 'Expenses are higher than income', tone: 'text-red-700 bg-red-50 border-red-100', bar: 'bg-red-500' }

  const categoryColors = ['bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-amber-500']

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Health</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Financial Health</h3>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${savingsStatus.tone}`}>
            {savingsStatus.label}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Savings Rate</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{Math.round(savingsRate)}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transactions</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{balanceInfo.transactionCount}</p>
            </div>
          </div>

          <div className="mt-4 h-2 rounded-full bg-slate-200">
            <div className={`h-2 rounded-full ${savingsStatus.bar}`} style={{ width: progressWidth }} />
          </div>

          <p className="mt-3 text-sm leading-5 text-slate-600">{savingsStatus.message}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Spending</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Top Categories</h3>
          </div>
        </div>

        <div className="space-y-4">
          {topCategories.length > 0 ? (
            topCategories.map(([category, amount], index) => {
              const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
              return (
                <div key={category}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryColors[index]}`} />
                      <span className="truncate text-sm font-semibold text-slate-700">{category}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-950">{formatCurrency(amount)}</p>
                      <p className="text-xs text-slate-500">{Math.round(percentage)}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${categoryColors[index]}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-slate-700">No expense categories yet</p>
              <p className="mt-1 text-xs text-slate-500">Add expenses to view category insights.</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Actions</p>
          <h3 className="mt-1 text-xl font-bold">Quick shortcuts</h3>
          <p className="mt-1 text-sm text-slate-400">Manage entries faster.</p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onShowAddTransaction}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-slate-950 transition hover:bg-blue-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg"><CreditCard className="h-5 w-5 text-blue-600" /></span>
            <span className="min-w-0">
              <span className="block font-bold">Add Transaction</span>
              <span className="block text-sm text-slate-500">Record income or expense</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('goals')}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-slate-950 transition hover:bg-violet-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg"><Target className="h-5 w-5 text-violet-600" /></span>
            <span className="min-w-0">
              <span className="block font-bold">Manage Goals</span>
              <span className="block text-sm text-slate-500">Track savings targets</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('recurring')}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-slate-950 transition hover:bg-emerald-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg"><RefreshCw className="h-5 w-5 text-emerald-600" /></span>
            <span className="min-w-0">
              <span className="block font-bold">Setup Recurring</span>
              <span className="block text-sm text-slate-500">Automate repeated entries</span>
            </span>
          </button>
        </div>
      </section>
    </aside>
  )
}
