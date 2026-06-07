// Utilities for resolving the correct price of a recurring transaction on a given date,
// taking into account its full price change history stored in the database.

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
 * Returns the price that was active for a recurring transaction on a specific date.
 * Falls back to `defaultAmount` if no history exists or on error.
 */
export async function getPriceForDate(
  recurringTransactionId: string,
  targetDate: Date,
  defaultAmount: number
): Promise<number> {
  try {
    const priceChanges = await prisma.recurringTransactionPriceChange.findMany({
      where: { recurringTransactionId },
      orderBy: { effectiveDate: 'desc' }
    })

    if (priceChanges.length === 0) {
      return defaultAmount
    }

    for (const priceChange of priceChanges) {
      if (priceChange.effectiveDate <= targetDate) {
        return Number(priceChange.newAmount)
      }
    }

    return Number(priceChanges[priceChanges.length - 1].oldAmount)
  } catch (error) {
    console.error('Error getting price for date:', error)
    return defaultAmount
  }
}

/**
 * Returns the correct amount for each date in a series, accounting for price changes
 * that took effect between those dates.
 */
export async function calculateAmountsForDates(
  recurringTransactionId: string,
  dates: Date[],
  defaultAmount: number
): Promise<{ date: Date; amount: number }[]> {
  try {
    const priceChanges = await prisma.recurringTransactionPriceChange.findMany({
      where: { recurringTransactionId },
      orderBy: { effectiveDate: 'asc' }
    })

    if (priceChanges.length === 0) {
      return dates.map(date => ({ date, amount: defaultAmount }))
    }

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
    const result: { date: Date; amount: number }[] = []

    let currentAmount = Number(priceChanges[0].oldAmount)
    let priceChangeIndex = 0

    for (const date of sortedDates) {
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
    return dates.map(date => ({ date, amount: defaultAmount }))
  }
}

/**
 * Generates all occurrence dates for a recurring transaction between two dates,
 * based on the given frequency.
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
