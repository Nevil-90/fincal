// Tab showing travel and fuel logging data, including charts, aggregated insights,
// recent entries list, and support for multi-delete and bulk export.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, Car, Fuel, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/financial-utils'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import TravelSummaryCards from './travel/TravelSummaryCards'
import TravelSummaryList from './travel/TravelSummaryList'
import TravelList from './travel/TravelList'
import TravelCharts from './travel/TravelCharts'
import TravelAddModal from './travel/TravelAddModal'
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

export default function TravelingTab() {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<any>('date-desc')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [compareYear, setCompareYear] = useState(new Date().getFullYear() - 1)

  const { entries: travelEntries, pagination, isLoading: loadingEntries, mutate: mutateEntries } = useTravelEntries(currentPage, 10, '', sortBy)
  const { analytics, isLoading: loadingAnalytics, mutate: mutateAnalytics } = useTravelAnalytics(selectedYear)
  const { analytics: compareYearAnalytics, mutate: mutateCompareYearAnalytics } = useTravelAnalytics(compareYear)

  const loading = loadingEntries || loadingAnalytics

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'charts' | 'entries'>('overview')

  const { data: staticData, manager: staticManager } = useEnhancedStaticData()
  
  const defaultFuelPrice = Number(staticData.userSettings?.defaultFuelPrice) || 0
  const overrideTravelCalc = staticData.userSettings?.overrideTravelCalc === 'true'

  useScrollLock(showAddForm)

  const tableRef = useRef<HTMLDivElement>(null)

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
    mutateCompareYearAnalytics()
  }, [mutateAnalytics, mutateCompareYearAnalytics])

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
        toast.error(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error adding travel entry:', error)
      toast.error('Failed to add travel entry')
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
        toast.error('Failed to delete travel entry')
      }
    } catch (error) {
      console.error('Error deleting travel entry:', error)
      toast.error('Failed to delete travel entry')
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
        toast.error('Some entries failed to delete')
      }
    } catch (error) {
      console.error('Error deleting travel entries:', error)
      toast.error('Failed to delete travel entries')
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



  const isInitialLoad = (loadingEntries || loadingAnalytics) && travelEntries.length === 0 && !analytics
  if (isInitialLoad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-neutral-900/50 rounded-2xl border border-slate-100 dark:border-neutral-800 border-dashed animate-pulse">
        <div className="h-8 w-8 border-4 border-slate-200 dark:border-neutral-700 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Loading your travel logs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 font-sans max-w-[1600px] mx-auto pb-24 md:pb-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Travel & Fuel Tracking</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Monitor your fuel expenses and vehicle efficiency over time.</p>
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

      <div className="rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 p-2 shadow-sm">
        <div className="flex flex-row items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'charts', label: 'Charts' },
            { id: 'entries', label: 'Entries' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as 'overview' | 'charts' | 'entries')}
              className={`flex-1 sm:flex-initial shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors text-center ${
                activeSubTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 dark:bg-neutral-800'
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

      {activeSubTab === 'charts' && (
        <TravelCharts
          selectedYear={selectedYear}
          onYearChange={(y) => {
            setSelectedYear(y)
            if (compareYear === y) setCompareYear(y - 1)
          }}
          compareYear={compareYear}
          onCompareYearChange={setCompareYear}
          analytics={analytics}
          compareAnalytics={compareYearAnalytics}
          isLoading={loadingAnalytics}
        />
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
          sortBy={sortBy}
          setSortBy={(s: any) => {
            setSortBy(s)
            setCurrentPage(1)
          }}
          loading={loading}
          tableRef={tableRef}
        />
      )}

      <TravelAddModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        overrideTravelCalc={overrideTravelCalc}
        onToggleOverrideCalc={(val: boolean) => staticManager.saveSetting('overrideTravelCalc', val ? 'true' : 'false')}
        defaultFuelPrice={defaultFuelPrice}
      />
    </div>
  )
}