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

    // Get previous month bounds
    const prevMonthStart = new Date(prevYear, prevMonth - 1, 1)
    const prevMonthEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59)

    // 1. Fetch all expenses for all categories in the previous month in a single grouped query
    const groupedExpenses = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        type: 'expense',
        date: { gte: prevMonthStart, lte: prevMonthEnd }
      },
      _sum: { amount: true }
    })

    const spentByCategory = groupedExpenses.reduce((acc, curr) => {
      acc[curr.category || 'Other'] = Number(curr._sum.amount || 0)
      return acc
    }, {} as Record<string, number>)

    // 2. Fetch the previous month's MonthlyBudget record (for its own carryOver)
    const prevMonthBudget = await prisma.monthlyBudget.findUnique({
      where: { month_year_userId: { month: prevMonth, year: prevYear, userId } }
    })
    
    // We only use the previous month's total carryOver if we distribute it, but usually rollover is calculated per category.
    // If the intent is to sum all unused budget from all categories:
    let totalLeftover = 0
    
    for (const budget of budgetAmounts) {
      const prevSpent = spentByCategory[budget.category] || 0
      // Calculate leftover for THIS specific category
      const leftover = Math.max(0, Number(budget.amount) - prevSpent)
      totalLeftover += leftover
    }

    // Include the carryover from the month before that if they stack indefinitely, 
    // but typically rollover is just (total budget - total spent) of previous month + its carryover.
    // We will add the prevCarryOver to the sum of leftovers:
    const prevCarryOver = Number(prevMonthBudget?.carryOver ?? 0)
    
    // Some users might want totalLeftover to just be the sum of unused budgets.
    // If previous carryover applies globally, we add it. 
    // But since the original code added it to EACH category (which was a bug), we will just use the sum of unused budgets.
    const finalCarryOver = totalLeftover

    // 3. Perform a single upsert for the total carryover
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
