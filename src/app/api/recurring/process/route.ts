import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active, unpaused recurring transactions where nextDue is today or in the past
    const now = new Date()
    now.setHours(23, 59, 59, 999) // End of current day

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
    const updatePromises = []
    let totalProcessed = 0

    for (const rt of dueRecurring) {
      let currentDate = new Date(rt.nextDue)
      
      // Process all occurrences up to today
      while (currentDate <= now) {
        // Store date as UTC midnight to align with summary routes
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

        // Move to next occurrence based on frequency
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
              currentDate.setDate(0) // Set to last day of the month
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

      // Update the recurring transaction's nextDue date
      updatePromises.push(
        prisma.recurringTransaction.update({
          where: { id: rt.id },
          data: { nextDue: currentDate }
        })
      )
    }

    // Execute database operations
    if (transactionsToCreate.length > 0) {
      await prisma.transaction.createMany({
        data: transactionsToCreate
      })
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
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
