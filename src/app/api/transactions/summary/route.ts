import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')

    // 1. Global (All-time) Summary
    const allTimeAgg = await prisma.transaction.aggregate({
      where: { userId: currentUserId, deletedAt: null },
      _sum: { amount: true },
      _count: { id: true }
    })

    const allTimeIncomeAgg = await prisma.transaction.aggregate({
      where: { userId: currentUserId, deletedAt: null, type: 'income' },
      _sum: { amount: true }
    })

    const allTimeExpenseAgg = await prisma.transaction.aggregate({
      where: { userId: currentUserId, deletedAt: null, type: 'expense' },
      _sum: { amount: true }
    })

    const globalIncome = Number(allTimeIncomeAgg._sum.amount || 0)
    const globalExpense = Number(allTimeExpenseAgg._sum.amount || 0)
    const globalBalance = globalIncome - globalExpense

    // 2. Available Years
    // We can get distinct years by grouping or raw query. Since Prisma doesn't support Date formatting in groupBy easily,
    // we'll fetch the min and max date to figure out the range of years.
    const dateAgg = await prisma.transaction.aggregate({
      where: { userId: currentUserId, deletedAt: null },
      _min: { date: true },
      _max: { date: true }
    })

    const availableYears: number[] = []
    if (dateAgg._min.date && dateAgg._max.date) {
      const minYear = dateAgg._min.date.getFullYear()
      const maxYear = dateAgg._max.date.getFullYear()
      for (let y = maxYear; y >= minYear; y--) {
        availableYears.push(y)
      }
    }
    const currentYear = new Date().getFullYear()
    if (!availableYears.includes(currentYear)) {
      availableYears.unshift(currentYear)
      availableYears.sort((a, b) => b - a)
    }

    // 3. Period Summary (If month and year provided)
    let periodInfo = null
    const categorySpend: Record<string, number> = {}

    if (monthParam && yearParam) {
      const month = parseInt(monthParam, 10)
      const year = parseInt(yearParam, 10)

      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)

      const periodIncomeAgg = await prisma.transaction.aggregate({
        where: {
          userId: currentUserId,
          deletedAt: null,
          type: 'income',
          date: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true }
      })

      const periodExpenseAgg = await prisma.transaction.aggregate({
        where: {
          userId: currentUserId,
          deletedAt: null,
          type: 'expense',
          date: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true }
      })

      const periodIncome = Number(periodIncomeAgg._sum.amount || 0)
      const periodExpense = Number(periodExpenseAgg._sum.amount || 0)

      // Previous Month
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      const prevStartDate = new Date(prevYear, prevMonth - 1, 1)
      const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999)

      const prevExpenseAgg = await prisma.transaction.aggregate({
        where: {
          userId: currentUserId,
          deletedAt: null,
          type: 'expense',
          date: { gte: prevStartDate, lte: prevEndDate }
        },
        _sum: { amount: true }
      })

      const prevExpense = Number(prevExpenseAgg._sum.amount || 0)

      periodInfo = {
        income: periodIncome,
        expense: periodExpense,
        balance: periodIncome - periodExpense,
        prevExpense
      }

      // 4. Category Spend for the period
      const categoryAgg = await prisma.transaction.groupBy({
        by: ['category'],
        where: {
          userId: currentUserId,
          deletedAt: null,
          type: 'expense',
          date: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true }
      })

      categoryAgg.forEach(item => {
        categorySpend[item.category || 'Other'] = Number(item._sum.amount || 0)
      })
    }

    return NextResponse.json({
      global: {
        income: globalIncome,
        expense: globalExpense,
        balance: globalBalance,
        count: allTimeAgg._count.id
      },
      availableYears,
      period: periodInfo,
      categorySpend
    })

  } catch (error) {
    console.error('Error in /api/transactions/summary:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
