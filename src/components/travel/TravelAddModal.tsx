'use client'

import React, { useEffect } from 'react'
import { X, Compass, Plus, ArrowLeft } from 'lucide-react'
import CustomDateField from '@/components/ui/CustomDateField'

interface TravelAddModalProps {
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  formData: {
    startDate: string
    endDate: string
    startKm: string
    endKm: string
    amount: string
    liters: string
    description: string
  }
  setFormData: React.Dispatch<React.SetStateAction<{
    startDate: string
    endDate: string
    startKm: string
    endKm: string
    amount: string
    liters: string
    description: string
  }>>
  handleSubmit: (e: React.FormEvent) => void
  overrideTravelCalc: boolean
  onToggleOverrideCalc: (val: boolean) => void
  defaultFuelPrice: number
}

export default function TravelAddModal({
  isOpen,
  onClose,
  onBack,
  formData,
  setFormData,
  handleSubmit,
  overrideTravelCalc,
  onToggleOverrideCalc,
  defaultFuelPrice
}: TravelAddModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[200] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
      >
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
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Add Travel Entry
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                Log mileage, fuel consumption, and trip cost
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
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 no-scrollbar space-y-3 sm:space-y-3.5">
            {/* Start Date & End Date */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <CustomDateField
                  label="Start Date"
                  placeholder="Departure date"
                  required
                  value={formData.startDate}
                  onChange={val => setFormData(prev => ({ ...prev, startDate: val }))}
                />
              </div>
              <div>
                <CustomDateField
                  label="End Date"
                  placeholder="Return date"
                  required
                  value={formData.endDate}
                  onChange={val => setFormData(prev => ({ ...prev, endDate: val }))}
                />
              </div>
            </div>

            {/* Start KM & End KM */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Start KM <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.startKm}
                  onChange={e => setFormData({ ...formData, startKm: e.target.value })}
                  className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 text-base sm:text-xs bg-slate-50/70 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors font-semibold tabular-nums"
                  placeholder="e.g. 15000"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  End KM <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.endKm}
                  onChange={e => setFormData({ ...formData, endKm: e.target.value })}
                  className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 text-base sm:text-xs bg-slate-50/70 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors font-semibold tabular-nums"
                  placeholder="e.g. 15450"
                  required
                />
              </div>
            </div>

            {/* Manual Entry Toggle Card */}
            <div className="flex items-center justify-between bg-slate-50/70 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Manual Entry Mode</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">Disable auto-calc for custom fuel pricing</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={overrideTravelCalc}
                  onChange={e => onToggleOverrideCalc(e.target.checked)}
                />
                <div className="w-8 h-4.5 bg-slate-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Amount & Liters */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Amount (₹) <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => {
                    const amount = e.target.value
                    if (!overrideTravelCalc && defaultFuelPrice > 0 && amount !== '') {
                      const parsedAmount = parseFloat(amount)
                      if (!isNaN(parsedAmount)) {
                        const liters = (parsedAmount / defaultFuelPrice).toFixed(2)
                        setFormData({ ...formData, amount, liters: String(liters) })
                        return
                      }
                    }
                    setFormData({ ...formData, amount })
                  }}
                  className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 text-base sm:text-xs bg-slate-50/70 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors font-semibold tabular-nums"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Liters <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.liters}
                  onChange={e => {
                    const liters = e.target.value
                    if (!overrideTravelCalc && defaultFuelPrice > 0 && liters !== '') {
                      const parsedLiters = parseFloat(liters)
                      if (!isNaN(parsedLiters)) {
                        const amount = (parsedLiters * defaultFuelPrice).toFixed(2)
                        setFormData({ ...formData, liters, amount: String(amount) })
                        return
                      }
                    }
                    setFormData({ ...formData, liters })
                  }}
                  className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 text-base sm:text-xs bg-slate-50/70 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors font-semibold tabular-nums"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Description <span className="text-slate-400 dark:text-zinc-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-9 sm:h-9.5 px-3 sm:px-3.5 text-base sm:text-xs bg-slate-50/70 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors font-semibold"
                placeholder="e.g. Trip to Mumbai, Weekend getaway..."
              />
            </div>
          </div>

          {/* Sticky Modal Actions Footer */}
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#16161a]/60 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 sm:h-9.5 px-4 sm:px-5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16161a] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-9 sm:h-9.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save Travel Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
