// Travel analytics endpoint. Supports three aggregation modes via ?type=:
//   overview  — all-time summary + monthly breakdown for current year + yearly summaries
//   monthly   — summary and entries for a specific month
//   yearly    — summary and monthly breakdown for a specific year

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface TravelSummary {
  totalKmTraveled: number
  totalAmount: number
  totalLiters: number
  averageEfficiency: number
  averagePricePerLiter: number
  totalEntries: number
}

interface MonthlySummary extends TravelSummary {
  month: number
  year: number
  monthName: string
}

interface YearlySummary extends TravelSummary {
  year: number
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null

    if (type === 'overview') {
      const allEntries = await prisma.travelEntry.findMany({
        where: { userId: currentUserId, deletedAt: null },
        orderBy: { startDate: 'asc' }
      })

      const summary = calculateSummary(allEntries)
      
      const monthlySummaries: MonthlySummary[] = []
      for (let m = 1; m <= 12; m++) {
        const monthEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.startDate)
          return entryDate.getFullYear() === year && entryDate.getMonth() + 1 === m
        })

        if (monthEntries.length > 0) {
          const monthSummary = calculateSummary(monthEntries)
          monthlySummaries.push({
            ...monthSummary,
            month: m,
            year,
            monthName: new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'long' })
          })
        }
      }

      const years = [...new Set(allEntries.map(entry => new Date(entry.startDate).getFullYear()))]
      const yearlySummaries: YearlySummary[] = years.map(y => {
        const yearEntries = allEntries.filter(entry => new Date(entry.startDate).getFullYear() === y)
        const yearSummary = calculateSummary(yearEntries)
        return {
          ...yearSummary,
          year: y
        }
      }).sort((a, b) => b.year - a.year)

      return NextResponse.json({
        overall: summary,
        monthly: monthlySummaries,
        yearly: yearlySummaries,
        recentEntries: allEntries.slice(-5).reverse()
      })
    }

    if (type === 'monthly') {
      const startDate = new Date(year, (month || 1) - 1, 1)
      const endDate = new Date(year, month || 12, 0, 23, 59, 59)

      const entries = await prisma.travelEntry.findMany({
        where: {
          userId: currentUserId,
          deletedAt: null,
          startDate: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { startDate: 'desc' }
      })

      const summary = calculateSummary(entries)
      
      return NextResponse.json({
        summary,
        entries,
        period: `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      })
    }

    if (type === 'yearly') {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31, 23, 59, 59)

      const entries = await prisma.travelEntry.findMany({
        where: {
          userId: currentUserId,
          deletedAt: null,
          startDate: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { startDate: 'desc' }
      })

      const summary = calculateSummary(entries)

      const monthlyBreakdown: MonthlySummary[] = []
      for (let m = 1; m <= 12; m++) {
        const monthEntries = entries.filter(entry => {
          const entryDate = new Date(entry.startDate)
          return entryDate.getMonth() + 1 === m
        })

        if (monthEntries.length > 0) {
          const monthSummary = calculateSummary(monthEntries)
          monthlyBreakdown.push({
            ...monthSummary,
            month: m,
            year,
            monthName: new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'long' })
          })
        }
      }

      return NextResponse.json({
        summary,
        entries,
        monthlyBreakdown,
        period: year.toString()
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching travel analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch travel analytics' }, { status: 500 })
  }
}

interface TravelEntry {
  id: string
  startDate: Date
  endDate: Date
  startKm: number
  endKm: number
  amount: number
  liters: number
  description?: string | null
}

function calculateSummary(entries: any[]): TravelSummary {
  if (entries.length === 0) {
    return {
      totalKmTraveled: 0,
      totalAmount: 0,
      totalLiters: 0,
      averageEfficiency: 0,
      averagePricePerLiter: 0,
      totalEntries: 0
    }
  }

  const totalKmTraveled = entries.reduce((total, entry) => total + (Number(entry.endKm) - Number(entry.startKm)), 0)
  const totalAmount = entries.reduce((total, entry) => total + Number(entry.amount), 0)
  const totalLiters = entries.reduce((total, entry) => total + Number(entry.liters), 0)
  
  const averageEfficiency = totalLiters > 0 ? totalKmTraveled / totalLiters : 0
  const averagePricePerLiter = totalLiters > 0 ? totalAmount / totalLiters : 0

  return {
    totalKmTraveled: Math.round(totalKmTraveled * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalLiters: Math.round(totalLiters * 100) / 100,
    averageEfficiency: Math.round(averageEfficiency * 100) / 100,
    averagePricePerLiter: Math.round(averagePricePerLiter * 100) / 100,
    totalEntries: entries.length
  }
}
