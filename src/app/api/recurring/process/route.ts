// Processes due recurring transactions for the current user. For each active,
// unpaused transaction whose nextDue is today or earlier, creates all missing
// transaction records and advances nextDue to the next future occurrence.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    now.setHours(23, 59, 59, 999)

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
      let currentDate = new Date(rt.nextDue)
      
      while (currentDate <= now) {
        const finalDate = new Date(Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          0, 0, 0, 0
        ))
        
        transactionsToCreate.push({
          type: rt.type,
          amount: Number(rt.amount),
          category: rt.category,
          description: rt.description,
          paymentMethod: rt.paymentMethod,
          source: rt.source,
          recurringTransactionId: rt.id,
          date: finalDate,
          userId: currentUserId
        })

        totalProcessed++

        switch (rt.frequency.toLowerCase()) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1)
            break
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7)
            break
          case 'monthly':
            const originalDayOfMonth = new Date(rt.startDate).getDate()
            currentDate.setMonth(currentDate.getMonth() + 1)
            currentDate.setDate(originalDayOfMonth)
            if (currentDate.getDate() !== originalDayOfMonth) {
              currentDate.setDate(0)
            }
            break
          case 'quarterly':
            const originalDayOfMonthQ = new Date(rt.startDate).getDate()
            currentDate.setMonth(currentDate.getMonth() + 3)
            currentDate.setDate(originalDayOfMonthQ)
            if (currentDate.getDate() !== originalDayOfMonthQ) {
              currentDate.setDate(0)
            }
            break
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1)
            break
          default:
            currentDate.setMonth(currentDate.getMonth() + 1)
        }
      }

      updatePayloads.push({
        id: rt.id,
        nextDue: currentDate
      })
    }

    if (transactionsToCreate.length > 0) {
      const TX_CHUNK_SIZE = 1000;
      for (let i = 0; i < transactionsToCreate.length; i += TX_CHUNK_SIZE) {
        await prisma.transaction.createMany({
          data: transactionsToCreate.slice(i, i + TX_CHUNK_SIZE)
        });
      }
    }

    if (updatePayloads.length > 0) {
      const CHUNK_SIZE = 50;
      for (let i = 0; i < updatePayloads.length; i += CHUNK_SIZE) {
        const chunk = updatePayloads.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(update => 
            prisma.recurringTransaction.update({
              where: { id: update.id },
              data: { nextDue: update.nextDue }
            })
          )
        );
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
