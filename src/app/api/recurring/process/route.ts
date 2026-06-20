// Processes due recurring transactions for the current user. For each active,
// unpaused transaction whose nextDue is today or earlier, creates all missing
// transaction records and advances nextDue to the next future occurrence.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { collectOccurrencesUpTo, localToUtcMidnight } from '@/lib/recurring-date-utils'

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    now.setUTCHours(23, 59, 59, 999)

    const dueRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId: currentUserId,
        isActive: true,
        isPaused: false,
        deletedAt: null,
        nextDue: {
          lte: now
        }
      }
    })

    if (dueRecurring.length === 0) {
      return NextResponse.json({ message: 'No recurring transactions to process', processed: 0 })
    }

    const transactionsToCreate = []
    const updatePayloads = []
    let totalProcessed = 0

    for (const rt of dueRecurring) {
      const nextDueNormalised = localToUtcMidnight(new Date(rt.nextDue))
      const startDateNormalised = localToUtcMidnight(new Date(rt.startDate))
      const originalDay = startDateNormalised.getUTCDate()

      const { occurrences, nextDue } = collectOccurrencesUpTo(
        nextDueNormalised,
        now,
        rt.frequency,
        originalDay
      )

      for (const date of occurrences) {
        transactionsToCreate.push({
          type: rt.type,
          amount: Number(rt.amount),
          category: rt.category,
          description: rt.description,
          paymentMethod: rt.paymentMethod,
          source: rt.source,
          recurringTransactionId: rt.id,
          date,
          userId: currentUserId
        })
        totalProcessed++
      }

      updatePayloads.push({ id: rt.id, nextDue })
    }

    if (transactionsToCreate.length > 0) {
      const TX_CHUNK_SIZE = 1000
      for (let i = 0; i < transactionsToCreate.length; i += TX_CHUNK_SIZE) {
        await prisma.transaction.createMany({
          data: transactionsToCreate.slice(i, i + TX_CHUNK_SIZE)
        })
      }
    }

    if (updatePayloads.length > 0) {
      const CHUNK_SIZE = 50
      for (let i = 0; i < updatePayloads.length; i += CHUNK_SIZE) {
        const chunk = updatePayloads.slice(i, i + CHUNK_SIZE)
        await Promise.all(
          chunk.map(update =>
            prisma.recurringTransaction.update({
              where: { id: update.id },
              data: { nextDue: update.nextDue }
            })
          )
        )
      }
    }

    return NextResponse.json({
      message: `Processed ${totalProcessed} occurrences across ${dueRecurring.length} recurring transactions.`,
      processed: totalProcessed
    })

  } catch (error) {
    console.error('Error processing recurring transactions:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring transactions' },
      { status: 500 }
    )
  }
}
