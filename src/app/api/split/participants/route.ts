// GET: List all participants for this user (for autocomplete when adding group members)
// POST: Create a new participant
// PATCH: Update a participant (via ?id= param)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const participantSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const participants = await prisma.participant.findMany({
      where: {
        userId,
        deletedAt: null,
        isActive: true,
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ participants })
  } catch (error) {
    console.error('[GET /api/split/participants]', error)
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = participantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, phone } = parsed.data

    const participant = await prisma.participant.create({
      data: { userId, name, email: email || null, phone: phone || null },
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error('[POST /api/split/participants]', error)
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 })

    const participant = await prisma.participant.findFirst({ where: { id, userId, deletedAt: null } })
    if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

    const body = await request.json()
    const parsed = participantSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const updated = await prisma.participant.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone || null }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/split/participants]', error)
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 })
  }
}
