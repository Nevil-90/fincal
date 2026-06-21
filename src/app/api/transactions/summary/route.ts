// Aggregated transaction summary used by the dashboard.
// Returns global all-time totals, available years, an optional year summary,
// an optional month+year period summary, and per-category spend for the period.

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

    const [globalGrouped, dateAgg] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where: { userId: currentUserId, deletedAt: null },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.transaction.aggregate({
        where: { userId: currentUserId, deletedAt: null },
        _min: { date: true },
        _max: { date: true }
      })
    ])

    let globalIncome = 0
    let globalExpense = 0
    let globalCount = 0

    globalGrouped.forEach(g => {
      globalCount += g._count.id
      if (g.type === 'income') globalIncome = Number(g._sum.amount || 0)
      if (g.type === 'expense') globalExpense = Number(g._sum.amount || 0)
    })

    const globalBalance = globalIncome - globalExpense

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

    let yearInfo = null
    if (yearParam && !monthParam) {
      const year = parseInt(yearParam, 10)
      const yearStart = new Date(year, 0, 1)
      const yearEnd   = new Date(year, 11, 31, 23, 59, 59, 999)

      const [yearGrouped, yearCountAgg] = await Promise.all([
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId: currentUserId, deletedAt: null, date: { gte: yearStart, lte: yearEnd } },
          _sum: { amount: true }
        }),
        prisma.transaction.count({
          where: { userId: currentUserId, deletedAt: null, date: { gte: yearStart, lte: yearEnd } }
        })
      ])

      let yIncome = 0
      let yExpense = 0
      yearGrouped.forEach(g => {
        if (g.type === 'income') yIncome = Number(g._sum.amount || 0)
        if (g.type === 'expense') yExpense = Number(g._sum.amount || 0)
      })

      yearInfo = { income: yIncome, expense: yExpense, balance: yIncome - yExpense, count: yearCountAgg }
    }

    let periodInfo = null
    const categorySpend: Record<string, number> = {}

    if (yearParam) {
      const year = parseInt(yearParam, 10)
      const isAllYear = !monthParam

      const startDate = isAllYear ? new Date(year, 0, 1) : new Date(year, parseInt(monthParam, 10) - 1, 1)
      const endDate = isAllYear ? new Date(year, 11, 31, 23, 59, 59, 999) : new Date(year, parseInt(monthParam, 10), 0, 23, 59, 59, 999)

      const prevStartDate = isAllYear 
        ? new Date(year - 1, 0, 1) 
        : (() => {
            const m = parseInt(monthParam, 10)
            const prevMonth = m === 1 ? 12 : m - 1
            const prevYear = m === 1 ? year - 1 : year
            return new Date(prevYear, prevMonth - 1, 1)
          })()

      const prevEndDate = isAllYear
        ? new Date(year - 1, 11, 31, 23, 59, 59, 999)
        : (() => {
            const m = parseInt(monthParam, 10)
            const prevMonth = m === 1 ? 12 : m - 1
            const prevYear = m === 1 ? year - 1 : year
            return new Date(prevYear, prevMonth, 0, 23, 59, 59, 999)
          })()

      const [periodGrouped, prevExpenseAgg, categoryAgg] = await Promise.all([
        prisma.transaction.groupBy({
          by: ['type'],
          where: {
            userId: currentUserId,
            deletedAt: null,
            date: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: {
            userId: currentUserId,
            deletedAt: null,
            type: 'expense',
            date: { gte: prevStartDate, lte: prevEndDate }
          },
          _sum: { amount: true }
        }),
        prisma.transaction.groupBy({
          by: ['category'],
          where: {
            userId: currentUserId,
            deletedAt: null,
            type: 'expense',
            date: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true }
        })
      ])

      let periodIncome = 0
      let periodExpense = 0
      periodGrouped.forEach(g => {
        if (g.type === 'income') periodIncome = Number(g._sum.amount || 0)
        if (g.type === 'expense') periodExpense = Number(g._sum.amount || 0)
      })

      periodInfo = {
        income: periodIncome,
        expense: periodExpense,
        balance: periodIncome - periodExpense,
        prevExpense: Number(prevExpenseAgg._sum.amount || 0)
      }

      categoryAgg.forEach(item => {
        categorySpend[item.category || 'Other'] = Number(item._sum.amount || 0)
      })
    }

    return NextResponse.json({
      global: {
        income: globalIncome,
        expense: globalExpense,
        balance: globalBalance,
        count: globalCount
      },
      availableYears,
      year:   yearInfo,
      period: periodInfo,
      categorySpend
    })

  } catch (error) {
    console.error('Error in /api/transactions/summary:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
