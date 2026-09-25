'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { CATEGORY_ICON_CATALOG, CategoryIconMeta, CATEGORY_GROUPS, CategoryGroup } from '@/lib/category-icons'

export interface IconPickerProps {
  isOpen: boolean
  onClose: () => void
  selectedIconId?: string
  currentIconId?: string
  onSelect?: (iconId: string) => void
  onSelectIcon?: (iconId: string) => void
  title?: string
  categoryName?: string
}

const ALL_TABS = ['All', ...CATEGORY_GROUPS] as const
type TabType = typeof ALL_TABS[number]

export default function IconPicker({
  isOpen,
  onClose,
  selectedIconId,
  currentIconId,
  onSelect,
  onSelectIcon,
  title,
  categoryName
}: IconPickerProps) {
  const activeIconId = selectedIconId || currentIconId
  const handleSelect = onSelect || onSelectIcon || (() => {})
  const modalTitle = title || (categoryName ? `Select Icon for "${categoryName}"` : 'Select Category Icon')
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<TabType>('All')

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Count items per group for tabs
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { All: CATEGORY_ICON_CATALOG.length }
    CATEGORY_ICON_CATALOG.forEach(item => {
      counts[item.group] = (counts[item.group] || 0) + 1
    })
    return counts
  }, [])

  const filteredIcons = useMemo(() => {
    const q = search.toLowerCase().trim()
    const list = CATEGORY_ICON_CATALOG.filter(item => {
      const matchesGroup = selectedGroup === 'All' || item.group === selectedGroup
      if (!matchesGroup) return false
      if (!q) return true

      const matchLabel = item.label.toLowerCase().includes(q)
      const matchId = item.id.toLowerCase().includes(q)
      const matchGroup = item.group.toLowerCase().includes(q)
      const matchKeywords = item.keywords && item.keywords.some(k => k.toLowerCase().includes(q))

      return matchLabel || matchId || matchGroup || matchKeywords
    })

    if (!q) return list

    return list.sort((a, b) => {
      const aLabel = a.label.toLowerCase()
      const bLabel = b.label.toLowerCase()
      const aExact = aLabel === q || (a.keywords && a.keywords.includes(q))
      const bExact = bLabel === q || (b.keywords && b.keywords.includes(q))
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      const aStarts = aLabel.startsWith(q) || (a.keywords && a.keywords.some(k => k.startsWith(q)))
      const bStarts = bLabel.startsWith(q) || (b.keywords && b.keywords.some(k => k.startsWith(q)))
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      return 0
    })
  }, [search, selectedGroup])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <div className="min-w-0 pr-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {modalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Choose an icon to visually distinguish transactions and categories.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Search Bar & Group Filter */}
        <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.06] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search 130+ icons (e.g. "intern", "ipo", "refund", "salary", "wifi", "gym")...'
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {ALL_TABS.map(tab => {
              const count = groupCounts[tab] || 0
              const isSelected = selectedGroup === tab

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedGroup(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[9px] tabular-nums font-semibold px-1 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/60 dark:bg-white/[0.08] text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="p-4 overflow-y-auto max-h-[52vh] [scrollbar-width:thin]">
          {filteredIcons.length === 0 ? (
            <div className="py-14 text-center text-slate-400 dark:text-neutral-500">
              <p className="text-xs font-semibold">No icons found matching &quot;{search}&quot;</p>
              <p className="text-[11px] mt-1">Try another search term like &ldquo;money&rdquo;, &ldquo;stocks&rdquo;, or &ldquo;bills&rdquo;.</p>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setSelectedGroup('All')
                  }}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {filteredIcons.map((item: CategoryIconMeta) => {
                const IconComponent = item.icon
                const isSelected = activeIconId === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleSelect(item.id)
                      onClose()
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200/80 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#16161a] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.12]'
                    }`}
                    title={`${item.label} (${item.group})`}
                  >
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${item.bgClass} ${item.colorClass} border ${item.borderClass}`}
                    >
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-neutral-300 truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
          <span className="tabular-nums">
            Showing {filteredIcons.length} of {CATEGORY_ICON_CATALOG.length} icons
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
