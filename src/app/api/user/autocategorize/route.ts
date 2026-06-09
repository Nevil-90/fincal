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
      select: { id: true, keyword: true, category: true, type: true },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ success: true, rules })
  } catch (error) {
    console.error('AutoCategorize GET Error:', error)
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

    if (rules.length > 5000) {
      return NextResponse.json({ error: 'Payload too large. Maximum 5000 rules allowed.' }, { status: 413 })
    }

    const ruleMap = new Map<string, any>()
    for (const r of rules) {
      if (r && typeof r.keyword === 'string' && r.keyword.trim().length > 0) {
        const keyword = r.keyword.toLowerCase().trim()
        
        const category = typeof r.category === 'string' && r.category.trim().length > 0 ? r.category.trim() : 'Uncategorized'
        const type = ['expense', 'income'].includes(r.type) ? r.type : 'expense'
        
        ruleMap.set(keyword, { keyword, category, type })
      }
    }

    const deduplicatedRules = Array.from(ruleMap.values())

    if (deduplicatedRules.length === 0) {
      return NextResponse.json({ success: true, processed: rules.length, saved: 0, skipped: rules.length })
    }

    const CHUNK_SIZE = process.env.AUTOCATEGORIZE_CHUNK_SIZE ? parseInt(process.env.AUTOCATEGORIZE_CHUNK_SIZE) : 50
    let saved = 0

    const existingRules = await prisma.autoCategorizeRule.findMany({
      where: { userId, keyword: { in: deduplicatedRules.map(r => r.keyword) } },
      select: { keyword: true, category: true, type: true }
    })
    
    const existingMap = new Map<string, any>()
    for (const ex of existingRules) {
      existingMap.set(ex.keyword, ex)
    }

    const rulesToProcess = deduplicatedRules.filter(rule => {
      const ex = existingMap.get(rule.keyword)
      if (ex && ex.category === rule.category && ex.type === rule.type) {
        return false // Skip identical
      }
      return true
    })

    if (rulesToProcess.length === 0) {
      return NextResponse.json({ success: true, processed: rules.length, saved: 0, skipped: rules.length })
    }

    for (let i = 0; i < rulesToProcess.length; i += CHUNK_SIZE) {
      const chunk = rulesToProcess.slice(i, i + CHUNK_SIZE)
      const chunkStart = Date.now()
      
      await prisma.$transaction(
        chunk.map((rule) =>
          prisma.autoCategorizeRule.upsert({
            where: {
              userId_keyword: { userId, keyword: rule.keyword }
            },
            update: { category: rule.category, type: rule.type },
            create: { userId, keyword: rule.keyword, category: rule.category, type: rule.type }
          })
        )
      )
      
      saved += chunk.length
      
      console.log(`AutoCategorize Chunk [${i} - ${i + chunk.length}] processed in ${Date.now() - chunkStart}ms`)
    }

    return NextResponse.json({ 
      success: true, 
      processed: rules.length, 
      saved, 
      skipped: rules.length - saved
    })
  } catch (error) {
    console.error('AutoCategorize POST Error:', error)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
