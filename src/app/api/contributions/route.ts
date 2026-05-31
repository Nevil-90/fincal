import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Verify goal belongs to user
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

    // Get the goal details and verify ownership
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId: currentUserId }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    // Start a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the expense transaction
      const transaction = await tx.transaction.create({
        data: {
          type: 'expense',
          amount: parseFloat(amount),
          category: 'Investment',
          description: description || `Savings contribution to ${goal.name}`,
          paymentMethod: paymentMethod || null,
          source: 'Savings Goal Contribution',
          userId: currentUserId
        }
      })

      // Create the goal contribution record
      const contribution = await tx.goalContribution.create({
        data: {
          goalId,
          amount: parseFloat(amount),
          transactionId: transaction.id,
          description
        }
      })

      // Update the goal's current amount
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

    // Get the contribution details and verify ownership of the goal
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

    // Start a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Soft delete the related expense transaction if it exists
      if (contribution.transactionId) {
        await tx.transaction.update({
          where: { id: contribution.transactionId },
          data: { deletedAt: new Date() }
        })
      }

      // Soft delete the contribution
      await tx.goalContribution.update({
        where: { id: contributionId },
        data: { deletedAt: new Date() }
      })

      // Update the goal's current amount (subtract the contribution)
      const newCurrentAmount = Math.max(0, Number(contribution.goal.currentAmount) - Number(contribution.amount))
      await tx.savingsGoal.update({
        where: { id: contribution.goalId },
        data: {
          currentAmount: newCurrentAmount,
          isCompleted: newCurrentAmount >= Number(contribution.goal.targetAmount)
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contribution:', error)
    return NextResponse.json({ error: 'Failed to delete contribution' }, { status: 500 })
  }
}
