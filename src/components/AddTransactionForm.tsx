// Add/Edit transaction modal form. Includes auto-categorization suggestions
// by storing mapping rules locally based on user description input.
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Calendar, ArrowLeft, Receipt } from 'lucide-react'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { useGoals } from '@/hooks/useApi'
import CustomDateField from '@/components/ui/CustomDateField'
import CustomSelect from '@/components/ui/CustomSelect'

interface AddTransactionFormProps {
  onClose: () => void
  onTransactionAdded: () => void
  onBack?: () => void
  initialData?: {
    id: string
    type: 'income' | 'expense'
    amount: number
    category: string
    title?: string | null
    description?: string | null
    notes?: string | null
    paymentMethod: string | null
    source: string | null
    date: string
    goalContribution?: { goalId: string } | null
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

export default function AddTransactionForm({ onClose, onTransactionAdded, onBack, initialData }: AddTransactionFormProps) {
  const { data: staticData } = useEnhancedStaticData()
  const { goals } = useGoals()
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense')
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [goalId, setGoalId] = useState(initialData?.goalContribution?.goalId || '')
  const [title, setTitle] = useState(initialData?.title || initialData?.description || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
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
    const trimmedTitle = title.trim()
    if (!trimmedTitle || trimmedTitle.length < 4) {
      setSuggestion(null)
      return
    }
    const key = trimmedTitle.toLowerCase()
    const rules = getLocalRules()
    const match = rules[key] || Object.entries(rules).find(([k]) => key.startsWith(k) || k.startsWith(key))?.[1]
    if (match) {
      if (['Subscriptions', 'Fuel'].includes(match.category) && match.type === 'expense') {
        setSuggestion(null)
      } else {
        setSuggestion(match as { category: string; type: 'income' | 'expense' })
      }
    } else {
      setSuggestion(null)
    }
  }, [title])

  const applySuggestion = () => {
    if (suggestion) {
      setType(suggestion.type)
      setCategory(suggestion.category)
      setSuggestion(null)
    }
  }

  const DEDICATED_MODULE_CATEGORIES = new Set(['Subscriptions', 'Fuel'])

  const categories = Array.from(new Set(type === 'income'
    ? staticData.incomeCategories.filter(c => c.isActive).map(c => c.name)
    : [
        ...staticData.expenseCategories
          .filter(c => c.isActive && (!DEDICATED_MODULE_CATEGORIES.has(c.name) || c.name === initialData?.category))
          .map(c => c.name),
        'Goals'
      ]))

  const sourcesOrPurposes = Array.from(new Set(type === 'income'
    ? staticData.incomeSources.filter(c => c.isActive).map(c => c.name)
    : staticData.expensePurposes.filter(c => c.isActive).map(c => c.name)))

  const paymentMethods = Array.from(new Set(
    staticData.paymentMethods.filter(c => c.isActive).map(c => c.name).length > 0
      ? staticData.paymentMethods.filter(c => c.isActive).map(c => c.name)
      : ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'UPI']
  ))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !paymentMethod || !title.trim()) return

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
          title: title.trim(),
          notes: notes.trim() || null,
          paymentMethod: paymentMethod || null,
          source: source || null,
          date,
          ...(category === 'Goals' && goalId ? { goalId } : {})
        }),
      })

      if (response.ok) {
        if (title.trim() && category) {
          saveLocalRule(title, category, type)
          fetch('/api/user/autocategorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rules: [{ keyword: title.toLowerCase().trim(), category, type }]
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
    <div className="flex flex-col w-full h-full overflow-hidden bg-white dark:bg-[#121215]">
      {/* Mobile handle pull bar */}
      <div className="flex sm:hidden justify-center pt-2.5 pb-1 shrink-0">
        <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
      </div>

      {/* Modal Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer shrink-0"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 shadow-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {initialData ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              Record standard income or expense entry
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#121215]">
        <div className="flex-1 overflow-y-auto px-5 py-3.5 no-scrollbar">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
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
          <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm font-semibold transition-all"
            placeholder="e.g. Grocery shopping, Salary, Dinner"
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

        <div className="col-span-2">
          <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
            Notes <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 text-slate-900 dark:text-white bg-slate-50/70 dark:bg-neutral-950 text-sm transition-all resize-y min-h-[56px]"
            placeholder="Add detailed notes, items list, or transaction remarks..."
          />
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

        <CustomSelect
          id="category"
          label="Category"
          value={category}
          onChange={(e) => {
            const nextCat = e.target.value
            setCategory(nextCat)
            if (nextCat !== 'Goals') {
              setGoalId('')
            }
          }}
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </CustomSelect>

        {category === 'Goals' && (
          <div className="col-span-2 sm:col-span-1 animate-in fade-in duration-150">
            <CustomSelect
              id="goalId"
              label="Savings Goal"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              required
            >
              <option value="">Select a goal</option>
              {(goals || []).map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.category || 'General'})
                </option>
              ))}
            </CustomSelect>
          </div>
        )}

        <CustomSelect
          id="source"
          label={type === 'income' ? 'Source (Optional)' : 'Purpose (Optional)'}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">{type === 'income' ? 'Select source' : 'Select purpose'}</option>
          {sourcesOrPurposes.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </CustomSelect>

        <CustomSelect
          id="paymentMethod"
          label="Payment Method"
          required
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="">Select payment method</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </CustomSelect>

        <div className="col-span-2">
          <CustomDateField
            id="date"
            label="Date"
            value={date}
            onChange={setDate}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-4 sm:px-5 py-3 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-neutral-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !amount || !category || !date}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Transaction')}
          </button>
        </div>
      </form>
    </div>
  )
}
