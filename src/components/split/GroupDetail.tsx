'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  Check,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { invalidateSplitGroup, useSplitGroup } from '@/hooks/useSplit'
import { getSimplifiedDebts, initials, memberName } from './split-utils'
import AddExpenseSheet from './AddExpenseSheet'
import SettleSheet from './SettleSheet'

type Panel = 'expense' | 'settle' | 'members' | null

export default function GroupDetail({ groupId }: { groupId: string }) {
  const { group, isLoading } = useSplitGroup(groupId)
  const [panel, setPanel] = useState<Panel>(null)
  const [settlePreset, setSettlePreset] = useState<{ from: string; to: string; amount: number } | null>(null)
  const [search, setSearch] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [newMember, setNewMember] = useState('')

  const members = useMemo(
    () => (group?.members ?? []).filter((member: any) => member.isActive),
    [group]
  )
  const expenses = useMemo(
    () => (group?.expenses ?? []).filter((expense: any) => !expense.deletedAt && !expense.isSettlement),
    [group]
  )
  const settlements = useMemo(
    () => (group?.settlements ?? []).filter((settlement: any) => !settlement.deletedAt),
    [group]
  )
  const debts = useMemo(
    () => getSimplifiedDebts(members, group?.expenses ?? [], group?.settlements ?? []),
    [members, group]
  )
  const activity = useMemo(() => {
    const rows = [
      ...expenses.map((expense: any) => ({ ...expense, kind: 'expense' as const })),
      ...settlements.map((settlement: any) => ({ ...settlement, kind: 'settlement' as const })),
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (!search.trim()) return rows
    return rows.filter((item: any) => {
      const text = item.kind === 'expense'
        ? `${item.description} ${memberName(item.paidBy)}`
        : `${memberName(item.fromMember)} ${memberName(item.toMember)}`
      return text.toLowerCase().includes(search.toLowerCase())
    })
  }, [expenses, settlements, search])
  const totals = useMemo(() => {
    const owner = members.find((member: any) => member.isOwner)
    const spent = expenses.reduce((sum: number, expense: any) => sum + Number(expense.totalAmount), 0)
    const share = owner
      ? expenses.reduce((sum: number, expense: any) => {
          const split = expense.splits?.find((item: any) => item.memberId === owner.id)
          return sum + Number(split?.amount ?? 0)
        }, 0)
      : 0
    const comingBack = debts.filter((debt) => debt.to.isOwner).reduce((sum, debt) => sum + debt.amount, 0)
    const toPay = debts.filter((debt) => debt.from.isOwner).reduce((sum, debt) => sum + debt.amount, 0)
    return { spent, share, comingBack, toPay, net: comingBack - toPay }
  }, [members, expenses, debts])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-[22px] border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }
  if (!group) return null

  const isClosed = group.status === 'closed'
  const refresh = () => {
    invalidateSplitGroup(groupId)
  }
  const openSettle = (debt?: (typeof debts)[number]) => {
    setSettlePreset(debt ? { from: debt.from.id, to: debt.to.id, amount: debt.amount } : null)
    setPanel('settle')
  }
  const deleteItem = async (item: any) => {
    const message = item.kind === 'expense'
      ? 'Delete this expense? Settlements that no longer match the remaining balance will also be deleted.'
      : 'Delete this settlement?'
    if (!confirm(message)) return
    try {
      const url = item.kind === 'expense'
        ? `/api/split/groups/${groupId}/expenses/${item.id}`
        : `/api/split/groups/${groupId}/settlements?id=${item.id}`
      const response = await fetch(url, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      const removed = Number(result.removedSettlements ?? 0)
      toast.success(
        removed > 0
          ? `Expense and ${removed} ${removed === 1 ? 'settlement' : 'settlements'} deleted`
          : 'Entry deleted'
      )
      refresh()
    } catch (error: any) {
      toast.error(error.message || 'Could not delete entry')
    }
  }
  const archiveGroup = async () => {
    if (!confirm('Archive this group? It will become read-only.')) return
    try {
      const response = await fetch(`/api/split/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success('Group archived')
      setShowMenu(false)
      refresh()
    } catch (error: any) {
      toast.error(error.message || 'Could not archive group')
    }
  }
  const exportCSV = () => {
    const lines = ['Date,Description,Paid By,Amount']
    expenses.forEach((expense: any) => {
      lines.push(`"${format(new Date(expense.date), 'dd MMM yyyy')}","${expense.description.replaceAll('"', '""')}","${memberName(expense.paidBy)}",${Number(expense.totalAmount).toFixed(2)}`)
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    link.download = `${group.name.replace(/\s+/g, '_')}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    setShowMenu(false)
  }
  const addMember = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newMember.trim()) return
    const name = newMember.trim()
    const toastId = toast.loading(`Adding ${name}...`)
    setNewMember('')
    try {
      const response = await fetch(`/api/split/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success(`${name} added`, { id: toastId })
      refresh()
    } catch (error: any) {
      setNewMember((current) => current || name)
      toast.error(error.message || 'Could not add member', { id: toastId })
    }
  }
  const removeMember = async (member: any) => {
    if (!confirm(`Remove ${memberName(member)} from this group?`)) return
    try {
      const response = await fetch(`/api/split/groups/${groupId}/members/${member.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success(`${memberName(member)} removed`)
      refresh()
    } catch (error: any) {
      toast.error(error.message || 'Could not remove member')
    }
  }

  return (
    <>
      <section aria-labelledby="split-group-title" className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
        <div className="flex h-[64px] shrink-0 items-center gap-2.5 border-b border-slate-100 px-3.5 dark:border-neutral-800 sm:gap-3 sm:px-5">
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
            {group.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 id="split-group-title" className="truncate text-base font-black text-slate-950 dark:text-white">{group.name}</h2>
              {isClosed && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">Archived</span>}
            </div>
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-neutral-400">
              {members.length} members{group.description ? ` · ${group.description}` : ''}
            </p>
          </div>

          <div className="mr-1 hidden text-right sm:block">
            <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
              {totals.net > 0.01 ? 'You get' : totals.net < -0.01 ? 'You owe' : 'Your balance'}
            </p>
            <p className={`text-sm font-black tabular-nums ${
              totals.net > 0.01 ? 'text-emerald-600 dark:text-emerald-400' : totals.net < -0.01 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
            }`}>
              {totals.net > 0 ? '+' : totals.net < 0 ? '-' : ''}₹{Math.abs(totals.net).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          {!isClosed && debts.length > 0 && (
            <button onClick={() => openSettle()} className="hidden h-10 items-center rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800 sm:flex">
              Settle
            </button>
          )}
          {!isClosed && (
            <button onClick={() => setPanel('expense')} className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add expense</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
          <button onClick={() => setPanel('members')} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800" aria-label={`Manage members in ${group.name}`}>
            <Users className="h-4 w-4" />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu((value) => !value)} aria-expanded={showMenu} aria-haspopup="menu" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800" aria-label={`More options for ${group.name}`}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <button className="fixed inset-0 z-20 cursor-default" onClick={() => setShowMenu(false)} aria-label="Close menu" />
                  <motion.div role="menu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                    <button role="menuitem" onClick={exportCSV} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-200 dark:hover:bg-neutral-800">
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </button>
                    {!isClosed && (
                      <button role="menuitem" onClick={archiveGroup} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-950/20">
                        <Archive className="h-3.5 w-3.5" /> Archive group
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <dl className="grid h-[60px] shrink-0 grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 dark:divide-neutral-800 dark:border-neutral-800" aria-label={`${group.name} balance summary`}>
          {[
            ['Spent', totals.spent, 'text-slate-900 dark:text-white'],
            ['Your share', totals.share, 'text-blue-600 dark:text-blue-400'],
            ['You get', totals.comingBack, 'text-emerald-600 dark:text-emerald-400'],
            ['You owe', totals.toPay, 'text-rose-600 dark:text-rose-400'],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="flex min-w-0 flex-col justify-center px-2.5 sm:px-5">
              <dt className="truncate text-[11px] font-semibold text-slate-500 dark:text-neutral-400">{label}</dt>
              <dd className={`truncate text-sm font-black tabular-nums ${color}`}>
                ₹{Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </dd>
            </div>
          ))}
        </dl>

        {debts.length > 0 && (
          <div className="flex h-[60px] shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-100 px-3 dark:border-neutral-800 sm:px-5 custom-scrollbar" aria-label="Suggested settlements">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Settle</span>
            {debts.map((debt, index) => (
              <button
                key={`${debt.from.id}-${debt.to.id}-${index}`}
                onClick={() => !isClosed && openSettle(debt)}
                disabled={isClosed}
                aria-label={`${memberName(debt.from)} pays ${memberName(debt.to)} ${debt.amount.toLocaleString('en-IN')} rupees`}
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-default dark:border-neutral-700 dark:bg-neutral-800/60"
              >
                <span className="font-semibold text-slate-700 dark:text-neutral-200">{memberName(debt.from)}</span>
                <span className="text-slate-300">→</span>
                <span className="font-semibold text-slate-700 dark:text-neutral-200">{memberName(debt.to)}</span>
                <span className="font-black tabular-nums text-blue-600 dark:text-blue-400">₹{debt.amount.toLocaleString('en-IN')}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-100 px-3.5 dark:border-neutral-800 sm:px-5">
          <h3 id="split-activity-title" className="text-sm font-bold text-slate-900 dark:text-white">Recent activity</h3>
          <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">{activity.length}</span>
          <div className="ml-auto hidden w-52 items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 sm:flex dark:bg-neutral-800">
            <Search className="h-3 w-3 text-slate-400" />
            <label htmlFor="split-activity-search" className="sr-only">Search group activity</label>
            <input id="split-activity-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity" className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-neutral-400" />
            {search && <button onClick={() => setSearch('')} aria-label="Clear activity search" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="h-3.5 w-3.5 text-slate-500" /></button>}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 sm:px-5 custom-scrollbar" aria-labelledby="split-activity-title">
          {activity.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400">{search ? 'No matching activity' : 'No activity yet'}</p>
              {!isClosed && !search && <button onClick={() => setPanel('expense')} className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">Add the first expense</button>}
            </div>
          ) : activity.map((item: any) => {
            const isExpense = item.kind === 'expense'
            const splitCount = item.splits?.length ?? 0
            return (
              <article key={`${item.kind}-${item.id}`} className="group flex min-h-[64px] items-center gap-3 border-b border-slate-100 py-2.5 last:border-0 dark:border-neutral-800/70">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isExpense ? 'bg-slate-100 dark:bg-neutral-800' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
                  {isExpense ? <span className="text-xs font-black text-slate-500">₹</span> : <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {isExpense ? item.description : `${memberName(item.fromMember)} paid ${memberName(item.toMember)}`}
                  </p>
                  <p className="truncate text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                    {format(new Date(item.date), 'dd MMM')}
                    {isExpense && ` · ${memberName(item.paidBy)} paid · split ${splitCount} ways`}
                    {!isExpense && ' · settlement'}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-black tabular-nums ${isExpense ? 'text-slate-900 dark:text-white' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  ₹{Number(isExpense ? item.totalAmount : item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                {!isClosed && (
                  <button onClick={() => deleteItem(item)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 hover:bg-rose-50 hover:text-rose-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 sm:opacity-0 sm:group-hover:opacity-100 dark:text-neutral-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400" aria-label={`Delete ${isExpense ? item.description : 'settlement'}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </article>
            )
          })}
        </div>

        {!isClosed && debts.length > 0 && (
          <div className="flex h-[52px] shrink-0 items-center gap-2 border-t border-slate-100 px-3.5 dark:border-neutral-800 sm:hidden">
            <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-neutral-400">
              {debts.length} {debts.length === 1 ? 'payment' : 'payments'} left
            </p>
            <button onClick={() => openSettle()} className="h-10 rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-700 dark:text-neutral-100">
              Settle
            </button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {panel === 'expense' && <AddExpenseSheet groupId={groupId} members={members} onClose={() => setPanel(null)} onSaved={refresh} />}
        {panel === 'settle' && (
          <SettleSheet
            groupId={groupId}
            initialFromMemberId={settlePreset?.from}
            initialToMemberId={settlePreset?.to}
            initialSuggestedAmount={settlePreset?.amount}
            members={members}
            expenses={group.expenses ?? []}
            settlements={group.settlements ?? []}
            onClose={() => { setPanel(null); setSettlePreset(null) }}
            onSaved={refresh}
          />
        )}
        {panel === 'members' && (
          <Modal title="Members" subtitle={`${members.length} people in ${group.name}`} onClose={() => setPanel(null)}>
            <div className="space-y-1">
              {members.map((member: any) => (
                <div key={member.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-800/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">{initials(memberName(member))}</div>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-neutral-200">{memberName(member)}</span>
                  {member.isOwner ? <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Owner</span> : !isClosed && <button onClick={() => removeMember(member)} aria-label={`Remove ${memberName(member)} from ${group.name}`} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-950/20">Remove</button>}
                </div>
              ))}
            </div>
            {!isClosed && (
              <form onSubmit={addMember} className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-neutral-800">
                <label htmlFor="new-split-member" className="sr-only">New member name</label>
                <input id="new-split-member" value={newMember} onChange={(event) => setNewMember(event.target.value)} placeholder="Member name" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                <button disabled={!newMember.trim()} aria-label="Add member" className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-40 dark:focus-visible:ring-offset-neutral-900">
                  <UserPlus className="h-4 w-4" />
                </button>
              </form>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </>
  )
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = `split-modal-${title.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center sm:p-4">
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" aria-label="Close" />
      <motion.div role="dialog" aria-modal="true" aria-labelledby={titleId} initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} className="relative z-10 w-full rounded-t-[24px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:max-h-[76vh] sm:max-w-sm sm:overflow-y-auto sm:rounded-2xl custom-scrollbar">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 id={titleId} className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label={`Close ${title}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
