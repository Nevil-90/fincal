// PATCH: Update member nickname
// DELETE: Remove member (only if zero balance in this group)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateMemberSchema = z.object({
  nickname: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
})

async function getMemberBalance(groupId: string, memberId: string): Promise<number> {
  const [expenses, settlements] = await Promise.all([
    prisma.splitExpense.findMany({
      where: { groupId, deletedAt: null, isSettlement: false },
      include: { splits: true },
    }),
    prisma.splitSettlement.findMany({
      where: {
        groupId,
        deletedAt: null,
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
      },
    }),
  ])

  let balance = 0
  for (const expense of expenses) {
    if (expense.paidByMemberId === memberId) {
      // Member paid — others owe them
      for (const split of expense.splits) {
        if (split.memberId !== memberId) balance += Number(split.amount)
      }
    } else {
      // Member is owed to payer
      const split = expense.splits.find((s) => s.memberId === memberId)
      if (split) balance -= Number(split.amount)
    }
  }

  for (const settlement of settlements) {
    if (settlement.fromMemberId === memberId) balance += Number(settlement.amount)
    else balance -= Number(settlement.amount)
  }

  return balance
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, memberId } = await params
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId, deletedAt: null } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const member = await prisma.splitGroupMember.findFirst({ where: { id: memberId, groupId } })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const body = await request.json()
    const parsed = updateMemberSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const updated = await prisma.splitGroupMember.update({
      where: { id: memberId },
      data: {
        ...(parsed.data.nickname !== undefined && { nickname: parsed.data.nickname }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
      include: { participant: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/split/groups/[groupId]/members/[memberId]]', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, memberId } = await params
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId, deletedAt: null } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const member = await prisma.splitGroupMember.findFirst({ where: { id: memberId, groupId } })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (member.isOwner) return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 400 })

    const balance = await getMemberBalance(groupId, memberId)
    if (Math.abs(balance) > 0.01) {
      return NextResponse.json(
        { error: 'Cannot remove member with a non-zero balance. Settle up first.' },
        { status: 400 }
      )
    }

    await prisma.splitGroupMember.update({
      where: { id: memberId },
      data: { isActive: false, leftAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/split/groups/[groupId]/members/[memberId]]', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
