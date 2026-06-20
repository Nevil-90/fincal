// GET: Compute net balance summary for the group on-the-fly.
// Only shows balances involving the current user (the group owner).

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
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId, deletedAt: null } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Find the owner member row
    const ownerMember = await prisma.splitGroupMember.findFirst({
      where: { groupId, isOwner: true },
    })
    if (!ownerMember) return NextResponse.json({ error: 'Owner member not found' }, { status: 500 })

    // Fetch all expenses and settlements
    const [expenses, settlements, allMembers] = await Promise.all([
      prisma.splitExpense.findMany({
        where: { groupId, deletedAt: null, isSettlement: false },
        include: { splits: true },
      }),
      prisma.splitSettlement.findMany({
        where: { groupId, deletedAt: null },
      }),
      prisma.splitGroupMember.findMany({
        where: { groupId, isActive: true },
        include: { participant: true },
      }),
    ])

    // Calculate raw balance: positive = other member owes current user, negative = current user owes that member
    const balanceMap: Record<string, number> = {}

    for (const expense of expenses) {
      const paidByOwner = expense.paidByMemberId === ownerMember.id

      for (const split of expense.splits) {
        if (split.memberId === ownerMember.id) continue // user's own share doesn't create a debt to track

        const splitAmount = Number(split.amount)

        if (paidByOwner) {
          // Owner paid — this member owes the owner
          balanceMap[split.memberId] = (balanceMap[split.memberId] ?? 0) + splitAmount
        } else if (expense.paidByMemberId !== ownerMember.id) {
          // Someone else paid — if owner has a split in this expense, check against payer
          const ownerSplit = expense.splits.find((s) => s.memberId === ownerMember.id)
          if (ownerSplit && split.memberId === expense.paidByMemberId) {
            // Owner owes the payer
            balanceMap[expense.paidByMemberId] = (balanceMap[expense.paidByMemberId] ?? 0) - Number(ownerSplit.amount)
          }
        }
      }
    }

    // Apply settlements
    for (const settlement of settlements) {
      const amount = Number(settlement.amount)
      if (settlement.fromMemberId === ownerMember.id) {
        // Owner paid someone → reduces what owner owes them
        balanceMap[settlement.toMemberId] = (balanceMap[settlement.toMemberId] ?? 0) + amount
      } else if (settlement.toMemberId === ownerMember.id) {
        // Someone paid owner → reduces what they owe
        balanceMap[settlement.fromMemberId] = (balanceMap[settlement.fromMemberId] ?? 0) - amount
      }
    }

    // Build response — only non-owner members, only those with non-zero balance
    const balances = allMembers
      .filter((m) => !m.isOwner)
      .map((member) => {
        const net = balanceMap[member.id] ?? 0
        return {
          memberId: member.id,
          memberName: member.nickname ?? member.participant?.name ?? 'Unknown',
          net: Math.round(net * 100) / 100,
          direction: net > 0.01 ? 'owes_you' : net < -0.01 ? 'you_owe' : 'settled',
        }
      })

    const totalOwedToYou = balances.filter((b) => b.direction === 'owes_you').reduce((s, b) => s + b.net, 0)
    const totalYouOwe = balances.filter((b) => b.direction === 'you_owe').reduce((s, b) => s + Math.abs(b.net), 0)
    const netBalance = totalOwedToYou - totalYouOwe

    return NextResponse.json({
      groupId,
      currency: 'INR',
      balances,
      totalOwedToYou: Math.round(totalOwedToYou * 100) / 100,
      totalYouOwe: Math.round(totalYouOwe * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      isFullySettled: Math.abs(netBalance) < 0.01 && balances.every((b) => b.direction === 'settled'),
    })
  } catch (error) {
    console.error('[GET /api/split/groups/[groupId]/balances]', error)
    return NextResponse.json({ error: 'Failed to compute balances' }, { status: 500 })
  }
}
