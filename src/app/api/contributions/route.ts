// CRUD endpoints for goal contributions. Each contribution creates a linked
// expense transaction and updates the goal's current amount atomically.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withDbLock } from '@/lib/db-lock'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('goalId')

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId: currentUserId, deletedAt: null }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    const contributions = await prisma.goalContribution.findMany({
      where: { goalId, deletedAt: null },
      include: {
        transaction: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(contributions)
  } catch (error) {
    console.error('Error fetching contributions:', error)
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goalId, amount, description, paymentMethod, date, action, type, reason } = body

    if (!goalId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId: currentUserId, deletedAt: null }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    const movementType = (action || type || 'deposit').toLowerCase() === 'withdrawal' ? 'withdrawal' : 'deposit'
    const depositDate = date ? new Date(date) : new Date()

    if (movementType === 'withdrawal' && numericAmount > Number(goal.currentAmount)) {
      return NextResponse.json({
        error: `Cannot withdraw ₹${numericAmount.toLocaleString()}. Available goal savings is ₹${Number(goal.currentAmount).toLocaleString()}.`
      }, { status: 400 })
    }

    const result = await withDbLock(() => 
      prisma.$transaction(async (tx) => {
        let transaction = null
        if (movementType === 'withdrawal') {
          // Modeled as type: 'transfer' to ensure ZERO distortion to income or expense
          transaction = await tx.transaction.create({
            data: {
              type: 'transfer',
              amount: numericAmount,
              category: 'Goals',
              title: description || `Withdrawal: ${goal.name}${reason ? ` (${reason})` : ''}`,
              notes: reason || null,
              paymentMethod: paymentMethod || null,
              source: 'Goal Withdrawal',
              date: depositDate,
              userId: currentUserId
            }
          })
        } else {
          // Deposit modeled as expense allocation to goal
          transaction = await tx.transaction.create({
            data: {
              type: 'expense',
              amount: numericAmount,
              category: 'Goals',
              title: description || `Savings contribution to ${goal.name}`,
              notes: reason || null,
              paymentMethod: paymentMethod || null,
              source: 'Savings Goal Contribution',
              date: depositDate,
              userId: currentUserId
            }
          })
        }

        const contribution = await tx.goalContribution.create({
          data: {
            goalId,
            amount: numericAmount,
            type: movementType,
            reason: reason || null,
            transactionId: transaction.id,
            description,
            date: depositDate
          }
        })

        const updatedGoal = movementType === 'withdrawal'
          ? await tx.savingsGoal.update({
              where: { id: goalId },
              data: {
                currentAmount: { decrement: numericAmount },
                usedAmount: { increment: numericAmount },
                isCompleted: false
              }
            })
          : await tx.savingsGoal.update({
              where: { id: goalId },
              data: {
                currentAmount: { increment: numericAmount },
                isCompleted: Number(goal.currentAmount) + numericAmount >= Number(goal.targetAmount)
              }
            })

        return { contribution, transaction, goal: updatedGoal }
      })
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating contribution:', error)
    return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contributionId = searchParams.get('id') || searchParams.get('contributionId')

    if (!contributionId) {
      return NextResponse.json({ error: 'Contribution ID is required' }, { status: 400 })
    }

    const contribution = await prisma.goalContribution.findFirst({
      where: { 
        id: contributionId,
        deletedAt: null
      },
      include: {
        goal: true,
        transaction: true
      }
    })

    if (!contribution || contribution.goal.userId !== currentUserId) {
      return NextResponse.json({ error: 'Contribution not found or access denied' }, { status: 404 })
    }

    await withDbLock(() => 
      prisma.$transaction(async (tx) => {
        if (contribution.transactionId) {
          await tx.transaction.update({
            where: { id: contribution.transactionId },
            data: { deletedAt: new Date() }
          })
        }

        await tx.goalContribution.update({
          where: { id: contributionId },
          data: { deletedAt: new Date() }
        })

        if (contribution.type === 'withdrawal') {
          // Reverse withdrawal: restore currentAmount, decrement usedAmount
          const restoredCurrent = Number(contribution.goal.currentAmount) + Number(contribution.amount)
          const restoredUsed = Math.max(0, Number(contribution.goal.usedAmount) - Number(contribution.amount))
          await tx.savingsGoal.update({
            where: { id: contribution.goalId },
            data: {
              currentAmount: restoredCurrent,
              usedAmount: restoredUsed,
              isCompleted: restoredCurrent >= Number(contribution.goal.targetAmount)
            }
          })
        } else {
          // Reverse deposit: decrement currentAmount
          const newCurrentAmount = Math.max(0, Number(contribution.goal.currentAmount) - Number(contribution.amount))
          await tx.savingsGoal.update({
            where: { id: contribution.goalId },
            data: {
              currentAmount: newCurrentAmount,
              isCompleted: newCurrentAmount >= Number(contribution.goal.targetAmount)
            }
          })
        }
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contribution:', error)
    return NextResponse.json({ error: 'Failed to delete contribution' }, { status: 500 })
  }
}
