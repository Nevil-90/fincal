'use client'

import React from 'react'
import { Calendar, X } from 'lucide-react'
import CustomDateField from '@/components/ui/CustomDateField'

interface TravelAddModalProps {
  isOpen: boolean
  onClose: () => void
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
  formData,
  setFormData,
  handleSubmit,
  overrideTravelCalc,
  onToggleOverrideCalc,
  defaultFuelPrice
}: TravelAddModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/45 dark:bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-neutral-800 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all">
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Travel Entry</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 dark:text-neutral-500 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5 [&>*:last-child:nth-child(odd)]:col-span-2">
            <div>
              <CustomDateField
                label="Start Date"
                required
                value={formData.startDate}
                onChange={val => setFormData(prev => ({ ...prev, startDate: val }))}
              />
            </div>
            <div>
              <CustomDateField
                label="End Date"
                required
                value={formData.endDate}
                onChange={val => setFormData(prev => ({ ...prev, endDate: val }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 [&>*:last-child:nth-child(odd)]:col-span-2">
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Start KM
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.startKm}
                onChange={e => setFormData({ ...formData, startKm: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 dark:text-white transition-all"
                placeholder="e.g. 15000"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                End KM
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.endKm}
                onChange={e => setFormData({ ...formData, endKm: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 dark:text-white transition-all"
                placeholder="e.g. 15450"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl p-3.5 mb-5">
            <div>
              <h4 className="text-[12px] font-semibold text-slate-800 dark:text-neutral-200">Manual Entry Mode</h4>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">Disable auto-calc for custom fuel pricing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={overrideTravelCalc}
                onChange={e => onToggleOverrideCalc(e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-neutral-900 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#34C759] dark:peer-checked:bg-[#34C759]"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-5 [&>*:last-child:nth-child(odd)]:col-span-2">
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Amount
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
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 dark:text-white transition-all"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Liters
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
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 dark:text-white transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
              Description <span className="text-slate-400 dark:text-neutral-500 font-normal normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:text-neutral-500"
              placeholder="Trip to Mumbai, Weekend getaway..."
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border-0 ring-1 ring-inset ring-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600/50"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
