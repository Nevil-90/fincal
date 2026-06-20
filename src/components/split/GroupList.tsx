'use client'

import { useMemo, useState } from 'react'
import { Archive, ChevronDown, Plus } from 'lucide-react'

interface Props {
  groups: any[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onNewGroup: () => void
}

export default function GroupList({
  groups,
  isLoading,
  selectedId,
  onSelect,
  onNewGroup,
}: Props) {
  const [showArchived, setShowArchived] = useState(false)
  const active = useMemo(
    () => groups.filter((group: any) => group.status === 'active'),
    [groups]
  )
  const archived = useMemo(
    () => groups.filter((group: any) => group.status === 'closed'),
    [groups]
  )

  if (isLoading) {
    return (
      <div className="flex h-11 shrink-0 gap-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="w-32 rounded-xl bg-slate-200/70 dark:bg-neutral-800" />
        ))}
      </div>
    )
  }

  if (!groups.length) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-6 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-neutral-800">
          <Plus className="h-5 w-5 text-slate-500 dark:text-neutral-400" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Start your first group</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-neutral-400">
          Add people once, then record shared costs in seconds.
        </p>
        <button onClick={onNewGroup} className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950">
          Create group
        </button>
      </section>
    )
  }

  return (
    <div className="relative shrink-0 flex flex-col gap-1.5">
      <div
        className="flex h-12 items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar"
        role="navigation"
        aria-label="Split groups"
      >
        {active.map((group: any) => (
          <GroupPill
            key={group.id}
            group={group}
            selected={selectedId === group.id}
            onClick={() => onSelect(group.id)}
          />
        ))}
        {archived.length > 0 && (
          <button
            onClick={() => setShowArchived((value) => !value)}
            aria-expanded={showArchived}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archived</span>
            <span aria-label={`${archived.length} archived groups`}>{archived.length}</span>
            <ChevronDown className={`h-3 w-3 ${showArchived ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {showArchived && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 custom-scrollbar animate-slide-up">
          {archived.map((group: any) => (
            <GroupPill
              key={group.id}
              group={group}
              selected={selectedId === group.id}
              onClick={() => onSelect(group.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function GroupPill({
  group,
  selected,
  onClick,
}: {
  group: any
  selected: boolean
  onClick: () => void
}) {
  const balance = Number(group.netBalance ?? 0)
  const balanceLabel = balance > 0.01
    ? `You are owed ${Math.abs(balance).toLocaleString('en-IN')} rupees`
    : balance < -0.01
      ? `You owe ${Math.abs(balance).toLocaleString('en-IN')} rupees`
      : 'All settled'

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-controls="split-group-panel"
      aria-label={`${group.name}. ${balanceLabel}`}
      className={`flex h-10 max-w-[230px] shrink-0 items-center gap-2 rounded-xl border px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-neutral-950 ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
      }`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
        selected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-neutral-800'
      }`}>
        {group.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="truncate text-sm font-bold">{group.name}</span>
      {Math.abs(balance) > 0.01 && (
        <span aria-hidden="true" className={`text-xs font-black tabular-nums ${balance > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
          {balance > 0 ? '+' : '-'}₹{Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      )}
    </button>
  )
}
