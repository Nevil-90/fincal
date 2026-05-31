import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rules = await prisma.autoCategorizeRule.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ success: true, rules })
  } catch {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rules } = body

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Upsert each rule
    await Promise.all(
      rules.map((rule: { keyword: string; category: string; type: string }) =>
        prisma.autoCategorizeRule.upsert({
          where: {
            userId_keyword: {
              userId,
              keyword: rule.keyword.toLowerCase().trim()
            }
          },
          update: {
            category: rule.category,
            type: rule.type
          },
          create: {
            userId,
            keyword: rule.keyword.toLowerCase().trim(),
            category: rule.category,
            type: rule.type
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
