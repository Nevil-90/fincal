'use client'

// Two page sections for the Cash & Online sub-tab:
//   <WalletBreakdown>  how each balance adds up since it was last set
//   <WalletEntries>    every convert / set entry, grouped by month, with edit (converts) + delete

import React, { useMemo, useState } from 'react'
import { X, ArrowLeftRight, Scale, Pencil, Trash2, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/financial-utils'
import { formatDateForDisplay } from '@/lib/dateUtils'
import type { WalletEntryDTO, WalletResponse } from '@/hooks/useApi'
import { WALLET_META, type WalletId } from './wallet-ui'

export function WalletBreakdown({ wallet }: { wallet?: WalletResponse }) {
  return (
    <div className="space-y-2.5">
      {(['cash', 'online'] as WalletId[]).map(w => {
        const snap = wallet?.[w]
        const Icon = WALLET_META[w].icon
        const b = snap?.sinceAnchor
        const negative = snap?.balance !== null && snap?.balance !== undefined && snap.balance < 0
        return (
          <div key={w} className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-neutral-200">
                <span className={`w-6 h-6 rounded-md border flex items-center justify-center ${WALLET_META[w].iconClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {WALLET_META[w].label}
              </span>
              <span className={`text-sm font-bold tabular-nums ${negative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {snap?.isSet && snap.balance !== null ? formatCurrency(snap.balance) : 'Not set'}
              </span>
            </div>
            {snap?.isSet && snap.anchor && b && (
              <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] tabular-nums">
                <dt className="text-slate-500 dark:text-zinc-400">Set on {formatDateForDisplay(snap.anchor.date)}</dt>
                <dd className="text-right font-semibold text-slate-700 dark:text-neutral-300">{formatCurrency(snap.anchor.amount)}</dd>
                {b.income > 0 && (<><dt className="text-slate-500 dark:text-zinc-400">Income</dt><dd className="text-right font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(b.income)}</dd></>)}
                {b.expense > 0 && (<><dt className="text-slate-500 dark:text-zinc-400">Expenses</dt><dd className="text-right font-semibold text-rose-600 dark:text-rose-400">−{formatCurrency(b.expense)}</dd></>)}
                {b.goalWithdrawals > 0 && (<><dt className="text-slate-500 dark:text-zinc-400">Goal withdrawals</dt><dd className="text-right font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(b.goalWithdrawals)}</dd></>)}
                {b.convertIn > 0 && (<><dt className="text-slate-500 dark:text-zinc-400">Converted in</dt><dd className="text-right font-semibold text-violet-600 dark:text-violet-400">+{formatCurrency(b.convertIn)}</dd></>)}
                {b.convertOut > 0 && (<><dt className="text-slate-500 dark:text-zinc-400">Converted out</dt><dd className="text-right font-semibold text-violet-600 dark:text-violet-400">−{formatCurrency(b.convertOut)}</dd></>)}
              </dl>
            )}
          </div>
        )
      })}
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
        Payment method “Cash” counts as Cash; UPI, NEFT, bank transfer and cards count as Online. Entries dated before a balance was set are already included in it.
      </p>
    </div>
  )
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

interface WalletEntriesProps {
  wallet?: WalletResponse
  onEdit: (entry: WalletEntryDTO) => void
  onChanged: (data: WalletResponse) => void
}

export function WalletEntries({ wallet, onEdit, onChanged }: WalletEntriesProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const out: { key: string; items: WalletEntryDTO[] }[] = []
    for (const e of wallet?.entries || []) {
      const k = e.date.slice(0, 7)
      const last = out[out.length - 1]
      if (last && last.key === k) last.items.push(e)
      else out.push({ key: k, items: [e] })
    }
    return out
  }, [wallet?.entries])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/wallet?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Could not delete entry')
        return
      }
      toast.success('Entry deleted')
      onChanged(data as WalletResponse)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/[0.1] p-6 text-center">
        <ArrowLeftRight className="h-5 w-5 mx-auto text-slate-300 dark:text-zinc-600" />
        <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">Nothing here yet</p>
        <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-0.5">ATM withdrawals and cash paybacks you record will show up here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map(g => (
        <div key={g.key}>
          <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5">{monthLabel(g.key)}</p>
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.05] rounded-xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
            {g.items.map(e => {
              const isConvert = e.kind === 'convert'
              const confirming = confirmId === e.id
              const deleting = deletingId === e.id
              let titleText = ''
              let sub = ''
              if (isConvert && e.fromWallet && e.toWallet) {
                titleText = `${WALLET_META[e.fromWallet].short} → ${WALLET_META[e.toWallet].short}`
              } else if (e.wallet) {
                titleText = `${WALLET_META[e.wallet].short} set to ${formatCurrency(e.amount)}`
                if (e.previousBalance === null) sub = 'Starting balance'
                else {
                  const diff = Math.round((e.amount - e.previousBalance) * 100) / 100
                  sub = diff === 0
                    ? 'Matched app balance'
                    : `App had ${formatCurrency(e.previousBalance)} · adjusted ${diff > 0 ? '+' : '−'}${formatCurrency(Math.abs(diff))}`
                }
              }
              return (
                <li key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-transparent">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                    isConvert
                      ? 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20'
                      : 'text-slate-600 dark:text-zinc-300 bg-slate-500/10 border-slate-500/20'
                  }`}>
                    {isConvert ? <ArrowLeftRight className="h-3.5 w-3.5" /> : <Scale className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{titleText}</p>
                      {isConvert && (
                        <span className="text-xs font-bold tabular-nums text-violet-600 dark:text-violet-400 shrink-0">
                          {formatCurrency(e.amount)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {formatDateForDisplay(e.date)}
                      {e.note ? ` · ${e.note}` : sub ? ` · ${sub}` : ''}
                    </p>
                    {e.note && sub && sub.toLowerCase() !== e.note.toLowerCase() && (
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{sub}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {confirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          disabled={deleting}
                          className="h-9 sm:h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                          title="Confirm delete"
                        >
                          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center cursor-pointer"
                          title="Cancel"
                          aria-label="Cancel delete"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {isConvert && (
                          <button
                            type="button"
                            onClick={() => onEdit(e)}
                            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center cursor-pointer"
                            title="Edit"
                            aria-label="Edit conversion"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmId(e.id)}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center cursor-pointer"
                          title="Delete"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
