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

    // Get previous month bounds
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Fetch the budget amounts configured by the user
    const budgetAmounts = await prisma.budgetAmount.findMany({
      where: { userId, isActive: true }
    })

    if (budgetAmounts.length === 0) {
      return NextResponse.json({ success: true, message: 'No budget amounts configured.' })
    }

    // For each budget category, calculate cumulative rollover
    for (const budget of budgetAmounts) {
      // Fetch all expenses for this category in the previous month
      const prevMonthStart = new Date(prevYear, prevMonth - 1, 1)
      const prevMonthEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59)

      const prevExpenses = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'expense',
          category: budget.category,
          date: { gte: prevMonthStart, lte: prevMonthEnd }
        },
        _sum: { amount: true }
      })

      const prevSpent = Number(prevExpenses._sum.amount || 0)

      // Get the previous month's MonthlyBudget record (for its own carryOver)
      const prevMonthBudget = await prisma.monthlyBudget.findUnique({
        where: { month_year_userId: { month: prevMonth, year: prevYear, userId } }
      })

      // Effective previous budget = configured amount + previous carryOver
      const prevCarryOver = Number(prevMonthBudget?.carryOver ?? 0)
      const effectivePrevBudget = Number(budget.amount) + prevCarryOver
      const leftover = Math.max(0, effectivePrevBudget - prevSpent)

      // Upsert this month's MonthlyBudget with the cumulative carryOver
      await prisma.monthlyBudget.upsert({
        where: { month_year_userId: { month, year, userId } },
        update: { carryOver: leftover },
        create: {
          userId,
          month,
          year,
          carryOver: leftover,
          totalIncome: 0,
          totalExpense: 0
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Rollover calculated successfully.' })
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
