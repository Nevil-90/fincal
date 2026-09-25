// CRUD endpoints for travel/fuel log entries. Each entry records a trip with
// start/end odometer readings, fuel amount, cost, and optional description.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '10', 10), 200))
    const search = (searchParams.get('search') || '').trim()
    const sortBy = searchParams.get('sortBy') || 'date-desc'
    const offset = (page - 1) * limit

    // Fetch all records for the user to perform comprehensive search & sorting
    let entries = await prisma.travelEntry.findMany({
      where: {
        userId: currentUserId,
        deletedAt: null
      },
      orderBy: [
        { endDate: 'desc' },
        { startDate: 'desc' }
      ]
    })

    // Filter across entire dataset by date string, description, amount, km
    if (search) {
      const q = search.toLowerCase()
      entries = entries.filter(entry => {
        const startStr = new Date(entry.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase()
        const endStr = new Date(entry.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase()
        const desc = (entry.description || '').toLowerCase()
        const kmTraveled = Number(entry.endKm) - Number(entry.startKm)
        const kmStr = `${Number(entry.startKm)} ${Number(entry.endKm)} ${kmTraveled}`
        const amountStr = `${Number(entry.amount)}`
        return startStr.includes(q) || endStr.includes(q) || desc.includes(q) || kmStr.includes(q) || amountStr.includes(q)
      })
    }

    // Sort across entire dataset
    entries.sort((a, b) => {
      const distA = Number(a.endKm) - Number(a.startKm)
      const distB = Number(b.endKm) - Number(b.startKm)
      const litersA = Number(a.liters) || 1
      const litersB = Number(b.liters) || 1
      const effA = distA / litersA
      const effB = distB / litersB

      if (sortBy === 'date-desc') {
        const diffEnd = new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        if (diffEnd !== 0) return diffEnd
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      }
      if (sortBy === 'date-asc') {
        const diffEnd = new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        if (diffEnd !== 0) return diffEnd
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      }
      if (sortBy === 'dist-desc') return distB - distA
      if (sortBy === 'dist-asc') return distA - distB
      if (sortBy === 'spend-desc') return Number(b.amount) - Number(a.amount)
      if (sortBy === 'spend-asc') return Number(a.amount) - Number(b.amount)
      if (sortBy === 'eff-desc') return effB - effA
      if (sortBy === 'eff-asc') return effA - effB
      return 0
    })

    const totalCount = entries.length
    const totalPages = Math.ceil(totalCount / limit) || 1
    const pagedEntries = entries.slice(offset, offset + limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    const durationMs = Math.round(performance.now() - startTime)

    return NextResponse.json(
      {
        success: true,
        travelEntries: pagedEntries,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      },
      {
        status: 200,
        headers: {
          'Server-Timing': `db;dur=${durationMs}`,
          'X-Response-Time': `${durationMs}ms`,
          'X-Total-Count': String(totalCount),
          'X-Total-Pages': String(totalPages),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('Error fetching travel entries:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch travel entries', code: 'FETCH_TRAVEL_ERROR' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate, startKm, endKm, amount, liters, description, paymentMethod } = body

    if (!startDate || !endDate || startKm === undefined || endKm === undefined || !amount || !liters) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numStartKm = parseFloat(startKm)
    const numEndKm = parseFloat(endKm)
    const numAmount = parseFloat(amount)
    const numLiters = parseFloat(liters)

    if (numStartKm >= numEndKm) {
      return NextResponse.json({ error: 'End KM must be greater than Start KM' }, { status: 400 })
    }

    if (numAmount <= 0 || numLiters <= 0) {
      return NextResponse.json({ error: 'Amount and liters must be greater than zero' }, { status: 400 })
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 })
    }

    const kmTraveled = Number((numEndKm - numStartKm).toFixed(1))
    const efficiency = Number((kmTraveled / numLiters).toFixed(2))
    const ratePerLiter = Number((numAmount / numLiters).toFixed(2))
    const computedDesc = description?.trim() || `Fuel: ${numLiters}L, ${kmTraveled}km, ${efficiency} km/L, ₹${ratePerLiter}/L`

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create master Transaction with Fuel category
      const transaction = await tx.transaction.create({
        data: {
          type: 'expense',
          amount: numAmount,
          category: 'Fuel',
          title: `Fuel (${kmTraveled} km)`,
          notes: computedDesc,
          paymentMethod: paymentMethod || 'Cash',
          source: 'Fuel Log',
          date: new Date(endDate),
          userId: currentUserId
        }
      })

      // 2. Create linked TravelEntry
      const travelEntry = await tx.travelEntry.create({
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          startKm: numStartKm,
          endKm: numEndKm,
          amount: numAmount,
          liters: numLiters,
          description: computedDesc,
          transactionId: transaction.id,
          userId: currentUserId
        }
      })

      return { ...travelEntry, transaction }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating travel entry:', error)
    return NextResponse.json({ error: 'Failed to create travel entry' }, { status: 500 })
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
    const ids = searchParams.get('ids')

    if (ids) {
      const idArray = ids.split(',').filter(Boolean)
      if (idArray.length === 0) {
        return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
      }

      const entries = await prisma.travelEntry.findMany({
        where: { id: { in: idArray }, userId: currentUserId },
        select: { id: true, transactionId: true }
      })

      const txIds = entries.map(e => e.transactionId).filter((tid): tid is string => Boolean(tid))

      await prisma.$transaction(async (tx) => {
        await tx.travelEntry.updateMany({
          where: {
            id: { in: idArray },
            userId: currentUserId
          },
          data: {
            deletedAt: new Date()
          }
        })

        if (txIds.length > 0) {
          await tx.transaction.updateMany({
            where: {
              id: { in: txIds },
              userId: currentUserId
            },
            data: {
              deletedAt: new Date()
            }
          })
        }
      })

      return NextResponse.json({ message: `Successfully deleted ${idArray.length} travel entries and linked transactions` })
    }

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    const entry = await prisma.travelEntry.findFirst({
      where: {
        id,
        userId: currentUserId
      }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.travelEntry.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      })

      if (entry.transactionId) {
        await tx.transaction.update({
          where: { id: entry.transactionId },
          data: {
            deletedAt: new Date()
          }
        })
      }
    })

    return NextResponse.json({ message: 'Travel entry and linked transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting travel entry:', error)
    return NextResponse.json({ error: 'Failed to delete travel entry' }, { status: 500 })
  }
}
