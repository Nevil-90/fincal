// Calculates and stores the budget carry-over amount from the previous month
// into the current month's MonthlyBudget record.
// GET returns the stored carry-over for a given month/year.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { month, year } = body

    if (!month || !year) {
      return NextResponse.json({ error: 'month and year are required' }, { status: 400 })
    }

    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    const prevMonthStart = new Date(prevYear, prevMonth - 1, 1)
    const prevMonthEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59)

    const [budgetAmounts, groupedExpenses] = await Promise.all([
      prisma.budgetAmount.findMany({ where: { userId, isActive: true } }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: {
          userId,
          type: 'expense',
          date: { gte: prevMonthStart, lte: prevMonthEnd }
        },
        _sum: { amount: true }
      }),
    ])

    if (budgetAmounts.length === 0) {
      return NextResponse.json({ success: true, message: 'No budget amounts configured.' })
    }

    const spentByCategory = groupedExpenses.reduce((acc, curr) => {
      acc[curr.category || 'Other'] = Number(curr._sum.amount || 0)
      return acc
    }, {} as Record<string, number>)

    let totalLeftover = 0
    
    for (const budget of budgetAmounts) {
      const prevSpent = spentByCategory[budget.category] || 0
      const leftover = Math.max(0, Number(budget.amount) - prevSpent)
      totalLeftover += leftover
    }

    const finalCarryOver = totalLeftover

    await prisma.monthlyBudget.upsert({
      where: { month_year_userId: { month, year, userId } },
      update: { carryOver: finalCarryOver },
      create: {
        userId,
        month,
        year,
        carryOver: finalCarryOver,
        totalIncome: 0,
        totalExpense: 0
      }
    })

    return NextResponse.json({ success: true, carryOver: finalCarryOver, message: 'Rollover calculated successfully.' })
  } catch {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    if (!month || !year) {
      return NextResponse.json({ error: 'month and year are required' }, { status: 400 })
    }

    const budget = await prisma.monthlyBudget.findUnique({
      where: { month_year_userId: { month, year, userId } }
    })

    return NextResponse.json({ success: true, carryOver: budget?.carryOver ?? 0 })
  } catch {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
