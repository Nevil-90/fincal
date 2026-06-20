// GET: List all non-deleted groups for the current user with computed net balance summary.
// POST: Create a new group, auto-create owner SplitGroupMember, and add any initial members.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
  members: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
      })
    )
    .optional()
    .default([]),
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const groups = await prisma.splitGroup.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        defaultCurrency: true,
        closedAt: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: { isActive: true },
          select: { id: true, isOwner: true },
        },
        expenses: {
          where: { deletedAt: null },
          select: {
            paidByMemberId: true,
            isSettlement: true,
            date: true,
            splits: { select: { memberId: true, amount: true } },
          },
        },
        settlements: {
          where: { deletedAt: null },
          select: {
            fromMemberId: true,
            toMemberId: true,
            amount: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Compute net balance per group for the current user
    const result = groups.map((group) => {
      const ownerMember = group.members.find((m) => m.isOwner)
      let totalOwedToUser = 0
      let totalUserOwes = 0

      if (ownerMember) {
        // From expenses: for each expense, payer is owed other members' shares
        for (const expense of group.expenses) {
          if (expense.isSettlement) continue
          const paidByOwner = expense.paidByMemberId === ownerMember.id

          if (paidByOwner) {
            for (const split of expense.splits) {
              if (split.memberId !== ownerMember.id) {
                totalOwedToUser += Number(split.amount)
              }
            }
          } else {
            const userSplit = expense.splits.find((s) => s.memberId === ownerMember.id)
            if (userSplit) {
              totalUserOwes += Number(userSplit.amount)
            }
          }
        }

        // From settlements: adjust balances
        for (const settlement of group.settlements) {
          const amount = Number(settlement.amount)
          if (settlement.fromMemberId === ownerMember.id) {
            // User paid someone → reduces what user owes
            totalUserOwes = Math.max(0, totalUserOwes - amount)
          } else if (settlement.toMemberId === ownerMember.id) {
            // Someone paid user → reduces what they owe user
            totalOwedToUser = Math.max(0, totalOwedToUser - amount)
          }
        }
      }

      const netBalance = totalOwedToUser - totalUserOwes
      const lastExpense = group.expenses.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        status: group.status,
        defaultCurrency: group.defaultCurrency,
        closedAt: group.closedAt,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        memberCount: group.members.length,
        lastActivityAt: lastExpense?.date ?? group.updatedAt,
        totalOwedToUser,
        totalUserOwes,
        netBalance,
        isFullySettled: Math.abs(netBalance) < 0.01,
      }
    })

    return NextResponse.json({ groups: result })
  } catch (error) {
    console.error('[GET /api/split/groups]', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = createGroupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, description, members } = parsed.data
    const memberNames = members.map((member) => member.name.trim())
    const normalizedNames = memberNames.map((memberName) => memberName.toLowerCase())
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      return NextResponse.json({ error: 'Each member name must be unique' }, { status: 400 })
    }

    const group = await prisma.$transaction(async (tx) => {
      const existingParticipants = memberNames.length
        ? await tx.participant.findMany({
            where: {
              userId,
              name: { in: memberNames },
              deletedAt: null,
            },
            select: { id: true, name: true },
          })
        : []
      const participantsByName = new Map(
        existingParticipants.map((participant) => [participant.name.toLowerCase(), participant])
      )
      const missingMembers = members.filter(
        (member) => !participantsByName.has(member.name.trim().toLowerCase())
      )

      if (missingMembers.length > 0) {
        const createdParticipants = await tx.participant.createManyAndReturn({
          data: missingMembers.map((member) => ({
            userId,
            name: member.name.trim(),
            email: member.email || null,
            phone: member.phone || null,
          })),
          select: { id: true, name: true },
        })
        createdParticipants.forEach((participant) => {
          participantsByName.set(participant.name.toLowerCase(), participant)
        })
      }

      return tx.splitGroup.create({
        data: {
          userId,
          name,
          description,
          defaultCurrency: 'INR',
          status: 'active',
          members: {
            create: [
              { participantId: null, isOwner: true },
              ...members.map((member) => ({
                participantId: participantsByName.get(member.name.trim().toLowerCase())!.id,
                isOwner: false,
              })),
            ],
          },
        },
        include: {
          members: { include: { participant: true } },
        },
      })
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('[POST /api/split/groups]', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
