export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string | null
  category: string
  priority: number
  isCompleted: boolean
  completedAt?: string | null
  createdAt?: string
  updatedAt?: string
  userId?: string
}

export interface GoalContribution {
  id: string
  goalId: string
  amount: number
  date: string
  description?: string | null
  transactionId?: string | null
  transaction?: {
    id: string
    amount: number
    date: string
    description?: string | null
    paymentMethod?: string | null
  } | null
}

export interface SavingsGoalsProps {
  goals: SavingsGoal[]
  availableBalance: number
  onRefresh?: () => void
}

export type GoalCategory = 
  | 'emergency'
  | 'travel'
  | 'vehicle'
  | 'gadgets'
  | 'investment'
  | 'home'
  | 'education'
  | 'general'
