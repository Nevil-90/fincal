// GET: List expenses in a group (paginated, filterable)
// POST: Create an expense with splits (equal, custom, percentage)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const equalSplitSchema = z.object({
  description: z.string().min(1).max(200),
  totalAmount: z.number().positive(),
  date: z.string(),
  paidByMemberId: z.string(),
  splitType: z.literal('equal'),
  splitBetween: z.array(z.string()).min(1),
  category: z.string().optional(),
  notes: z.string().optional(),
  transactionId: z.string().nullable().optional(),
})

const customSplitSchema = z.object({
  description: z.string().min(1).max(200),
  totalAmount: z.number().positive(),
  date: z.string(),
  paidByMemberId: z.string(),
  splitType: z.literal('custom'),
  splits: z.array(z.object({ memberId: z.string(), amount: z.number().min(0) })).min(1),
  category: z.string().optional(),
  notes: z.string().optional(),
  transactionId: z.string().nullable().optional(),
})

const percentageSplitSchema = z.object({
  description: z.string().min(1).max(200),
  totalAmount: z.number().positive(),
  date: z.string(),
  paidByMemberId: z.string(),
  splitType: z.literal('percentage'),
  splits: z.array(z.object({ memberId: z.string(), percentage: z.number().min(0).max(100) })).min(1),
  category: z.string().optional(),
  notes: z.string().optional(),
  transactionId: z.string().nullable().optional(),
})

const expenseSchema = z.discriminatedUnion('splitType', [
  equalSplitSchema,
  customSplitSchema,
  percentageSplitSchema,
])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId } = await params
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId, deletedAt: null } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'all' | 'paid_by_me' | 'paid_by_others' | 'unsettled'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit

    // Find the owner member to apply filters
    const ownerMember = await prisma.splitGroupMember.findFirst({ where: { groupId, isOwner: true } })

    const where: any = { groupId, deletedAt: null }

    if (filter === 'paid_by_me' && ownerMember) {
      where.paidByMemberId = ownerMember.id
      where.isSettlement = false
    } else if (filter === 'paid_by_others' && ownerMember) {
      where.paidByMemberId = { not: ownerMember.id }
      where.isSettlement = false
    } else if (filter === 'unsettled') {
      where.isSettlement = false
    }

    const [total, expenses] = await Promise.all([
      prisma.splitExpense.count({ where }),
      prisma.splitExpense.findMany({
        where,
        include: {
          paidBy: { include: { participant: true } },
          splits: { include: { member: { include: { participant: true } } } },
          transaction: { select: { id: true, description: true, amount: true, date: true } },
        },
        orderBy: { date: 'desc' },
        skip: offset,
        take: limit,
      }),
    ])

    return NextResponse.json({
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/split/groups/[groupId]/expenses]', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId } = await params
    const body = await request.json()
    const parsed = expenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const group = await prisma.splitGroup.findFirst({
      where: { id: groupId, userId, deletedAt: null },
      select: {
        status: true,
        members: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (group.status === 'closed') {
      return NextResponse.json({ error: 'Cannot add expenses to a closed group' }, { status: 400 })
    }

    let splitsData: { memberId: string; amount: number; percentage?: number }[] = []

    if (data.splitType === 'equal') {
      const memberIds = data.splitBetween
      const perPerson = Math.floor((data.totalAmount / memberIds.length) * 100) / 100
      const remainder = Math.round((data.totalAmount - perPerson * memberIds.length) * 100) / 100
      splitsData = memberIds.map((memberId, i) => ({
        memberId,
        amount: i === 0 ? perPerson + remainder : perPerson,
      }))
    } else if (data.splitType === 'custom') {
      const total = data.splits.reduce((s, x) => s + x.amount, 0)
      if (Math.abs(total - data.totalAmount) > 0.01) {
        return NextResponse.json({ error: 'Custom split amounts must sum to the total amount' }, { status: 400 })
      }
      splitsData = data.splits.map((s) => ({ memberId: s.memberId, amount: s.amount }))
    } else if (data.splitType === 'percentage') {
      const totalPct = data.splits.reduce((s, x) => s + x.percentage, 0)
      if (Math.abs(totalPct - 100) > 0.01) {
        return NextResponse.json({ error: 'Percentages must sum to 100%' }, { status: 400 })
      }
      splitsData = data.splits.map((s) => ({
        memberId: s.memberId,
        amount: Math.round(((data.totalAmount * s.percentage) / 100) * 100) / 100,
        percentage: s.percentage,
      }))
    }

    const memberIds = splitsData.map((s) => s.memberId)
    const activeMemberIds = new Set(group.members.map((member) => member.id))
    if (!activeMemberIds.has(data.paidByMemberId)) {
      return NextResponse.json({ error: 'Payer is not a member of this group' }, { status: 400 })
    }
    if (
      new Set(memberIds).size !== memberIds.length ||
      memberIds.some((memberId) => !activeMemberIds.has(memberId))
    ) {
      return NextResponse.json({ error: 'One or more split members are not valid group members' }, { status: 400 })
    }

    const [expense] = await prisma.$transaction([
      prisma.splitExpense.create({
        data: {
          groupId,
          description: data.description,
          totalAmount: data.totalAmount,
          currency: 'INR',
          paidByMemberId: data.paidByMemberId,
          splitType: data.splitType,
          date: new Date(data.date),
          category: data.category || null,
          notes: data.notes || null,
          transactionId: data.transactionId || null,
          splits: {
            create: splitsData.map((s) => ({
              memberId: s.memberId,
              amount: s.amount,
              percentage: s.percentage ?? null,
            })),
          },
        },
        select: {
          id: true,
          groupId: true,
          description: true,
          totalAmount: true,
          date: true,
        },
      }),
      prisma.splitGroup.update({
        where: { id: groupId },
        data: { updatedAt: new Date() },
        select: { id: true },
      }),
    ])

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('[POST /api/split/groups/[groupId]/expenses]', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
