'use client'

import { formatCurrency } from '@/lib/financial-utils'
import { ArrowUpRight, ArrowDownLeft, ClipboardList } from 'lucide-react'

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

interface RecentTransactionsProps {
  transactions: Transaction[]
  onViewAll: () => void
}

export default function RecentTransactions({ transactions, onViewAll }: RecentTransactionsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Activity</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">Recent Transactions</h3>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="shrink-0 rounded-full bg-blue-50 px-3.5 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
        >
          View All →
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {transactions.slice(0, 5).map((transaction) => {
          const isIncome = transaction.type === 'income'
          return (
            <div key={transaction.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${
                  isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" /> : <ArrowUpRight className="h-4 w-4 text-rose-600" />}
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">
                  {transaction.description || transaction.category}
                </p>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>

              <div
                className={`whitespace-nowrap text-right text-base font-black ${
                  isIncome ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </div>
            </div>
          )
        })}

        {transactions.length === 0 && (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center">
            <div className="mb-4 flex justify-center"><ClipboardList className="h-10 w-10 text-slate-300" /></div>
            <p className="mt-3 font-semibold text-slate-700">No transactions yet</p>
            <p className="mt-1 text-sm text-slate-500">Add your first transaction to get started</p>
          </div>
        )}
      </div>
    </section>
  )
}
