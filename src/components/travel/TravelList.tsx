'use client'

import React, { useMemo } from 'react'
import { CheckSquare, Square, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
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
  // Entries are globally filtered and sorted across the whole dataset by the API
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
        classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      }
    }
    if (efficiency >= 40) {
      return {
        label: 'Good',
        classes: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      }
    }
    return {
      label: 'Average',
      classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    }
  }

  return (
    <div ref={tableRef} className="space-y-4">
      {/* 1. CRM Data Table Container */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {/* CRM Action & Filter Toolbar */}
        <TravelListToolbar
          totalCount={pagination.totalCount}
          sortBy={sortBy}
          setSortBy={setSortBy}
          pagination={pagination}
          currentPage={currentPage}
          fetchTravelEntries={fetchTravelEntries}
          loading={loading}
        />

        {/* 2. Table Header & Body */}
        <div className="overflow-x-auto [scrollbar-width:none]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/60 border-b border-slate-200/80 dark:border-neutral-800 text-[11px] font-bold text-slate-400 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-3 w-12 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {travelEntries.length > 0 && selectedEntries.size === travelEntries.length ? (
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
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
            <tbody className={`divide-y divide-slate-100 dark:divide-neutral-800/80 transition-opacity duration-150 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                        <Layers className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">No travel logs found</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                        Add your first travel entry to start tracking.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. CRM Pagination Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-neutral-800/30 text-xs">
          <div className="text-slate-500 dark:text-neutral-400">
            Showing <span className="font-bold text-slate-900 dark:text-white">{processedEntries.length}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{pagination.totalCount}</span> entries (Page{' '}
            <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{pagination.totalPages}</span>)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchTravelEntries(currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 font-mono font-bold text-slate-800 dark:text-neutral-200">
              {currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => fetchTravelEntries(currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
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
