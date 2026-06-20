// POST: Record a settlement and write to the user's ledger when they are involved
// DELETE: Soft delete a settlement (via ?id= query param)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

const createSettlementSchema = z.object({
  fromMemberId: z.string(),
  toMemberId: z.string(),
  amount: z.number().positive(),
  date: z.string(),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId } = await params
    const body = await request.json()
    const parsed = createSettlementSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { fromMemberId, toMemberId, amount, date, notes } = parsed.data

    if (fromMemberId === toMemberId) {
      return NextResponse.json({ error: 'Cannot settle between the same member' }, { status: 400 })
    }

    const group = await prisma.splitGroup.findFirst({
      where: { id: groupId, userId, deletedAt: null },
      select: {
        name: true,
        status: true,
        members: {
          where: {
            id: { in: [fromMemberId, toMemberId] },
            isActive: true,
          },
          select: {
            id: true,
            isOwner: true,
            nickname: true,
            participant: { select: { name: true } },
          },
        },
      },
    })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (group.status === 'closed') {
      return NextResponse.json({ error: 'Cannot add settlements to a closed group' }, { status: 400 })
    }

    const fromMember = group.members.find((member) => member.id === fromMemberId)
    const toMember = group.members.find((member) => member.id === toMemberId)
    if (!fromMember || !toMember) {
      return NextResponse.json({ error: 'One or both members not found in this group' }, { status: 400 })
    }

    const settlementDate = new Date(date)
    const fromName = fromMember.nickname ?? fromMember.participant?.name ?? 'Group member'
    const toName = toMember.nickname ?? toMember.participant?.name ?? 'Group member'
    const settlementId = randomUUID()
    const settlementCreate = prisma.splitSettlement.create({
      data: {
        id: settlementId,
        groupId,
        fromMemberId,
        toMemberId,
        amount,
        currency: 'INR',
        date: settlementDate,
        notes: notes || null,
      },
      select: {
        id: true,
        groupId: true,
        fromMemberId: true,
        toMemberId: true,
        amount: true,
        date: true,
      },
    })
    const groupUpdate = prisma.splitGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
      select: { id: true },
    })

    let result
    if (fromMember.isOwner || toMember.isOwner) {
      const userIsPaying = fromMember.isOwner
      const counterparty = userIsPaying ? toName : fromName
      ;[result] = await prisma.$transaction([
        settlementCreate,
        prisma.transaction.create({
          data: {
            userId,
            type: userIsPaying ? 'expense' : 'income',
            amount,
            category: 'Split Settlement',
            description: userIsPaying
              ? `Settled with ${counterparty} — ${group.name}`
              : `Received from ${counterparty} — ${group.name}`,
            paymentMethod: 'UPI / Cash',
            source: `split-settlement:${settlementId}`,
            date: settlementDate,
          },
          select: { id: true },
        }),
        groupUpdate,
      ])
    } else {
      ;[result] = await prisma.$transaction([settlementCreate, groupUpdate])
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[POST /api/split/groups/[groupId]/settlements]', error)
    return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId } = await params
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId, deletedAt: null } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const settlementId = new URL(request.url).searchParams.get('id')
    if (!settlementId) return NextResponse.json({ error: 'Settlement ID is required' }, { status: 400 })

    const settlement = await prisma.splitSettlement.findFirst({
      where: { id: settlementId, groupId, deletedAt: null },
      include: {
        fromMember: { include: { participant: true } },
        toMember: { include: { participant: true } },
      },
    })
    if (!settlement) return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })

    const linkedTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        source: `split-settlement:${settlement.id}`,
        deletedAt: null,
      },
      select: { id: true },
    })
    let transactionId = linkedTransaction?.id ?? null

    if (!transactionId) {
      const userIsPaying = settlement.fromMember.isOwner
      const counterpartyMember = userIsPaying ? settlement.toMember : settlement.fromMember
      const counterparty = counterpartyMember.nickname ?? counterpartyMember.participant?.name ?? 'Group member'
      const description = userIsPaying
        ? `Settled with ${counterparty} — ${group.name}`
        : `Received from ${counterparty} — ${group.name}`
      const createdAfter = new Date(settlement.createdAt.getTime() - 10_000)
      const createdBefore = new Date(settlement.createdAt.getTime() + 10_000)
      const legacyTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          category: 'Split Settlement',
          description,
          type: userIsPaying ? 'expense' : 'income',
          amount: settlement.amount,
          date: settlement.date,
          createdAt: { gte: createdAfter, lte: createdBefore },
          deletedAt: null,
        },
        orderBy: { createdAt: 'asc' },
        take: 2,
        select: { id: true },
      })
      transactionId = legacyTransactions.length === 1 ? legacyTransactions[0].id : null
    }

    const deletedAt = new Date()
    await prisma.$transaction(async (tx) => {
      await tx.splitSettlement.update({
        where: { id: settlementId },
        data: { deletedAt },
      })
      if (transactionId) {
        await tx.transaction.updateMany({
          where: { id: transactionId, userId, deletedAt: null },
          data: { deletedAt },
        })
      }
      await tx.splitGroup.update({
        where: { id: groupId },
        data: { updatedAt: deletedAt },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/split/groups/[groupId]/settlements]', error)
    return NextResponse.json({ error: 'Failed to delete settlement' }, { status: 500 })
  }
}
