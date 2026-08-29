import React from 'react'
import { IndianRupee, Car, Gauge, Fuel } from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'

export interface TravelSummary {
  totalKmTraveled: number
  totalAmount: number
  totalLiters: number
  averageEfficiency: number
  averagePricePerLiter: number
  totalEntries: number
}

export interface MonthlySummary extends TravelSummary {
  month: number
  year: number
  monthName: string
}

export interface YearlySummary extends TravelSummary {
  year: number
}

export interface TravelAnalyticsResponse {
  overall?: TravelSummary
  monthly?: MonthlySummary[]
  yearly?: YearlySummary[]
  recentEntries?: any[]
}

export type MetricKey = 'spend' | 'distance' | 'efficiency' | 'liters'
export type ChartMode = 'comparison' | 'difference'

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export interface MetricConfig {
  key: MetricKey
  label: string
  shortLabel: string
  sublabel: string
  unit: string
  isCurrency: boolean
  isHigherBetter: boolean
  currentKey: string
  compareKey: string
  diffKey: string
  colorCurrent: string
  colorCompare: string
  colorDiff: string
  icon: React.ComponentType<{ className?: string }>
  formatVal: (v: number) => string
  formatCompact: (v: number) => string
}

export const METRIC_CONFIGS: Record<MetricKey, MetricConfig> = {
  spend: {
    key: 'spend',
    label: 'Total Spend',
    shortLabel: 'Spend',
    sublabel: 'Fuel and travel expenses (₹)',
    unit: '₹',
    isCurrency: true,
    isHigherBetter: false,
    currentKey: 'spendCurrent',
    compareKey: 'spendCompare',
    diffKey: 'spendDiff',
    colorCurrent: '#4f46e5', // High contrast Indigo
    colorCompare: '#d97706', // High contrast Amber
    colorDiff: '#0284c7',    // High contrast Sky
    icon: IndianRupee,
    formatVal: (v: number) => formatCurrency(v),
    formatCompact: (v: number) => formatCompactCurrency(v)
  },
  distance: {
    key: 'distance',
    label: 'Distance Traveled',
    shortLabel: 'Distance',
    sublabel: 'Kilometers traveled (km)',
    unit: 'km',
    isCurrency: false,
    isHigherBetter: true,
    currentKey: 'distanceCurrent',
    compareKey: 'distanceCompare',
    diffKey: 'distanceDiff',
    colorCurrent: '#2563eb', // High contrast Blue
    colorCompare: '#ea580c', // High contrast Orange
    colorDiff: '#0891b2',    // High contrast Cyan
    icon: Car,
    formatVal: (v: number) => `${v.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`,
    formatCompact: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k km` : `${v.toFixed(0)} km`)
  },
  efficiency: {
    key: 'efficiency',
    label: 'Fuel Efficiency',
    shortLabel: 'Efficiency',
    sublabel: 'Average mileage performance (km/L)',
    unit: 'km/L',
    isCurrency: false,
    isHigherBetter: true,
    currentKey: 'efficiencyCurrent',
    compareKey: 'efficiencyCompare',
    diffKey: 'efficiencyDiff',
    colorCurrent: '#059669', // High contrast Emerald
    colorCompare: '#b45309', // High contrast Warm Amber
    colorDiff: '#0d9488',    // High contrast Teal
    icon: Gauge,
    formatVal: (v: number) => `${v.toFixed(1)} km/L`,
    formatCompact: (v: number) => `${v.toFixed(0)} km/L`
  },
  liters: {
    key: 'liters',
    label: 'Fuel Consumed',
    shortLabel: 'Fuel Volume',
    sublabel: 'Total fuel liters filled (L)',
    unit: 'L',
    isCurrency: false,
    isHigherBetter: false,
    currentKey: 'litersCurrent',
    compareKey: 'litersCompare',
    diffKey: 'litersDiff',
    colorCurrent: '#db2777', // High contrast Pink
    colorCompare: '#ca8a04', // High contrast Yellow
    colorDiff: '#e11d48',    // High contrast Rose
    icon: Fuel,
    formatVal: (v: number) => `${v.toFixed(1)} L`,
    formatCompact: (v: number) => `${v.toFixed(0)} L`
  }
}
