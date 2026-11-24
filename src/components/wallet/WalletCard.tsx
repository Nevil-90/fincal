'use client'

// Overview card: how much Cash and Online money you have right now.
// Owns the Convert / Set modal and the history drawer.

import React, { useCallback, useState } from 'react'
import { ArrowLeftRight, Scale, History, Wallet, RefreshCw, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { useWallet, type WalletEntryDTO, type WalletResponse } from '@/hooks/useApi'
import WalletEntryModal, { type WalletModalMode } from './WalletEntryModal'
import WalletHistoryDrawer from './WalletHistoryDrawer'
import { WALLET_META, type WalletId } from './wallet-ui'

export default function WalletCard() {
  const { wallet, isLoading, isError, mutate } = useWallet()

  const [modal, setModal] = useState<{ mode: WalletModalMode; edit?: WalletEntryDTO | null; fromHistory?: boolean } | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const applyData = useCallback((data: WalletResponse) => {
    mutate(data, { revalidate: false })
  }, [mutate])

  const closeModal = useCallback(() => {
    setModal(prev => {
      if (prev?.fromHistory) setHistoryOpen(true)
      return null
    })
  }, [])

  const openFromHistory = (mode: WalletModalMode, edit?: WalletEntryDTO) => {
    setHistoryOpen(false)
    setModal({ mode, edit, fromHistory: true })
  }

  const shell = 'bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3 sm:p-3.5 shadow-sm'

  // ---- Loading ----
  if (isLoading && !wallet) {
    return (
      <div className={shell} aria-busy="true">
        <div className="h-3 w-28 rounded bg-slate-200/80 dark:bg-white/[0.06] animate-pulse" />
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-2.5">
          {[0, 1].map(i => <div key={i} className="h-[72px] rounded-xl bg-slate-100 dark:bg-white/[0.04] animate-pulse" />)}
        </div>
      </div>
    )
  }

  // ---- Error ----
  if (isError && !wallet) {
    return (
      <div className={`${shell} flex items-center justify-between gap-3`}>
        <p className="text-xs text-slate-500 dark:text-zinc-400">Couldn’t load Cash &amp; Online balances.</p>
        <button
          type="button"
          onClick={() => mutate()}
          className="h-8 px-3 rounded-lg border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    )
  }

  const anySet = !!(wallet?.cash.isSet || wallet?.online.isSet)

  const overlays = (
    <>
      <WalletEntryModal
        isOpen={!!modal}
        mode={modal?.mode || 'convert'}
        editEntry={modal?.edit || null}
        wallet={wallet}
        onClose={closeModal}
        onSaved={applyData}
      />
      <WalletHistoryDrawer
        isOpen={historyOpen}
        wallet={wallet}
        onClose={() => setHistoryOpen(false)}
        onConvert={() => openFromHistory('convert')}
        onSet={() => openFromHistory('set')}
        onEdit={entry => openFromHistory('convert', entry)}
        onChanged={applyData}
      />
    </>
  )

  // ---- First-time: not set up ----
  if (!anySet) {
    return (
      <>
        <div className={`${shell} flex flex-col sm:flex-row sm:items-center gap-3`}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Track Cash &amp; Online money</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 leading-snug mt-0.5">
                Enter what you have in hand and in the bank once. The app keeps both up to date from your entries, and ATM withdrawals or cash paybacks never count as income or expense.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'set' })}
            className="h-10 sm:h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            Set balances <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {overlays}
      </>
    )
  }

  // ---- Normal state ----
  const tile = (w: WalletId) => {
    const snap = wallet![w]
    const Icon = WALLET_META[w].icon
    const negative = snap.balance !== null && snap.balance < 0
    return (
      <button
        type="button"
        onClick={() => (snap.isSet ? setHistoryOpen(true) : setModal({ mode: 'set' }))}
        className="text-left bg-slate-50/80 dark:bg-[#16161a]/80 hover:bg-slate-100/90 dark:hover:bg-[#18181f] border border-slate-200/70 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-3 flex flex-col justify-between transition-all shadow-xs cursor-pointer min-w-0"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 truncate">
            {WALLET_META[w].label}
          </span>
          <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${WALLET_META[w].iconClass}`}>
            <Icon className="w-3 h-3" />
          </span>
        </div>
        <div className="mt-1.5 min-w-0">
          {snap.isSet && snap.balance !== null ? (
            <h3 className={`text-base sm:text-lg font-bold tabular-nums tracking-tight truncate ${negative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(snap.balance)}
            </h3>
          ) : (
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400">Set balance</h3>
          )}
          <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate mt-0.5">
            {snap.isSet && snap.anchor
              ? negative ? 'Below zero. Adjust?' : `Tracking since ${formatDateForDisplay(snap.anchor.date, '', { day: 'numeric', month: 'short' })}`
              : WALLET_META[w].hint}
          </p>
        </div>
      </button>
    )
  }

  return (
    <>
      <div className={shell}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">Cash &amp; Online</h2>
            <span className="hidden sm:inline text-[10px] font-medium text-slate-400 dark:text-zinc-500 truncate">
              Conversions aren’t counted as income or expense
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="h-8 px-2 sm:px-2.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="History"
          >
            <History className="h-3.5 w-3.5" />
            <span>History</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-2.5">
          {tile('cash')}
          {tile('online')}

          {/* Total: own tile on desktop, slim row on mobile */}
          <div className="col-span-2 lg:col-span-1 flex lg:flex-col items-center lg:items-start justify-between lg:justify-between gap-2 rounded-xl px-3 py-2 lg:p-3 border border-dashed border-slate-200 dark:border-white/[0.08]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total available</span>
            <div className="text-right lg:text-left">
              <p className="text-sm lg:text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {wallet?.total !== null && wallet?.total !== undefined ? formatCurrency(wallet.total) : '—'}
              </p>
              <p className="hidden lg:block text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">Cash + Online</p>
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-2 lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-2 lg:w-40">
            <button
              type="button"
              onClick={() => setModal({ mode: 'convert' })}
              className="h-10 lg:h-full rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Convert
            </button>
            <button
              type="button"
              onClick={() => setModal({ mode: 'set' })}
              className="h-10 lg:h-full rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16161a] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Scale className="h-3.5 w-3.5" />
              Adjust
            </button>
          </div>
        </div>
      </div>
      {overlays}
    </>
  )
}
