'use client'

// Overview → "Cash & Online" sub-tab: balances, Convert / Adjust, how it adds up, and history.

import React, { useCallback, useState } from 'react'
import { ArrowLeftRight, Scale, Wallet, RefreshCw, ChevronRight, Banknote, Landmark } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { useWallet, type WalletEntryDTO, type WalletResponse } from '@/hooks/useApi'
import WalletEntryModal, { type WalletModalMode } from './WalletEntryModal'
import { WalletBreakdown, WalletEntries } from './WalletHistory'
import { WALLET_META, type WalletId } from './wallet-ui'

const card = 'bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-sm'
const sectionTitle = 'text-sm font-bold text-slate-900 dark:text-white tracking-tight'

export default function WalletPanel() {
  const { wallet, isLoading, isError, mutate } = useWallet()
  const [modal, setModal] = useState<{ mode: WalletModalMode; edit?: WalletEntryDTO | null } | null>(null)

  const applyData = useCallback((data: WalletResponse) => {
    mutate(data, { revalidate: false })
  }, [mutate])

  const modalEl = (
    <WalletEntryModal
      isOpen={!!modal}
      mode={modal?.mode || 'convert'}
      editEntry={modal?.edit || null}
      wallet={wallet}
      onClose={() => setModal(null)}
      onSaved={applyData}
    />
  )

  // ---- Loading ----
  if (isLoading && !wallet) {
    return (
      <div className="space-y-3.5" aria-busy="true">
        <div className={card}>
          <div className="h-3 w-32 rounded bg-slate-200/80 dark:bg-white/[0.06] animate-pulse" />
          <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[0, 1, 2].map(i => <div key={i} className={`h-[84px] rounded-xl bg-slate-100 dark:bg-white/[0.04] animate-pulse ${i === 2 ? 'col-span-2 lg:col-span-1' : ''}`} />)}
          </div>
        </div>
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
      </div>
    )
  }

  // ---- Error ----
  if (isError && !wallet) {
    return (
      <div className={`${card} flex items-center justify-between gap-3`}>
        <p className="text-xs text-slate-500 dark:text-zinc-400">Couldn’t load Cash &amp; Online balances.</p>
        <button
          type="button"
          onClick={() => mutate()}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    )
  }

  const anySet = !!(wallet?.cash.isSet || wallet?.online.isSet)

  // ---- First-time: not set up ----
  if (!anySet) {
    const steps = [
      { icon: Scale, title: 'Set your balances once', text: 'Count the cash with you and check your bank / UPI balance.' },
      { icon: Banknote, title: 'Log entries as usual', text: 'Payment method “Cash” comes out of Cash; UPI, NEFT and cards come out of Online.' },
      { icon: ArrowLeftRight, title: 'Convert when money changes form', text: 'ATM withdrawal, friends paying you back in cash: never counted as income or expense.' },
    ]
    return (
      <>
        <div className={`${card} sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Track Cash &amp; Online money</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-snug mt-0.5">
                  Always know how much cash is in hand and how much is in the bank.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModal({ mode: 'set' })}
              className="h-11 sm:h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              Set balances <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <ol className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <li key={s.title} className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-200/70 dark:bg-white/[0.06] text-[11px] font-bold text-slate-600 dark:text-zinc-300 flex items-center justify-center">{i + 1}</span>
                    <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">{s.title}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">{s.text}</p>
                </li>
              )
            })}
          </ol>
        </div>
        {modalEl}
      </>
    )
  }

  // ---- Normal state ----
  const tile = (w: WalletId) => {
    const snap = wallet![w]
    const Icon = WALLET_META[w].icon
    const negative = snap.balance !== null && snap.balance < 0
    return (
      <div className="bg-slate-50/80 dark:bg-[#16161a]/80 border border-slate-200/70 dark:border-white/[0.07] rounded-xl p-3 flex flex-col justify-between shadow-xs min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 truncate">{WALLET_META[w].label}</span>
          <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${WALLET_META[w].iconClass}`}>
            <Icon className="w-3 h-3" />
          </span>
        </div>
        <div className="mt-1.5 min-w-0">
          {snap.isSet && snap.balance !== null ? (
            <h3 className={`text-lg sm:text-xl font-bold tabular-nums tracking-tight truncate ${negative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(snap.balance)}
            </h3>
          ) : (
            <button type="button" onClick={() => setModal({ mode: 'set' })} className="text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
              Set balance
            </button>
          )}
          <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate mt-0.5">
            {snap.isSet && snap.anchor
              ? negative ? 'Below zero. Adjust?' : `Tracking since ${formatDateForDisplay(snap.anchor.date, '', { day: 'numeric', month: 'short' })}`
              : WALLET_META[w].hint}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {/* Balances + actions */}
      <div className={card}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="min-w-0">
            <h2 className={sectionTitle}>Cash &amp; Online</h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Conversions and adjustments are never counted as income or expense.</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setModal({ mode: 'set' })}
              className="h-10 sm:h-9 px-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16161a] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Scale className="h-3.5 w-3.5" />
              Adjust
            </button>
            <button
              type="button"
              onClick={() => setModal({ mode: 'convert' })}
              className="h-10 sm:h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Convert
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {tile('cash')}
          {tile('online')}
          <div className="col-span-2 lg:col-span-1 flex lg:flex-col items-center lg:items-start justify-between gap-2 rounded-xl px-3 py-2.5 lg:p-3 border border-dashed border-slate-200 dark:border-white/[0.08]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Landmark className="h-3 w-3 lg:hidden" />Total available
            </span>
            <div className="text-right lg:text-left">
              <p className="text-base lg:text-xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {wallet?.total !== null && wallet?.total !== undefined ? formatCurrency(wallet.total) : '—'}
              </p>
              <p className="hidden lg:block text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">Cash + Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it adds up + history */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        <section className={`${card} lg:col-span-5`}>
          <h3 className={`${sectionTitle} mb-3`}>How it adds up</h3>
          <WalletBreakdown wallet={wallet} />
        </section>
        <section className={`${card} lg:col-span-7`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className={sectionTitle}>Conversions &amp; adjustments</h3>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 tabular-nums">{wallet?.entries.length || 0}</span>
          </div>
          <WalletEntries
            wallet={wallet}
            onEdit={entry => setModal({ mode: 'convert', edit: entry })}
            onChanged={applyData}
          />
        </section>
      </div>
      {modalEl}
    </div>
  )
}
