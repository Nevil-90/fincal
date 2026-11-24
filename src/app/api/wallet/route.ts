// Cash / Online wallet API.
// GET    -> current balances for both wallets + entry history.
// POST   -> { kind: 'convert', fromWallet, toWallet, amount, date, note? }
//           { kind: 'set', balances: { cash?: number, online?: number }, date, note? }
// PATCH  -> edit a convert entry: { id, fromWallet?, toWallet?, amount?, date?, note? }
// DELETE -> ?id=  soft-deletes a convert or set entry.
//
// None of these endpoints read or write the transactions table, so wallet entries are
// never counted as income or expense. See src/lib/wallet.ts for the balance rules.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeWalletState, isWalletId, parseWalletDate, WALLETS, type WalletId } from '@/lib/wallet'

const MAX_AMOUNT = 1_000_000_000 // ₹100 crore sanity cap
const MAX_NOTE = 200
const HISTORY_LIMIT = 200

function parseAmount(value: unknown, { allowZero }: { allowZero: boolean }): number | null {
  const n = typeof value === 'string' ? Number(value.trim()) : typeof value === 'number' ? value : NaN
  if (!Number.isFinite(n)) return null
  if (allowZero ? n < 0 : n <= 0) return null
  if (n > MAX_AMOUNT) return null
  return Math.round(n * 100) / 100
}

function parseNote(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, MAX_NOTE)
  return trimmed || null
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

async function buildResponse(userId: string) {
  const [state, history] = await Promise.all([
    computeWalletState(userId),
    prisma.walletEntry.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: HISTORY_LIMIT,
      select: {
        id: true, kind: true, fromWallet: true, toWallet: true, wallet: true,
        amount: true, previousBalance: true, date: true, note: true, createdAt: true,
      },
    }),
  ])
  return { ...state, entries: history }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return bad('Unauthorized', 401)
    return NextResponse.json(await buildResponse(userId))
  } catch (error) {
    console.error('Wallet GET error:', error)
    return bad('Failed to load wallet balances', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return bad('Unauthorized', 401)

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return bad('Invalid request body')

    const date = parseWalletDate(body.date)
    if (!date) return bad('A valid date (YYYY-MM-DD) is required')
    const note = parseNote(body.note) ?? null

    if (body.kind === 'convert') {
      const { fromWallet, toWallet } = body
      if (!isWalletId(fromWallet) || !isWalletId(toWallet)) return bad('Choose where the money moved from and to')
      if (fromWallet === toWallet) return bad('From and To must be different')
      const amount = parseAmount(body.amount, { allowZero: false })
      if (amount === null) return bad('Enter an amount greater than 0')

      await prisma.walletEntry.create({
        data: { userId, kind: 'convert', fromWallet, toWallet, amount, date, note },
      })
      return NextResponse.json(await buildResponse(userId), { status: 201 })
    }

    if (body.kind === 'set') {
      const balances = body.balances && typeof body.balances === 'object' ? body.balances : {}
      const toSet: Array<{ wallet: WalletId; amount: number }> = []
      for (const w of WALLETS) {
        if (balances[w] === undefined || balances[w] === null || balances[w] === '') continue
        const amount = parseAmount(balances[w], { allowZero: true })
        if (amount === null) return bad(`Enter a valid ${w === 'cash' ? 'cash' : 'online'} balance (0 or more)`)
        toSet.push({ wallet: w, amount })
      }
      if (toSet.length === 0) return bad('Enter at least one balance')

      await prisma.$transaction(async (tx) => {
        // Capture what the app had computed, so history can show the adjustment made.
        const before = await computeWalletState(userId, tx)
        for (const { wallet, amount } of toSet) {
          await tx.walletEntry.create({
            data: {
              userId, kind: 'set', wallet, amount, date, note,
              previousBalance: before[wallet].balance,
            },
          })
        }
      })
      return NextResponse.json(await buildResponse(userId), { status: 201 })
    }

    return bad('Unknown entry kind')
  } catch (error) {
    console.error('Wallet POST error:', error)
    return bad('Failed to save wallet entry', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return bad('Unauthorized', 401)

    const body = await request.json().catch(() => null)
    if (!body || typeof body.id !== 'string') return bad('Entry id is required')

    const existing = await prisma.walletEntry.findFirst({ where: { id: body.id, userId, deletedAt: null } })
    if (!existing) return bad('Entry not found', 404)
    if (existing.kind !== 'convert') return bad('Only convert entries can be edited. Set the balance again instead.')

    const data: Record<string, unknown> = {}
    const fromWallet = body.fromWallet ?? existing.fromWallet
    const toWallet = body.toWallet ?? existing.toWallet
    if (!isWalletId(fromWallet) || !isWalletId(toWallet) || fromWallet === toWallet) return bad('From and To must be different wallets')
    data.fromWallet = fromWallet
    data.toWallet = toWallet

    if (body.amount !== undefined) {
      const amount = parseAmount(body.amount, { allowZero: false })
      if (amount === null) return bad('Enter an amount greater than 0')
      data.amount = amount
    }
    if (body.date !== undefined) {
      const date = parseWalletDate(body.date)
      if (!date) return bad('A valid date (YYYY-MM-DD) is required')
      data.date = date
    }
    const note = parseNote(body.note)
    if (note !== undefined) data.note = note

    await prisma.walletEntry.update({ where: { id: existing.id }, data })
    return NextResponse.json(await buildResponse(userId))
  } catch (error) {
    console.error('Wallet PATCH error:', error)
    return bad('Failed to update wallet entry', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return bad('Unauthorized', 401)

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return bad('Entry id is required')

    const result = await prisma.walletEntry.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    })
    if (result.count === 0) return bad('Entry not found', 404)
    return NextResponse.json(await buildResponse(userId))
  } catch (error) {
    console.error('Wallet DELETE error:', error)
    return bad('Failed to delete wallet entry', 500)
  }
}
