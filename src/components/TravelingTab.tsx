'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, Trash2, Fuel, Navigation, BarChart3, ListFilter } from 'lucide-react'
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
import { TravelEntry, DerivedData } from './travel/travel-list-types'
import { SkeletonTraveling } from './ui/SkeletonCard'

interface YearlySummary {
  year: number
  totalKmTraveled: number
  totalAmount: number
  totalLiters: number
  averageEfficiency: number
  averagePricePerLiter: number
  totalEntries: number
}

export default function TravelingTab() {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('date-desc')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [compareYear, setCompareYear] = useState(new Date().getFullYear() - 1)

  const { entries: travelEntries, pagination, isLoading: loadingEntries, mutate: mutateEntries } = useTravelEntries(currentPage, 10, '', sortBy)
  const { analytics, isLoading: loadingAnalytics, mutate: mutateAnalytics } = useTravelAnalytics(selectedYear)
  const { analytics: compareYearAnalytics, mutate: mutateCompareYearAnalytics } = useTravelAnalytics(compareYear)

  const loading = loadingEntries || loadingAnalytics

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'entries' | 'charts'>('overview')

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
    if (!travelEntries || travelEntries.length === 0) return null
    return [...travelEntries].sort((a: TravelEntry, b: TravelEntry) => {
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    })[0]
  }, [travelEntries])

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    if (!showAddForm || !latestEntry) return

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
        toast.success('Travel & fuel log saved')
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
        toast.error(`Error: ${errorData.error || 'Failed to save'}`)
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
        toast.success('Log entry deleted')
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

  // Atomic bulk deletion via /api/travel?ids=id1,id2
  const handleMultiDelete = async () => {
    if (selectedEntries.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedEntries.size} travel entries?`)) return

    try {
      const idsParam = Array.from(selectedEntries).join(',')
      const response = await fetch(`/api/travel?ids=${idsParam}`, { method: 'DELETE' })
      
      if (response.ok) {
        toast.success(`Deleted ${selectedEntries.size} entries`)
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
      setSelectedEntries(new Set(travelEntries.map((entry: TravelEntry) => entry.id)))
    }
  }

  const calculateDerivedData = (entry: TravelEntry, index: number): DerivedData => {
    const kmTraveled = entry.endKm - entry.startKm
    const pricePerLiter = entry.amount / (entry.liters || 1)
    const efficiency = kmTraveled / (entry.liters || 1)
    const costPerKm = entry.amount / (kmTraveled || 1)
    const days = Math.ceil((new Date(entry.endDate).getTime() - new Date(entry.startDate).getTime()) / (1000 * 60 * 60 * 24))

    const entriesUpToThis = travelEntries.slice(0, index + 1)
    const cumulativeKm = entriesUpToThis.reduce((total: number, e: TravelEntry) => total + (e.endKm - e.startKm), 0)
    const cumulativeAmount = entriesUpToThis.reduce((total: number, e: TravelEntry) => total + e.amount, 0)

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

  if (loading && !analytics && (!travelEntries || travelEntries.length === 0)) {
    return <SkeletonTraveling />
  }

  return (
    <div className="space-y-4 font-sans max-w-[1600px] mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Travel & Fuel Logbook
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Vehicle telemetry, odometer logs, efficiency analysis, and fuel cost tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEntries.size > 0 && (
            <button
              type="button"
              onClick={handleMultiDelete}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete ({selectedEntries.size})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Log Trip</span>
          </button>
        </div>
      </div>

      {/* Subtab Segmented Switcher */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100 dark:bg-[#121215] p-1 shadow-xs">
        <div className="flex flex-row items-center gap-1 w-full">
          {[
            { id: 'overview', label: 'Telemetry & Pacing', icon: Navigation },
            { id: 'entries', label: 'Trip Logbook', icon: ListFilter },
            { id: 'charts', label: 'Efficiency Analytics', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as 'overview' | 'charts' | 'entries')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 dark:bg-white dark:text-black shadow-xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Panes */}
      {activeSubTab === 'overview' && analytics && (
        <div className="space-y-4">
          <TravelSummaryCards analytics={analytics} />
          <TravelSummaryList 
            analytics={analytics} 
            selectedYear={selectedYear} 
            onYearChange={setSelectedYear} 
          />
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
          sortBy={sortBy}
          setSortBy={(s: string) => {
            setSortBy(s)
            setCurrentPage(1)
          }}
          loading={loading}
          tableRef={tableRef}
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