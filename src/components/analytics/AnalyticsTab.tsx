'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis,
  ComposedChart,
  ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import {
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle,
  TrendingUp, PieChart as PieIcon, Calendar, ShieldAlert,
  Flame, CreditCard, ChevronRight, Info
} from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { useAnalytics } from '@/hooks/useApi'
import CustomSelect from '@/components/ui/CustomSelect'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { SkeletonAnalytics } from '../ui/SkeletonCard'

type DateFilter = 'this_month' | 'last_3_months' | 'last_6_months' | 'last_12_months' | 'ytd' | 'all_time'
type AnalyticsLens = 'cashflow' | 'categories' | 'behavior' | 'anomalies'

interface AnalyticsTabProps {
  goals?: any[]
}

const C = {
  income: '#10b981',
  expense: '#f43f5e',
  net: '#3b82f6',
  amber: '#f59e0b',
  cyan: '#06b6d4',
}

const CAT = [
  '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4',
  '#84cc16', '#f97316', '#e879f9', '#14b8a6', '#6366f1'
]

const PERIODS: { v: DateFilter; l: string }[] = [
  { v: 'this_month', l: '1M' },
  { v: 'last_3_months', l: '3M' },
  { v: 'last_6_months', l: '6M' },
  { v: 'last_12_months', l: '12M' },
  { v: 'ytd', l: 'YTD' },
  { v: 'all_time', l: 'All' },
]

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-[#141418]/95 backdrop-blur-md border border-slate-200 dark:border-white/[0.12] rounded-xl px-3.5 py-3 shadow-2xl min-w-[140px] font-sans">
      {label && <p className="text-slate-500 dark:text-neutral-400 font-semibold mb-2 text-[10px] uppercase tracking-wider">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((e: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-700 dark:text-neutral-300 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
              {e.name}
            </span>
            <span className="tabular-nums font-semibold text-slate-900 dark:text-white text-xs">
              {e.name === 'Count' ? e.value : formatCompactCurrency(e.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScatterTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-white/95 dark:bg-[#141418]/95 backdrop-blur-md border border-slate-200 dark:border-white/[0.12] rounded-xl px-3.5 py-3 shadow-2xl font-sans">
      <p className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[200px]">{d.title || d.description}</p>
      {d.notes && <p className="text-slate-500 dark:text-neutral-400 text-[10px] truncate max-w-[200px]">{d.notes}</p>}
      <p className="text-slate-500 dark:text-neutral-400 text-[10px] mt-1">{d.category} · {d.date}</p>
      <p className={`tabular-nums font-semibold mt-1 text-xs ${d.isAnomaly ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-neutral-200'}`}>
        {formatCurrency(d.amount)} {d.isAnomaly ? ' (Unusual Outlier)' : ''}
      </p>
    </div>
  )
}

function PieTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-[#141418]/95 backdrop-blur-md border border-slate-200 dark:border-white/[0.12] rounded-xl px-3 py-2 shadow-2xl flex flex-col gap-0.5 font-sans">
      <p className="font-medium text-slate-700 dark:text-neutral-300 text-xs">{payload[0].name}</p>
      <p className="tabular-nums font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function Delta({ pct, inv }: { pct: number | null; inv?: boolean }) {
  if (pct == null) return <span className="text-[10px] text-neutral-500 tabular-nums">—</span>
  const good = inv ? pct <= 0 : pct >= 0
  const Icon = pct === 0 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${
      pct === 0 ? 'text-neutral-500' : good ? 'text-emerald-400' : 'text-rose-400'
    }`}>
      <Icon className="h-3 w-3" />
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

function ActivityHeatmap({ grid, maxTotal }: { grid: any; maxTotal: number }) {
  const [hovered, setHovered] = useState<any>(null)
  const [pos, setPos] = useState({ x: 0, y: 0, left: 0 })
  const CELL = 12, GAP = 3, STEP = CELL + GAP
  const totalWeeks = grid?.totalWeeks ?? 0
  const rows: (any | null)[][] = grid?.rows ?? []
  const months: { label: string; col: number }[] = grid?.months ?? []
  const svgWidth = totalWeeks * STEP + 40
  const svgHeight = 7 * STEP + 30

  const getColor = useCallback((cell: any) => {
    if (!cell || cell.total === 0) return undefined
    const isIncome = cell.income >= cell.expense
    const amount = isIncome ? cell.income : cell.expense
    const intensity = Math.min(amount / Math.max(maxTotal * 0.2, 1), 1)
    const alpha = Math.round(40 + intensity * 215)
    return `${isIncome ? C.income : C.expense}${alpha.toString(16).padStart(2, '0')}`
  }, [maxTotal])

  if (!totalWeeks) return null

  return (
    <div className="overflow-x-auto select-none pb-2 font-sans [scrollbar-width:thin]">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        style={{ minWidth: svgWidth, height: 'auto' }}
        className="block"
        onMouseLeave={() => setHovered(null)}
      >
        {months.map((m, i) => (
          <text key={i} x={m.col * STEP + 32} y={12} fontSize={10} fontWeight={500} className="fill-neutral-400">
            {m.label}
          </text>
        ))}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          i % 2 === 1 && (
            <text key={i} x={4} y={24 + i * STEP + CELL * 0.7} fontSize={9} fontWeight={500} className="fill-neutral-500">
              {d}
            </text>
          )
        ))}
        {rows.map((row, dayIdx) =>
          row.map((cell, weekIdx) => {
            if (!cell) return null
            const x = weekIdx * STEP + 32
            const y = 24 + dayIdx * STEP
            const fill = getColor(cell)
            return (
              <rect
                key={`${dayIdx}-${weekIdx}`}
                x={x} y={y} width={CELL} height={CELL} rx={2.5}
                fill={fill ?? 'currentColor'}
                className={fill ? '' : 'text-slate-200 dark:text-white/[0.04]'}
                style={{ cursor: cell.total > 0 ? 'pointer' : 'default' }}
                onMouseEnter={e => {
                  if (cell.total > 0) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setPos({ x: rect.right, y: rect.top, left: rect.left })
                    setHovered(cell)
                  }
                }}
              />
            )
          })
        )}
      </svg>
      {hovered && (
        <div
          className="fixed pointer-events-none bg-white/95 dark:bg-[#141418]/95 backdrop-blur-md border border-slate-200 dark:border-white/[0.12] rounded-xl px-3 py-2.5 shadow-2xl text-xs z-[100] min-w-[140px]"
          style={{
            left: pos.left + 158 > (typeof window !== 'undefined' ? window.innerWidth : 1000)
              ? pos.left - 150 - 8
              : pos.left + 8,
            top: pos.y + 70 > (typeof window !== 'undefined' ? window.innerHeight : 800)
              ? pos.y - 60
              : pos.y - 10
          }}
        >
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatDateForDisplay(hovered.key)}
          </p>
          <div className="tabular-nums mt-1.5 space-y-1">
            {hovered.income > 0 && <p className="text-emerald-600 dark:text-emerald-400 font-medium">+{formatCompactCurrency(hovered.income)}</p>}
            {hovered.expense > 0 && <p className="text-rose-600 dark:text-rose-400 font-medium">−{formatCompactCurrency(hovered.expense)}</p>}
            {hovered.income === 0 && hovered.expense === 0 && <p className="text-slate-400 dark:text-neutral-500 italic text-[10px]">No activity</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ title, children, className = '', noPad, headerRight }: {
  title: string; children: React.ReactNode; className?: string; noPad?: boolean; headerRight?: React.ReactNode
}) {
  return (
    <div className={`flex flex-col bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xs font-sans ${className}`}>
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#16161a]/60 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-slate-700 dark:text-neutral-300 tracking-wider uppercase">{title}</h3>
        {headerRight}
      </div>
      <div className={`flex-1 ${noPad ? '' : 'p-4 sm:p-5'}`}>{children}</div>
    </div>
  )
}

export default function AnalyticsTab({}: AnalyticsTabProps) {
  const [period, setPeriod] = useState<DateFilter>('last_3_months')
  const [activeLens, setActiveLens] = useState<AnalyticsLens>('cashflow')
  const [heatmapYear, setHeatmapYear] = useState<number>(new Date().getFullYear())
  const { analyticsData, isLoading } = useAnalytics(period, heatmapYear)

  const {
    kpis = { income: 0, expense: 0, netFlow: 0, savingsRate: 0, burnRate: 0 } as any,
    monthlyTrendData = [] as any[],
    timelineData = [] as any[],
    weekdayData = [] as any[],
    paymentMethodData = [] as any[],
    treemapData = [] as any[],
    anomalyData = [] as any[],
    pivotTableData = { columns: [] as string[], rows: [] as any[] },
    heatmapGrid = null as any,
    heatmapMaxTotal = 1 as number,
    compare = { metrics: [] as any[], currentSummary: { income: 0, expenses: 0, savings: 0, count: 0 } as any },
  } = analyticsData || {}

  const allCats = useMemo(() =>
    ((treemapData[0]?.children ?? []) as any[]).sort((a, b) => b.size - a.size)
    , [treemapData])
  const totalCatSpend = useMemo(() => allCats.reduce((s, c) => s + c.size, 0), [allCats])

  // Pareto 80/20 computation
  const paretoAnalysis = useMemo(() => {
    let acc = 0
    const topItems: Array<{ name: string; size: number; pct: number }> = []
    for (const cat of allCats) {
      acc += cat.size
      const pct = totalCatSpend > 0 ? (cat.size / totalCatSpend) * 100 : 0
      topItems.push({ name: cat.name, size: cat.size, pct })
      if (totalCatSpend > 0 && acc / totalCatSpend >= 0.8) break
    }
    return {
      topCategories: topItems,
      sharePct: totalCatSpend > 0 ? Math.round((acc / totalCatSpend) * 100) : 0,
      count: topItems.length
    }
  }, [allCats, totalCatSpend])

  const normalTxns = useMemo(() => (anomalyData || []).filter((a: any) => !a.isAnomaly), [anomalyData])
  const anomalyTxns = useMemo(() => (anomalyData || []).filter((a: any) => a.isAnomaly), [anomalyData])

  const incomeDelta = compare.metrics.find((m: any) => m.label === 'Total Income')?.delta?.pct ?? null
  const expenseDelta = compare.metrics.find((m: any) => m.label === 'Total Expenses')?.delta?.pct ?? null
  const savingsDelta = compare.metrics.find((m: any) => m.label === 'Net Savings')?.delta?.pct ?? null

  const netFlow = kpis.netFlow ?? 0
  const pivotRows = (pivotTableData?.rows ?? []) as any[]
  const pivotCols = (pivotTableData?.columns ?? []) as string[]
  const maxWeekday = useMemo(() => Math.max(...weekdayData.map((d: any) => d.total ?? 0), 1), [weekdayData])
  const peakDay = useMemo(() => weekdayData.reduce((best: any, d: any) => d.total > (best?.total ?? 0) ? d : best, null), [weekdayData])
  const totalPayments = useMemo(() => paymentMethodData.reduce((s: number, d: any) => s + (d.value ?? 0), 0), [paymentMethodData])

  if (isLoading && !analyticsData) {
    return <SkeletonAnalytics />
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 font-sans pb-24 md:pb-6">
      {/* 1. Header with Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Financial Intelligence & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Runway projections, Pareto category burn, weekday velocity, and anomaly detection.
          </p>
        </div>

        {/* Period Selector */}
        <div className="grid grid-cols-6 sm:inline-flex bg-slate-100/80 dark:bg-[#121215] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] gap-0.5 w-full sm:w-auto">
          {PERIODS.map(p => (
            <button
              key={p.v}
              type="button"
              onClick={() => setPeriod(p.v)}
              className={`flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                period === p.v
                  ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Executive KPI Strip (Compact, High-Density 4 Pillars) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Net Cashflow</span>
          <div className="mt-1">
            <p className={`text-lg sm:text-xl font-bold tabular-nums ${netFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netFlow >= 0 ? '+' : '-'}{formatCompactCurrency(Math.abs(netFlow))}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Delta pct={savingsDelta} />
              <span className="text-[10px] text-slate-400 dark:text-neutral-500">vs prior period</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Total Outflow</span>
          <div className="mt-1">
            <p className="text-lg sm:text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
              -{formatCompactCurrency(kpis.expense ?? 0)}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Delta pct={expenseDelta} inv />
              <span className="text-[10px] text-slate-400 dark:text-neutral-500">spend variance</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Savings Retention</span>
          <div className="mt-1">
            <p className={`text-lg sm:text-xl font-bold tabular-nums ${(kpis.savingsRate ?? 0) >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {(kpis.savingsRate ?? 0).toFixed(1)}%
            </p>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 block mt-1">Target benchmark: 20%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Burn Rate / Day</span>
          <div className="mt-1">
            <p className="text-lg sm:text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {formatCompactCurrency(kpis.burnRate ?? 0)}<span className="text-xs text-slate-400 dark:text-neutral-500 font-normal">/day</span>
            </p>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 block mt-1">Average daily velocity</span>
          </div>
        </div>
      </div>

      {/* 3. Analytics Lens Switcher (Solves the long vertical scrolling problem) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#121215] p-1 shadow-xs">
        <div className="grid grid-cols-4 sm:flex sm:flex-row items-center gap-1 w-full">
          {[
            { id: 'cashflow', label: 'Cashflow Dynamics', mobileLabel: 'Cashflow', icon: TrendingUp },
            { id: 'categories', label: 'Category Pareto', mobileLabel: 'Pareto', icon: PieIcon },
            { id: 'behavior', label: 'Behavioral Patterns', mobileLabel: 'Habits', icon: Calendar },
            { id: 'anomalies', label: 'Outliers & Audit', mobileLabel: 'Outliers', icon: ShieldAlert }
          ].map(lens => {
            const Icon = lens.icon
            const isActive = activeLens === lens.id
            return (
              <button
                key={lens.id}
                type="button"
                onClick={() => setActiveLens(lens.id as AnalyticsLens)}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1.5 sm:px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline truncate">{lens.label}</span>
                <span className="sm:hidden text-[11px] truncate">{lens.mobileLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Focused Dimension Panes */}

      {/* LENS 1: Cashflow Dynamics */}
      {activeLens === 'cashflow' && (
        <div className="space-y-4">
          <Card
            title="Monthly Revenue & Outflow Trajectory"
            headerRight={
              !isLoading && monthlyTrendData.length > 0 && (
                <div className="flex items-center gap-3 text-[10px] tabular-nums font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-emerald-500" />
                    <span className="text-slate-500 dark:text-neutral-400">In</span>
                    <span className="text-slate-900 dark:text-white">{formatCompactCurrency(kpis.income ?? 0)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-rose-500" />
                    <span className="text-slate-500 dark:text-neutral-400">Out</span>
                    <span className="text-slate-900 dark:text-white">{formatCompactCurrency(kpis.expense ?? 0)}</span>
                  </span>
                </div>
              )
            }
          >
            {isLoading ? (
              <div className="h-64 bg-slate-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
            ) : monthlyTrendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500">No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }} barGap={4}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} width={55} />
                  <Tooltip content={<Tip />} cursor={{ fill: 'currentColor', className: 'text-slate-200/50 dark:text-white/[0.03]' }} />
                  <Bar dataKey="income" name="Income" fill={C.income} radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="expense" name="Expenses" fill={C.expense} radius={[4, 4, 0, 0]} barSize={22} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Cumulative Cashflow Runway">
            {isLoading ? (
              <div className="h-60 bg-slate-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
            ) : timelineData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500">No timeline data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={timelineData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.net} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.net} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} minTickGap={30} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} width={55} />
                  <Tooltip content={<Tip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.3 }} />
                  <ReferenceLine y={0} stroke={C.expense} strokeDasharray="4 4" strokeWidth={1} opacity={0.4} />
                  <Area type="monotone" dataKey="balance" name="Balance" stroke={C.net} strokeWidth={2} fill="url(#gBal)" dot={false} activeDot={{ r: 4 }} />
                  <Bar dataKey="income" name="Inflow" fill={C.income} radius={[2, 2, 0, 0]} barSize={4} opacity={0.6} />
                  <Bar dataKey="expense" name="Outflow" fill={C.expense} radius={[2, 2, 0, 0]} barSize={4} opacity={0.6} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      )}

      {/* LENS 2: Category Pareto Concentration */}
      {activeLens === 'categories' && (
        <div className="space-y-4">
          {/* Pareto Insight Banner */}
          {paretoAnalysis.count > 0 && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
              <Flame className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Pareto Principle (80/20 Rule): </span>
                <span className="text-slate-600 dark:text-neutral-300">
                  Your top {paretoAnalysis.count} {paretoAnalysis.count === 1 ? 'category' : 'categories'} ({paretoAnalysis.topCategories.map(c => c.name).join(', ')}) account for <strong className="text-slate-900 dark:text-white tabular-nums">{paretoAnalysis.sharePct}%</strong> of total outflows.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Donut Distribution */}
            <Card title="Category Distribution" className="lg:col-span-2">
              {isLoading ? (
                <div className="h-60 bg-slate-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
              ) : allCats.length === 0 ? (
                <div className="h-60 flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500">No category data</div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full" style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={allCats.slice(0, 10)} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none" dataKey="size">
                          {allCats.slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={CAT[i % CAT.length]} />)}
                        </Pie>
                        <Tooltip content={<PieTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Total</span>
                      <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{formatCompactCurrency(totalCatSpend)}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                    {allCats.slice(0, 6).map((c: any, i: number) => {
                      const pct = totalCatSpend > 0 ? (c.size / totalCatSpend) * 100 : 0
                      return (
                        <div key={i} className="flex items-center justify-between text-xs min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CAT[i % CAT.length] }} />
                            <span className="text-slate-700 dark:text-neutral-300 truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2 tabular-nums shrink-0">
                            <span className="text-slate-900 dark:text-white font-medium">{formatCompactCurrency(c.size)}</span>
                            <span className="text-[10px] text-slate-400 dark:text-neutral-500">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* Ranked Breakdown List */}
            <Card title="Ranked Category Outflows" className="lg:col-span-3">
              <div className="space-y-3">
                {allCats.map((cat, i) => {
                  const pct = totalCatSpend > 0 ? (cat.size / totalCatSpend) * 100 : 0
                  const color = CAT[i % CAT.length]
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 w-4">{i + 1}</span>
                          <span className="font-medium text-slate-800 dark:text-neutral-200 truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5 tabular-nums">
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cat.size)}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* LENS 3: Behavioral Spending Patterns */}
      {activeLens === 'behavior' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekday Velocity */}
            <Card
              title="Burn Velocity by Weekday"
              headerRight={
                peakDay && !isLoading && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400">
                    <span>Peak:</span>
                    <span className="font-bold">{peakDay.day}</span>
                  </div>
                )
              }
            >
              {isLoading ? (
                <div className="h-64 bg-slate-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weekdayData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={16} layout="vertical">
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} />
                    <YAxis type="category" dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} cursor={{ fill: 'currentColor', className: 'text-slate-200/50 dark:text-white/[0.03]' }} />
                    <Bar dataKey="total" name="Spent" radius={[0, 4, 4, 0]}>
                      {weekdayData.map((d: any, i: number) => (
                        <Cell key={i} fill={d.total === maxWeekday ? C.expense : C.net} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Payment Method Distribution */}
            <Card title="Payment Method Share">
              {isLoading ? (
                <div className="h-64 bg-slate-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
              ) : paymentMethodData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500">No payment data</div>
              ) : (
                <div className="space-y-3.5">
                  {[...paymentMethodData].sort((a, b) => b.value - a.value).map((d: any, i: number) => {
                    const pct = totalPayments > 0 ? (d.value / totalPayments) * 100 : 0
                    const color = CAT[i % CAT.length]
                    return (
                      <div key={d.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                            <span className="font-medium text-slate-800 dark:text-neutral-200 truncate">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 tabular-nums">
                            <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(d.value)}</span>
                            <span className="text-[10px] text-slate-500 dark:text-neutral-400">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* 365-Day Activity Log */}
          <Card
            title={period === 'all_time' ? "Activity Calendar Heatmap" : "365-Day Activity Heatmap"}
            headerRight={
              compare.availableYears && compare.availableYears.length > 0 && (
                <div className="min-w-[85px]">
                  <CustomSelect
                    selectSize="xs"
                    value={heatmapYear}
                    onChange={(e) => setHeatmapYear(Number(e.target.value))}
                  >
                    {compare.availableYears.map((y: number) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </CustomSelect>
                </div>
              )
            }
          >
            {isLoading ? (
              <div className="h-32 bg-slate-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
            ) : !heatmapGrid ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500">No activity data</div>
            ) : (
              <div className="space-y-3">
                <ActivityHeatmap grid={heatmapGrid} maxTotal={heatmapMaxTotal} />
                <div className="flex items-center justify-end gap-3 text-[10px] text-slate-500 dark:text-neutral-400">
                  <span>Less</span>
                  <div className="flex items-center gap-1">
                    {[0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
                      <div key={i} className="h-2.5 w-2.5 rounded-[2px] bg-rose-500" style={{ opacity: o }} />
                    ))}
                  </div>
                  <span>More Outflow</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* LENS 4: Outliers & Audit */}
      {activeLens === 'anomalies' && (
        <div className="space-y-4">
          <Card
            title="Statistical Outlier Detection"
            headerRight={
              !isLoading && (
                <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  anomalyTxns.length > 0
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <AlertTriangle className="h-3 w-3" />
                  <span>{anomalyTxns.length} {anomalyTxns.length === 1 ? 'outlier' : 'outliers'} detected</span>
                </div>
              )
            }
          >
            {isLoading ? (
              <div className="h-56 bg-slate-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
            ) : anomalyData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500">No transaction data to evaluate</div>
            ) : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
                    <XAxis dataKey="rawDate" type="number" domain={['auto', 'auto']} tick={false} axisLine={false} tickLine={false} />
                    <YAxis dataKey="amount" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} width={55} />
                    <ZAxis range={[35, 35]} />
                    <Tooltip content={<ScatterTip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.3 }} />
                    <Scatter name="Normal" data={normalTxns} fill={C.net} fillOpacity={0.4} />
                    <Scatter name="Outlier" data={anomalyTxns} fill={C.expense} fillOpacity={0.9} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Flagged Outlier Transactions List */}
          {anomalyTxns.length > 0 && (
            <Card title="Flagged High-Variance Transactions">
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {anomalyTxns.map((txn: any) => (
                  <div key={txn.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{txn.title || txn.description}</p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                        {txn.category} • {formatDateForDisplay(txn.date)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(txn.amount)}
                      </span>
                      <span className="text-[9px] block text-rose-500 font-semibold uppercase">3x Above Mean</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Category Matrix */}
          {pivotRows.length > 0 && (
            <Card title="Category × Month Matrix" noPad>
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#16161a]">
                      <th className="sticky left-0 bg-slate-50 dark:bg-[#16161a] z-10 text-left px-4 py-3 font-semibold text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-white/[0.08]">
                        Category
                      </th>
                      {pivotCols.map(col => (
                        <th key={col} className="text-right px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-white/[0.08] whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                      <th className="text-right px-4 py-3 font-semibold text-[10px] uppercase tracking-wider text-slate-700 dark:text-neutral-300 border-b border-slate-200 dark:border-white/[0.08]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {pivotRows.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="sticky left-0 bg-white dark:bg-[#121215] px-4 py-2.5 font-medium text-slate-800 dark:text-neutral-200 border-r border-slate-200/80 dark:border-white/[0.06] whitespace-nowrap">
                          {row.category}
                        </td>
                        {pivotCols.map(col => {
                          const val = row[col] ?? 0
                          return (
                            <td key={col} className="px-3 py-2.5 text-right tabular-nums">
                              {val > 0 ? (
                                <span className="text-slate-900 dark:text-white font-medium">{formatCompactCurrency(val)}</span>
                              ) : (
                                <span className="text-slate-300 dark:text-neutral-600">—</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                          {formatCompactCurrency(Number(row.total ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
