'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Calendar } from 'lucide-react'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'

interface AddTransactionFormProps {
  onClose: () => void
  onTransactionAdded: () => void
  initialData?: {
    id: string
    type: 'income' | 'expense'
    amount: number
    category: string
    description: string | null
    paymentMethod: string | null
    source: string | null
    date: string
  }
}

const AC_STORAGE_KEY = 'fincal_ac_rules'

function getLocalRules(): Record<string, { category: string; type: string }> {
  try {
    return JSON.parse(localStorage.getItem(AC_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveLocalRule(keyword: string, category: string, type: string) {
  try {
    const rules = getLocalRules()
    rules[keyword.toLowerCase().trim()] = { category, type }
    localStorage.setItem(AC_STORAGE_KEY, JSON.stringify(rules))
  } catch {
    // ignore storage errors
  }
}

export default function AddTransactionForm({ onClose, onTransactionAdded, initialData }: AddTransactionFormProps) {
  const { data: staticData } = useEnhancedStaticData()
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense')
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '')
  const [source, setSource] = useState(initialData?.source || '')
  const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<{ category: string; type: 'income' | 'expense' } | null>(null)
  const syncedRef = useRef(false)

  // Sync DB rules into localStorage once on mount
  useEffect(() => {
    if (syncedRef.current) return
    syncedRef.current = true
    fetch('/api/user/autocategorize')
      .then(res => res.json())
      .then(data => {
        if (data.rules && Array.isArray(data.rules)) {
          const local = getLocalRules()
          data.rules.forEach((r: { keyword: string; category: string; type: string }) => {
            local[r.keyword] = { category: r.category, type: r.type }
          })
          localStorage.setItem(AC_STORAGE_KEY, JSON.stringify(local))
        }
      })
      .catch(() => {})
  }, [])

  // Auto-suggest category when description changes
  useEffect(() => {
    if (!description.trim()) {
      setSuggestion(null)
      return
    }
    const key = description.toLowerCase().trim()
    const rules = getLocalRules()
    // Find best match: exact or startsWith
    const match = rules[key] || Object.entries(rules).find(([k]) => key.startsWith(k) || k.startsWith(key))?.[1]
    if (match) {
      setSuggestion(match as { category: string; type: 'income' | 'expense' })
    } else {
      setSuggestion(null)
    }
  }, [description])

  const applySuggestion = () => {
    if (suggestion) {
      setType(suggestion.type)
      setCategory(suggestion.category)
      setSuggestion(null)
    }
  }

  const categories = type === 'income'
    ? staticData.incomeCategories.filter(c => c.isActive).map(c => c.name)
    : staticData.expenseCategories.filter(c => c.isActive).map(c => c.name)

  const sourcesOrPurposes = type === 'income'
    ? staticData.incomeSources.filter(c => c.isActive).map(c => c.name)
    : staticData.expensePurposes.filter(c => c.isActive).map(c => c.name)

  const paymentMethods = staticData.paymentMethods.filter(c => c.isActive).map(c => c.name)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !paymentMethod) return

    setLoading(true)
    try {
      const response = await fetch('/api/transactions', {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialData?.id,
          type,
          amount: parseFloat(amount),
          category,
          description: description || null,
          paymentMethod: paymentMethod || null,
          source: source || null,
          date,
        }),
      })

      if (response.ok) {
        // Save the categorization rule locally and sync to DB
        if (description.trim() && category) {
          saveLocalRule(description, category, type)
          // Sync to DB (fire-and-forget)
          fetch('/api/user/autocategorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rules: [{ keyword: description.toLowerCase().trim(), category, type }]
            }),
          }).catch(() => {})
        }
        onTransactionAdded()
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <h3 className="text-base font-bold text-slate-900">{initialData ? 'Edit Transaction' : 'Add Transaction'}</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {/* Transaction Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Expense
            </button>
          </div>
        </div>

        {/* Description — before category so suggestion can pre-fill */}
        <div>
          <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Description (Optional)
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50/50 text-slate-900 bg-slate-50/70 text-sm font-semibold transition-all"
            placeholder="What was this for?"
          />
          {/* Auto-categorization suggestion pill */}
          {suggestion && (
            <button
              type="button"
              onClick={applySuggestion}
              className="mt-2 flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl font-semibold hover:bg-blue-100 transition-all w-full"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              Auto-fill: <strong>{suggestion.category}</strong> ({suggestion.type}) — tap to apply
            </button>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50/50 text-slate-900 bg-slate-50/70 text-sm font-semibold transition-all"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50/50 text-slate-900 bg-slate-50/70 text-sm font-semibold transition-all"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label htmlFor="source" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {type === 'income' ? 'Source of Money' : 'Purpose/Where it went'} (Optional)
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50/50 text-slate-900 bg-slate-50/70 text-sm font-semibold transition-all"
          >
            <option value="">{type === 'income' ? 'Select source' : 'Select purpose'}</option>
            {sourcesOrPurposes.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="paymentMethod" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            required
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50/50 text-slate-900 bg-slate-50/70 text-sm font-semibold transition-all"
          >
            <option value="">Select payment method</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Date
          </label>
          <div className="relative w-full">
            <div className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/70 text-sm font-semibold flex items-center justify-between pointer-events-none transition-all">
              <span className={date ? 'text-slate-900' : 'text-slate-400'}>
                {date
                  ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Select Date'}
              </span>
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Buttons (Footer) */}
        <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !amount || !category || !date}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Transaction')}
          </button>
        </div>
      </form>
    </div>
  )
}
