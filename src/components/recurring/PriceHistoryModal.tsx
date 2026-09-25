import { useState, useEffect, useCallback } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { PriceChange, RecurringTransaction } from './types'
import { toast } from 'sonner'
import CustomDateField from '@/components/ui/CustomDateField'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { X, Plus, RotateCcw, TrendingUp, TrendingDown, ArrowRight, History, Calendar } from 'lucide-react'

interface PriceHistoryModalProps {
  recurringTransaction: RecurringTransaction
  isOpen: boolean
  onClose: () => void
  onPriceChangeAdded: () => void
}

export default function PriceHistoryModal({
  recurringTransaction,
  isOpen,
  onClose,
  onPriceChangeAdded
}: PriceHistoryModalProps) {
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([])
  const [loading, setLoading] = useState(false)
  const [addingPriceChange, setAddingPriceChange] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  useScrollLock(isOpen)

  // Form state for new price change
  const [newPriceChange, setNewPriceChange] = useState<Partial<PriceChange>>({
    newAmount: 0,
    effectiveDate: '',
    reason: ''
  })

  const fetchPriceChanges = useCallback(async () => {
    if (!recurringTransaction?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/recurring/price-changes?recurringTransactionId=${recurringTransaction.id}`)
      if (response.ok) {
        const data = await response.json()
        setPriceChanges(data)
      }
    } catch (error) {
      console.error('Error fetching price changes:', error)
    } finally {
      setLoading(false)
    }
  }, [recurringTransaction?.id])

  useEffect(() => {
    if (isOpen) {
      fetchPriceChanges()
    }
  }, [isOpen, fetchPriceChanges])

  const handleAddPriceChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPriceChange.newAmount || !newPriceChange.effectiveDate) return

    setAddingPriceChange(true)
    try {
      const response = await fetch('/api/recurring/price-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurringTransactionId: recurringTransaction.id,
          newAmount: newPriceChange.newAmount,
          effectiveDate: newPriceChange.effectiveDate,
          reason: newPriceChange.reason
        })
      })

      if (response.ok) {
        await fetchPriceChanges()
        setNewPriceChange({ newAmount: 0, effectiveDate: '', reason: '' })
        setShowAddForm(false)
        onPriceChangeAdded()
        toast.success('Price change recorded successfully')
      }
    } catch (error) {
      console.error('Error adding price change:', error)
      toast.error('Failed to save price change')
    } finally {
      setAddingPriceChange(false)
    }
  }

  const handleRecalculateTransactions = async () => {
    if (!confirm('This will retroactively adjust all past transactions based on this price timeline. Continue?')) return

    setRecalculating(true)
    try {
      const response = await fetch('/api/recurring/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurringTransactionId: recurringTransaction.id
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Recalculation complete! Updated ${result.updatedCount} out of ${result.totalTransactions} transactions.`)
        onPriceChangeAdded()
      } else {
        toast.error('Failed to recalculate transactions.')
      }
    } catch (error) {
      console.error('Error recalculating transactions:', error)
      toast.error('Network error during recalculation.')
    } finally {
      setRecalculating(false)
    }
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatDate = (dateString: string) => formatDateForDisplay(dateString)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs sm:p-4 overflow-hidden animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white dark:bg-[#121215] rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/[0.08] shadow-2xl flex flex-col w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0" onClick={(e) => e.stopPropagation()}>
        {/* Mobile drag handle */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Price History & Timeline</h3>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              {recurringTransaction.description} · Current: <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(recurringTransaction.amount)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
          {/* Action Ribbon */}
          <div className="flex items-center justify-between gap-2">
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Price Change</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-slate-900 dark:text-white">Record New Price Point</span>
            )}

            {priceChanges.length > 0 && (
              <button
                type="button"
                onClick={handleRecalculateTransactions}
                disabled={recalculating}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181b] hover:bg-slate-100 dark:hover:bg-[#202024] text-xs font-semibold text-slate-700 dark:text-neutral-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <RotateCcw className={`w-3 h-3 ${recalculating ? 'animate-spin' : ''}`} />
                <span>{recalculating ? 'Recalculating...' : 'Sync Past Records'}</span>
              </button>
            )}
          </div>

          {/* Add Price Change Form */}
          {showAddForm && (
            <form onSubmit={handleAddPriceChange} className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] space-y-3 animate-in slide-in-from-top-1 duration-150">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 mb-1">
                    New Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-neutral-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={newPriceChange.newAmount || ''}
                      onChange={(e) => setNewPriceChange({
                        ...newPriceChange,
                        newAmount: parseFloat(e.target.value) || 0
                      })}
                      className="w-full h-9 pl-7 pr-3 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#18181b] text-base sm:text-xs font-bold tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <CustomDateField
                    label="Effective Date *"
                    placeholder="Effective date (e.g. 01 Oct 2026)"
                    required
                    value={newPriceChange.effectiveDate || ''}
                    onChange={(val) => setNewPriceChange({
                      ...newPriceChange,
                      effectiveDate: val
                    })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 mb-1">
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Annual renewal rate increase, upgraded tier"
                  value={newPriceChange.reason || ''}
                  onChange={(e) => setNewPriceChange({
                    ...newPriceChange,
                    reason: e.target.value
                  })}
                  className="w-full h-8 px-3 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewPriceChange({ newAmount: 0, effectiveDate: '', reason: '' })
                  }}
                  className="flex-1 h-8 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181b] text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#202024] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPriceChange}
                  className="flex-1 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-40 shadow-xs cursor-pointer"
                >
                  {addingPriceChange ? 'Saving...' : 'Save Price Point'}
                </button>
              </div>
            </form>
          )}

          {/* Timeline List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2">
              Price Revision Timeline
            </h4>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2" />
                <p className="text-xs text-slate-400 dark:text-neutral-500">Loading history...</p>
              </div>
            ) : priceChanges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-slate-200/80 dark:border-white/[0.08] text-center">
                <History className="w-8 h-8 text-slate-300 dark:text-neutral-600 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-neutral-300">No price adjustments recorded</p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  The subscription has billed at {formatCurrency(recurringTransaction.amount)} since inception.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {priceChanges.map((change, idx) => {
                  const isIncrease = change.newAmount > (change.oldAmount || 0)
                  return (
                    <div
                      key={change.id || idx}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isIncrease
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40'
                        }`}>
                          {isIncrease ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 dark:text-neutral-500 tabular-nums font-medium line-through">
                              {formatCurrency(change.oldAmount || 0)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-300 dark:text-neutral-600" />
                            <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                              {formatCurrency(change.newAmount)}
                            </span>
                          </div>
                          {change.reason && (
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                              {change.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-neutral-300">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(change.effectiveDate)}</span>
                        </div>
                        {change.createdAt && (
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                            Logged {formatDate(change.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
