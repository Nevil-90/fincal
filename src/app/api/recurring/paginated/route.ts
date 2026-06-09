// Paginated list of recurring transactions with filtering by status, type,
// category, frequency, and text search. Returns aggregate totals per transaction
// without loading all child transactions into memory.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '10', 10), 200))
    const skip = (page - 1) * limit

    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const frequency = searchParams.get('frequency')
    const search = searchParams.get('search')

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

    const [totalCount, categories, frequencies, recurringTransactions] = await Promise.all([
      prisma.recurringTransaction.count({ where }),
      prisma.recurringTransaction.findMany({
        where: { userId: currentUserId },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' }
      }),
      prisma.recurringTransaction.findMany({
        where: { userId: currentUserId },
        select: { frequency: true },
        distinct: ['frequency'],
        orderBy: { frequency: 'asc' }
      }),
      prisma.recurringTransaction.findMany({
        where,
        orderBy: [
          { isActive: 'desc' },
          { nextDue: 'asc' }
        ],
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              transactions: true
            }
          },
          priceChanges: {
            orderBy: { effectiveDate: 'asc' }
          }
        }
      })
    ])

    const recurringIds = recurringTransactions.map(rt => rt.id)
    let groupedTotals: Record<string, number> = {}
    
    if (recurringIds.length > 0) {
      const totals = await prisma.transaction.groupBy({
        by: ['recurringTransactionId'],
        where: { recurringTransactionId: { in: recurringIds } },
        _sum: { amount: true }
      })
      
      groupedTotals = totals.reduce((acc, curr) => {
        if (curr.recurringTransactionId) {
          acc[curr.recurringTransactionId] = Number(curr._sum.amount || 0)
        }
        return acc
      }, {} as Record<string, number>)
    }

    const formattedData = recurringTransactions.map(rt => {
      return { ...rt, totalSpent: groupedTotals[rt.id] || 0 }
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
