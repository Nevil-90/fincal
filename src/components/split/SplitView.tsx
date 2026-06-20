'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSplitGroups } from '@/hooks/useSplit'
import GroupList from './GroupList'
import GroupDetail from './GroupDetail'
import NewGroupModal from './NewGroupModal'

export default function SplitView() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const { groups, isLoading, mutate } = useSplitGroups()

  const activeGroups = useMemo(
    () => groups.filter((group: any) => group.status === 'active'),
    [groups]
  )
  const selectedGroup = groups.find((group: any) => group.id === selectedId)

  useEffect(() => {
    if (!groups.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !groups.some((group: any) => group.id === selectedId)) {
      setSelectedId((activeGroups[0] ?? groups[0]).id)
    }
  }, [groups, activeGroups, selectedId])

  return (
    <div className="flex h-[calc(100dvh-146px)] min-h-[520px] flex-col gap-3 overflow-hidden md:h-[calc(100dvh-112px)]">
      <div className="flex shrink-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">Split</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-neutral-400">
            {activeGroups.length} active {activeGroups.length === 1 ? 'group' : 'groups'}
          </p>
        </div>

        <button
          onClick={() => setShowNewGroup(true)}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-neutral-200 dark:focus-visible:ring-offset-neutral-950 sm:h-10"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New group</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <GroupList
        groups={groups}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewGroup={() => setShowNewGroup(true)}
      />

      <div
        id="split-group-panel"
        className="min-h-0 flex-1"
        role="region"
        aria-label={selectedGroup ? `${selectedGroup.name} details` : 'Group details'}
      >
        {selectedId && (
          <div key={selectedId} className="h-full">
            <GroupDetail groupId={selectedId} />
          </div>
        )}
      </div>

      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreated={() => mutate()}
        />
      )}
    </div>
  )
}
