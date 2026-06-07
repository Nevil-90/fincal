// CRUD endpoints for recurring transactions.
// POST creates the recurring template, backfills all missed past transactions,
// and optionally creates a linked SharedSubscription for split-type entries.
// PUT handles pause/resume and the legacy isActive toggle.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    let nextDue = new Date(start)

    if (start <= now) {
      nextDue = new Date(start)
      
      while (nextDue <= now) {
        switch (frequency.toLowerCase()) {
          case 'daily':
            nextDue.setDate(nextDue.getDate() + 1)
            break
          case 'weekly':
            nextDue.setDate(nextDue.getDate() + 7)
            break
          case 'monthly':
            const originalDayOfMonth = start.getDate()
            nextDue.setMonth(nextDue.getMonth() + 1)
            nextDue.setDate(originalDayOfMonth)
            
            if (nextDue.getDate() !== originalDayOfMonth) {
              nextDue.setDate(0)
            }
            break
          case 'quarterly':
            nextDue.setMonth(nextDue.getMonth() + 3)
            break
          case 'yearly':
            nextDue.setFullYear(nextDue.getFullYear() + 1)
            break
          default:
            nextDue.setMonth(nextDue.getMonth() + 1)
        }
      }
    } else {
      nextDue = new Date(start)
    }

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

    const transactionsToCreate = []
    const currentDate = new Date(start)
    
    while (currentDate <= now) {
      const finalDate = new Date(Date.UTC(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        0, 0, 0, 0
      ))

      
      transactionsToCreate.push({
        type,
        amount: parseFloat(amount),
        category,
        description: description,
        paymentMethod,
        source,
        recurringTransactionId: recurringTransaction.id,
        date: finalDate,
        userId: currentUserId
      })

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
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1)
          break
        default:
          currentDate.setMonth(currentDate.getMonth() + 1)
      }
    }

    if (transactionsToCreate.length > 0) {
      await prisma.transaction.createMany({
        data: transactionsToCreate
      })
    }

    let sharedSubscription = null
    if (splitType === 'split') {
      try {
        let billingDate = nextDue.getDate()
        
        if (frequency === 'monthly') {
          billingDate = nextDue.getDate()
        } else if (frequency === 'yearly') {
          billingDate = nextDue.getDate()
        } else {
          billingDate = 1
        }

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
        today.setHours(0, 0, 0, 0)
        
        const originalStartDate = new Date(existing.startDate)
        const nextDue = new Date(today)
        
        switch (existing.frequency) {
          case 'daily':
            nextDue.setDate(nextDue.getDate() + 1)
            break
            
          case 'weekly':
            const originalDayOfWeek = originalStartDate.getDay()
            const currentDayOfWeek = nextDue.getDay()
            let daysToAdd = (originalDayOfWeek - currentDayOfWeek + 7) % 7
            if (daysToAdd === 0) daysToAdd = 7
            nextDue.setDate(nextDue.getDate() + daysToAdd)
            break
            
          case 'monthly':
            const originalDayOfMonth = originalStartDate.getDate()
            nextDue.setDate(originalDayOfMonth)
            
            if (nextDue <= today) {
              nextDue.setMonth(nextDue.getMonth() + 1)
              nextDue.setDate(originalDayOfMonth)
            }
            
            if (nextDue.getDate() !== originalDayOfMonth) {
              nextDue.setDate(0)
            }
            break
            
          case 'quarterly':
            const originalDayOfMonthQ = originalStartDate.getDate()
            nextDue.setDate(originalDayOfMonthQ)
            
            if (nextDue <= today) {
              nextDue.setMonth(nextDue.getMonth() + 3)
              nextDue.setDate(originalDayOfMonthQ)
            }
            
            if (nextDue.getDate() !== originalDayOfMonthQ) {
              nextDue.setDate(0)
            }
            break
            
          case 'yearly':
            nextDue.setMonth(originalStartDate.getMonth())
            nextDue.setDate(originalStartDate.getDate())
            
            if (nextDue <= today) {
              nextDue.setFullYear(nextDue.getFullYear() + 1)
              nextDue.setMonth(originalStartDate.getMonth())
              nextDue.setDate(originalStartDate.getDate())
            }
            
            if (nextDue.getDate() !== originalStartDate.getDate()) {
              nextDue.setDate(0)
            }
            break
            
          default:
            const defaultDayOfMonth = originalStartDate.getDate()
            nextDue.setDate(defaultDayOfMonth)
            if (nextDue <= today) {
              nextDue.setMonth(nextDue.getMonth() + 1)
              nextDue.setDate(defaultDayOfMonth)
            }
            if (nextDue.getDate() !== defaultDayOfMonth) {
              nextDue.setDate(0)
            }
        }

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
