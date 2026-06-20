// CRUD endpoints for recurring transactions.
// POST creates the recurring template, backfills all missed past transactions,
// and optionally creates a linked SharedSubscription for split-type entries.
// PUT handles pause/resume and the legacy isActive toggle.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateNextDue, collectOccurrencesUpTo, localToUtcMidnight } from '@/lib/recurring-date-utils'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        userId: currentUserId,
        deletedAt: null
      },
      orderBy: {
        nextDue: 'asc'
      }
    })

    return NextResponse.json(recurringTransactions)
  } catch (error) {
    console.error('Error fetching recurring transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, amount, category, description, frequency, startDate, paymentMethod, source, splitType } = body

    if (!type || !amount || !category || !frequency || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = localToUtcMidnight(new Date(startDate))
    const now = new Date()
    now.setUTCHours(23, 59, 59, 999)

    // Calculate nextDue using UTC-safe utility
    const nextDue = calculateNextDue(start, now, frequency)

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category,
        description,
        frequency,
        splitType: splitType || 'personal',
        startDate: start,
        nextDue,
        paymentMethod,
        source,
        isActive: true,
        userId: currentUserId
      }
    })

    // Backfill all past occurrences using UTC-safe utility
    const { occurrences } = collectOccurrencesUpTo(start, now, frequency)
    const transactionsToCreate = occurrences.map(date => ({
      type,
      amount: parseFloat(amount),
      category,
      description,
      paymentMethod,
      source,
      recurringTransactionId: recurringTransaction.id,
      date,
      userId: currentUserId
    }))

    if (transactionsToCreate.length > 0) {
      await prisma.transaction.createMany({
        data: transactionsToCreate
      })
    }

    let sharedSubscription = null
    if (splitType === 'split') {
      try {
        // Use UTC day to avoid timezone shifting the billing date
        const billingDate = (frequency === 'monthly' || frequency === 'yearly')
          ? nextDue.getUTCDate()
          : 1

        sharedSubscription = await prisma.sharedSubscription.create({
          data: {
            name: description || `${category} - Recurring`,
            description: `Auto-created from recurring transaction: ${description || category}`,
            amount: parseFloat(amount),
            billingDate: billingDate,
            frequency: frequency,
            isActive: true,
            userId: currentUserId
          }
        })
      } catch (error) {
        console.error('Error creating shared subscription:', error)
      }
    }

    return NextResponse.json({
      ...recurringTransaction,
      backfilledTransactions: transactionsToCreate.length,
      sharedSubscription: sharedSubscription,
      message: `Created recurring transaction with ${transactionsToCreate.length} backfilled transactions${sharedSubscription ? ' and shared subscription' : ''}`
    })
  } catch (error) {
    console.error('Error creating recurring transaction:', error)
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, isActive, isPaused } = body

    if (!id) {
      return NextResponse.json({ error: 'Recurring transaction ID is required' }, { status: 400 })
    }

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId: currentUserId, deletedAt: null }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Recurring transaction not found or access denied' }, { status: 404 })
    }

    if (isPaused !== undefined) {
      if (isPaused) {
        const updatedRecurring = await prisma.recurringTransaction.update({
          where: { id },
          data: {
            isPaused: true,
            pauseDate: new Date(),
            updatedAt: new Date()
          }
        })
        return NextResponse.json(updatedRecurring)
      } else {
        const today = new Date()
        today.setUTCHours(23, 59, 59, 999)

        const startDateNormalised = localToUtcMidnight(new Date(existing.startDate))
        const nextDue = calculateNextDue(startDateNormalised, today, existing.frequency)

        const updatedRecurring = await prisma.recurringTransaction.update({
          where: { id },
          data: {
            isPaused: false,
            pauseDate: null,
            nextDue: nextDue,
            updatedAt: new Date()
          }
        })
        return NextResponse.json(updatedRecurring)
      }
    }

    if (isActive !== undefined) {
      const updatedRecurring = await prisma.recurringTransaction.update({
        where: { id },
        data: {
          isPaused: !Boolean(isActive),
          pauseDate: !Boolean(isActive) ? new Date() : null,
          updatedAt: new Date()
        }
      })
      return NextResponse.json(updatedRecurring)
    }

    return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 })
  } catch (error) {
    console.error('Error updating recurring transaction:', error)
    return NextResponse.json({ error: 'Failed to update recurring transaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Recurring transaction ID is required' }, { status: 400 })
    }

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId: currentUserId, deletedAt: null }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Recurring transaction not found or access denied' }, { status: 404 })
    }

    await prisma.recurringTransaction.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true, message: 'Recurring transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting recurring transaction:', error)
    return NextResponse.json({ error: 'Failed to delete recurring transaction' }, { status: 500 })
  }
}
