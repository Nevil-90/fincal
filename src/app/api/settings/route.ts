// Key-value store for per-user settings (e.g. theme, display preferences).
// GET returns all settings as an object, or a single setting by key.
// POST upserts a key/value pair.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const setting = await prisma.userSetting.findUnique({
        where: {
          key_userId: {
            key,
            userId: currentUserId
          }
        }
      })
      return NextResponse.json(setting)
    }

    const settings = await prisma.userSetting.findMany({
      where: { userId: currentUserId }
    })
    
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    const setting = await prisma.userSetting.upsert({
      where: {
        key_userId: {
          key,
          userId: currentUserId
        }
      },
      update: {
        value: String(value)
      },
      create: {
        key,
        value: String(value),
        userId: currentUserId
      }
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error updating user setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
