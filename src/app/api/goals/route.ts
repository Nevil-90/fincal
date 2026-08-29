// CRUD endpoints for savings goals. Only active (non-completed) goals are
// returned by GET. Deletion is a soft-delete via deletedAt.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withDbLock } from '@/lib/db-lock'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goals = await prisma.savingsGoal.findMany({
      where: {
        isCompleted: false,
        userId: currentUserId,
        deletedAt: null
      },
      orderBy: {
        priority: 'asc'
      }
    })
    
    return NextResponse.json(goals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, targetAmount, currentAmount, deadline, category } = body

    if (!name || !targetAmount || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline ? new Date(deadline) : null,
        userId: currentUserId,
        category
      } as any
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, currentAmount, targetAmount, isCompleted: reqIsCompleted, name, category, deadline } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing required goal id' }, { status: 400 })
    }

    const existingGoal = await withDbLock(() => 
      prisma.savingsGoal.findFirst({
        where: { id, userId: currentUserId }
      })
    )
    
    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    const newCurrentAmount = currentAmount !== undefined ? parseFloat(currentAmount) : Number(existingGoal.currentAmount)
    const newTargetAmount = targetAmount !== undefined ? parseFloat(targetAmount) : Number(existingGoal.targetAmount)

    let isCompleted = existingGoal.isCompleted
    if (typeof reqIsCompleted === 'boolean') {
      isCompleted = reqIsCompleted
    } else if (currentAmount !== undefined) {
      isCompleted = newCurrentAmount >= newTargetAmount
    }

    const updateData: any = {
      currentAmount: newCurrentAmount,
      targetAmount: newTargetAmount,
      isCompleted
    }

    if (name) updateData.name = name
    if (category) updateData.category = category
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null

    if (isCompleted && !existingGoal.isCompleted) {
      updateData.completedAt = new Date()
    } else if (!isCompleted && existingGoal.isCompleted) {
      updateData.completedAt = null
    }

    const goal = await withDbLock(() => 
      prisma.savingsGoal.update({
        where: { id },
        data: updateData
      })
    )

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
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
    const deleteTransactions = searchParams.get('deleteTransactions') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    const existingGoal = await prisma.savingsGoal.findFirst({
      where: { id, userId: currentUserId },
      include: { contributions: true }
    })
    
    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    // Wrap the deletion in a transaction to ensure all or nothing
    await prisma.$transaction(async (tx) => {
      // 1. Soft delete the goal
      await tx.savingsGoal.update({
        where: { id },
        data: { deletedAt: new Date() }
      })

      // 2. Soft delete related transactions if requested
      if (deleteTransactions && existingGoal.contributions.length > 0) {
        const transactionIds = existingGoal.contributions
          .map(c => c.transactionId)
          .filter((id): id is string => id !== null)
        
        await tx.transaction.updateMany({
          where: { id: { in: transactionIds } },
          data: { deletedAt: new Date() }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
