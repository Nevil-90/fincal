// Loading skeleton components used while data is being fetched.
// Shimmer is the base pulse animation; exported variants mirror actual UI shapes.
function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-neutral-700 ${className}`} />
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-slate-200 dark:bg-neutral-700 ${className}`} />
  )
}

export function SkeletonStatCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-5 w-5 rounded-lg" />
      </div>
      <Shimmer className="h-8 w-32" />
      <Shimmer className="h-2.5 w-20 opacity-60" />
    </div>
  )
}

export function SkeletonTransactionRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 py-3 px-4 border-b border-slate-100 dark:border-neutral-800">
      <Shimmer className="h-9 w-9 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-28" />
        <Shimmer className="h-2.5 w-20 opacity-60" />
      </div>
      <Shimmer className="h-4 w-16" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-neutral-950">
      <div className="hidden md:flex w-64 shrink-0 flex-col bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800">
        <div className="px-6 h-[60px] sm:h-[68px] border-b border-slate-200 dark:border-neutral-800 flex items-center gap-3 shrink-0">
          <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
          <Shimmer className="h-4 w-24" />
        </div>
        <div className="flex-1 p-4 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Shimmer className="h-5 w-5 rounded-lg shrink-0" />
              <Shimmer className={`h-4 ${i === 0 ? 'w-20' : i % 3 === 0 ? 'w-16' : 'w-24'}`} />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 flex items-center gap-3">
          <Shimmer className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-2.5 w-28 opacity-60" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[60px] sm:h-[68px] bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Shimmer className="h-5 w-5 rounded-md" />
            <Shimmer className="h-5 w-36" />
          </div>
          <div className="flex items-center gap-3">
            <Shimmer className="h-8 w-28 rounded-lg" />
            <Shimmer className="h-8 w-8 rounded-full" />
            <Shimmer className="h-8 w-8 rounded-full" />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-5">
          <div className="space-y-2">
            <Shimmer className="h-7 w-56" />
            <Shimmer className="h-3.5 w-80 opacity-60" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Shimmer className="h-5 w-40" />
              <Shimmer className="h-8 w-24 rounded-lg" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTransactionRow key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
