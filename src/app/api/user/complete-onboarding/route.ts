import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
