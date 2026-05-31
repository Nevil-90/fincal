// Types and interfaces for recurring transactions functionality

export interface RecurringTransaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  paymentMethod: string | null
  source: string | null
  frequency: string
  splitType: string
  startDate: string
  nextDue: string
  isActive: boolean
  isPaused?: boolean
  pauseDate?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    transactions: number
  }
}

export interface TransactionHistory {
  id: string
  date: string
  amount: number
  description: string | null
}

export interface Participant {
  id: string
  name: string
  email?: string
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SubscriptionParticipant {
  id: string
  subscriptionId: string
  participantId: string
  shareAmount: number
  joinDate: string
  leaveDate?: string
  isActive: boolean
  participant: Participant
}

export interface SharedSubscription {
  id: string
  name: string
  description?: string
  amount: number
  billingDate: number
  frequency: string
  startDate?: string // When the subscription actually started
  isActive: boolean
  participants: SubscriptionParticipant[]
}

export interface SplitPayment {
  id: string
  subscriptionId: string
  participantId: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'pending' | 'paid' | 'late' | 'partial'
  billingMonth: number
  billingYear: number
  advanceMonths: number
  participant: Participant
  subscription: SharedSubscription
}

export interface RecurringFormData {
  type: 'income' | 'expense'
  amount: string
  category: string
  description: string
  paymentMethod: string
  source: string
  frequency: string
  startDate: string
  splitType: 'personal' | 'split' // Keep for compatibility but only 'personal' will be used
}

export interface PriceChange {
  id?: string
  recurringTransactionId?: string
  oldAmount?: number
  newAmount: number
  effectiveDate: string
  reason?: string
  createdAt?: string
}

export interface RecurringTransactionWithPriceHistory extends RecurringTransaction {
  priceChanges?: PriceChange[]
}
