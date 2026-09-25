'use client'

import React, { useMemo } from 'react'
import { CheckSquare, Square, Layers, ChevronLeft, ChevronRight, Calendar, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { TravelListProps } from './travel-list-types'
import TravelListToolbar from './TravelListToolbar'
import TravelListRow from './TravelListRow'

export default function TravelList({
  travelEntries,
  selectedEntries,
  handleSelectEntry,
  handleSelectAll,
  handleDelete,
  calculateDerivedData,
  pagination,
  currentPage,
  fetchTravelEntries,
  sortBy,
  setSortBy,
  loading,
  tableRef
}: TravelListProps) {
  const processedEntries = useMemo(() => {
    return travelEntries.map((entry, index) => ({
      entry,
      index,
      derived: calculateDerivedData(entry, index)
    }))
  }, [travelEntries, calculateDerivedData])

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 45) {
      return {
        label: 'Excellent',
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      }
    }
    if (efficiency >= 40) {
      return {
        label: 'Good',
        classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      }
    }
    return {
      label: 'Average',
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
  }

  return (
    <div ref={tableRef} className="space-y-4 font-sans">
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
        {/* Action & Filter Toolbar */}
        <TravelListToolbar
          totalCount={pagination.totalCount}
          sortBy={sortBy}
          setSortBy={setSortBy}
          pagination={pagination}
          currentPage={currentPage}
          fetchTravelEntries={fetchTravelEntries}
          loading={loading}
        />

        {/* 1. Desktop & Tablet CRM Table View (md+) */}
        <div className="hidden md:block overflow-x-auto [scrollbar-width:none]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#16161a] border-b border-slate-200/80 dark:border-white/[0.06] text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-3 w-12 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="p-1 rounded text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {travelEntries.length > 0 && selectedEntries.size === travelEntries.length ? (
                      <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Period & Timeline</th>
                <th className="py-3.5 px-4">Odometer Log</th>
                <th className="py-3.5 px-4">Net Distance</th>
                <th className="py-3.5 px-4">Fuel & Spend</th>
                <th className="py-3.5 px-4">Efficiency</th>
                <th className="py-3.5 px-4">Cost / KM</th>
                <th className="py-3.5 pr-5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-white/[0.04] transition-opacity duration-150 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {processedEntries.length > 0 ? (
                processedEntries.map(({ entry, index, derived }) => (
                  <TravelListRow
                    key={entry.id}
                    entry={entry}
                    index={index}
                    derived={derived}
                    isSelected={selectedEntries.has(entry.id)}
                    handleSelectEntry={handleSelectEntry}
                    handleDelete={handleDelete}
                    getEfficiencyBadge={getEfficiencyBadge}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center mb-2.5">
                        <Layers className="h-5 w-5 text-slate-400 dark:text-neutral-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">No travel logs found</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                        Log your first trip or adjust search filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Mobile-Dedicated Trip Card Feed (< md) to Eliminate Horizontal Scrolling */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
          {processedEntries.length > 0 ? (
            processedEntries.map(({ entry, derived }) => {
              const effBadge = getEfficiencyBadge(derived.efficiency)
              const isSelected = selectedEntries.has(entry.id)
              return (
                <div
                  key={entry.id}
                  className={`p-3.5 transition-colors space-y-2.5 ${
                    isSelected ? 'bg-blue-50/50 dark:bg-blue-500/10' : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Top row: Checkbox, Dates & Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectEntry(entry.id)}
                        className="rounded border-slate-300 dark:border-white/[0.2] bg-white dark:bg-[#18181b] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 tabular-nums truncate">
                        <span>{new Date(entry.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <span className="text-slate-400 dark:text-neutral-500">→</span>
                        <span>{new Date(entry.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-neutral-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shrink-0">
                          {derived.days}d
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 transition-colors shrink-0"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Middle row: Odometer & Distance */}
                  <div className="flex items-center justify-between text-xs tabular-nums bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.04] rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-700 dark:text-neutral-300">
                      {entry.startKm.toLocaleString('en-IN')} → {entry.endKm.toLocaleString('en-IN')} km
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                      +{derived.kmTraveled.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km
                    </span>
                  </div>

                  {/* Bottom metrics row */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] rounded-lg p-1.5 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 block truncate">Spend</span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums block truncate mt-0.5">
                        {formatCurrency(entry.amount)}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] rounded-lg p-1.5 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 block truncate">Mileage</span>
                      <span className={`font-bold tabular-nums block truncate mt-0.5 ${effBadge.classes.includes('emerald') ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {derived.efficiency} km/L
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] rounded-lg p-1.5 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 block truncate">Burn Rate</span>
                      <span className="font-bold text-slate-800 dark:text-neutral-300 tabular-nums block truncate mt-0.5">
                        {formatCurrency(derived.costPerKm)}/km
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-neutral-400 text-xs">
              No travel logs found
            </div>
          )}
        </div>

        {/* 3. Pagination Footer */}
        <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#16161a]/40 text-xs">
          <div className="text-slate-600 dark:text-neutral-400">
            Showing <span className="font-bold text-slate-900 dark:text-white tabular-nums">{processedEntries.length}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">{pagination.totalCount}</span> entries (Page{' '}
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">{pagination.totalPages}</span>)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchTravelEntries(currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181b] font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] tabular-nums font-semibold text-slate-900 dark:text-white">
              {currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => fetchTravelEntries(currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181b] font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
