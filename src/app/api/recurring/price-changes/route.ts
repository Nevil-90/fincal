import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Get all price changes for a recurring transaction
export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recurringTransactionId = searchParams.get('recurringTransactionId')

    if (!recurringTransactionId) {
      return NextResponse.json({ error: 'recurringTransactionId is required' }, { status: 400 })
    }

    // Verify ownership of the recurring transaction
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: { id: recurringTransactionId, userId: currentUserId }
    })

    if (!recurringTransaction) {
      return NextResponse.json({ error: 'Recurring transaction not found or access denied' }, { status: 404 })
    }

    const priceChanges = await prisma.recurringTransactionPriceChange.findMany({
      where: { recurringTransactionId },
      orderBy: { effectiveDate: 'desc' }
    })

    return NextResponse.json(priceChanges)
  } catch (error) {
    console.error('Error fetching price changes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price changes' },
      { status: 500 }
    )
  }
}

// POST: Add a new price change
export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recurringTransactionId, newAmount, effectiveDate, reason } = body

    if (!recurringTransactionId || !newAmount || !effectiveDate) {
      return NextResponse.json(
        { error: 'recurringTransactionId, newAmount, and effectiveDate are required' },
        { status: 400 }
      )
    }

    // Verify ownership and get old amount
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: { id: recurringTransactionId, userId: currentUserId }
    })

    if (!recurringTransaction) {
      return NextResponse.json(
        { error: 'Recurring transaction not found or access denied' },
        { status: 404 }
      )
    }

    const oldAmount = recurringTransaction.amount

    // Create the price change record
    const priceChange = await prisma.recurringTransactionPriceChange.create({
      data: {
        recurringTransactionId,
        oldAmount,
        newAmount: parseFloat(newAmount),
        effectiveDate: new Date(effectiveDate),
        reason
      }
    })

    // Update the recurring transaction with the new amount
    await prisma.recurringTransaction.update({
      where: { id: recurringTransactionId },
      data: { amount: parseFloat(newAmount) }
    })

    // Update existing transactions that should use the new price
    // Find all transactions from this recurring transaction that are on or after the effective date
    const transactionsToUpdate = await prisma.transaction.findMany({
      where: {
        recurringTransactionId,
        userId: currentUserId,
        date: {
          gte: new Date(effectiveDate)
        }
      }
    })

    // Update each transaction with the new amount
    if (transactionsToUpdate.length > 0) {
      await prisma.transaction.updateMany({
        where: {
          recurringTransactionId,
          userId: currentUserId,
          date: {
            gte: new Date(effectiveDate)
          }
        },
        data: {
          amount: parseFloat(newAmount)
        }
      })
    }

    return NextResponse.json({
      ...priceChange,
      updatedTransactions: transactionsToUpdate.length,
      message: `Price change created. Updated ${transactionsToUpdate.length} existing transactions.`
    })
  } catch (error) {
    console.error('Error creating price change:', error)
    return NextResponse.json(
      { error: 'Failed to create price change' },
      { status: 500 }
    )
  }
}
