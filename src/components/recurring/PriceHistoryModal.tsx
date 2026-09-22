// Component for PriceHistoryModal.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { PriceChange, RecurringTransaction } from './types'
import { toast } from 'sonner'
import CustomDateField from '@/components/ui/CustomDateField'

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

  // Fetch price changes when modal opens
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
        await fetchPriceChanges() // Refresh the list
        setNewPriceChange({ newAmount: 0, effectiveDate: '', reason: '' })
        setShowAddForm(false)
        onPriceChangeAdded() // Notify parent to refresh recurring transactions
      }
    } catch (error) {
      console.error('Error adding price change:', error)
    } finally {
      setAddingPriceChange(false)
    }
  }

  const handleRecalculateTransactions = async () => {
    if (!confirm('This will recalculate all existing transactions based on the current price history. Continue?')) return

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
        onPriceChangeAdded() // Refresh the parent data
      } else {
        toast.error('Failed to recalculate transactions. Please try again.')
      }
    } catch (error) {
      console.error('Error recalculating transactions:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setRecalculating(false)
    }
  }

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/45 dark:bg-neutral-950/80 p-3 sm:p-4 backdrop-blur-sm overflow-hidden" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Price History</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-500">
              {recurringTransaction.description || 'Recurring Transaction'} · Current: {formatCurrency(recurringTransaction.amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {/* Add Price Change Button */}
          {!showAddForm && (
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Price Change
              </button>

              {priceChanges.length > 0 && (
                <button
                  onClick={handleRecalculateTransactions}
                  disabled={recalculating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {recalculating ? 'Recalculating...' : 'Fix Past Transactions'}
                </button>
              )}
            </div>
          )}

          {/* Add Price Change Form */}
          {showAddForm && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-800/50">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Add New Price Change</h4>
              <form onSubmit={handleAddPriceChange} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">New Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-neutral-500 text-sm font-medium">₹</span>
                      <input
                        type="number"
                        placeholder="150.00"
                        value={newPriceChange.newAmount || ''}
                        onChange={(e) => setNewPriceChange({
                          ...newPriceChange,
                          newAmount: parseFloat(e.target.value) || 0
                        })}
                        className="w-full pl-8 pr-3 py-2.5 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 bg-slate-50/70 dark:bg-neutral-950 transition-all text-sm font-semibold outline-none"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <CustomDateField
                      label="Effective Date"
                      required
                      value={newPriceChange.effectiveDate}
                      onChange={(val) => setNewPriceChange({
                        ...newPriceChange,
                        effectiveDate: val
                      })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Reason (Optional)</label>
                  <textarea
                    placeholder="e.g., Price increase due to plan upgrade"
                    value={newPriceChange.reason || ''}
                    onChange={(e) => setNewPriceChange({
                      ...newPriceChange,
                      reason: e.target.value
                    })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 bg-slate-50/70 dark:bg-neutral-950 resize-none transition-all text-sm font-medium outline-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addingPriceChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingPriceChange ? 'Adding...' : 'Add Price Change'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewPriceChange({ newAmount: 0, effectiveDate: '', reason: '' })
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Price Changes List */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Price Change History</h4>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-neutral-400 mt-2">Loading price changes...</p>
              </div>
            ) : priceChanges.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No price changes yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priceChanges.map((change, index) => (
                  <div key={change.id || index} className="border border-gray-200 dark:border-neutral-800 rounded-lg p-4 bg-white dark:bg-neutral-900">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-neutral-400">From:</span>
                            <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(change.oldAmount || 0)}</span>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-neutral-400">To:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(change.newAmount)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-neutral-400">
                          <span className="font-medium text-gray-900 dark:text-white">Effective from:</span> {formatDate(change.effectiveDate)}
                        </div>
                        {change.reason && (
                          <div className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                            <span className="font-medium text-gray-900 dark:text-white">Reason:</span> {change.reason}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-neutral-500">
                        {change.createdAt && formatDate(change.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
