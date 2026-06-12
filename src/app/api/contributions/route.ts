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
      where: { id: goalId, userId: currentUserId }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    const contributions = await prisma.goalContribution.findMany({
      where: { goalId },
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
    const { goalId, amount, description, paymentMethod } = body

    if (!goalId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId: currentUserId }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    const result = await withDbLock(() => 
      prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            type: 'expense',
            amount: parseFloat(amount),
            category: (goal as any).category,
            description: description || `Savings contribution to ${goal.name}`,
            paymentMethod: paymentMethod || null,
            source: 'Savings Goal Contribution',
            userId: currentUserId
          }
        })

        const contribution = await tx.goalContribution.create({
          data: {
            goalId,
            amount: parseFloat(amount),
            transactionId: transaction.id,
            description
          }
        })

        const updatedGoal = await tx.savingsGoal.update({
          where: { id: goalId },
          data: {
            currentAmount: {
              increment: parseFloat(amount)
            },
            isCompleted: Number(goal.currentAmount) + parseFloat(amount) >= Number(goal.targetAmount)
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
    const contributionId = searchParams.get('contributionId')

    if (!contributionId) {
      return NextResponse.json({ error: 'Contribution ID is required' }, { status: 400 })
    }

    const contribution = await prisma.goalContribution.findUnique({
      where: { id: contributionId },
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

        const newCurrentAmount = Math.max(0, Number(contribution.goal.currentAmount) - Number(contribution.amount))
        await tx.savingsGoal.update({
          where: { id: contribution.goalId },
          data: {
            currentAmount: newCurrentAmount,
            isCompleted: newCurrentAmount >= Number(contribution.goal.targetAmount)
          }
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contribution:', error)
    return NextResponse.json({ error: 'Failed to delete contribution' }, { status: 500 })
  }
}
