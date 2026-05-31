import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { navPreferences: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let preferences = ['overview', 'transactions', 'goals', 'recurring']
    if (user.navPreferences) {
      try {
        const parsed = JSON.parse(user.navPreferences)
        if (Array.isArray(parsed) && parsed.length >= 4 && parsed.length <= 6) {
          preferences = parsed
        }
      } catch (e) {
        console.warn('Failed to parse nav preferences from DB, using default')
      }
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching nav preferences:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    if (!Array.isArray(preferences) || preferences.length < 4 || preferences.length > 6) {
      return NextResponse.json({ error: 'Invalid preferences format' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { navPreferences: JSON.stringify(preferences) }
    })

    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    console.error('Error updating nav preferences:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
