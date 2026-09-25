'use client'

import React from 'react'
import { Calendar, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { TravelEntry, DerivedData } from './travel-list-types'

interface TravelListRowProps {
  entry: TravelEntry
  index: number
  derived: DerivedData
  isSelected: boolean
  handleSelectEntry: (id: string) => void
  handleDelete: (id: string) => void
  getEfficiencyBadge: (efficiency: number) => { label: string; classes: string }
}

export default function TravelListRow({
  entry,
  derived,
  isSelected,
  handleSelectEntry,
  handleDelete,
  getEfficiencyBadge
}: TravelListRowProps) {
  const effBadge = getEfficiencyBadge(derived.efficiency)
  const dailyDistance = derived.days > 0 ? derived.kmTraveled / derived.days : derived.kmTraveled

  return (
    <tr
      className={`transition-colors text-xs font-sans ${
        isSelected
          ? 'bg-blue-50/50 dark:bg-blue-500/10'
          : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      {/* Checkbox */}
      <td className="py-3.5 pl-5 pr-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleSelectEntry(entry.id)}
          className="rounded border-slate-300 dark:border-white/[0.2] bg-white dark:bg-[#18181b] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
        />
      </td>

      {/* Date & Period */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-neutral-300 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 tabular-nums">
              <span>{new Date(entry.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              <span className="text-slate-400 dark:text-neutral-500">→</span>
              <span>{new Date(entry.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-neutral-400">
              <span className="font-semibold text-slate-700 dark:text-neutral-300">{derived.days} days</span>
              <span>•</span>
              <span className="tabular-nums">~{dailyDistance.toFixed(1)} km/day</span>
            </div>
          </div>
        </div>
      </td>

      {/* Odometer Log */}
      <td className="py-3.5 px-4">
        <div className="tabular-nums text-xs text-slate-900 dark:text-neutral-200 font-semibold">
          {entry.startKm.toLocaleString('en-IN')} <span className="text-slate-400 dark:text-neutral-500 font-normal">→</span> {entry.endKm.toLocaleString('en-IN')}
        </div>
        <div className="text-[10px] text-slate-400 dark:text-neutral-400 mt-0.5">
          Odometer Range
        </div>
      </td>

      {/* Net Distance */}
      <td className="py-3.5 px-4">
        <div className="inline-flex items-center gap-1 tabular-nums text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
          +{derived.kmTraveled.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km
        </div>
      </td>

      {/* Fuel & Spend */}
      <td className="py-3.5 px-4">
        <div className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">
          {formatCurrency(entry.amount)}
        </div>
        <div className="text-[11px] tabular-nums text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
          <span>{entry.liters} L</span>
          <span>@</span>
          <span>{formatCurrency(derived.pricePerLiter)}/L</span>
        </div>
      </td>

      {/* Efficiency */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums border ${effBadge.classes}`}>
            {derived.efficiency} km/L
          </span>
          <span className="text-[10px] text-slate-500 dark:text-neutral-400">{effBadge.label}</span>
        </div>
      </td>

      {/* Cost / KM */}
      <td className="py-3.5 px-4 tabular-nums text-xs font-semibold text-slate-800 dark:text-neutral-300">
        {formatCurrency(derived.costPerKm)}/km
      </td>

      {/* Actions */}
      <td className="py-3.5 pr-5 pl-3 text-right">
        <button
          type="button"
          onClick={() => handleDelete(entry.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="Delete entry"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}
