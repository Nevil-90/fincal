// Add/Edit transaction modal form. Includes auto-categorization suggestions
// by storing mapping rules locally based on user description input.
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

  useEffect(() => {
    if (!description.trim()) {
      setSuggestion(null)
      return
    }
    const key = description.toLowerCase().trim()
    const rules = getLocalRules()
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

  const categories = Array.from(new Set(type === 'income'
    ? staticData.incomeCategories.filter(c => c.isActive).map(c => c.name)
    : staticData.expenseCategories.filter(c => c.isActive).map(c => c.name)))

  const sourcesOrPurposes = Array.from(new Set(type === 'income'
    ? staticData.incomeSources.filter(c => c.isActive).map(c => c.name)
    : staticData.expensePurposes.filter(c => c.isActive).map(c => c.name)))

  const paymentMethods = Array.from(new Set(staticData.paymentMethods.filter(c => c.isActive).map(c => c.name)))

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
        if (description.trim() && category) {
          saveLocalRule(description, category, type)
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Transaction' : 'Add Transaction'}</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white dark:bg-neutral-900">
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <div className="col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-neutral-800/50 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-neutral-800/50 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              Expense
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
            Description (Optional)
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold transition-all"
            placeholder="What was this for?"
          />
          {suggestion && (
            <button
              type="button"
              onClick={applySuggestion}
              className="mt-2 flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all w-full"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              Auto-fill: <strong>{suggestion.category}</strong> ({suggestion.type}) — tap to apply
            </button>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
            Amount
          </label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-bold">₹</span>
            <input
              type="text"
              inputMode="decimal"
              id="amount"
              value={amount}
              onFocus={(e) => {
                if (e.target.value === '0' || e.target.value === '') {
                  setAmount('')
                }
              }}
              onChange={(e) => {
                let val = e.target.value
                // Allow only valid numeric input
                val = val.replace(/[^0-9.]/g, '')
                // Strip leading zeros unless it's "0." (decimal)
                if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                  val = val.replace(/^0+/, '')
                }
                // Allow only one decimal point
                const parts = val.split('.')
                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
                setAmount(val)
              }}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold transition-all"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold transition-all"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="source" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1 truncate" title={type === 'income' ? 'Source of Money (Optional)' : 'Purpose/Where it went (Optional)'}>
            {type === 'income' ? 'Source' : 'Purpose'} (Optional)
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold transition-all"
          >
            <option value="">{type === 'income' ? 'Select source' : 'Select purpose'}</option>
            {sourcesOrPurposes.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="paymentMethod" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            required
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold transition-all"
          >
            <option value="">Select payment method</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
            Date
          </label>
          <div className="relative w-full">
            <div className="w-full px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold flex items-center justify-between pointer-events-none transition-all">
              <span className={date ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-neutral-500'}>
                {date
                  ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Select Date'}
              </span>
              <Calendar className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
            </div>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => {
                try {
                  if ('showPicker' in HTMLInputElement.prototype) {
                    (e.target as HTMLInputElement).showPicker();
                  }
                } catch (err) {}
              }}
              max={new Date().toISOString().split('T')[0]}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />
          </div>
        </div>

          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-100 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-700 dark:text-neutral-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
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
