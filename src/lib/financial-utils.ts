// Financial calculation helpers, static lookup lists (categories, payment methods, etc.),
// and formatting utilities used across the app.

import { Transaction, SavingsGoal, MonthlyBudget } from '@/generated/prisma'

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  monthlyData: MonthlyBudget | null
}

export interface GoalCalculation {
  monthsToGoal: number
  monthlyRequired: number
  canAfford: boolean
  timeline: string
}

export function calculateFinancialSummary(
  transactions: Transaction[],
  monthlyBudget: MonthlyBudget | null
): FinancialSummary {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpenses + (monthlyBudget?.carryOver ? Number(monthlyBudget.carryOver) : 0)

  return {
    totalIncome,
    totalExpenses,
    balance,
    monthlyData: monthlyBudget
  }
}

export function calculateGoalTimeline(
  goal: SavingsGoal,
  monthlyAvailable: number
): GoalCalculation {
  const remainingAmount = Number(goal.targetAmount) - Number(goal.currentAmount)

  if (monthlyAvailable <= 0) {
    return {
      monthsToGoal: -1,
      monthlyRequired: remainingAmount,
      canAfford: false,
      timeline: 'Cannot afford with current budget'
    }
  }

  const monthsToGoal = Math.ceil(remainingAmount / monthlyAvailable)

  return {
    monthsToGoal,
    monthlyRequired: remainingAmount / monthsToGoal,
    canAfford: true,
    timeline: `${monthsToGoal} month${monthsToGoal !== 1 ? 's' : ''}`
  }
}

export function calculateMultipleGoals(
  goals: SavingsGoal[],
  monthlyAvailable: number
): GoalCalculation[] {
  const activeGoals = goals.filter(g => !g.isCompleted).sort((a, b) => a.priority - b.priority)

  return activeGoals.map(goal => calculateGoalTimeline(goal, monthlyAvailable / activeGoals.length))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2
    }).format(amount)
  }
  return formatCurrency(amount)
}

export function formatCompactNumber(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    return new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(amount)
  }
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 1
  }).format(amount)
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  }
}

export function getPreviousMonthYear(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 }
  }
  return { month: month - 1, year }
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Petrol/Fuel',
  'Auto Rickshaw/Taxi',
  'Public Transport',
  'Shopping',
  'Clothing',
  'Entertainment',
  'Movies/OTT',
  'Bills & Utilities',
  'Electricity',
  'Mobile Recharge',
  'Internet',
  'LPG/Gas',
  'Water Bill',
  'Healthcare',
  'Medicine',
  'Doctor Consultation',
  'Education',
  'Books/Courses',
  'School/College Fees',
  'Travel',
  'Train/Flight',
  'Hotel/Accommodation',
  'Rent',
  'House Maintenance',
  'Domestic Help',
  'Religious/Charity',
  'Temple/Gurudwara',
  'Donations',
  'Investment',
  'SIP/Mutual Fund',
  'Fixed Deposit',
  'Other'
] as const

export const INCOME_CATEGORIES = [
  'Salary',
  'Business Income',
  'Freelance/Consulting',
  'Investment Returns',
  'Dividend',
  'Interest Income',
  'Rental Income',
  'Bonus',
  'Festival Bonus',
  'Gift/Cash Gift',
  'Refund',
  'Other Income'
] as const

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Bank Transfer',
  'Cheque',
  'Other'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
export type IncomeCategory = typeof INCOME_CATEGORIES[number]
export type PaymentMethod = typeof PAYMENT_METHODS[number]

export const INCOME_SOURCES = [
  'Salary from Company',
  'Freelance Client',
  'Family/Relatives',
  'Friends',
  'Business Partner',
  'Investment Returns',
  'Rental Property',
  'Side Business',
  'Gift/Wedding Money',
  'Loan Received',
  'Refund/Cashback',
  'Prize/Contest',
  'Other'
] as const

export const EXPENSE_PURPOSES = [
  'Personal Use',
  'Family Expense',
  'Business Expense',
  'Investment',
  'Gift to Someone',
  'Loan Payment',
  'EMI Payment',
  'Tax Payment',
  'Insurance Premium',
  'Emergency',
  'Other'
] as const

export const BUDGET_CATEGORIES = [
  'Food & Dining Budget',
  'Transportation Budget',
  'Shopping Budget',
  'Entertainment Budget',
  'Bills & Utilities Budget',
  'Healthcare Budget',
  'Education Budget',
  'Travel Budget',
  'Rent Budget',
  'Investment Budget',
  'Emergency Fund',
  'Monthly Savings',
  'Miscellaneous Budget'
] as const

export type IncomeSource = typeof INCOME_SOURCES[number]
export type ExpensePurpose = typeof EXPENSE_PURPOSES[number]
export type BudgetCategory = typeof BUDGET_CATEGORIES[number]

export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}
