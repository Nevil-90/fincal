// Component for TravelList.tsx
import { Car, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'

interface TravelEntry {
  id: string
  startDate: string
  endDate: string
  startKm: number
  endKm: number
  amount: number
  liters: number
  description?: string
}

interface DerivedData {
  kmTraveled: number
  pricePerLiter: number
  efficiency: number
  costPerKm: number
  days: number
  cumulativeKm: number
  cumulativeAmount: number
}

interface TravelListProps {
  travelEntries: TravelEntry[]
  selectedEntries: Set<string>
  handleSelectEntry: (id: string) => void
  handleSelectAll: () => void
  handleDelete: (id: string) => void
  expandedEntryId: string | null
  setExpandedEntryId: (id: string | null) => void
  calculateDerivedData: (entry: TravelEntry, index: number) => DerivedData
  pagination: {
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  currentPage: number
  fetchTravelEntries: (page: number) => void
  loading: boolean
  tableRef: React.RefObject<HTMLDivElement | null>
}

export default function TravelList({
  travelEntries,
  selectedEntries,
  handleSelectEntry,
  handleSelectAll,
  handleDelete,
  expandedEntryId,
  setExpandedEntryId,
  calculateDerivedData,
  pagination,
  currentPage,
  fetchTravelEntries,
  loading,
  tableRef
}: TravelListProps) {
  return (
    <div ref={tableRef} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden transform-gpu">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 flex justify-between items-center">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Travel Log</h3>
      </div>
      
      {/* Mobile View */}
      <div className="sm:hidden divide-y divide-slate-100">
        {travelEntries.length > 0 ? (
          travelEntries.map((entry, index) => {
            const derived = calculateDerivedData(entry, index)
            const isExpanded = expandedEntryId === entry.id
            return (
              <div key={entry.id} className={`px-4 sm:px-5 py-4 ${selectedEntries.has(entry.id) ? 'bg-indigo-50/40 dark:bg-indigo-900/30' : 'bg-white dark:bg-neutral-900'}`}>
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => handleSelectEntry(entry.id)}
                      className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(entry.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        <span className="text-slate-400 dark:text-neutral-500 mx-1">→</span>
                        {new Date(entry.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400">{derived.days} days · {entry.liters} L</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                      className="text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:text-neutral-300 px-2 py-1 rounded-md"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-slate-400 dark:text-neutral-500 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 px-3 py-2">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-neutral-400">Distance</p>
                    <p className="text-sm font-semibold text-indigo-600">{derived.kmTraveled.toLocaleString()} KM</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 dark:text-neutral-400">Amount</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(entry.amount)}</p>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2">
                    <div className="rounded-lg border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2">
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400">KM Range</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">{entry.startKm.toLocaleString()}-{entry.endKm.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2">
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400">Fuel</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">{entry.liters} L</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2">
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400">Efficiency</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        {derived.efficiency} KM/L
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2">
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400">Price/L</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">{formatCurrency(derived.pricePerLiter)}/L</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="px-6 py-20 text-center flex flex-col items-center bg-slate-50/50 dark:bg-neutral-900/30">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-slate-100 dark:border-neutral-800 flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-slate-300 dark:text-neutral-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">No travel logs found</p>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-[250px]">Add your first entry to start tracking fuel efficiency and travel costs.</p>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-100 dark:border-neutral-800">
              <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  checked={travelEntries.length > 0 && selectedEntries.size === travelEntries.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 w-4 h-4 cursor-pointer transition-colors"
                />
              </th>
              <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Date Range</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">KM Range</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Distance</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Fuel</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Efficiency</th>
              <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {travelEntries.length > 0 ? (
              travelEntries.map((entry, index) => {
                const derived = calculateDerivedData(entry, index)
                return (
                  <tr key={entry.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-800/50 ${selectedEntries.has(entry.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(entry.id)}
                        onChange={() => handleSelectEntry(entry.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 w-4 h-4 cursor-pointer transition-colors"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-medium text-slate-900 dark:text-white">
                        {new Date(entry.startDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} 
                        <span className="text-slate-400 dark:text-neutral-500 mx-1">→</span> 
                        {new Date(entry.endDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: '2-digit'})}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 mt-0.5">{derived.days} days</div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-600 dark:text-neutral-400 font-medium">
                      {entry.startKm.toLocaleString()} <span className="text-slate-400 dark:text-neutral-500 mx-0.5">-</span> {entry.endKm.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-semibold text-indigo-600">
                      {derived.kmTraveled.toLocaleString()} <span className="text-[11px]">KM</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-bold text-slate-900 dark:text-white">{formatCurrency(entry.amount)}</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 mt-0.5">{formatCurrency(derived.pricePerLiter)}/L</div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-600 dark:text-neutral-400">
                      {entry.liters}<span className="text-slate-400 dark:text-neutral-500">L</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        {derived.efficiency} KM/L
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-slate-400 dark:text-neutral-500 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-slate-100 dark:border-neutral-800 flex items-center justify-center mb-4">
                      <Car className="h-8 w-8 text-slate-300 dark:text-neutral-600" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">No travel logs found</p>
                    <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-[300px]">Add your first entry to start tracking fuel efficiency and travel costs.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-[13px] font-medium text-slate-500 dark:text-neutral-400 leading-snug">
            Showing page <span className="text-slate-900 dark:text-white font-semibold">{currentPage}</span> of <span className="text-slate-900  font-semibold">{pagination.totalPages}</span>
            <span className="mx-1.5 text-slate-300">•</span>
            {pagination.totalCount} total entries
          </div>
          
          <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl shadow-sm ring-1 ring-slate-900/5 max-w-full">
            <button
              onClick={() => fetchTravelEntries(currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-800/50 hover:text-slate-900 dark:text-white"
            >
              Prev
            </button>
            
            <div className="sm:hidden px-2 text-xs font-semibold text-slate-600 dark:text-neutral-400">
              {currentPage} / {pagination.totalPages}
            </div>

            <div className="hidden sm:flex flex-wrap items-center gap-1 border-x border-slate-100 dark:border-neutral-800 px-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchTravelEntries(pageNum)}
                    disabled={loading}
                    className={`min-w-[30px] px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-800/50 hover:text-slate-900 dark:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => fetchTravelEntries(currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 dark:bg-neutral-800/50 hover:text-slate-900 dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
