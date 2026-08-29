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
      className={`transition-colors text-xs ${
        isSelected
          ? 'bg-indigo-50/50 dark:bg-indigo-950/30'
          : 'hover:bg-slate-50/80 dark:hover:bg-neutral-800/40'
      }`}
    >
      {/* Checkbox */}
      <td className="py-4 pl-5 pr-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleSelectEntry(entry.id)}
          className="rounded border-slate-300 dark:border-neutral-700 text-indigo-600 focus:ring-indigo-600 w-4 h-4 cursor-pointer"
        />
      </td>

      {/* Date & Period */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 shrink-0">
            <Calendar className="h-4 w-4 text-slate-500 dark:text-neutral-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{new Date(entry.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              <span className="text-slate-400 dark:text-neutral-500">→</span>
              <span>{new Date(entry.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-neutral-500">
              <span className="font-semibold text-slate-600 dark:text-neutral-400">{derived.days} days</span>
              <span>•</span>
              <span>~{dailyDistance.toFixed(1)} km/day</span>
            </div>
          </div>
        </div>
      </td>

      {/* Odometer Log */}
      <td className="py-4 px-4">
        <div className="font-mono text-xs text-slate-700 dark:text-neutral-300 font-semibold">
          {entry.startKm.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">→</span> {entry.endKm.toLocaleString('en-IN')}
        </div>
        <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
          Odometer Range
        </div>
      </td>

      {/* Net Distance */}
      <td className="py-4 px-4">
        <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200/50 dark:border-blue-800/40">
          +{derived.kmTraveled.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km
        </div>
      </td>

      {/* Fuel & Spend */}
      <td className="py-4 px-4">
        <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
          {formatCurrency(entry.amount)}
        </div>
        <div className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 mt-0.5 flex items-center gap-1.5">
          <span>{entry.liters} L</span>
          <span>@</span>
          <span>{formatCurrency(derived.pricePerLiter)}/L</span>
        </div>
      </td>

      {/* Efficiency */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${effBadge.classes}`}>
            {derived.efficiency} km/L
          </span>
        </div>
      </td>

      {/* Cost per KM */}
      <td className="py-4 px-4">
        <div className="font-mono text-xs font-bold text-slate-800 dark:text-neutral-200">
          {formatCurrency(derived.costPerKm)}
          <span className="text-[10px] font-normal text-slate-400">/km</span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 pr-5 pl-3 text-right">
        <button
          type="button"
          onClick={() => handleDelete(entry.id)}
          className="p-1.5 rounded-lg text-slate-400 dark:text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Delete record"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}
