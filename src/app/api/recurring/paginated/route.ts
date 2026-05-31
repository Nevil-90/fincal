import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Filter parameters
    const status = searchParams.get('status') // 'active', 'inactive', 'all'
    const type = searchParams.get('type') // 'income', 'expense', 'all'
    const category = searchParams.get('category')
    const frequency = searchParams.get('frequency')
    const search = searchParams.get('search') // Search in description/category

    // Build where clause
    const where: {
      userId: string
      isActive?: boolean
      type?: string
      category?: string
      frequency?: string
      OR?: Array<{
        description?: { contains: string; mode: 'insensitive' }
        category?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      userId: currentUserId
    }
    
    if (status && status !== 'all') {
      where.isActive = status === 'active'
    }
    
    if (type && type !== 'all') {
      where.type = type
    }
    
    if (category) {
      where.category = category
    }
    
    if (frequency) {
      where.frequency = frequency
    }
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.recurringTransaction.count({ where })
    
    // Get paginated results
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where,
      orderBy: [
        { isActive: 'desc' }, // Active first
        { nextDue: 'asc' }     // Then by next due date
      ],
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            transactions: true // Count of related transactions
          }
        },
        transactions: {
          select: { amount: true }
        },
        priceChanges: {
          orderBy: { effectiveDate: 'asc' }
        }
      }
    })

    // Compute the total spent for each recurring transaction
    const formattedData = recurringTransactions.map(rt => {
      const totalSpent = rt.transactions.reduce((sum, t) => sum + Number(t.amount), 0)
      const { transactions, ...rest } = rt
      return { ...rest, totalSpent }
    })

    // Get unique categories and frequencies for filter options of this user
    const categories = await prisma.recurringTransaction.findMany({
      where: { userId: currentUserId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    })

    const frequencies = await prisma.recurringTransaction.findMany({
      where: { userId: currentUserId },
      select: { frequency: true },
      distinct: ['frequency'],
      orderBy: { frequency: 'asc' }
    })

    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      data: formattedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        categories: categories.map(c => c.category),
        frequencies: frequencies.map(f => f.frequency)
      }
    })
  } catch (error) {
    console.error('Error fetching paginated recurring transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring transactions' }, 
      { status: 500 }
    )
  }
}
