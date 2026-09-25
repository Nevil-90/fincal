// Loading skeleton components used while data is being fetched.
// Shimmer is the base pulse animation; tab-specific variants mirror actual UI layouts.
'use client'

import React from 'react'

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/[0.05] ${className}`} />
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] shadow-xs ${className}`} />
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-4 w-4 rounded-md" />
      </div>
      <Shimmer className="h-6 w-28" />
      <Shimmer className="h-2 w-16 opacity-50" />
    </div>
  )
}

export function SkeletonTransactionRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 border-b border-slate-100 dark:border-white/[0.03]">
      <Shimmer className="h-8 w-8 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Shimmer className="h-3.5 w-32" />
        <Shimmer className="h-2 w-20 opacity-50" />
      </div>
      <Shimmer className="h-4 w-16 shrink-0" />
    </div>
  )
}

// ─── 1. Overview Tab Skeleton ──────────────────────────────────────────
export function SkeletonOverview() {
  return (
    <div className="space-y-3 font-sans pb-16 md:pb-0">
      {/* Overview Hero */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-3">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <Shimmer className="h-4 w-36" />
            <Shimmer className="h-5 w-24 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5">
            <Shimmer className="h-7 w-20 rounded-xl" />
            <Shimmer className="h-7 w-16 rounded-xl" />
          </div>
        </div>

        {/* 4 Hero KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-50/80 dark:bg-[#16161a]/80 border border-slate-200/70 dark:border-white/[0.07] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Shimmer className="h-2.5 w-16" />
                <Shimmer className="h-3.5 w-10 rounded" />
              </div>
              <Shimmer className="h-5 w-24" />
              <Shimmer className="h-2 w-16 opacity-50" />
            </div>
          ))}
        </div>
      </div>

      {/* Cockpit Grid: 7 cols (Budgets) + 5 cols (Donut & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left: Category Budgets */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2">
            <Shimmer className="h-3.5 w-28" />
            <Shimmer className="h-6 w-16 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-slate-100 dark:border-white/[0.04] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shimmer className="h-6 w-6 rounded-lg shrink-0" />
                    <Shimmer className="h-3 w-20" />
                  </div>
                  <Shimmer className="h-3 w-16" />
                </div>
                <Shimmer className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stacked Donut & Activity */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Donut Card */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2">
              <Shimmer className="h-3.5 w-32" />
              <Shimmer className="h-3 w-12" />
            </div>
            <div className="flex items-center justify-center py-4">
              <Shimmer className="h-28 w-28 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Shimmer className="h-2 w-2 rounded-full shrink-0" />
                  <Shimmer className="h-2.5 w-14" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2">
              <Shimmer className="h-3.5 w-24" />
              <Shimmer className="h-3 w-14" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5">
                <Shimmer className="h-7 w-7 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1">
                  <Shimmer className="h-3 w-28" />
                  <Shimmer className="h-2 w-16 opacity-50" />
                </div>
                <Shimmer className="h-3.5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 2. Transactions Tab Skeleton ──────────────────────────────────────
export function SkeletonTransactions() {
  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* Master Ledger Container */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Shimmer className="h-8 w-full sm:w-64 rounded-xl" />
              <Shimmer className="h-8 w-44 rounded-xl shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Shimmer className="h-8 w-28 rounded-xl" />
              <Shimmer className="h-8 w-28 rounded-xl" />
              <Shimmer className="h-8 w-8 rounded-xl" />
              <Shimmer className="h-8 w-16 rounded-xl" />
              <Shimmer className="h-8 w-16 rounded-xl" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <Shimmer className="h-2.5 w-10" />
              <Shimmer className="h-5 w-12 rounded-lg" />
              <Shimmer className="h-5 w-24 rounded-lg" />
              <Shimmer className="h-5 w-16 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Status Ribbon */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200/70 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-3 w-16" />
          </div>
          <Shimmer className="h-3 w-24" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-white/[0.03]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Shimmer className="h-3.5 w-3.5 rounded shrink-0" />
                <Shimmer className="h-3 w-16 shrink-0" />
                <Shimmer className="h-7 w-7 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <Shimmer className="h-3.5 w-36" />
                  <Shimmer className="h-2 w-20 opacity-50" />
                </div>
                <Shimmer className="h-3 w-20 hidden md:block shrink-0" />
                <Shimmer className="h-3 w-16 hidden lg:block shrink-0" />
              </div>
              <Shimmer className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-200/70 dark:border-white/[0.06]">
          <Shimmer className="h-3 w-28" />
          <div className="flex items-center gap-1.5">
            <Shimmer className="h-7 w-16 rounded-xl" />
            <Shimmer className="h-7 w-16 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 3. Analytics Tab Skeleton ─────────────────────────────────────────
export function SkeletonAnalytics() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-4 font-sans pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Shimmer className="h-6 w-60" />
          <Shimmer className="h-3 w-80 opacity-60" />
        </div>
        <Shimmer className="h-8 w-48 rounded-xl" />
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs space-y-2">
            <Shimmer className="h-2.5 w-20" />
            <Shimmer className="h-6 w-24" />
            <Shimmer className="h-2 w-16 opacity-50" />
          </div>
        ))}
      </div>

      {/* Lens Switcher */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#121215] p-1 shadow-xs">
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-7 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Primary Chart Card */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#16161a]/60 flex items-center justify-between">
          <Shimmer className="h-3 w-40" />
          <Shimmer className="h-3 w-24" />
        </div>
        <div className="p-5">
          <Shimmer className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── 4. Savings Goals Tab Skeleton ─────────────────────────────────────
export function SkeletonGoals() {
  return (
    <div className="space-y-4 font-sans max-w-[1600px] mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
        <div className="space-y-1">
          <Shimmer className="h-6 w-64" />
          <Shimmer className="h-3 w-72 opacity-60" />
        </div>
        <Shimmer className="h-8 w-32 rounded-xl" />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs space-y-2">
            <Shimmer className="h-2.5 w-20" />
            <Shimmer className="h-5 w-28" />
            <Shimmer className="h-2 w-16 opacity-50" />
          </div>
        ))}
      </div>

      {/* Horizon Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-2 px-3 shadow-sm">
        <Shimmer className="h-7 w-64 rounded-xl" />
        <Shimmer className="h-7 w-28 rounded-xl" />
      </div>

      {/* Goal Horizon Cards */}
      <div className="space-y-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shimmer className="h-4 w-36" />
                <Shimmer className="h-5 w-16 rounded-md" />
                <Shimmer className="h-5 w-20 rounded-md" />
              </div>
              <Shimmer className="h-6 w-20 rounded-md" />
            </div>
            <Shimmer className="h-2 w-full rounded-full" />
            <div className="flex items-center justify-between pt-1">
              <Shimmer className="h-4 w-32" />
              <Shimmer className="h-7 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 5. Recurring Bills Tab Skeleton ───────────────────────────────────
export function SkeletonRecurring() {
  return (
    <div className="space-y-4 font-sans pb-24 md:pb-6">
      {/* Header with Title and Executive Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <Shimmer className="h-7 w-64 rounded-lg" />
          <Shimmer className="h-3.5 w-80 mt-1 opacity-60" />
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Shimmer className="h-8 w-20 rounded-xl" />
          <Shimmer className="h-8 w-20 rounded-xl" />
          <Shimmer className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* Cashflow Projection 4-Card Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs space-y-1.5">
            <Shimmer className="h-2.5 w-24 rounded" />
            <div className="flex items-baseline gap-1.5 mt-1">
              <Shimmer className="h-6 w-20 rounded" />
              <Shimmer className="h-3 w-8 rounded opacity-50" />
            </div>
            <Shimmer className="h-2.5 w-28 rounded opacity-50 mt-0.5" />
          </div>
        ))}
      </div>

      {/* Grouped Subscriptions Feed */}
      <div className="space-y-4 pt-1">
        {/* Section 1 */}
        <div className="space-y-2">
          <Shimmer className="h-4 w-36 rounded-md" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
                <div className="flex items-center gap-3.5">
                  <Shimmer className="w-11 h-11 rounded-2xl shrink-0" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Shimmer className="h-4 w-32 rounded" />
                      <Shimmer className="h-4 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Shimmer className="h-3 w-16 rounded" />
                      <Shimmer className="h-3 w-14 rounded" />
                      <Shimmer className="h-3 w-10 rounded" />
                      <Shimmer className="h-3 w-24 rounded" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right space-y-1">
                    <Shimmer className="h-5 w-14 rounded ml-auto" />
                    <Shimmer className="h-2.5 w-16 rounded opacity-50 ml-auto" />
                  </div>
                  <Shimmer className="w-7 h-7 rounded-xl shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <Shimmer className="h-4 w-40 rounded-md" />
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs">
            <div className="flex items-center gap-3.5">
              <Shimmer className="w-11 h-11 rounded-2xl shrink-0" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Shimmer className="h-4 w-36 rounded" />
                  <Shimmer className="h-4 w-16 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Shimmer className="h-3 w-16 rounded" />
                  <Shimmer className="h-3 w-14 rounded" />
                  <Shimmer className="h-3 w-10 rounded" />
                  <Shimmer className="h-3 w-24 rounded" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right space-y-1">
                <Shimmer className="h-5 w-14 rounded ml-auto" />
                <Shimmer className="h-2.5 w-16 rounded opacity-50 ml-auto" />
              </div>
              <Shimmer className="w-7 h-7 rounded-xl shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 6. Calendar Tab Skeleton ──────────────────────────────────────────
export function SkeletonCalendar() {
  return (
    <div className="space-y-4 font-sans pb-24 md:pb-0">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <Shimmer className="h-6 w-48" />
          <Shimmer className="h-3 w-64 opacity-60" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="h-8 w-44 rounded-xl" />
          <Shimmer className="h-8 w-40 rounded-xl" />
          <Shimmer className="h-8 w-16 rounded-xl" />
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-2 text-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <Shimmer key={i} className="h-4 w-10 mx-auto" />
          ))}
        </div>
        {/* Day Cells (5 rows x 7 cols) */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-white/[0.03]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 sm:h-24 p-2 space-y-1">
              <Shimmer className="h-3.5 w-5" />
              {i % 4 === 0 && <Shimmer className="h-3.5 w-full rounded" />}
              {i % 6 === 0 && <Shimmer className="h-3.5 w-3/4 rounded" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 7. Traveling Tab Skeleton ─────────────────────────────────────────
export function SkeletonTraveling() {
  return (
    <div className="space-y-4 font-sans max-w-[1600px] mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
        <div className="space-y-1">
          <Shimmer className="h-6 w-52" />
          <Shimmer className="h-3 w-72 opacity-60" />
        </div>
        <Shimmer className="h-8 w-28 rounded-xl" />
      </div>

      {/* Subtab Switcher */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100 dark:bg-[#121215] p-1 shadow-xs">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-7 rounded-xl" />
          ))}
        </div>
      </div>

      {/* 4 Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-sm space-y-2">
            <Shimmer className="h-2.5 w-24" />
            <Shimmer className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* 2 Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-2">
              <Shimmer className="h-4 w-32" />
              <Shimmer className="h-6 w-16 rounded-xl" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-white/[0.03]">
                  <Shimmer className="h-3 w-20" />
                  <Shimmer className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 8. Tab Dispatcher Skeleton ────────────────────────────────────────
export function SkeletonTab({ tab = 'overview' }: { tab?: string }) {
  switch (tab) {
    case 'overview':
      return <SkeletonOverview />
    case 'transactions':
      return <SkeletonTransactions />
    case 'analytics':
      return <SkeletonAnalytics />
    case 'goals':
      return <SkeletonGoals />
    case 'recurring':
      return <SkeletonRecurring />
    case 'calendar':
      return <SkeletonCalendar />
    case 'traveling':
      return <SkeletonTraveling />
    default:
      return <SkeletonOverview />
  }
}

// ─── 9. Full Application Shell Skeleton ────────────────────────────────
export function SkeletonDashboard({ activeTab = 'overview' }: { activeTab?: string }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#09090b]">
      {/* Sidebar Shell */}
      <div className="hidden md:flex w-64 shrink-0 flex-col bg-white dark:bg-[#0d0d10] border-r border-slate-200/80 dark:border-white/[0.08]">
        <div className="px-5 h-16 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center gap-2.5 shrink-0">
          <Shimmer className="h-8 w-8 rounded-xl shrink-0" />
          <div className="space-y-1">
            <Shimmer className="h-3.5 w-20" />
            <Shimmer className="h-2 w-14 opacity-50" />
          </div>
        </div>
        <div className="flex-1 p-3 space-y-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
              <Shimmer className="h-4 w-4 rounded-md shrink-0" />
              <Shimmer className={`h-3 ${i === 0 ? 'w-20' : i % 3 === 0 ? 'w-16' : 'w-24'}`} />
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center gap-2.5">
          <Shimmer className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1">
            <Shimmer className="h-2.5 w-20" />
            <Shimmer className="h-2 w-28 opacity-50" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Shell */}
        <div className="h-16 bg-white dark:bg-[#0d0d10] border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <Shimmer className="h-4 w-4 rounded-md" />
            <Shimmer className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-2.5">
            <Shimmer className="h-8 w-24 rounded-xl" />
            <Shimmer className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Tab-Tailored Skeleton Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <SkeletonTab tab={activeTab} />
        </div>
      </div>
    </div>
  )
}
