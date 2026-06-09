// CRUD endpoints for travel/fuel log entries. Each entry records a trip with
// start/end odometer readings, fuel amount, cost, and optional description.

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
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '50', 10), 200))
    const offset = (page - 1) * limit

    const totalCount = await prisma.travelEntry.count({
      where: { userId: currentUserId, deletedAt: null }
    })

    const travelEntries = await prisma.travelEntry.findMany({
      where: { userId: currentUserId, deletedAt: null },
      orderBy: {
        startDate: 'desc'
      },
      skip: offset,
      take: limit
    })

    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      travelEntries,
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
    console.error('Error fetching travel entries:', error)
    return NextResponse.json({ error: 'Failed to fetch travel entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate, startKm, endKm, amount, liters, description } = body

    if (!startDate || !endDate || startKm === undefined || endKm === undefined || !amount || !liters) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (parseFloat(startKm) >= parseFloat(endKm)) {
      return NextResponse.json({ error: 'End KM must be greater than Start KM' }, { status: 400 })
    }

    if (parseFloat(amount) <= 0 || parseFloat(liters) <= 0) {
      return NextResponse.json({ error: 'Amount and liters must be greater than zero' }, { status: 400 })
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const travelEntry = await prisma.travelEntry.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startKm: parseFloat(startKm),
        endKm: parseFloat(endKm),
        amount: parseFloat(amount),
        liters: parseFloat(liters),
        description,
        userId: currentUserId
      }
    })

    return NextResponse.json(travelEntry)
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

    if (!id) {
      return NextResponse.json({ error: 'Travel entry ID is required' }, { status: 400 })
    }

    const existing = await prisma.travelEntry.findFirst({
      where: { id, userId: currentUserId, deletedAt: null }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Travel entry not found or access denied' }, { status: 404 })
    }

    const deletedEntry = await prisma.travelEntry.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Travel entry deleted successfully',
      travelEntry: deletedEntry 
    })
  } catch (error) {
    console.error('Error deleting travel entry:', error)
    return NextResponse.json({ error: 'Failed to delete travel entry' }, { status: 500 })
  }
}
