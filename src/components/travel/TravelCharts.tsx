'use client'

import React, { useState, useMemo } from 'react'
import { TravelAnalyticsResponse, MetricKey, ChartMode, METRIC_CONFIGS, MonthlySummary, MONTH_NAMES, FULL_MONTH_NAMES } from './travel-chart-types'
import TravelChartToolbar from './TravelChartToolbar'
import TravelMetricSwitcher from './TravelMetricSwitcher'
import TravelLineChartCanvas from './TravelLineChartCanvas'

interface TravelChartsProps {
  selectedYear: number
  onYearChange: (year: number) => void
  compareYear: number
  onCompareYearChange: (year: number) => void
  analytics?: TravelAnalyticsResponse
  compareAnalytics?: TravelAnalyticsResponse
  isLoading?: boolean
}

export default function TravelCharts({
  selectedYear,
  onYearChange,
  compareYear,
  onCompareYearChange,
  analytics,
  compareAnalytics,
  isLoading = false
}: TravelChartsProps) {
  // Active metric displayed on the single hero chart
  const [activeMetric, setActiveMetric] = useState<MetricKey>('spend')

  // Chart view mode: 'comparison' (Dual Line YoY) or 'difference' (Net Difference Line)
  const [chartMode, setChartMode] = useState<ChartMode>('comparison')

  // Selected months filter (1-12)
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(
    new Set(Array.from({ length: 12 }, (_, i) => i + 1))
  )

  // Available years from analytics
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>()
    yearsSet.add(selectedYear)
    yearsSet.add(compareYear)
    yearsSet.add(new Date().getFullYear())
    yearsSet.add(new Date().getFullYear() - 1)

    if (analytics?.yearly?.length) {
      analytics.yearly.forEach(y => yearsSet.add(y.year))
    }
    if (compareAnalytics?.yearly?.length) {
      compareAnalytics.yearly.forEach(y => yearsSet.add(y.year))
    }

    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [analytics, compareAnalytics, selectedYear, compareYear])

  // Quick month selectors
  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => {
      const next = new Set(prev)
      if (next.has(month)) {
        if (next.size > 1) next.delete(month)
      } else {
        next.add(month)
      }
      return next
    })
  }

  const selectAllMonths = () => {
    setSelectedMonths(new Set(Array.from({ length: 12 }, (_, i) => i + 1)))
  }

  // Build unified month dataset for LineChart
  const chartData = useMemo(() => {
    const dataByMonth = new Map<number, { current?: MonthlySummary; compare?: MonthlySummary }>()

    for (let m = 1; m <= 12; m++) {
      dataByMonth.set(m, {})
    }

    if (analytics?.monthly) {
      analytics.monthly
        .filter(m => m.year === selectedYear)
        .forEach(m => {
          const entry = dataByMonth.get(m.month) || {}
          entry.current = m
          dataByMonth.set(m.month, entry)
        })
    }

    if (compareAnalytics?.monthly) {
      compareAnalytics.monthly
        .filter(m => m.year === compareYear)
        .forEach(m => {
          const entry = dataByMonth.get(m.month) || {}
          entry.compare = m
          dataByMonth.set(m.month, entry)
        })
    }

    const rows = Array.from(dataByMonth.entries())
      .filter(([month]) => selectedMonths.has(month))
      .sort(([a], [b]) => a - b)
      .map(([month, data]) => {
        const cur = data.current
        const comp = data.compare

        const spendCur = cur ? Number(cur.totalAmount) || 0 : 0
        const spendComp = comp ? Number(comp.totalAmount) || 0 : 0

        const distCur = cur ? Number(cur.totalKmTraveled) || 0 : 0
        const distComp = comp ? Number(comp.totalKmTraveled) || 0 : 0

        const effCur = cur ? Number(cur.averageEfficiency) || 0 : 0
        const effComp = comp ? Number(comp.averageEfficiency) || 0 : 0

        const litersCur = cur ? Number(cur.totalLiters) || 0 : 0
        const litersComp = comp ? Number(comp.totalLiters) || 0 : 0

        const spendDiff = spendCur - spendComp
        const distDiff = distCur - distComp
        const effDiff = Number((effCur - effComp).toFixed(2))
        const litersDiff = Number((litersCur - litersComp).toFixed(1))

        return {
          month,
          monthName: MONTH_NAMES[month - 1],
          fullMonthName: FULL_MONTH_NAMES[month - 1],
          // Spend
          spendCurrent: spendCur,
          spendCompare: spendComp,
          spendDiff,
          // Distance
          distanceCurrent: distCur,
          distanceCompare: distComp,
          distanceDiff: distDiff,
          // Efficiency
          efficiencyCurrent: effCur,
          efficiencyCompare: effComp,
          efficiencyDiff: effDiff,
          // Fuel Liters
          litersCurrent: litersCur,
          litersCompare: litersComp,
          litersDiff
        }
      })

    return rows
  }, [analytics, compareAnalytics, selectedYear, compareYear, selectedMonths])

  const activeConfig = METRIC_CONFIGS[activeMetric]

  // Calculate high-level totals across the active months
  const activeTotals = useMemo(() => {
    let sumCur = 0
    let sumComp = 0
    let countCur = 0
    let countComp = 0

    chartData.forEach(row => {
      const curVal = (row as any)[activeConfig.currentKey]
      const compVal = (row as any)[activeConfig.compareKey]
      if (typeof curVal === 'number') {
        sumCur += curVal
        if (curVal > 0) countCur++
      }
      if (typeof compVal === 'number') {
        sumComp += compVal
        if (compVal > 0) countComp++
      }
    })

    if (activeMetric === 'efficiency') {
      sumCur = countCur > 0 ? sumCur / countCur : 0
      sumComp = countComp > 0 ? sumComp / countComp : 0
    }

    const diff = sumCur - sumComp
    const pct = sumComp !== 0 ? (diff / sumComp) * 100 : null

    return { sumCur, sumComp, diff, pct }
  }, [chartData, activeMetric, activeConfig])

  // Calculate guaranteed healthy Y-Axis domain max
  const yDomainMax = useMemo(() => {
    let max = 0
    chartData.forEach(row => {
      const cur = Number((row as any)[activeConfig.currentKey]) || 0
      const comp = Number((row as any)[activeConfig.compareKey]) || 0
      const diff = Math.abs(Number((row as any)[activeConfig.diffKey]) || 0)

      if (chartMode === 'difference') {
        if (diff > max) max = diff
      } else {
        if (cur > max) max = cur
        if (comp > max) max = comp
      }
    })
    return max > 0 ? Math.ceil(max * 1.25) : 100
  }, [chartData, activeConfig, chartMode])

  const isPositiveTotal = activeConfig.isHigherBetter
    ? activeTotals.diff >= 0
    : activeTotals.diff <= 0

  return (
    <div className="space-y-4">
      {/* 1. Compact Controls Toolbar (Base Year, Compare Year, Month Filter) */}
      <TravelChartToolbar
        selectedYear={selectedYear}
        onYearChange={onYearChange}
        compareYear={compareYear}
        onCompareYearChange={onCompareYearChange}
        availableYears={availableYears}
        selectedMonths={selectedMonths}
        toggleMonth={toggleMonth}
        selectAllMonths={selectAllMonths}
        activeConfig={activeConfig}
      />

      {/* 2. Pure Line Comparison Chart Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-sm">
        {/* Top Header: Title, Live Difference Numbers, and Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          {/* Left Title */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"
                style={{ backgroundColor: activeConfig.colorCurrent }}
              />
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {activeConfig.label} Line Chart
              </h4>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {activeConfig.sublabel} ({selectedYear} vs {compareYear})
            </p>
          </div>

          {/* Right: Live YoY Difference & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            {/* Live YoY Difference Counters */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-neutral-800/80 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-neutral-700/60 text-[11px] sm:text-xs overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeConfig.colorCurrent }} />
                <span className="font-bold font-mono text-slate-900 dark:text-white">{activeConfig.formatVal(activeTotals.sumCur)}</span>
              </div>
              <span className="text-slate-300 dark:text-neutral-600">vs</span>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeConfig.colorCompare }} />
                <span className="font-bold font-mono text-slate-700 dark:text-neutral-300">{activeConfig.formatVal(activeTotals.sumComp)}</span>
              </div>
              <span className="text-slate-300 dark:text-neutral-600">|</span>
              <span className={`font-bold font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
                isPositiveTotal
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
              }`}>
                {activeTotals.diff > 0 ? '+' : ''}{activeConfig.formatVal(activeTotals.diff)}
                {activeTotals.pct !== null && ` (${activeTotals.diff > 0 ? '+' : ''}${activeTotals.pct.toFixed(0)}%)`}
              </span>
            </div>

            {/* Line View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setChartMode('comparison')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-xs ${
                  chartMode === 'comparison'
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
                }`}
              >
                YoY Lines
              </button>
              <button
                type="button"
                onClick={() => setChartMode('difference')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-xs ${
                  chartMode === 'difference'
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
                }`}
              >
                Net Diff (Δ)
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas - Pure Line Chart */}
        <TravelLineChartCanvas
          chartData={chartData}
          chartMode={chartMode}
          activeConfig={activeConfig}
          yDomainMax={yDomainMax}
          selectedYear={selectedYear}
          compareYear={compareYear}
        />
      </div>

      {/* 3. Metric Toggle Pill Switcher Below the Chart */}
      <TravelMetricSwitcher
        activeMetric={activeMetric}
        onSelectMetric={setActiveMetric}
      />
    </div>
  )
}
