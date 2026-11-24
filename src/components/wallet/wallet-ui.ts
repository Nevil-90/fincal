// Shared presentation helpers for the Cash / Online wallet UI.

import { Banknote, Landmark, type LucideIcon } from 'lucide-react'

export type WalletId = 'cash' | 'online'

export const WALLET_META: Record<WalletId, {
  label: string
  short: string
  hint: string
  icon: LucideIcon
  iconClass: string
  accentText: string
}> = {
  cash: {
    label: 'Cash in hand',
    short: 'Cash',
    hint: 'Notes & coins with you',
    icon: Banknote,
    iconClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
  online: {
    label: 'Online',
    short: 'Online',
    hint: 'Bank, UPI, NEFT, cards',
    icon: Landmark,
    iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
}

export const otherWallet = (w: WalletId): WalletId => (w === 'cash' ? 'online' : 'cash')

/** Keeps an amount text field to digits + a single decimal point, max 2 decimals. */
export function sanitizeAmountInput(raw: string): string {
  let val = raw.replace(/[^0-9.]/g, '')
  const parts = val.split('.')
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
  const [int, dec] = val.split('.')
  const cleanInt = int.length > 1 ? int.replace(/^0+(?=\d)/, '') : int
  return dec !== undefined ? `${cleanInt}.${dec.slice(0, 2)}` : cleanInt
}

export const inputClass =
  'w-full px-3 py-2.5 sm:py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-base sm:text-sm font-semibold transition-all'

export const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1'
