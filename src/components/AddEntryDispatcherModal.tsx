'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Receipt, Fuel, Repeat, Target, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import AddTransactionForm from './AddTransactionForm'
import TravelAddModal from './travel/TravelAddModal'
import RecurringForm from './recurring/RecurringForm'
import type { RecurringFormData } from './recurring/types'
import { AddGoalModal } from './goals/AddGoalModal'

type EntryType = 'select' | 'regular' | 'fuel' | 'recurring' | 'goal'

interface AddEntryDispatcherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddEntryDispatcherModal({
  isOpen,
  onClose,
  onSuccess,
}: AddEntryDispatcherModalProps) {
  const [activeModal, setActiveModal] = useState<EntryType>('select')
  const [selectedRadio, setSelectedRadio] = useState<'regular' | 'fuel' | 'recurring' | 'goal'>('regular')

  const { data: staticData, manager: staticManager } = useEnhancedStaticData()

  // Reset to selector when opened
  useEffect(() => {
    if (isOpen) {
      setActiveModal('select')
      setSelectedRadio('regular')
    }
  }, [isOpen])

  // --- 1. Fuel / Travel State & Logic ---
  const defaultFuelPrice = Number(staticData.userSettings?.defaultFuelPrice) || 0
  const overrideTravelCalc = staticData.userSettings?.overrideTravelCalc === 'true'

  const [fuelFormData, setFuelFormData] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0],
    startKm: '',
    endKm: '',
    amount: '',
    liters: '',
    description: 'Traveling'
  })

  // Pre-fetch latest fuel log to map previous endDate -> startDate and endKm -> startKm
  useEffect(() => {
    if (!isOpen || activeModal !== 'fuel') return

    const fetchLatestFuel = async () => {
      try {
        const res = await fetch('/api/travel?limit=1&sortBy=date-desc')
        if (res.ok) {
          const data = await res.json()
          const entries = data.entries || data || []
          if (Array.isArray(entries) && entries.length > 0) {
            const latest = entries[0]
            const formatDate = (dateStr: string) => {
              const d = new Date(dateStr)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              return `${y}-${m}-${day}`
            }

            setFuelFormData(prev => ({
              ...prev,
              startDate: latest.endDate ? formatDate(latest.endDate) : prev.startDate,
              startKm: latest.endKm != null ? String(latest.endKm) : prev.startKm,
              amount: '',
              liters: ''
            }))
          }
        }
      } catch {
        // Ignore fetch errors, keep defaults
      }
    }

    fetchLatestFuel()
  }, [isOpen, activeModal])

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fuelFormData)
      })
      if (res.ok) {
        toast.success('Travel & fuel log saved')
        onSuccess()
        onClose()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save travel entry')
      }
    } catch {
      toast.error('Network error saving travel entry')
    }
  }

  // --- 2. Recurring / Subscription State & Logic ---
  const [recLoading, setRecLoading] = useState(false)
  const [recFormData, setRecFormData] = useState<RecurringFormData>({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    paymentMethod: '',
    source: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    splitType: 'personal',
  })

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recFormData.amount || !recFormData.category) {
      toast.error('Please fill in amount and category')
      return
    }
    setRecLoading(true)
    try {
      if (recFormData.frequency === 'one-time') {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: recFormData.type,
            amount: parseFloat(recFormData.amount),
            category: recFormData.category,
            title: recFormData.description.trim() || 'One-Time Subscription',
            date: recFormData.startDate,
            paymentMethod: recFormData.paymentMethod || null,
            source: recFormData.source || null,
            notes: recFormData.notes || null,
            isOneTimeSubscription: true,
          })
        })
        if (res.ok) {
          toast.success('One-time cost recorded successfully')
          onSuccess()
          onClose()
        } else {
          const err = await res.json()
          toast.error(err.error || 'Failed to save one-time cost')
        }
      } else {
        const res = await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recFormData)
        })
        if (res.ok) {
          toast.success('Recurring transaction created successfully')
          onSuccess()
          onClose()
        } else {
          const err = await res.json()
          toast.error(err.error || 'Failed to create recurring item')
        }
      }
    } catch {
      toast.error('Network error saving item')
    } finally {
      setRecLoading(false)
    }
  }

  // --- 3. Savings Goal State & Logic ---
  const [goalFormData, setGoalFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    category: ''
  })

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalFormData.name || !goalFormData.targetAmount || !goalFormData.category.trim()) {
      toast.error('Please enter a goal name, target amount, and category')
      return
    }
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goalFormData,
          category: goalFormData.category.trim()
        })
      })
      if (res.ok) {
        toast.success('Savings milestone created!')
        onSuccess()
        onClose()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create savings goal')
      }
    } catch {
      toast.error('Network error creating goal')
    }
  }

  if (!isOpen) return null

  // --- Direct Specific Modal Rendering ---
  if (activeModal === 'fuel') {
    return (
      <TravelAddModal
        isOpen={true}
        onClose={onClose}
        onBack={() => setActiveModal('select')}
        formData={fuelFormData}
        setFormData={setFuelFormData}
        handleSubmit={handleFuelSubmit}
        overrideTravelCalc={overrideTravelCalc}
        onToggleOverrideCalc={(val: boolean) => staticManager.saveSetting('overrideTravelCalc', val ? 'true' : 'false')}
        defaultFuelPrice={defaultFuelPrice}
      />
    )
  }

  if (activeModal === 'recurring') {
    return (
      <RecurringForm
        formData={recFormData}
        setFormData={setRecFormData}
        onSubmit={handleRecurringSubmit}
        onCancel={onClose}
        onBack={() => setActiveModal('select')}
        formLoading={recLoading}
      />
    )
  }

  if (activeModal === 'goal') {
    return (
      <AddGoalModal
        isOpen={true}
        onClose={onClose}
        onBack={() => setActiveModal('select')}
        newGoal={goalFormData}
        setNewGoal={setGoalFormData}
        handleAddGoal={handleGoalSubmit}
      />
    )
  }

  if (activeModal === 'regular') {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
        >
          <AddTransactionForm
            onClose={onClose}
            onBack={() => setActiveModal('select')}
            onTransactionAdded={() => {
              onSuccess()
              onClose()
            }}
          />
        </div>
      </div>
    )
  }

  // --- Initial Selector Modal with Radio Buttons ---
  const options = [
    {
      id: 'regular' as const,
      title: 'Regular Transaction',
      description: 'Standard income or expense with category and payment method',
      icon: Receipt,
      iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'fuel' as const,
      title: 'Fuel / Travel Log',
      description: 'Mileage, odometer start/end KM, and fuel refill',
      icon: Fuel,
      iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'recurring' as const,
      title: 'Recurring / Subscription',
      description: 'Scheduled monthly/annual bill, subscription, or recurring salary',
      icon: Repeat,
      iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'goal' as const,
      title: 'Savings Goal',
      description: 'Target savings milestone and target date',
      icon: Target,
      iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
  ]

  const handleSelectRadio = (type: 'regular' | 'fuel' | 'recurring' | 'goal') => {
    setSelectedRadio(type)
    // Redirect directly to that specific modal
    setActiveModal(type)
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
      >
        {/* Mobile drag handle */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Add New Record
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              Which type of transaction do you want to add?
            </p>
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

        {/* Radio Options List */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto">
          {options.map((opt) => {
            const Icon = opt.icon
            const isSelected = selectedRadio === opt.id

            return (
              <label
                key={opt.id}
                onClick={() => handleSelectRadio(opt.id)}
                className={`group flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-blue-500/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                    : 'border-slate-200/90 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#16161a]/40 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/60 dark:hover:bg-[#16161a]'
                }`}
              >
                {/* Radio Input */}
                <div className="flex items-center justify-center shrink-0">
                  <input
                    type="radio"
                    name="transactionType"
                    value={opt.id}
                    checked={isSelected}
                    onChange={() => handleSelectRadio(opt.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 dark:border-zinc-600 group-hover:border-slate-400 dark:group-hover:border-zinc-500'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* Option Icon */}
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${opt.iconColor}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    {opt.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug truncate">
                    {opt.description}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 shrink-0 ${
                  isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-600'
                }`} />
              </label>
            )
          })}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 sm:h-9.5 px-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16161a] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setActiveModal(selectedRadio)}
            className="flex-1 h-9 sm:h-9.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
