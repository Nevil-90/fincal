// Utilities for resolving the correct price of a recurring transaction on a given date,
// taking into account its full price change history stored in the database.

import { prisma } from '@/lib/prisma'
import { collectOccurrencesUpTo } from '@/lib/recurring-date-utils'

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
 * Generates all occurrence dates for a recurring transaction between two dates.
 */
export function generateRecurringDates(startDate: Date, endDate: Date, frequency: string): Date[] {
  const end = new Date(endDate)
  end.setUTCHours(23, 59, 59, 999)
  const { occurrences } = collectOccurrencesUpTo(startDate, end, frequency)
  return occurrences
}
