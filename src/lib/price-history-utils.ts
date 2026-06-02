import { prisma } from '@/lib/prisma'

export interface PriceHistoryItem {
  id: string
  oldAmount: number
  newAmount: number
  effectiveDate: Date
  reason?: string
  createdAt: Date
}

/**
 * Get the correct price for a recurring transaction on a specific date
 * based on its price change history
 */
export async function getPriceForDate(
  recurringTransactionId: string,
  targetDate: Date,
  defaultAmount: number
): Promise<number> {
  try {
    // Get all price changes for this recurring transaction
    const priceChanges = await prisma.recurringTransactionPriceChange.findMany({
      where: { recurringTransactionId },
      orderBy: { effectiveDate: 'desc' } // Most recent first
    })

    // If no price changes, return the default amount
    if (priceChanges.length === 0) {
      return defaultAmount
    }

    // Find the most recent price change that was effective on or before the target date
    for (const priceChange of priceChanges) {
      if (priceChange.effectiveDate <= targetDate) {
        return Number(priceChange.newAmount)
      }
    }

    // If no price change was effective before the target date, return the oldAmount of the oldest price change
    return Number(priceChanges[priceChanges.length - 1].oldAmount)
  } catch (error) {
    console.error('Error getting price for date:', error)
    return defaultAmount
  }
}

/**
 * Calculate the correct amounts for a series of recurring transaction dates
 * considering price history
 */
export async function calculateAmountsForDates(
  recurringTransactionId: string,
  dates: Date[],
  defaultAmount: number
): Promise<{ date: Date; amount: number }[]> {
  try {
    // Get all price changes for this recurring transaction
    const priceChanges = await prisma.recurringTransactionPriceChange.findMany({
      where: { recurringTransactionId },
      orderBy: { effectiveDate: 'asc' } // Oldest first for easier processing
    })

    // If no price changes, all dates use the default amount
    if (priceChanges.length === 0) {
      return dates.map(date => ({ date, amount: defaultAmount }))
    }

    // Sort dates to process them in order
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())

    const result: { date: Date; amount: number }[] = []
    
    // The initial amount before the first price change was oldAmount
    let currentAmount = Number(priceChanges[0].oldAmount)
    let priceChangeIndex = 0

    for (const date of sortedDates) {
      // Check if we need to update the current amount based on price changes
      while (
        priceChangeIndex < priceChanges.length &&
        priceChanges[priceChangeIndex].effectiveDate <= date
      ) {
        currentAmount = Number(priceChanges[priceChangeIndex].newAmount)
        priceChangeIndex++
      }

      result.push({ date, amount: currentAmount })
    }

    return result
  } catch (error) {
    console.error('Error calculating amounts for dates:', error)
    // Return default amounts as fallback
    return dates.map(date => ({ date, amount: defaultAmount }))
  }
}

/**
 * Generate dates for a recurring transaction based on frequency
 */
export function generateRecurringDates(
  startDate: Date,
  endDate: Date,
  frequency: string
): Date[] {
  const dates: Date[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))

    // Move to the next occurrence based on frequency
    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + 3)
        break
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1)
        break
      default:
        currentDate.setMonth(currentDate.getMonth() + 1)
    }
  }

  return dates
}
