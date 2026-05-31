export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />
  )
}

export function SkeletonStatCard() {
  return (
    <div className="animate-pulse bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 rounded-full" />
        <div className="h-5 w-5 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-8 w-32 bg-slate-200 rounded-full" />
      <div className="h-2.5 w-20 bg-slate-100 rounded-full" />
    </div>
  )
}

export function SkeletonTransactionRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 py-3 px-4 border-b border-slate-100">
      <div className="h-9 w-9 bg-slate-200 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 bg-slate-200 rounded-full" />
        <div className="h-2.5 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="h-4 w-16 bg-slate-200 rounded-full" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded-full animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTransactionRow key={i} />
        ))}
      </div>
    </div>
  )
}
