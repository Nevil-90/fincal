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
      orderBy: {
        startDate: 'desc'
      }
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

      if (sortBy === 'date-desc') return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      if (sortBy === 'date-asc') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
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

    return NextResponse.json({
      travelEntries: pagedEntries,
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
    const ids = searchParams.get('ids')

    if (ids) {
      const idArray = ids.split(',').filter(Boolean)
      if (idArray.length === 0) {
        return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
      }

      await prisma.travelEntry.updateMany({
        where: {
          id: { in: idArray },
          userId: currentUserId
        },
        data: {
          deletedAt: new Date()
        }
      })

      return NextResponse.json({ message: `Successfully deleted ${idArray.length} travel entries` })
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

    await prisma.travelEntry.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Travel entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting travel entry:', error)
    return NextResponse.json({ error: 'Failed to delete travel entry' }, { status: 500 })
  }
}
