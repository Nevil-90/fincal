// Exports the current user's transactions as a CSV file.
// Supports the same filter parameters as the transactions list (date range,
// type, category, search). Prepends an opening balance row when a date filter
// is active and computes a running balance column.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Parser } from '@json2csv/plainjs'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const where: any = {
      userId: currentUserId,
      deletedAt: null
    }

    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    const filterType = searchParams.get('filterType')
    if (filterType && filterType !== 'all') {
      where.type = filterType
    }

    const filterCategory = searchParams.get('filterCategory')
    if (filterCategory && filterCategory !== 'all') {
      where.category = filterCategory
    }

    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (startDate && endDate) {
      where.date = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`)
      }
    } else if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
      where.date = {
        gte: startDate,
        lte: endDate
      }
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1)
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999)
      where.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        date: true,
        type: true,
        category: true,
        amount: true,
        description: true,
        paymentMethod: true,
        source: true,
      }
    })

    let runningBalance = 0

    if (where.date?.gte) {
      const openingBalanceCondition = {
        ...where,
        date: { lt: where.date.gte }
      }
      
      const [priorIncome, priorExpense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { ...openingBalanceCondition, type: 'income' },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { ...openingBalanceCondition, type: 'expense' },
          _sum: { amount: true }
        })
      ])
      
      runningBalance = Number(priorIncome._sum.amount || 0) - Number(priorExpense._sum.amount || 0)
    }

    const csvData = transactions.map(t => {
      const amount = Number(t.amount)
      if (t.type === 'income') {
        runningBalance += amount
      } else {
        runningBalance -= amount
      }

      return {
        Date: new Date(t.date).toLocaleDateString('en-US'),
        Type: t.type.toUpperCase(),
        Category: t.category,
        Description: t.description || '',
        'Payment Method': t.paymentMethod || '',
        Source: t.source || '',
        'Debit (-)': t.type === 'expense' ? amount.toFixed(2) : '',
        'Credit (+)': t.type === 'income' ? amount.toFixed(2) : '',
        Balance: runningBalance.toFixed(2)
      }
    })

    if (where.date?.gte) {
      csvData.unshift({
        Date: new Date(where.date.gte).toLocaleDateString('en-US'),
        Type: 'SYSTEM',
        Category: 'Opening Balance',
        Description: 'Opening Balance',
        'Payment Method': '',
        Source: '',
        'Debit (-)': '',
        'Credit (+)': '',
        Balance: runningBalance.toFixed(2)
      })
    }

    const fields = ['Date', 'Type', 'Category', 'Description', 'Payment Method', 'Source', 'Debit (-)', 'Credit (+)', 'Balance']
    const parser = new Parser({ fields })
    const csv = parser.parse(csvData)

    let scope = 'transactions'
    if (searchParams.get('startDate') && searchParams.get('endDate')) {
      scope = `transactions_${searchParams.get('startDate')}_to_${searchParams.get('endDate')}`
    } else if (searchParams.get('month') && searchParams.get('year')) {
      scope = `transactions_${searchParams.get('year')}_${String(searchParams.get('month')).padStart(2, '0')}`
    } else if (searchParams.get('year')) {
      scope = `transactions_${searchParams.get('year')}`
    }

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const filename = `${scope}_${dateStr}_${timeStr}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })
  } catch (error: any) {
    console.error('CSV Export Error:', error)
    return NextResponse.json({ error: 'Failed to generate CSV', details: error?.message || String(error) }, { status: 500 })
  }
}
