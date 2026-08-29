'use client'

import React from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

interface TravelListToolbarProps {
  totalCount: number
  sortBy: string
  setSortBy: (sortBy: string) => void
  pagination: {
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  currentPage: number
  fetchTravelEntries: (page: number) => void
  loading: boolean
}

export default function TravelListToolbar({
  totalCount,
  sortBy,
  setSortBy,
  pagination,
  currentPage,
  fetchTravelEntries,
  loading
}: TravelListToolbarProps) {
  return (
    <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-neutral-800/30">
      {/* Left Title & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Travel Log Registry
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/70 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
          {totalCount} Records
        </span>
      </div>

      {/* Right Toolbar: Sort Filter & Top Pagination */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5">
        {/* Sort Select */}
        <div className="relative flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 dark:text-neutral-300 shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="appearance-none [-webkit-appearance:none] bg-transparent font-medium outline-none cursor-pointer text-xs pr-5 pl-0.5 border-0 focus:ring-0 text-slate-800 dark:text-neutral-200"
          >
            <option value="date-desc" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Date (Newest)</option>
            <option value="date-asc" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Date (Oldest)</option>
            <option value="dist-desc" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Distance (High)</option>
            <option value="spend-desc" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Spend (High)</option>
            <option value="eff-desc" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Mileage (Best)</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Top Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-1 text-xs shrink-0">
            <button
              type="button"
              onClick={() => fetchTravelEntries(currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-neutral-300 transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-bold font-mono text-[11px] text-slate-700 dark:text-neutral-200">
              {currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => fetchTravelEntries(currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-neutral-300 transition-colors"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
