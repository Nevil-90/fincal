/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
// FIXED: Added 'X' to the lucide-react imports
import { Plus, Car, Fuel, TrendingUp, Calendar, Trash2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import TravelSummaryCards from './travel/TravelSummaryCards'
import TravelSummaryList from './travel/TravelSummaryList'
import TravelList from './travel/TravelList'
import { useTravelEntries, useTravelAnalytics } from '@/hooks/useApi'

interface TravelEntry {
  id: string
  startDate: string
  endDate: string
  startKm: number
  endKm: number
  amount: number
  liters: number
  description?: string
}

interface TravelSummary {
  totalKmTraveled: number
  totalAmount: number
  totalLiters: number
  averageEfficiency: number
  averagePricePerLiter: number
  totalEntries: number
}

interface MonthlySummary extends TravelSummary {
  month: number
  year: number
  monthName: string
}

interface YearlySummary extends TravelSummary {
  year: number
}

const monthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

const calcDelta = (current: number, previous: number) => {
  const delta = current - previous
  const pct = previous === 0 ? null : (delta / previous) * 100
  const direction = delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down'
  return { delta, pct, direction }
}

const formatDeltaPct = (pct: number | null) => {
  if (pct === null || Number.isNaN(pct)) return 'n/a'
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
}

const formatSignedMetric = (value: number, formatter: (value: number) => string) => {
  if (value === 0) return formatter(0)
  const prefix = value > 0 ? '+' : '-'
  return `${prefix}${formatter(Math.abs(value))}`
}

export default function TravelingTab() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const { entries: travelEntries, pagination, isLoading: loadingEntries, mutate: mutateEntries } = useTravelEntries(currentPage)
  const { analytics, isLoading: loadingAnalytics, mutate: mutateAnalytics } = useTravelAnalytics(selectedYear)
  const { analytics: prevYearAnalytics, mutate: mutatePrevYearAnalytics } = useTravelAnalytics(selectedYear - 1)

  const loading = loadingEntries || loadingAnalytics

  const [showAddForm, setShowAddForm] = useState(false)
  const [insightsMonth, setInsightsMonth] = useState<number | 'all'>(new Date().getMonth() + 1)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'insights' | 'charts' | 'entries'>('overview')

  const { data: staticData, manager: staticManager } = useEnhancedStaticData()
  
  const defaultFuelPrice = Number(staticData.userSettings?.defaultFuelPrice) || 0
  const overrideTravelCalc = staticData.userSettings?.overrideTravelCalc === 'true'

  useScrollLock(showAddForm)

  const [selectedChartMonths, setSelectedChartMonths] = useState<Set<number>>(new Set(Array.from({ length: 12 }, (_, i) => i + 1)))

  const toggleChartMonth = (month: number) => {
    setSelectedChartMonths(prev => {
      const next = new Set(prev)
      if (next.has(month)) {
        next.delete(month)
      } else {
        next.add(month)
      }
      return next
    })
  }

  const handleSelectAllMonths = () => {
    setSelectedChartMonths(new Set(Array.from({ length: 12 }, (_, i) => i + 1)))
  }

  const handleClearAllMonths = () => {
    setSelectedChartMonths(new Set())
  }

  const tableRef = useRef<HTMLDivElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startKm: '',
    endKm: '',
    amount: '',
    liters: '',
    description: 'Traveling'
  })

  const latestEntry = useMemo(() => {
    if (travelEntries.length === 0) return null
    return [...travelEntries].sort((a, b) => {
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    })[0]
  }, [travelEntries])

  useEffect(() => {
    if (!showAddForm || !latestEntry) return

    const formatDateForInput = (dateString: string) => {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    setFormData(prev => ({
      ...prev,
      startDate: latestEntry.endDate ? formatDateForInput(latestEntry.endDate) : prev.startDate,
      startKm: latestEntry.endKm ? String(latestEntry.endKm) : prev.startKm,
      amount: '',
      liters: ''
    }))
  }, [showAddForm, latestEntry])

  const refreshAnalytics = useCallback(async () => {
    mutateAnalytics()
    mutatePrevYearAnalytics()
  }, [mutateAnalytics, mutatePrevYearAnalytics])

  useEffect(() => {
    if (analytics) {
      const availableYears = analytics.yearly?.map((item: YearlySummary) => item.year) || []
      if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
        const latestYear = Math.max(...availableYears)
        setSelectedYear(latestYear)
      }
    }
  }, [analytics, selectedYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await Promise.all([
          mutateEntries(),
          refreshAnalytics()
        ])
        setFormData({
          startDate: '',
          endDate: '',
          startKm: '',
          endKm: '',
          amount: '',
          liters: '',
          description: 'Traveling'
        })
        setShowAddForm(false)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error adding travel entry:', error)
      alert('Failed to add travel entry')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this travel entry?')) return

    try {
      const response = await fetch(`/api/travel?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await Promise.all([
          mutateEntries(),
          refreshAnalytics()
        ])
      } else {
        alert('Failed to delete travel entry')
      }
    } catch (error) {
      console.error('Error deleting travel entry:', error)
      alert('Failed to delete travel entry')
    }
  }

  const handleMultiDelete = async () => {
    if (selectedEntries.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedEntries.size} travel entries?`)) return

    try {
      const deletePromises = Array.from(selectedEntries).map(id =>
        fetch(`/api/travel?id=${id}`, { method: 'DELETE' })
      )
      
      const results = await Promise.all(deletePromises)
      const allSuccessful = results.every(response => response.ok)
      
      if (allSuccessful) {
        setSelectedEntries(new Set())
        await Promise.all([
          mutateEntries(),
          refreshAnalytics()
        ])
      } else {
        alert('Some entries failed to delete')
      }
    } catch (error) {
      console.error('Error deleting travel entries:', error)
      alert('Failed to delete travel entries')
    }
  }

  const handleSelectEntry = (id: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEntries(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedEntries.size === travelEntries.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(travelEntries.map(entry => entry.id)))
    }
  }

  const calculateDerivedData = (entry: TravelEntry, index: number) => {
    const kmTraveled = entry.endKm - entry.startKm
    const pricePerLiter = entry.amount / entry.liters
    const efficiency = kmTraveled / entry.liters
    const costPerKm = entry.amount / kmTraveled
    const days = Math.ceil((new Date(entry.endDate).getTime() - new Date(entry.startDate).getTime()) / (1000 * 60 * 60 * 24))

    const entriesUpToThis = travelEntries.slice(0, index + 1)
    const cumulativeKm = entriesUpToThis.reduce((total, e) => total + (e.endKm - e.startKm), 0)
    const cumulativeAmount = entriesUpToThis.reduce((total, e) => total + e.amount, 0)

    return {
      kmTraveled: Math.round(kmTraveled * 100) / 100,
      pricePerLiter: Math.round(pricePerLiter * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100,
      costPerKm: Math.round(costPerKm * 100) / 100,
      days: days || 1,
      cumulativeKm: Math.round(cumulativeKm * 100) / 100,
      cumulativeAmount: Math.round(cumulativeAmount * 100) / 100
    }
  }

  const availableInsightMonths = useMemo(() => {
    if (!analytics?.monthly?.length) return []
    return analytics.monthly
      .filter(month => month.year === selectedYear)
      .map(month => month.month)
      .sort((a, b) => b - a)
  }, [analytics, selectedYear])

  useEffect(() => {
    if (insightsMonth === 'all') return
    if (!availableInsightMonths.length) return
    if (!availableInsightMonths.includes(insightsMonth)) {
      setInsightsMonth(availableInsightMonths[0])
    }
  }, [availableInsightMonths, insightsMonth])

  const getMonthlyTotals = useCallback((
    month: number,
    year: number,
    data: { monthly: MonthlySummary[] } | null
  ): TravelSummary => {
    const match = data?.monthly?.find(item => item.year === year && item.month === month)
    if (match) return match
    return {
      totalKmTraveled: 0,
      totalAmount: 0,
      totalLiters: 0,
      averageEfficiency: 0,
      averagePricePerLiter: 0,
      totalEntries: 0
    }
  }, [])

  const currentMonthTotals = useMemo(() => {
    if (insightsMonth === 'all') {
      const match = analytics?.yearly?.find(item => item.year === selectedYear)
      if (match) return match
      return {
        totalKmTraveled: 0,
        totalAmount: 0,
        totalLiters: 0,
        averageEfficiency: 0,
        averagePricePerLiter: 0,
        totalEntries: 0
      }
    }
    return getMonthlyTotals(insightsMonth, selectedYear, analytics)
  }, [getMonthlyTotals, insightsMonth, selectedYear, analytics])

  const previousMonthTotals = useMemo(() => {
    if (insightsMonth === 'all') {
      const match = prevYearAnalytics?.yearly?.find(item => item.year === selectedYear - 1)
      if (match) return match
      return {
        totalKmTraveled: 0,
        totalAmount: 0,
        totalLiters: 0,
        averageEfficiency: 0,
        averagePricePerLiter: 0,
        totalEntries: 0
      }
    }
    const prevMonth = insightsMonth === 1 ? 12 : insightsMonth - 1
    const prevYear = insightsMonth === 1 ? selectedYear - 1 : selectedYear
    const dataSource = prevYear === selectedYear ? analytics : prevYearAnalytics
    return getMonthlyTotals(prevMonth, prevYear, dataSource)
  }, [getMonthlyTotals, insightsMonth, selectedYear, analytics, prevYearAnalytics])

  const sameMonthLastYearTotals = useMemo(() => {
    if (insightsMonth === 'all') {
      const match = prevYearAnalytics?.yearly?.find(item => item.year === selectedYear - 1)
      if (match) return match
      return {
        totalKmTraveled: 0,
        totalAmount: 0,
        totalLiters: 0,
        averageEfficiency: 0,
        averagePricePerLiter: 0,
        totalEntries: 0
      }
    }
    return getMonthlyTotals(insightsMonth, selectedYear - 1, prevYearAnalytics)
  }, [getMonthlyTotals, insightsMonth, selectedYear, prevYearAnalytics])

  const metricDefinitions = useMemo(() => ([
    {
      label: 'Distance',
      getValue: (summary: TravelSummary) => summary.totalKmTraveled,
      format: (value: number) => `${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`
    },
    {
      label: 'Fuel Spend',
      getValue: (summary: TravelSummary) => summary.totalAmount,
      format: (value: number) => formatCurrency(value)
    },
    {
      label: 'Fuel Volume',
      getValue: (summary: TravelSummary) => summary.totalLiters,
      format: (value: number) => `${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`
    },
    {
      label: 'Efficiency',
      getValue: (summary: TravelSummary) => summary.averageEfficiency,
      format: (value: number) => `${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} km/L`
    },
    {
      label: 'Cost per KM',
      getValue: (summary: TravelSummary) => summary.totalKmTraveled > 0
        ? summary.totalAmount / summary.totalKmTraveled
        : 0,
      format: (value: number) => `${formatCurrency(value)} / km`
    },
    {
      label: 'Entries',
      getValue: (summary: TravelSummary) => summary.totalEntries,
      format: (value: number) => value.toLocaleString('en-IN')
    }
  ]), [])

  const insightsMetrics = useMemo(() => {
    return metricDefinitions.map(metric => {
      const current = metric.getValue(currentMonthTotals)
      const previous = metric.getValue(previousMonthTotals)
      return {
        label: metric.label,
        current,
        previous,
        format: metric.format,
        delta: calcDelta(current, previous)
      }
    })
  }, [metricDefinitions, currentMonthTotals, previousMonthTotals])

  const yearOverYearMetrics = useMemo(() => {
    return metricDefinitions.map(metric => {
      const current = metric.getValue(currentMonthTotals)
      const previous = metric.getValue(sameMonthLastYearTotals)
      return {
        label: metric.label,
        current,
        previous,
        format: metric.format,
        delta: calcDelta(current, previous)
      }
    })
  }, [metricDefinitions, currentMonthTotals, sameMonthLastYearTotals])

  const monthlyChartSeries = useMemo(() => {
    if (!analytics?.monthly?.length) return []
    return analytics.monthly
      .filter(month => month.year === selectedYear)
      .sort((a, b) => a.month - b.month)
  }, [analytics, selectedYear])

  const filteredChartSeries = useMemo(() => {
    return monthlyChartSeries.filter(item => selectedChartMonths.has(item.month))
  }, [monthlyChartSeries, selectedChartMonths])

  const maxMonthlySpend = useMemo(() => {
    return Math.max(...monthlyChartSeries.map(item => item.totalAmount), 1)
  }, [monthlyChartSeries])

  const maxMonthlyDistance = useMemo(() => {
    return Math.max(...monthlyChartSeries.map(item => item.totalKmTraveled), 1)
  }, [monthlyChartSeries])

  const maxMonthlyEfficiency = useMemo(() => {
    return Math.max(...monthlyChartSeries.map(item => item.averageEfficiency), 1)
  }, [monthlyChartSeries])

  const currentMonthLabel = useMemo(() => {
    if (insightsMonth === 'all') return `${selectedYear} (All Months)`
    return monthLabel(selectedYear, insightsMonth)
  }, [selectedYear, insightsMonth])

  const previousMonthLabel = useMemo(() => {
    if (insightsMonth === 'all') return `${selectedYear - 1} (All Months)`
    const prevMonth = insightsMonth === 1 ? 12 : insightsMonth - 1
    const prevYear = insightsMonth === 1 ? selectedYear - 1 : selectedYear
    return monthLabel(prevYear, prevMonth)
  }, [selectedYear, insightsMonth])

  const sameMonthLastYearLabel = useMemo(() => {
    if (insightsMonth === 'all') return `${selectedYear - 1} (All Months)`
    return monthLabel(selectedYear - 1, insightsMonth)
  }, [selectedYear, insightsMonth])

  if (loading && travelEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/50 rounded-2xl border border-slate-100 border-dashed animate-pulse">
        <div className="h-8 w-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-slate-500">Loading your travel logs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 font-sans max-w-[1600px] mx-auto pb-24 md:pb-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Travel & Fuel Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your fuel expenses and vehicle efficiency over time.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedEntries.size > 0 && (
            <button
              onClick={handleMultiDelete}
              className="px-4 py-2 text-sm font-medium bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 flex items-center gap-2 transition-all shadow-sm ring-1 ring-inset ring-rose-600/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedEntries.size})
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600/50"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm">
        <div className="flex flex-row items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'insights', label: 'Insights' },
            { id: 'charts', label: 'Charts' },
            { id: 'entries', label: 'Entries' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as 'overview' | 'insights' | 'charts' | 'entries')}
              className={`flex-1 sm:flex-initial shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors text-center ${
                activeSubTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'overview' && analytics && (
        <TravelSummaryCards analytics={analytics} />
      )}

      {activeSubTab === 'overview' && analytics && (
        <TravelSummaryList 
          analytics={analytics} 
          selectedYear={selectedYear} 
          onYearChange={setSelectedYear} 
        />
      )}

      {activeSubTab === 'insights' && (
        <div className="space-y-4 sm:space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Travel Insights</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">Movement & Comparison Review</h3>
                <p className="text-sm text-slate-500 mt-1">Raw travel and fuel deltas across periods.</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 self-start lg:self-auto">
                Current period: {currentMonthLabel}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  {analytics?.yearly?.length ? (
                    analytics.yearly.map(year => (
                      <option key={year.year} value={year.year}>{year.year}</option>
                    ))
                  ) : (
                    <option value={selectedYear}>{selectedYear}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Month</label>
                <select
                  value={insightsMonth}
                  onChange={(e) => setInsightsMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="all">All Months</option>
                  {availableInsightMonths.length ? (
                    availableInsightMonths.map(month => (
                      <option key={month} value={month}>
                        {new Date(selectedYear, month - 1, 1).toLocaleDateString('en-IN', { month: 'long' })}
                      </option>
                    ))
                  ) : (
                    <option value={insightsMonth === 'all' ? 'all' : insightsMonth}>
                      {insightsMonth === 'all'
                        ? 'All Months'
                        : new Date(selectedYear, insightsMonth - 1, 1).toLocaleDateString('en-IN', { month: 'long' })}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1">
            {insightsMetrics.map(metric => (
              <div key={metric.label} className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 shadow-sm flex flex-col items-start justify-start">
                <div className="min-w-0 w-full">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">{metric.label}</p>
                </div>
                
                <div className="text-left w-full mt-2">
                  <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{metric.format(metric.current)}</p>
                  
                  <div className="flex items-center justify-between mt-2 text-[10px] sm:text-xs text-slate-500">
                    <span className="truncate">Prev: {metric.format(metric.previous)}</span>
                  </div>
                  
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold ${
                      metric.delta.direction === 'up'
                        ? 'bg-emerald-100 text-emerald-700'
                        : metric.delta.direction === 'down'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-200 text-slate-600'
                    }`}>
                      {formatSignedMetric(metric.delta.delta, metric.format)}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500">{formatDeltaPct(metric.delta.pct)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:[&>*:last-child:nth-child(odd)]:col-span-2">
            <div className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-5 sm:shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Month Comparison</p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">
                    {insightsMonth === 'all' ? 'Current Year vs Previous Year' : 'Current vs Previous Month'}
                  </h4>
                </div>
                <span className="text-xs font-semibold text-slate-500">{previousMonthLabel}</span>
              </div>

              <div className="mt-4 divide-y divide-slate-100 sm:divide-y-0 sm:space-y-3 text-sm">
                {insightsMetrics.map(metric => (
                  <div key={metric.label} className="flex items-center justify-between py-3.5 sm:rounded-xl sm:border sm:border-slate-100 sm:bg-slate-50/70 sm:px-4 sm:py-3">
                    <span className="font-semibold text-slate-700">{metric.label}</span>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{metric.format(metric.current)}</p>
                      <p className="text-xs text-slate-500">
                        {formatSignedMetric(metric.delta.delta, metric.format)} ({formatDeltaPct(metric.delta.pct)})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-5 sm:shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Year Comparison</p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">
                    {insightsMonth === 'all' ? 'Year-over-Year Comparison' : 'Current vs Same Month Last Year'}
                  </h4>
                </div>
                <span className="text-xs font-semibold text-slate-500">{sameMonthLastYearLabel}</span>
              </div>

              <div className="mt-4 divide-y divide-slate-100 sm:divide-y-0 sm:space-y-3 text-sm">
                {yearOverYearMetrics.map(metric => (
                  <div key={metric.label} className="flex items-center justify-between py-3.5 sm:rounded-xl sm:border sm:border-slate-100 sm:bg-slate-50/70 sm:px-4 sm:py-3">
                    <span className="font-semibold text-slate-700">{metric.label}</span>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{metric.format(metric.current)}</p>
                      <p className="text-xs text-slate-500">
                        {formatSignedMetric(metric.delta.delta, metric.format)} ({formatDeltaPct(metric.delta.pct)})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          <div className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-5 sm:shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Travel Charts
                </p>

                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Monthly Travel Movement
                </h3>
              </div>

              <div className="min-w-[180px]">
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Select Year
                </label>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  {analytics?.yearly?.length ? (
                    analytics.yearly.map((year) => (
                      <option key={year.year} value={year.year}>
                        {year.year}
                      </option>
                    ))
                  ) : (
                    <option value={selectedYear}>{selectedYear}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Month Multi-Selector */}
            <div className="mt-5 border-t border-slate-100/60 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Toggle Months
                </label>
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={handleSelectAllMonths}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearAllMonths}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 12 }, (_, i) => {
                  const m = i + 1
                  const mName = new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' })
                  const isSelected = selectedChartMonths.has(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleChartMonth(m)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-950'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 ring-1 ring-slate-200/40'
                      }`}
                    >
                      {mName}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {monthlyChartSeries.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 sm:[&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Monthly Spend</p>
                <div className="flex items-end justify-start sm:justify-center gap-2 sm:gap-3.5 overflow-x-auto pb-2 pt-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden h-48 w-full">
                  {filteredChartSeries.length ? (
                    filteredChartSeries.map(item => {
                      const heightPercent = Math.min((item.totalAmount / maxMonthlySpend) * 100, 100)
                      return (
                        <div key={`spend-${item.month}`} className="flex flex-col items-center flex-1 min-w-[38px] max-w-[50px] group relative">
                          <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {formatCurrency(item.totalAmount)}
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 mb-1.5 whitespace-nowrap">
                            {item.totalAmount >= 1000 ? `${(item.totalAmount / 1000).toFixed(0)}k` : item.totalAmount.toString()}
                          </span>
                          <div className="w-5 sm:w-7 bg-slate-50 rounded-t-md relative h-28 flex items-end border border-slate-100/50">
                            <div
                              className="w-full bg-slate-900 rounded-t-md transition-all duration-300 group-hover:bg-indigo-600"
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            {item.monthName.slice(0, 3)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-xs font-semibold text-slate-400 py-10">
                      No months selected
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Monthly Distance</p>
                <div className="flex items-end justify-start sm:justify-center gap-2 sm:gap-3.5 overflow-x-auto pb-2 pt-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden h-48 w-full">
                  {filteredChartSeries.length ? (
                    filteredChartSeries.map(item => {
                      const heightPercent = Math.min((item.totalKmTraveled / maxMonthlyDistance) * 100, 100)
                      return (
                        <div key={`distance-${item.month}`} className="flex flex-col items-center flex-1 min-w-[38px] max-w-[50px] group relative">
                          <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {item.totalKmTraveled.toLocaleString()} km
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 mb-1.5 whitespace-nowrap">
                            {item.totalKmTraveled >= 1000 ? `${(item.totalKmTraveled / 1000).toFixed(0)}k` : item.totalKmTraveled.toString()}
                          </span>
                          <div className="w-5 sm:w-7 bg-indigo-50/30 rounded-t-md relative h-28 flex items-end border border-indigo-100/30">
                            <div
                              className="w-full bg-indigo-600 rounded-t-md transition-all duration-300 group-hover:bg-indigo-700"
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            {item.monthName.slice(0, 3)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-xs font-semibold text-slate-400 py-10">
                      No months selected
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Efficiency Trend</p>
                <div className="flex items-end justify-start sm:justify-center gap-2 sm:gap-3.5 overflow-x-auto pb-2 pt-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden h-48 w-full">
                  {filteredChartSeries.length ? (
                    filteredChartSeries.map(item => {
                      const heightPercent = Math.min((item.averageEfficiency / maxMonthlyEfficiency) * 100, 100)
                      return (
                        <div key={`eff-${item.month}`} className="flex flex-col items-center flex-1 min-w-[38px] max-w-[50px] group relative">
                          <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {item.averageEfficiency} km/L
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 mb-1.5 whitespace-nowrap">
                            {item.averageEfficiency.toFixed(1)}
                          </span>
                          <div className="w-5 sm:w-7 bg-emerald-50/30 rounded-t-md relative h-28 flex items-end border border-emerald-100/30">
                            <div
                              className="w-full bg-emerald-500 rounded-t-md transition-all duration-300 group-hover:bg-emerald-600"
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            {item.monthName.slice(0, 3)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-xs font-semibold text-slate-400 py-10">
                      No months selected
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              No monthly analytics available for this year yet.
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'entries' && (
        <TravelList
          travelEntries={travelEntries}
          selectedEntries={selectedEntries}
          handleSelectEntry={handleSelectEntry}
          handleSelectAll={handleSelectAll}
          handleDelete={handleDelete}
          expandedEntryId={expandedEntryId}
          setExpandedEntryId={setExpandedEntryId}
          calculateDerivedData={calculateDerivedData}
          pagination={pagination}
          currentPage={currentPage}
          fetchTravelEntries={(page: number) => setCurrentPage(page)}
          loading={loading}
          tableRef={tableRef}
        />
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-semibold text-slate-900">Add Travel Entry</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5 [&>*:last-child:nth-child(odd)]:col-span-2">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Start Date</label>
                  <div className="relative w-full">
                    <div className="w-full px-3.5 py-2.5 text-sm bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl text-slate-900 flex items-center justify-between pointer-events-none transition-colors">
                      <span className={formData.startDate ? 'text-slate-900' : 'text-slate-400'}>
                        {formData.startDate
                          ? new Date(formData.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Select Date'}
                      </span>
                      <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-2">End Date</label>
                  <div className="relative w-full">
                    <div className="w-full px-3.5 py-2.5 text-sm bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl text-slate-900 flex items-center justify-between pointer-events-none transition-colors">
                      <span className={formData.endDate ? 'text-slate-900' : 'text-slate-400'}>
                        {formData.endDate
                          ? new Date(formData.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Select Date'}
                      </span>
                      <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 [&>*:last-child:nth-child(odd)]:col-span-2">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Start KM</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.startKm}
                    onChange={(e) => setFormData({ ...formData, startKm: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 transition-all"
                    placeholder="e.g. 15000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-2">End KM</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.endKm}
                    onChange={(e) => setFormData({ ...formData, endKm: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 transition-all"
                    placeholder="e.g. 15450"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5">
                <div>
                  <h4 className="text-[12px] font-semibold text-slate-800">Manual Entry Mode</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Disable auto-calc for custom fuel pricing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={overrideTravelCalc}
                    onChange={(e) => {
                      const val = e.target.checked ? 'true' : 'false'
                      staticManager.saveSetting('overrideTravelCalc', val)
                    }}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-5 [&>*:last-child:nth-child(odd)]:col-span-2">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => {
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
                    className="w-full px-3.5 py-2.5 text-sm bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Liters</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.liters}
                    onChange={(e) => {
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
                    className="w-full px-3.5 py-2.5 text-sm bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Description <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border-0 shadow-sm ring-1 ring-inset ring-slate-300 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-slate-900 transition-all placeholder:text-slate-400"
                  placeholder="Trip to Mumbai, Weekend getaway..."
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border-0 ring-1 ring-inset ring-slate-300 rounded-xl hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
      )}


    </div>
  )
}