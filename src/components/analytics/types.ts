import { formatCurrency } from '@/lib/financial-utils'

export interface Transaction {
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

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  priority: number
  deadline?: string
  isCompleted?: boolean
  completedAt?: string
}

export interface AnalyticsTabProps {
  goals: SavingsGoal[]
}

export type DateFilter = 'this_month' | 'last_3_months' | 'last_6_months' | 'last_12_months' | 'ytd' | 'all_time'
export type SubTab = 'overview' | 'cashflow' | 'compare' | 'categories' | 'behaviors' | 'forecasting'

export const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6']
export const RADAR_COLORS = { stroke: '#8B5CF6', fill: '#8B5CF6' }
export const SCATTER_COLORS = { normal: '#3B82F6', anomaly: '#EF4444' }

// Clean, flat UI styles
export const cardClasses = "rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 shadow-sm"
export const headerClasses = "text-lg font-bold text-slate-950 dark:text-white"
export const subHeaderClasses = "text-xs text-slate-500 dark:text-neutral-400 mt-1"
