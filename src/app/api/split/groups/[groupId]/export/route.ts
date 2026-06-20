// GET: Returns group export data for client-side PDF/CSV generation
// Query: ?format=pdf | ?format=csv

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      include: {
        members: {
          where: { isActive: true },
          include: { participant: true },
        },
        expenses: {
          where: { deletedAt: null },
          include: {
            paidBy: { include: { participant: true } },
            splits: { include: { member: { include: { participant: true } } } },
          },
          orderBy: { date: 'asc' },
        },
        settlements: {
          where: { deletedAt: null },
          include: {
            fromMember: { include: { participant: true } },
            toMember: { include: { participant: true } },
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const ownerMember = group.members.find((m) => m.isOwner)

    const getMemberName = (member: any) =>
      member?.nickname ?? member?.participant?.name ?? 'You'

    const expenseRows = group.expenses
      .filter((e) => !e.isSettlement)
      .map((e) => ({
        date: e.date,
        description: e.description,
        totalAmount: Number(e.totalAmount),
        currency: e.currency,
        paidBy: getMemberName(e.paidBy),
        splitType: e.splitType,
        category: e.category ?? '',
        notes: e.notes ?? '',
        splits: e.splits.map((s) => ({
          member: getMemberName(s.member),
          amount: Number(s.amount),
          percentage: s.percentage ? Number(s.percentage) : null,
        })),
      }))

    const settlementRows = group.settlements.map((s) => ({
      date: s.date,
      fromMember: getMemberName(s.fromMember),
      toMember: getMemberName(s.toMember),
      amount: Number(s.amount),
      notes: s.notes ?? '',
    }))

    return NextResponse.json({
      groupName: group.name,
      description: group.description,
      status: group.status,
      defaultCurrency: group.defaultCurrency,
      createdAt: group.createdAt,
      members: group.members.map((m) => ({
        name: getMemberName(m),
        isOwner: m.isOwner,
        email: m.participant?.email ?? null,
      })),
      expenses: expenseRows,
      settlements: settlementRows,
      exportedAt: new Date(),
    })
  } catch (error) {
    console.error('[GET /api/split/groups/[groupId]/export]', error)
    return NextResponse.json({ error: 'Failed to generate export data' }, { status: 500 })
  }
}
