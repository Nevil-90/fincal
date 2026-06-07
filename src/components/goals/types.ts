// Domain types for savings goals and contributions.
export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  priority: number
  deadline?: string
  isCompleted?: boolean
  completedAt?: string
  createdAt?: Date
  updatedAt?: Date
  contributions?: GoalContribution[]
}

export interface BulkEntry {
  id: string
  goalId: string
  amount: string
  date: string
  description: string
  paymentMethod: string
}

export interface GoalContribution {
  id: string
  goalId: string
  amount: number
  description: string | null
  date: string
  transaction?: {
    id: string
    paymentMethod: string | null
  }
}

export interface SavingsGoalsProps {
  goals: SavingsGoal[]
  availableBalance: number
  onRefresh?: () => void
}
