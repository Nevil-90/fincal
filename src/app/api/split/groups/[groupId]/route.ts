// GET: Group detail with members, expenses, settlements
// PATCH: Update group name/description/status (close)
// DELETE: Soft delete if no expenses or all balances zero

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(['active', 'closed']).optional(),
})

async function resolveGroup(groupId: string, userId: string) {
  return prisma.splitGroup.findFirst({
    where: { id: groupId, userId, deletedAt: null },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId } = await params
    const group = await prisma.splitGroup.findFirst({
      where: { id: groupId, userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        defaultCurrency: true,
        status: true,
        closedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        members: {
          where: { isActive: true },
          select: {
            id: true,
            groupId: true,
            participantId: true,
            isOwner: true,
            nickname: true,
            joinedAt: true,
            leftAt: true,
            isActive: true,
            createdAt: true,
            participant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        expenses: {
          where: { deletedAt: null },
          select: {
            id: true,
            groupId: true,
            description: true,
            totalAmount: true,
            currency: true,
            paidByMemberId: true,
            splitType: true,
            date: true,
            category: true,
            notes: true,
            transactionId: true,
            isSettlement: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            splits: {
              select: {
                id: true,
                expenseId: true,
                memberId: true,
                amount: true,
                percentage: true,
                createdAt: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
        settlements: {
          where: { deletedAt: null },
          select: {
            id: true,
            groupId: true,
            fromMemberId: true,
            toMemberId: true,
            amount: true,
            currency: true,
            date: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const members = new Map(group.members.map((member) => [member.id, member]))
    return NextResponse.json({
      ...group,
      expenses: group.expenses.map((expense) => ({
        ...expense,
        paidBy: members.get(expense.paidByMemberId) ?? null,
        splits: expense.splits.map((split) => ({
          ...split,
          member: members.get(split.memberId) ?? null,
        })),
      })),
      settlements: group.settlements.map((settlement) => ({
        ...settlement,
        fromMember: members.get(settlement.fromMemberId) ?? null,
        toMember: members.get(settlement.toMemberId) ?? null,
      })),
    })
  } catch (error) {
    console.error('[GET /api/split/groups/[groupId]]', error)
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId } = await params
    const group = await resolveGroup(groupId, userId)
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const body = await request.json()
    const parsed = updateGroupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, description, status } = parsed.data
    const updated = await prisma.splitGroup.update({
      where: { id: groupId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && {
          status,
          closedAt: status === 'closed' ? new Date() : null,
        }),
      },
      include: { members: { include: { participant: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/split/groups/[groupId]]', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
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
    const group = await prisma.splitGroup.findFirst({
      where: { id: groupId, userId, deletedAt: null },
      include: { expenses: { where: { deletedAt: null } } },
    })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    if (group.expenses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a group that has expenses. Settle all balances first.' },
        { status: 400 }
      )
    }

    await prisma.splitGroup.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/split/groups/[groupId]]', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
