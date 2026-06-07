// Returns completed savings goals for the current user, ordered by most
// recently completed, each with the last 5 contributions included.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const completedGoals = await prisma.savingsGoal.findMany({
      where: {
        isCompleted: true,
        userId: currentUserId
      },
      include: {
        contributions: {
          include: {
            transaction: {
              select: {
                id: true,
                paymentMethod: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })
    
    return NextResponse.json(completedGoals)
  } catch (error) {
    console.error('Error fetching completed goals:', error)
    return NextResponse.json({ error: 'Failed to fetch completed goals' }, { status: 500 })
  }
}
