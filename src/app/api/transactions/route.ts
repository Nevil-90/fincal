// Full CRUD for transactions with filtering, pagination, and optional
// opening-balance calculation. PATCH updates an existing transaction in place.
// DELETE is a soft-delete; transactions linked to a goal contribution are blocked.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recurringId = searchParams.get('recurringId')
    
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = (page - 1) * limit
    
    const category = searchParams.get('category')
    const type = searchParams.get('type') as 'income' | 'expense' | null
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const search = searchParams.get('search')
    const includeOpeningBalance = searchParams.get('includeOpeningBalance') === 'true'
    
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')
    
    const whereClause: {
      userId: string
      recurringTransactionId?: string
      category?: string
      type?: 'income' | 'expense'
      paymentMethod?: string
      date?: {
        gte?: Date
        lte?: Date
      }
      amount?: {
        gte?: number
        lte?: number
      }
      OR?: Array<{
        description?: { contains: string; mode: 'insensitive' }
        category?: { contains: string; mode: 'insensitive' }
        paymentMethod?: { contains: string; mode: 'insensitive' }
        source?: { contains: string; mode: 'insensitive' }
      }>
      deletedAt: null
    } = {
      userId: currentUserId,
      deletedAt: null
    }
    
    if (recurringId) {
      whereClause.recurringTransactionId = recurringId
    }
    
    if (category) {
      whereClause.category = category
    }
    
    if (type) {
      whereClause.type = type
    }
    
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod
    }
    
    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        whereClause.date.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate)
      }
    } else if (monthParam && yearParam) {
      const year = parseInt(yearParam, 10)
      const month = parseInt(monthParam, 10) - 1
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)
      
      whereClause.date = {
        gte: startOfMonth,
        lte: endOfMonth
      }
    } else if (yearParam && !monthParam) {
      const year = parseInt(yearParam, 10)
      const startOfYear = new Date(year, 0, 1)
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)
      
      whereClause.date = {
        gte: startOfYear,
        lte: endOfYear
      }
    }
    
    if (minAmount || maxAmount) {
      whereClause.amount = {}
      if (minAmount) {
        whereClause.amount.gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        whereClause.amount.lte = parseFloat(maxAmount)
      }
    }
    
    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { paymentMethod: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const queries: Promise<any>[] = [
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          recurringTransaction: {
            select: {
              id: true,
              description: true,
              frequency: true,
              isActive: true,
              isPaused: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: offset,
        take: limit
      })
    ]

    const calculateOpening = includeOpeningBalance && whereClause.date?.gte
    if (calculateOpening) {
      queries.push(
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId: currentUserId, deletedAt: null, date: { lt: whereClause.date?.gte } },
          _sum: { amount: true }
        })
      )
    }

    const results = await Promise.all(queries)
    
    const totalCount = results[0]
    const transactions = results[1]
    
    let openingBalance = 0
    if (calculateOpening && results[2]) {
      const openingGrouped = results[2]
      let openingIncome = 0
      let openingExpense = 0
      openingGrouped.forEach((g: any) => {
        if (g.type === 'income') openingIncome = Number(g._sum.amount || 0)
        if (g.type === 'expense') openingExpense = Number(g._sum.amount || 0)
      })
      openingBalance = openingIncome - openingExpense
    }
    
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return NextResponse.json({
      transactions,
      openingBalance,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, amount, category, description, paymentMethod, source, date, recurringTransactionId } = body

    if (!type || !amount || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a valid number greater than zero' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: numericAmount,
        category,
        description,
        paymentMethod,
        source,
        date: date ? new Date(date) : new Date(),
        recurringTransactionId,
        userId: currentUserId
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
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
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId: currentUserId }
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 })
    }

    const goalContribution = await prisma.goalContribution.findFirst({
      where: { transactionId: id }
    })

    if (goalContribution) {
      return NextResponse.json({ 
        error: 'Cannot delete transaction linked to savings goal. Delete the goal contribution first.' 
      }, { status: 400 })
    }

    const deletedTransaction = await prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction deleted successfully',
      transaction: deletedTransaction 
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, type, amount, category, description, paymentMethod, source, date } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    if (!amount || !category) {
      return NextResponse.json({ error: 'Amount and category are required' }, { status: 400 })
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a valid number greater than zero' }, { status: 400 })
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId: currentUserId }
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 })
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: type || existingTransaction.type,
        amount: numericAmount,
        category,
        description: description || null,
        paymentMethod: paymentMethod || null,
        source: source || null,
        date: date ? new Date(date) : existingTransaction.date,
      }
    })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}
