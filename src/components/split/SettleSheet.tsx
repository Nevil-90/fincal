'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, X } from 'lucide-react'
import { toast } from 'sonner'
import { getSimplifiedDebts, initials, memberName } from './split-utils'

interface Props {
  groupId: string
  initialFromMemberId?: string
  initialToMemberId?: string
  initialSuggestedAmount?: number
  members: any[]
  expenses: any[]
  settlements: any[]
  onClose: () => void
  onSaved: () => void
}

interface Selection {
  from: string
  to: string
  amount: number
}

export default function SettleSheet({
  groupId,
  initialFromMemberId,
  initialToMemberId,
  initialSuggestedAmount,
  members,
  expenses,
  settlements,
  onClose,
  onSaved,
}: Props) {
  const initialSelection = initialFromMemberId && initialToMemberId
    ? { from: initialFromMemberId, to: initialToMemberId, amount: initialSuggestedAmount ?? 0 }
    : null
  const [selection, setSelection] = useState<Selection | null>(initialSelection)
  const [amount, setAmount] = useState(initialSelection?.amount.toFixed(2) ?? '')

  const suggestions = useMemo(
    () => getSimplifiedDebts(members, expenses, settlements),
    [members, expenses, settlements]
  )
  const from = members.find((member) => member.id === selection?.from)
  const to = members.find((member) => member.id === selection?.to)

  useEffect(() => {
    setAmount(selection ? selection.amount.toFixed(2) : '')
  }, [selection])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = Number(amount)
    if (!selection || !from || !to) return
    if (!value || value <= 0) return toast.error('Enter a valid amount')

    const toastId = toast.loading('Recording payment...')
    onClose()
    try {
      const response = await fetch(`/api/split/groups/${groupId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromMemberId: selection.from,
          toMemberId: selection.to,
          amount: value,
          date: new Date().toISOString(),
        }),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success('Payment recorded', { id: toastId })
      onSaved()
    } catch (error: any) {
      toast.error(error.message || 'Could not record payment', { id: toastId })
    }
  }

  return (
    <div className="fixed inset-0 z-[270] flex items-end justify-center sm:items-center sm:p-4">
      <button
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm"
        aria-label="Close"
      />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settle-sheet-title"
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:max-h-[78vh] sm:max-w-sm sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          {selection && !initialSelection && (
            <button type="button" onClick={() => setSelection(null)} className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="settle-sheet-title" className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
              {selection ? 'Record payment' : 'Settle balances'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
              {selection ? 'Confirm the payment made between members.' : 'Choose a suggested payment to clear the group.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settlement" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {selection && from && to ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 rounded-xl bg-slate-50 px-4 py-3.5 dark:bg-neutral-800/60">
                <Person member={from} />
                <div className="flex flex-col items-center gap-1">
                  <ArrowRight className="h-5 w-5 text-slate-300 dark:text-neutral-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">pays</span>
                </div>
                <Person member={to} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Payment amount</label>
                <div className="mt-2 flex items-center rounded-2xl bg-slate-100 px-4 py-3 dark:bg-neutral-800">
                  <span className="text-xl font-bold text-slate-400">₹</span>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-2 text-2xl font-black tracking-tight text-slate-950 outline-none dark:text-white"
                  />
                </div>
              </div>

              <p className="rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                {from.isOwner || to.isOwner
                  ? 'This payment will also be recorded in your transaction history.'
                  : 'This payment only updates the split group and will not affect your transaction history.'}
              </p>
            </div>
          ) : suggestions.length ? (
            <div className="space-y-2">
              {suggestions.map((debt, index) => (
                <button
                  key={`${debt.from.id}-${debt.to.id}-${index}`}
                  type="button"
                  onClick={() => setSelection({ from: debt.from.id, to: debt.to.id, amount: debt.amount })}
                  aria-label={`${memberName(debt.from)} pays ${memberName(debt.to)} ${debt.amount.toLocaleString('en-IN')} rupees`}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-left hover:border-blue-400 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
                >
                  <div className="flex -space-x-1.5">
                    {[debt.from, debt.to].map((member) => (
                      <div key={member.id} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-black text-slate-600 dark:border-neutral-900 dark:bg-neutral-800 dark:text-neutral-300">
                        {initials(memberName(member))}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-500 dark:text-neutral-400">
                      <span className="font-bold text-slate-900 dark:text-white">{memberName(debt.from)}</span>
                      {' pays '}
                      <span className="font-bold text-slate-900 dark:text-white">{memberName(debt.to)}</span>
                    </p>
                    <p className="mt-1 text-sm font-black tabular-nums text-blue-600 dark:text-blue-400">
                      ₹{debt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Everyone is settled</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">There are no outstanding payments.</p>
            </div>
          )}
        </div>

        {selection && (
          <div className="border-t border-slate-100 p-4 dark:border-neutral-800 sm:px-5">
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
            >
              Mark as paid
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

function Person({ member }: { member: any }) {
  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-black text-slate-700 shadow-sm dark:bg-neutral-700 dark:text-white">
        {initials(memberName(member))}
      </div>
      <p className="mt-2 max-w-[100px] truncate text-xs font-bold text-slate-900 dark:text-white">{memberName(member)}</p>
    </div>
  )
}
