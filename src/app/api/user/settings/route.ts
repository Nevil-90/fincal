import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const setting = await prisma.userSetting.findUnique({
      where: {
        key_userId: {
          key: 'theme',
          userId: userId,
        }
      }
    })

    return NextResponse.json({ theme: setting?.value || 'system' })
  } catch (error) {
    console.error('Error fetching theme setting:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { theme } = body

    if (!['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
    }

    const setting = await prisma.userSetting.upsert({
      where: {
        key_userId: {
          key: 'theme',
          userId: userId,
        }
      },
      update: {
        value: theme,
      },
      create: {
        key: 'theme',
        value: theme,
        userId: userId,
      }
    })

    return NextResponse.json({ success: true, theme: setting.value })
  } catch (error) {
    console.error('Error updating theme setting:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
