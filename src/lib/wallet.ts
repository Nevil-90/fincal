// Cash / Online wallet balances.
//
// Two wallets: 'cash' and 'online'. A transaction belongs to a wallet by its payment
// method: "Cash" (any casing / spacing) -> cash, everything else -> online.
//
// A wallet only has a balance once the user has done a "Set balance" (WalletEntry kind 'set').
// That entry is the wallet's anchor: "right now I have X". From then on the balance is
//   anchor.amount
//   + income            (counted)
//   - expense           (counted)
//   + goal withdrawals  (type 'transfer', money comes back into the wallet)  (counted)
//   + converts into this wallet - converts out of it                          (counted)
// where "counted" means: not deleted, created AFTER the anchor was saved, and dated on or
// after the anchor's day. Entries for earlier days are already reflected in the amount the
// user typed, so they are ignored even if they are logged later.
//
// Converts and sets live in their own table (wallet_entries), so they never touch any
// income / expense / budget / analytics number.

import { prisma } from '@/lib/prisma'

export const WALLETS = ['cash', 'online'] as const
export type WalletId = (typeof WALLETS)[number]

export const WALLET_LABELS: Record<WalletId, string> = {
  cash: 'Cash',
  online: 'Online',
}

export function isWalletId(value: unknown): value is WalletId {
  return value === 'cash' || value === 'online'
}

export function walletForPaymentMethod(paymentMethod: string | null | undefined): WalletId {
  return (paymentMethod || '').trim().toLowerCase() === 'cash' ? 'cash' : 'online'
}

/** Parses a strict YYYY-MM-DD string into UTC midnight (same convention as transactions). */
export function parseWalletDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(`${value}T00:00:00.000Z`)
  if (isNaN(d.getTime())) return null
  // Reject impossible dates like 2026-02-31 that JS silently rolls over
  if (d.toISOString().slice(0, 10) !== value) return null
  return d
}

/** Rounds to paise to avoid floating noise from Decimal -> number conversion. */
const money = (n: number) => Math.round(n * 100) / 100

export interface WalletBreakdown {
  income: number
  expense: number
  goalWithdrawals: number
  convertIn: number
  convertOut: number
}

export interface WalletSnapshot {
  wallet: WalletId
  isSet: boolean
  balance: number | null
  anchor: { id: string; amount: number; date: string; createdAt: string } | null
  sinceAnchor: WalletBreakdown | null
}

export interface WalletState {
  cash: WalletSnapshot
  online: WalletSnapshot
  total: number | null
  isSetUp: boolean
}

type EntryRow = {
  id: string
  kind: string
  fromWallet: string | null
  toWallet: string | null
  wallet: string | null
  amount: unknown
  date: Date
  createdAt: Date
}

/**
 * Computes both wallet balances for a user.
 * `db` may be a Prisma transaction client so a "set" can read the balance
 * consistently inside the same transaction it writes in.
 */
export async function computeWalletState(userId: string, db: any = prisma): Promise<WalletState> {
  const entries: EntryRow[] = await db.walletEntry.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, kind: true, fromWallet: true, toWallet: true, wallet: true, amount: true, date: true, createdAt: true },
  })

  const snapshots = {} as Record<WalletId, WalletSnapshot>

  for (const w of WALLETS) {
    const sets = entries.filter(e => e.kind === 'set' && e.wallet === w)
    const anchor = sets.length > 0 ? sets[sets.length - 1] : null

    if (!anchor) {
      snapshots[w] = { wallet: w, isSet: false, balance: null, anchor: null, sinceAnchor: null }
      continue
    }

    const counts = (e: { createdAt: Date; date: Date }) =>
      e.createdAt.getTime() > anchor.createdAt.getTime() && e.date.getTime() >= anchor.date.getTime()

    // groupBy is NOT covered by the soft-delete extension, so deletedAt is filtered explicitly.
    const grouped: Array<{ type: string; paymentMethod: string | null; _sum: { amount: unknown } }> =
      await db.transaction.groupBy({
        by: ['type', 'paymentMethod'],
        where: {
          userId,
          deletedAt: null,
          createdAt: { gt: anchor.createdAt },
          date: { gte: anchor.date },
        },
        _sum: { amount: true },
      })

    const breakdown: WalletBreakdown = { income: 0, expense: 0, goalWithdrawals: 0, convertIn: 0, convertOut: 0 }
    for (const g of grouped) {
      if (walletForPaymentMethod(g.paymentMethod) !== w) continue
      const sum = Number(g._sum.amount || 0)
      if (g.type === 'income') breakdown.income += sum
      else if (g.type === 'expense') breakdown.expense += sum
      else if (g.type === 'transfer') breakdown.goalWithdrawals += sum
    }

    for (const e of entries) {
      if (e.kind !== 'convert' || !counts(e)) continue
      const amt = Number(e.amount)
      if (e.toWallet === w) breakdown.convertIn += amt
      if (e.fromWallet === w) breakdown.convertOut += amt
    }

    for (const k of Object.keys(breakdown) as (keyof WalletBreakdown)[]) breakdown[k] = money(breakdown[k])

    const balance = money(
      Number(anchor.amount) +
        breakdown.income -
        breakdown.expense +
        breakdown.goalWithdrawals +
        breakdown.convertIn -
        breakdown.convertOut
    )

    snapshots[w] = {
      wallet: w,
      isSet: true,
      balance,
      anchor: {
        id: anchor.id,
        amount: money(Number(anchor.amount)),
        date: anchor.date.toISOString(),
        createdAt: anchor.createdAt.toISOString(),
      },
      sinceAnchor: breakdown,
    }
  }

  const isSetUp = snapshots.cash.isSet && snapshots.online.isSet
  const total = isSetUp ? money((snapshots.cash.balance || 0) + (snapshots.online.balance || 0)) : null

  return { cash: snapshots.cash, online: snapshots.online, total, isSetUp }
}
