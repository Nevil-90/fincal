'use client'

// Modal for the two wallet actions:
//   mode 'convert' -> move money between Cash and Online (ATM withdrawal, friends paid you back
//                     in cash for a bill you paid online, cash deposit...). Also used to edit one.
//   mode 'set'     -> "this is what I actually have right now" for Cash and/or Online.
// Neither action is counted as income or expense.

import React, { useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ArrowRight, ArrowLeftRight, Scale, Info, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/financial-utils'
import { getTodayDateString } from '@/lib/dateUtils'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { WalletEntryDTO, WalletResponse } from '@/hooks/useApi'
import CustomDateField from '@/components/ui/CustomDateField'
import { WALLET_META, otherWallet, sanitizeAmountInput, inputClass, labelClass, type WalletId } from './wallet-ui'

export type WalletModalMode = 'convert' | 'set'

interface WalletEntryModalProps {
  isOpen: boolean
  mode: WalletModalMode
  wallet?: WalletResponse
  /** When given (convert mode only), the modal edits this entry instead of creating one. */
  editEntry?: WalletEntryDTO | null
  defaultFrom?: WalletId
  onClose: () => void
  onBack?: () => void
  onSaved: (data: WalletResponse) => void
}

const NOTE_PRESETS: Record<WalletId, string[]> = {
  online: ['ATM withdrawal', 'Friends paid back in cash', 'Split bill settled in cash'],
  cash: ['Cash deposited to bank', 'Friends paid back online', 'Gave cash, got UPI'],
}

export default function WalletEntryModal({
  isOpen,
  mode,
  wallet,
  editEntry,
  defaultFrom = 'online',
  onClose,
  onBack,
  onSaved,
}: WalletEntryModalProps) {
  useScrollLock(isOpen)

  const isEdit = mode === 'convert' && !!editEntry
  const today = getTodayDateString()

  // Convert state
  const [from, setFrom] = useState<WalletId>(defaultFrom)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')

  // Set state
  const [cashValue, setCashValue] = useState('')
  const [onlineValue, setOnlineValue] = useState('')
  const [setNoteText, setSetNoteText] = useState('')

  const [saving, setSaving] = useState(false)

  // (Re)initialise every time the modal opens so stale values never leak between uses.
  useEffect(() => {
    if (!isOpen) return
    setSaving(false)
    if (mode === 'convert') {
      if (editEntry) {
        setFrom((editEntry.fromWallet as WalletId) || 'online')
        setAmount(String(editEntry.amount))
        setDate(editEntry.date.slice(0, 10))
        setNote(editEntry.note || '')
      } else {
        setFrom(defaultFrom)
        setAmount('')
        setDate(getTodayDateString())
        setNote('')
      }
    } else {
      const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(Math.max(0, v)))
      setCashValue(fmt(wallet?.cash.balance))
      setOnlineValue(fmt(wallet?.online.balance))
      setSetNoteText('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, editEntry?.id])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const to = otherWallet(from)
  const amountNum = Number(amount)
  const amountValid = amount !== '' && Number.isFinite(amountNum) && amountNum > 0

  // Live preview of balances after this conversion (accounts for the entry being edited).
  const preview = useMemo(() => {
    if (!wallet || mode !== 'convert') return null
    const base: Record<WalletId, number | null> = { cash: wallet.cash.balance, online: wallet.online.balance }
    const counted = (ws: WalletResponse['cash']) => {
      if (!editEntry || !ws.anchor) return false
      return new Date(editEntry.createdAt).getTime() > new Date(ws.anchor.createdAt).getTime() &&
        editEntry.date.slice(0, 10) >= ws.anchor.date.slice(0, 10)
    }
    if (editEntry) {
      for (const w of ['cash', 'online'] as WalletId[]) {
        if (base[w] === null || !counted(wallet[w])) continue
        if (editEntry.toWallet === w) base[w] = (base[w] as number) - editEntry.amount
        if (editEntry.fromWallet === w) base[w] = (base[w] as number) + editEntry.amount
      }
    }
    const delta = amountValid ? amountNum : 0
    const after: Record<WalletId, number | null> = {
      cash: base.cash === null ? null : base.cash + (to === 'cash' ? delta : -delta),
      online: base.online === null ? null : base.online + (to === 'online' ? delta : -delta),
    }
    return { before: base, after }
  }, [wallet, mode, editEntry, amountValid, amountNum, to])

  const goesNegative = preview && preview.after[from] !== null && (preview.after[from] as number) < 0

  const parsedSet = (v: string) => (v.trim() === '' ? null : Number(v))
  const cashNum = parsedSet(cashValue)
  const onlineNum = parsedSet(onlineValue)
  const setValid =
    (cashNum !== null || onlineNum !== null) &&
    [cashNum, onlineNum].every(n => n === null || (Number.isFinite(n) && n >= 0))
  const isFirstSetup = !wallet?.cash.isSet && !wallet?.online.isSet

  if (!isOpen) return null

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amountValid || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/wallet', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? { id: editEntry!.id, fromWallet: from, toWallet: to, amount: amountNum, date, note }
            : { kind: 'convert', fromWallet: from, toWallet: to, amount: amountNum, date, note }
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Could not save conversion')
        setSaving(false)
        return
      }
      toast.success(isEdit ? 'Conversion updated' : `${formatCurrency(amountNum)} moved ${WALLET_META[from].short} → ${WALLET_META[to].short}`)
      onSaved(data as WalletResponse)
      onClose()
    } catch {
      toast.error('Network error. Please try again.')
      setSaving(false)
    }
  }

  const handleSet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setValid || saving) return
    setSaving(true)
    const balances: Record<string, number> = {}
    // Only send wallets the user actually changed (or is setting for the first time).
    if (cashNum !== null && (!wallet?.cash.isSet || cashNum !== wallet.cash.balance)) balances.cash = cashNum
    if (onlineNum !== null && (!wallet?.online.isSet || onlineNum !== wallet.online.balance)) balances.online = onlineNum
    if (Object.keys(balances).length === 0) {
      toast.info('Balances already match. Nothing to change.')
      setSaving(false)
      onClose()
      return
    }
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'set', balances, date: getTodayDateString(), note: setNoteText }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Could not save balances')
        setSaving(false)
        return
      }
      toast.success(isFirstSetup ? 'Balances set. Tracking starts now.' : 'Balances updated')
      onSaved(data as WalletResponse)
      onClose()
    } catch {
      toast.error('Network error. Please try again.')
      setSaving(false)
    }
  }

  const title = mode === 'set'
    ? (isFirstSetup ? 'Set your balances' : 'Adjust balances')
    : isEdit ? 'Edit conversion' : 'Convert Cash ↔ Online'
  const subtitle = mode === 'set'
    ? 'Enter what you actually have right now'
    : 'Moves money between wallets. Not income or expense.'
  const HeaderIcon = mode === 'set' ? Scale : ArrowLeftRight

  const renderAdjustHint = (w: WalletId, typed: number | null) => {
    const snap = wallet?.[w]
    if (!snap?.isSet || snap.balance === null || typed === null || !Number.isFinite(typed)) return null
    const diff = Math.round((typed - snap.balance) * 100) / 100
    return (
      <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
        App shows {formatCurrency(snap.balance)}
        {diff !== 0 && (
          <span className={diff > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
            {' '}· adjusts {diff > 0 ? '+' : '−'}{formatCurrency(Math.abs(diff))}
          </span>
        )}
      </p>
    )
  }

  return (
    <div
      onClick={onClose}
      style={{ paddingBottom: 'var(--keyboard-height, 0px)' }}
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center bg-black/80 dark:bg-black/90 backdrop-blur-sm sm:backdrop-blur-md p-0 sm:p-4 overflow-hidden touch-none animate-in fade-in duration-150"
    >
      <div
        data-modal-drawer
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl flex flex-col max-h-[calc(var(--vv-height,100dvh)-1rem)] sm:max-h-[85vh] overflow-hidden touch-auto"
      >
        {/* Mobile drag handle */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-8 h-8 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20">
              <HeaderIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">{title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={mode === 'set' ? handleSet : handleConvert} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 sm:px-5 py-4 space-y-4 no-scrollbar">
            {mode === 'convert' ? (
              <>
                {/* Direction */}
                <div>
                  <span className={labelClass}>Direction</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['online', 'cash'] as WalletId[]).map(src => {
                      const dst = otherWallet(src)
                      const active = from === src
                      const SrcIcon = WALLET_META[src].icon
                      const DstIcon = WALLET_META[dst].icon
                      return (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setFrom(src)}
                          aria-pressed={active}
                          className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                            active
                              ? 'border-violet-500/60 bg-violet-50/70 dark:bg-violet-950/25 shadow-xs ring-1 ring-violet-500/20'
                              : 'border-slate-200 dark:border-neutral-700 bg-slate-50/60 dark:bg-neutral-900/40 hover:bg-slate-100 dark:hover:bg-neutral-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <SrcIcon className={`h-4 w-4 ${WALLET_META[src].accentText}`} />
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <DstIcon className={`h-4 w-4 ${WALLET_META[dst].accentText}`} />
                          </div>
                          <p className={`mt-1 text-xs sm:text-[13px] font-bold ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-neutral-300'}`}>
                            {WALLET_META[src].short} → {WALLET_META[dst].short}
                          </p>
                          <p className="text-[10px] leading-snug text-slate-500 dark:text-zinc-500 mt-0.5">
                            {src === 'online' ? 'ATM, friends paid you cash' : 'Deposit, friends paid you online'}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Amount + Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="wallet-amount" className={labelClass}>Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-bold">₹</span>
                      <input
                        id="wallet-amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoFocus={!isEdit}
                        value={amount}
                        onChange={e => setAmount(sanitizeAmountInput(e.target.value))}
                        className={`${inputClass} pl-8`}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                  <CustomDateField
                    label="Date"
                    value={date}
                    onChange={v => setDate(v || today)}
                    max={today}
                    required
                  />
                </div>

                {/* Note */}
                <div>
                  <label htmlFor="wallet-note" className={labelClass}>
                    Note <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
                  </label>
                  <input
                    id="wallet-note"
                    type="text"
                    maxLength={200}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Dinner split, 3 friends paid cash"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {NOTE_PRESETS[from].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNote(p)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                          note === p
                            ? 'border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                            : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {preview && (preview.before.cash !== null || preview.before.online !== null) ? (
                  <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-3 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">After saving</p>
                    {(['online', 'cash'] as WalletId[]).map(w => {
                      const Icon = WALLET_META[w].icon
                      const b = preview.before[w]
                      const a = preview.after[w]
                      return (
                        <div key={w} className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-neutral-300">
                            <Icon className={`h-3.5 w-3.5 ${WALLET_META[w].accentText}`} />
                            {WALLET_META[w].short}
                          </span>
                          {b === null || a === null ? (
                            <span className="text-slate-400">Not set</span>
                          ) : (
                            <span className="tabular-nums text-slate-500 dark:text-zinc-400">
                              {formatCurrency(b)}
                              <ArrowRight className="inline h-3 w-3 mx-1 -mt-0.5" />
                              <span className={`font-bold ${a < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                {formatCurrency(a)}
                              </span>
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {goesNegative && (
                      <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 pt-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                        This takes {WALLET_META[from].short} below ₹0. Check the amount, or adjust your balances.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
                    Set your Cash and Online balances once (Overview → Cash &amp; Online) to see live totals.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[11px] leading-relaxed text-slate-600 dark:text-zinc-300">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
                  <span>
                    {isFirstSetup
                      ? 'Count the cash with you and check your bank/UPI balance now. From this moment the app keeps both up to date using your entries.'
                      : 'Use this when the app doesn’t match reality. The difference is recorded as an adjustment, not income or expense.'}
                  </span>
                </div>

                {(['cash', 'online'] as WalletId[]).map(w => {
                  const Icon = WALLET_META[w].icon
                  const value = w === 'cash' ? cashValue : onlineValue
                  const setValue = w === 'cash' ? setCashValue : setOnlineValue
                  return (
                    <div key={w}>
                      <label htmlFor={`wallet-set-${w}`} className={`${labelClass} flex items-center gap-1.5`}>
                        <Icon className={`h-3.5 w-3.5 ${WALLET_META[w].accentText}`} />
                        {WALLET_META[w].label}
                        <span className="normal-case tracking-normal font-normal text-slate-400">· {WALLET_META[w].hint}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-bold">₹</span>
                        <input
                          id={`wallet-set-${w}`}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={value}
                          onChange={e => setValue(sanitizeAmountInput(e.target.value))}
                          className={`${inputClass} pl-8`}
                          placeholder={isFirstSetup ? '0' : 'Leave as is'}
                        />
                      </div>
                      {renderAdjustHint(w, w === 'cash' ? cashNum : onlineNum)}
                    </div>
                  )
                })}

                <div>
                  <label htmlFor="wallet-set-note" className={labelClass}>
                    Note <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
                  </label>
                  <input
                    id="wallet-set-note"
                    type="text"
                    maxLength={200}
                    value={setNoteText}
                    onChange={e => setSetNoteText(e.target.value)}
                    className={inputClass}
                    placeholder={isFirstSetup ? 'e.g. Starting balance' : 'e.g. Counted wallet, ₹120 missing'}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 sm:h-9.5 px-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16161a] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (mode === 'set' ? !setValid : !amountValid)}
              className="flex-1 h-10 sm:h-9.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === 'set' ? (isFirstSetup ? 'Start tracking' : 'Save balances') : isEdit ? 'Save changes' : 'Save conversion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
