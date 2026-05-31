'use client'

import { useState, useEffect, useCallback } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { PriceChange, RecurringTransaction } from './types'
import { Calendar, Lightbulb } from 'lucide-react'

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
        alert(`[SUCCESS] Recalculation complete!\n\nUpdated ${result.updatedCount} out of ${result.totalTransactions} transactions.`)
        onPriceChangeAdded() // Refresh the parent data
      } else {
        alert('[ERROR] Failed to recalculate transactions. Please try again.')
      }
    } catch (error) {
      console.error('Error recalculating transactions:', error)
      alert('[ERROR] Network error. Please try again.')
    } finally {
      setRecalculating(false)
    }
  }

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Price History</h3>
            <p className="text-sm text-gray-600">{recurringTransaction.description || 'Recurring Transaction'}</p>
            <p className="text-sm text-gray-500">
              Current amount: {formatCurrency(recurringTransaction.amount)} · {recurringTransaction.frequency}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-md font-medium text-gray-900 mb-4">Add New Price Change</h4>
            <form onSubmit={handleAddPriceChange} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      placeholder="150.00"
                      value={newPriceChange.newAmount || ''}
                      onChange={(e) => setNewPriceChange({ 
                        ...newPriceChange, 
                        newAmount: parseFloat(e.target.value) || 0 
                      })}
                      className="w-full pl-8 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                  <div className="relative w-full">
                    <div className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 flex items-center justify-between pointer-events-none transition-colors">
                      <span className={newPriceChange.effectiveDate ? 'text-gray-900' : 'text-gray-400'}>
                        {newPriceChange.effectiveDate
                          ? new Date(newPriceChange.effectiveDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Select Date'}
                      </span>
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={newPriceChange.effectiveDate}
                      onChange={(e) => setNewPriceChange({ 
                        ...newPriceChange, 
                        effectiveDate: e.target.value 
                      })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <textarea
                  placeholder="e.g., Price increase due to plan upgrade"
                  value={newPriceChange.reason || ''}
                  onChange={(e) => setNewPriceChange({ 
                    ...newPriceChange, 
                    reason: e.target.value 
                  })}
                  className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white resize-none"
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
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Price Changes List */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Price Change History</h4>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading price changes...</p>
            </div>
          ) : priceChanges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No price changes yet.</p>
              <p className="text-sm">Add a price change to track historical amounts for different billing periods.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {priceChanges.map((change, index) => (
                <div key={change.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">From:</span>
                          <span className="font-medium text-red-600">{formatCurrency(change.oldAmount || 0)}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">To:</span>
                          <span className="font-medium text-green-600">{formatCurrency(change.newAmount)}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Effective from:</span> {formatDate(change.effectiveDate)}
                      </div>
                      {change.reason && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Reason:</span> {change.reason}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {change.createdAt && formatDate(change.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h5 className="text-sm font-medium text-blue-900 mb-1">How Price History Works</h5>
              <p className="text-sm text-blue-800 mb-2">
                When you add a price change, the system will automatically apply the correct amount for each billing period. 
                Past transactions keep their original amounts, and future transactions will use the new amount from the effective date.
              </p>
              <div className="text-xs text-blue-700 bg-blue-100 rounded p-2 mt-2">
                <strong>Example:</strong> If your Netflix subscription increases from ₹199 to ₹249 in March 2025, 
                all transactions from March onwards will use ₹249, while January and February transactions remain at ₹199.
              </div>
            </div>
          </div>
        </div>

        {/* Future Transactions Preview */}
        {priceChanges.length > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-1.5"><Lightbulb className="h-4 w-4" /> Price Changes Active</h5>
            <p className="text-sm text-green-800 mb-2">
              This recurring transaction has {priceChanges.length} price change{priceChanges.length > 1 ? 's' : ''}. 
              Future transactions will automatically use the correct amount based on their billing date.
            </p>
            <div className="text-xs text-green-700 mt-2 bg-green-100 rounded p-2">
              <strong className="flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Tip:</strong> If you see incorrect amounts in past transactions, use the &quot;Fix Past Transactions&quot; button above to recalculate all existing transactions based on the current price history.
            </div>
            <div className="text-xs text-green-700 mt-1">
              Next billing: Uses {formatCurrency(recurringTransaction.amount)} 
              ({priceChanges[0]?.effectiveDate && new Date(priceChanges[0].effectiveDate) <= new Date() 
                ? 'current rate' : 'scheduled rate'})
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
