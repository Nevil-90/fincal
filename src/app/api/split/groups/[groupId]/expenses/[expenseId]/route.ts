// GET: Single expense detail
// PATCH: Edit expense (recalculates splits)
// DELETE: Soft delete expense

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ReconciliationExpense = {
  paidByMemberId: string
  splits: { memberId: string; amount: unknown }[]
}

type ReconciliationSettlement = {
  id: string
  fromMemberId: string
  toMemberId: string
  amount: unknown
}

function invalidSettlementIds(
  expenses: ReconciliationExpense[],
  settlements: ReconciliationSettlement[]
) {
  const balances = new Map<string, number>()
  const add = (memberId: string, amount: number) => {
    balances.set(memberId, (balances.get(memberId) ?? 0) + amount)
  }

  expenses.forEach((expense) => {
    expense.splits.forEach((split) => {
      const amount = Math.round(Number(split.amount) * 100)
      add(expense.paidByMemberId, amount)
      add(split.memberId, -amount)
    })
  })

  return settlements.reduce<string[]>((invalid, settlement) => {
    const amount = Math.round(Number(settlement.amount) * 100)
    const fromBalance = balances.get(settlement.fromMemberId) ?? 0
    const toBalance = balances.get(settlement.toMemberId) ?? 0
    const available = Math.min(Math.max(0, -fromBalance), Math.max(0, toBalance))

    if (amount <= 0 || amount > available) {
      invalid.push(settlement.id)
      return invalid
    }

    add(settlement.fromMemberId, amount)
    add(settlement.toMemberId, -amount)
    return invalid
  }, [])
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, expenseId } = await params
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId, deletedAt: null } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const expense = await prisma.splitExpense.findFirst({
      where: { id: expenseId, groupId, deletedAt: null },
      include: {
        paidBy: { include: { participant: true } },
        splits: { include: { member: { include: { participant: true } } } },
        transaction: { select: { id: true, description: true, amount: true, date: true } },
      },
    })

    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    return NextResponse.json(expense)
  } catch (error) {
    console.error('[GET /api/split/groups/[groupId]/expenses/[expenseId]]', error)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, expenseId } = await params
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId, deletedAt: null } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const expense = await prisma.splitExpense.findFirst({
      where: { id: expenseId, groupId, deletedAt: null },
    })
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    const body = await request.json()
    const { description, totalAmount, date, paidByMemberId, splitType, splitBetween, splits, category, notes, transactionId } = body

    // Build splits
    let splitsData: { memberId: string; amount: number; percentage?: number }[] = []
    const amount = totalAmount ?? Number(expense.totalAmount)

    if (splitType === 'equal' && splitBetween) {
      const perPerson = Math.floor((amount / splitBetween.length) * 100) / 100
      const remainder = Math.round((amount - perPerson * splitBetween.length) * 100) / 100
      splitsData = splitBetween.map((id: string, i: number) => ({
        memberId: id,
        amount: i === 0 ? perPerson + remainder : perPerson,
      }))
    } else if (splitType === 'custom' && splits) {
      splitsData = splits.map((s: any) => ({ memberId: s.memberId, amount: s.amount }))
    } else if (splitType === 'percentage' && splits) {
      splitsData = splits.map((s: any) => ({
        memberId: s.memberId,
        amount: Math.round(((amount * s.percentage) / 100) * 100) / 100,
        percentage: s.percentage,
      }))
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Delete old splits
      await tx.splitExpenseSplit.deleteMany({ where: { expenseId } })

      return tx.splitExpense.update({
        where: { id: expenseId },
        data: {
          ...(description && { description }),
          ...(totalAmount && { totalAmount }),
          ...(date && { date: new Date(date) }),
          ...(paidByMemberId && { paidByMemberId }),
          ...(splitType && { splitType }),
          ...(category !== undefined && { category }),
          ...(notes !== undefined && { notes }),
          ...(transactionId !== undefined && { transactionId }),
          ...(splitsData.length > 0 && {
            splits: {
              create: splitsData.map((s) => ({
                memberId: s.memberId,
                amount: s.amount,
                percentage: s.percentage ?? null,
              })),
            },
          }),
        },
        include: {
          paidBy: { include: { participant: true } },
          splits: { include: { member: { include: { participant: true } } } },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/split/groups/[groupId]/expenses/[expenseId]]', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, expenseId } = await params
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId, deletedAt: null } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const expense = await prisma.splitExpense.findFirst({
      where: { id: expenseId, groupId, deletedAt: null },
    })
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    const deletedAt = new Date()
    const removedSettlements = await prisma.$transaction(async (tx) => {
      const [remainingExpenses, settlements] = await Promise.all([
        tx.splitExpense.findMany({
          where: {
            groupId,
            id: { not: expenseId },
            deletedAt: null,
            isSettlement: false,
          },
          select: {
            paidByMemberId: true,
            splits: { select: { memberId: true, amount: true } },
          },
        }),
        tx.splitSettlement.findMany({
          where: { groupId, deletedAt: null },
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            fromMemberId: true,
            toMemberId: true,
            amount: true,
          },
        }),
      ])

      const settlementIds = invalidSettlementIds(remainingExpenses, settlements)

      await tx.splitExpense.update({
        where: { id: expenseId },
        data: { deletedAt },
      })

      if (settlementIds.length > 0) {
        await Promise.all([
          tx.splitSettlement.updateMany({
            where: { id: { in: settlementIds }, groupId, deletedAt: null },
            data: { deletedAt },
          }),
          tx.transaction.updateMany({
            where: {
              userId,
              source: {
                in: settlementIds.map((id) => `split-settlement:${id}`),
              },
              deletedAt: null,
            },
            data: { deletedAt },
          }),
        ])
      }

      await tx.splitGroup.update({
        where: { id: groupId },
        data: { updatedAt: deletedAt },
      })

      return settlementIds.length
    })

    return NextResponse.json({ success: true, removedSettlements })
  } catch (error) {
    console.error('[DELETE /api/split/groups/[groupId]/expenses/[expenseId]]', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
