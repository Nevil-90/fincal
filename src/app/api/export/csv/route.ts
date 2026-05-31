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
    
    // Build where clause similar to transactions API
    const where: any = {
      userId: currentUserId,
      deletedAt: null
    }

    // Apply filters
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

    // Date filters (month/year or custom range)
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

    // Fetch all matching records, sorted chronologically
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

    // Calculate running balance
    let runningBalance = 0

    // Fetch opening balance (everything before the start date)
    if (where.date?.gte) {
      const openingBalanceCondition = {
        ...where,
        date: { lt: where.date.gte }
      }
      
      const priorIncome = await prisma.transaction.aggregate({
        where: { ...openingBalanceCondition, type: 'income' },
        _sum: { amount: true }
      })
      
      const priorExpense = await prisma.transaction.aggregate({
        where: { ...openingBalanceCondition, type: 'expense' },
        _sum: { amount: true }
      })
      
      runningBalance = Number(priorIncome._sum.amount || 0) - Number(priorExpense._sum.amount || 0)
    }

    // Format for CSV
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

    // Prepend Opening Balance Row if applicable
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

    // Use json2csv
    const fields = ['Date', 'Type', 'Category', 'Description', 'Payment Method', 'Source', 'Debit (-)', 'Credit (+)', 'Balance']
    const parser = new Parser({ fields })
    const csv = parser.parse(csvData)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="fintracker-statement.csv"',
      }
    })
  } catch (error: any) {
    console.error('CSV Export Error:', error)
    return NextResponse.json({ error: 'Failed to generate CSV', details: error?.message || String(error) }, { status: 500 })
  }
}
