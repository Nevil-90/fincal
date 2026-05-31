import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPriceForDate } from '@/lib/price-history-utils'

// POST: Recalculate and fix amounts for existing transactions based on price history
export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recurringTransactionId } = body

    if (!recurringTransactionId) {
      return NextResponse.json({ error: 'recurringTransactionId is required' }, { status: 400 })
    }

    // Get the recurring transaction and verify ownership
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: { id: recurringTransactionId, userId: currentUserId }
    })

    if (!recurringTransaction) {
      return NextResponse.json({ error: 'Recurring transaction not found or access denied' }, { status: 404 })
    }

    // Get all transactions for this recurring transaction
    const transactions = await prisma.transaction.findMany({
      where: { recurringTransactionId, userId: currentUserId },
      orderBy: { date: 'asc' }
    })

    if (transactions.length === 0) {
      return NextResponse.json({ message: 'No transactions to recalculate', updatedCount: 0 })
    }

    // Recalculate each transaction amount based on its date
    const { calculateAmountsForDates } = await import('@/lib/price-history-utils')
    const dates = transactions.map(t => t.date)
    const amountsForDates = await calculateAmountsForDates(
      recurringTransactionId,
      dates,
      Number(recurringTransaction.amount)
    )

    const amountByDate = new Map<string, number>()
    amountsForDates.forEach(item => {
      amountByDate.set(item.date.getTime().toString(), item.amount)
    })

    const updates = []
    const updatePromises = []
    
    for (const transaction of transactions) {
      const correctAmount = amountByDate.get(transaction.date.getTime().toString()) || Number(recurringTransaction.amount)

      // Only update if the amount is different
      if (Number(transaction.amount) !== correctAmount) {
        updatePromises.push(
          prisma.transaction.update({
            where: { id: transaction.id },
            data: { amount: correctAmount }
          })
        )
        updates.push({
          transactionId: transaction.id,
          date: transaction.date.toISOString().split('T')[0],
          oldAmount: Number(transaction.amount),
          newAmount: correctAmount
        })
      }
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
    }

    return NextResponse.json({
      message: `Recalculated ${updates.length} transactions`,
      updatedCount: updates.length,
      totalTransactions: transactions.length,
      updates: updates
    })
  } catch (error) {
    console.error('Error recalculating transactions:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate transactions' },
      { status: 500 }
    )
  }
}
