'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { initials, memberName } from './split-utils'

interface Props {
  groupId: string
  members: any[]
  onClose: () => void
  onSaved: () => void
}

export default function AddExpenseSheet({ groupId, members, onClose, onSaved }: Props) {
  const owner = members.find((member) => member.isOwner)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(owner?.id ?? members[0]?.id ?? '')
  const [splitWith, setSplitWith] = useState<string[]>(members.map((member) => member.id))

  const toggleMember = (id: string) => {
    setSplitWith((current) => {
      if (current.includes(id)) return current.length > 1 ? current.filter((item) => item !== id) : current
      return [...current, id]
    })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = Number(amount)
    if (!description.trim()) return toast.error('Add a description')
    if (!value || value <= 0) return toast.error('Enter a valid amount')
    if (!paidBy || !splitWith.length) return toast.error('Choose who paid and who is included')

    const toastId = toast.loading('Adding expense...')
    onClose()
    try {
      const response = await fetch(`/api/split/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          totalAmount: value,
          date: new Date().toISOString(),
          paidByMemberId: paidBy,
          splitType: 'equal',
          splitBetween: splitWith,
        }),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success('Expense added', { id: toastId })
      onSaved()
    } catch (error: any) {
      toast.error(error.message || 'Could not add expense', { id: toastId })
    }
  }

  const numericAmount = Number(amount)
  const perPerson = numericAmount > 0 && splitWith.length
    ? numericAmount / splitWith.length
    : 0

  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center sm:items-center sm:p-4">
      <button
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm"
        aria-label="Close"
      />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:max-h-[82vh] sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div>
            <h2 id="add-expense-title" className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Add expense</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Record a shared cost in this group.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close add expense" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 custom-scrollbar">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Amount</label>
            <div className="mt-2 flex items-center rounded-2xl bg-slate-100 px-4 py-3 dark:bg-neutral-800">
              <span className="text-xl font-bold text-slate-400">₹</span>
              <input
                autoFocus
                inputMode="decimal"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent px-2 text-2xl font-black tracking-tight text-slate-950 outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-neutral-600"
              />
              {perPerson > 0 && (
                <span className="text-xs font-medium text-slate-400">
                  ₹{perPerson.toFixed(2)} each
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="split-description" className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Description</label>
            <input
              id="split-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Dinner, hotel, fuel..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <MemberPicker
            label="Paid by"
            members={members}
            selected={[paidBy]}
            onSelect={(id) => setPaidBy(id)}
            single
          />
          <MemberPicker
            label="Split equally between"
            members={members}
            selected={splitWith}
            onSelect={toggleMember}
          />
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-neutral-800 sm:px-5">
          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
          >
            Add expense
          </button>
        </div>
      </form>
    </div>
  )
}

function MemberPicker({
  label,
  members,
  selected,
  onSelect,
  single = false,
}: {
  label: string
  members: any[]
  selected: string[]
  onSelect: (id: string) => void
  single?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">{label}</p>
        {!single && <span className="text-[11px] text-slate-400">{selected.length} selected</span>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {members.map((member) => {
          const active = selected.includes(member.id)
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member.id)}
              aria-pressed={active}
              aria-label={`${memberName(member)}${active ? ', selected' : ''}`}
              className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${
                active
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-300'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-neutral-700 dark:text-neutral-300'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-neutral-800'}`}>
                {active ? <Check className="h-3.5 w-3.5" /> : initials(memberName(member))}
              </span>
              <span className="truncate text-xs font-semibold">{memberName(member)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
