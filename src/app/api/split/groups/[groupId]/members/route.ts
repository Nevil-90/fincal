// GET: List members in a group
// POST: Add a member to the group (finds or creates a Participant)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

const addMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  nickname: z.string().optional(),
})

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

    const members = await prisma.splitGroupMember.findMany({
      where: { groupId, isActive: true },
      include: { participant: true },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('[GET /api/split/groups/[groupId]/members]', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
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
    const parsed = addMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, phone, nickname } = parsed.data

    const [group, participant] = await Promise.all([
      prisma.splitGroup.findFirst({
        where: { id: groupId, userId, deletedAt: null },
        select: { status: true },
      }),
      prisma.participant.findFirst({
        where: { userId, name, deletedAt: null },
        select: {
          id: true,
          splitGroupMembers: {
            where: { groupId },
            take: 1,
            select: { id: true, isActive: true },
          },
        },
      }),
    ])
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (group.status === 'closed') {
      return NextResponse.json({ error: 'Cannot add members to a closed group' }, { status: 400 })
    }

    const existing = participant?.splitGroupMembers[0]
    if (existing?.isActive) {
      return NextResponse.json({ error: 'Member already in group' }, { status: 409 })
    }

    const groupUpdate = prisma.splitGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
      select: { id: true },
    })

    let member
    if (existing) {
      ;[member] = await prisma.$transaction([
        prisma.splitGroupMember.update({
          where: { id: existing.id },
          data: { isActive: true, leftAt: null, nickname: nickname || null },
          include: { participant: true },
        }),
        groupUpdate,
      ])
    } else if (participant) {
      ;[member] = await prisma.$transaction([
        prisma.splitGroupMember.create({
          data: { groupId, participantId: participant.id, isOwner: false, nickname: nickname || null },
          include: { participant: true },
        }),
        groupUpdate,
      ])
    } else {
      const participantId = randomUUID()
      ;[, member] = await prisma.$transaction([
        prisma.participant.create({
          data: {
            id: participantId,
            userId,
            name,
            email: email || null,
            phone: phone || null,
          },
          select: { id: true },
        }),
        prisma.splitGroupMember.create({
          data: { groupId, participantId, isOwner: false, nickname: nickname || null },
          include: { participant: true },
        }),
        groupUpdate,
      ])
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('[POST /api/split/groups/[groupId]/members]', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
