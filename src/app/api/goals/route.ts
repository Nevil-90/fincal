import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const { name, targetAmount, currentAmount, deadline } = body

    if (!name || !targetAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline ? new Date(deadline) : null,
        userId: currentUserId
      }
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
    const { id, currentAmount } = body

    if (!id || currentAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify goal belongs to user
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: { id, userId: currentUserId }
    })
    
    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    const newCurrentAmount = parseFloat(currentAmount)
    const isCompleted = newCurrentAmount >= Number(existingGoal.targetAmount)
    const wasAlreadyCompleted = existingGoal.isCompleted

    const updateData: {
      currentAmount: number
      isCompleted: boolean
      completedAt?: Date
    } = {
      currentAmount: newCurrentAmount,
      isCompleted
    }

    // Set completedAt timestamp when goal is first completed
    if (isCompleted && !wasAlreadyCompleted) {
      updateData.completedAt = new Date()
    }

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: updateData
    })

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

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    // Verify goal belongs to user
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: { id, userId: currentUserId }
    })
    
    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 })
    }

    // Delete goal (soft delete)
    await prisma.savingsGoal.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
