'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis,
  ComposedChart, Line,
  ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatCompactCurrency } from '@/lib/financial-utils'
import { useAnalytics } from '@/hooks/useApi'
import CustomSelect from '@/components/ui/CustomSelect'

type DateFilter = 'this_month' | 'last_3_months' | 'last_6_months' | 'last_12_months' | 'ytd' | 'all_time'
interface AnalyticsTabProps { goals: any[] }

const C = {
  income: '#10b981',
  expense: '#f43f5e',
  net: '#3b82f6',
  amber: '#f59e0b',
  cyan: '#06b6d4',
}
const CAT = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#06b6d4', '#84cc16', '#f97316', '#e879f9', '#14b8a6', '#6366f1', '#34d399', '#60a5fa', '#fb923c', '#a78bfa']

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
    <div className="bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 shadow-2xl min-w-[140px]">
      {label && <p className="text-slate-500 dark:text-neutral-400 font-medium mb-2 text-[10px] uppercase tracking-wider">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((e: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-slate-600 dark:text-neutral-300 text-xs">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
              {e.name}
            </span>
            <span className="font-mono font-medium text-slate-900 dark:text-white text-xs">
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
    <div className="bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 shadow-2xl">
      <p className="font-semibold text-slate-800 dark:text-neutral-200 text-xs truncate max-w-[180px]">{d.description}</p>
      <p className="text-slate-500 dark:text-neutral-400 text-[10px] mt-1">{d.category} · {d.date}</p>
      <p className={`font-mono font-medium mt-1 text-xs ${d.isAnomaly ? 'text-red-500' : 'text-slate-800 dark:text-neutral-200'}`}>
        {formatCurrency(d.amount)} {d.isAnomaly ? ' (Anomaly)' : ''}
      </p>
    </div>
  )
}

function PieTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 shadow-2xl flex flex-col gap-1">
      <p className="font-medium text-slate-600 dark:text-neutral-300 text-xs">{payload[0].name}</p>
      <p className="font-mono font-medium text-slate-900 dark:text-white text-sm">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function Delta({ pct, inv }: { pct: number | null; inv?: boolean }) {
  if (pct == null) return <span className="text-[10px] text-slate-400 dark:text-neutral-600 font-mono">—</span>
  const good = inv ? pct <= 0 : pct >= 0
  const Icon = pct === 0 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium font-mono ${pct === 0 ? 'text-slate-500'
      : good ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-500 dark:text-rose-400'
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
    <div className="overflow-x-auto select-none pb-2">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        style={{ minWidth: svgWidth, height: 'auto' }}
        className="block"
        onMouseLeave={() => setHovered(null)}
      >
        {months.map((m, i) => (
          <text key={i} x={m.col * STEP + 32} y={12} fontSize={10} fontWeight={500}
            className="fill-slate-500 dark:fill-neutral-500">
            {m.label}
          </text>
        ))}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          i % 2 === 1 &&
          <text key={i} x={4} y={24 + i * STEP + CELL * 0.7} fontSize={9} fontWeight={500}
            className="fill-slate-400 dark:fill-neutral-600">
            {d}
          </text>
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
                className={fill ? '' : 'text-slate-100 dark:text-white/5'}
                style={{ cursor: cell.total > 0 ? 'pointer' : 'default' }}
                onMouseEnter={e => {
                  if (cell.total > 0) {
                    setHovered(cell)
                    const rect = e.currentTarget.getBoundingClientRect()
                    setPos({ x: rect.right, y: rect.top, left: rect.left })
                  }
                }}
              />
            )
          })
        )}
      </svg>
      {hovered && (
        <div
          className="fixed pointer-events-none bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2.5 shadow-xl text-xs z-[100] min-w-[140px]"
          style={{
            left: pos.left + 158 > (typeof window !== 'undefined' ? window.innerWidth : 1000)
              ? pos.left - 150 - 8
              : pos.left + 8,
            top: pos.y + 70 > (typeof window !== 'undefined' ? window.innerHeight : 800)
              ? pos.y - 60
              : pos.y - 10
          }}
        >
          <p className="font-semibold text-slate-800 dark:text-neutral-200">
            {new Date(hovered.key.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="font-mono mt-1.5 space-y-1">
            {hovered.income > 0 && <p className="text-emerald-600 dark:text-emerald-400">+{formatCompactCurrency(hovered.income)}</p>}
            {hovered.expense > 0 && <p className="text-rose-500 dark:text-rose-400">−{formatCompactCurrency(hovered.expense)}</p>}
            {hovered.income === 0 && hovered.expense === 0 && <p className="text-slate-400 dark:text-neutral-500 italic text-[10px]">No activity</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function Sk({ h = 'h-40' }: { h?: string }) {
  return <div className={`${h} w-full rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse`} />
}

function Card({ title, children, className = '', noPad, headerRight }: {
  title: string; children: React.ReactNode; className?: string; noPad?: boolean; headerRight?: React.ReactNode
}) {
  return (
    <div className={`flex flex-col bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 tracking-widest uppercase">{title}</h3>
        {headerRight}
      </div>
      <div className={`flex-1 ${noPad ? '' : 'p-5'}`}>{children}</div>
    </div>
  )
}

export default function AnalyticsTab({ goals }: AnalyticsTabProps) {
  const [period, setPeriod] = useState<DateFilter>('last_3_months')
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
    compare = { metrics: [] as any[], currentSummary: { income: 0, expenses: 0, savings: 0, count: 0 } as any, previousSummary: { income: 0, expenses: 0, savings: 0, count: 0 } as any },
  } = analyticsData || {}

  const allCats = useMemo(() =>
    ((treemapData[0]?.children ?? []) as any[]).sort((a, b) => b.size - a.size)
    , [treemapData])
  const totalCatSpend = useMemo(() => allCats.reduce((s, c) => s + c.size, 0), [allCats])

  const normalTxns = useMemo(() => (anomalyData || []).filter((a: any) => !a.isAnomaly), [anomalyData])
  const anomalyTxns = useMemo(() => (anomalyData || []).filter((a: any) => a.isAnomaly), [anomalyData])

  const incomeDelta = compare.metrics.find((m: any) => m.label === 'Total Income')?.delta?.pct ?? null
  const expenseDelta = compare.metrics.find((m: any) => m.label === 'Total Expenses')?.delta?.pct ?? null
  const savingsDelta = compare.metrics.find((m: any) => m.label === 'Net Savings')?.delta?.pct ?? null

  const netFlow = kpis.netFlow ?? 0
  const txnCount = analyticsData?.filteredTransactionsCount ?? 0
  const pivotRows = (pivotTableData?.rows ?? []) as any[]
  const pivotCols = (pivotTableData?.columns ?? []) as string[]
  const maxWeekday = useMemo(() => Math.max(...weekdayData.map((d: any) => d.total ?? 0), 1), [weekdayData])
  const peakDay = useMemo(() => weekdayData.reduce((best: any, d: any) => d.total > (best?.total ?? 0) ? d : best, null), [weekdayData])
  const totalPayments = useMemo(() => paymentMethodData.reduce((s: number, d: any) => s + (d.value ?? 0), 0), [paymentMethodData])

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-24 md:pb-12">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 font-medium">
            {period.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} · Financial deep dive
          </p>
        </div>
        <div className="inline-flex bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl border border-slate-200/50 dark:border-neutral-700/50 gap-0.5">
          {PERIODS.map(p => (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${period === p.v
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
              }`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Income', value: formatCompactCurrency(kpis.income ?? 0), pct: incomeDelta, inv: false, accent: C.income },
          { label: 'Expenses', value: formatCompactCurrency(kpis.expense ?? 0), pct: expenseDelta, inv: true, accent: C.expense },
          { label: 'Net Flow', value: formatCompactCurrency(Math.abs(netFlow)), pct: savingsDelta, inv: false, accent: netFlow >= 0 ? C.income : C.expense },
          { label: 'Savings Rate', value: `${(kpis.savingsRate ?? 0).toFixed(1)}%`, pct: null, inv: false, accent: C.amber },
          { label: 'Burn / Day', value: formatCompactCurrency(kpis.burnRate ?? 0), pct: null, inv: false, accent: C.cyan },
          { label: 'Transactions', value: String(txnCount), pct: null, inv: false, accent: '#8b5cf6' },
        ].map((k, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-2xl px-4 py-4 shadow-sm flex flex-col gap-2 relative overflow-hidden"
            style={{ borderLeftWidth: 3, borderLeftColor: k.accent, borderLeftStyle: 'solid' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 leading-none">{k.label}</p>
            <div>
              {isLoading
                ? <div className="h-7 w-20 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                : <p className="text-xl font-black font-mono text-slate-900 dark:text-white leading-none">{k.value}</p>
              }
              {!isLoading && (
                <div className="mt-1.5 h-4 flex items-center">
                  {k.pct !== null
                    ? <Delta pct={k.pct} inv={k.inv} />
                    : <span className="text-[10px] text-slate-300 dark:text-neutral-700 font-mono">—</span>
                  }
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── MONTHLY REVENUE & SPEND ─────────────────────────────────────────── */}
      <Card
        title="Monthly Revenue & Spend"
        headerRight={
          !isLoading && monthlyTrendData.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: C.income }} />
                <span className="text-slate-400 dark:text-neutral-500">In</span>
                <span className="text-slate-700 dark:text-neutral-200">{formatCompactCurrency(kpis.income ?? 0)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: C.expense }} />
                <span className="text-slate-400 dark:text-neutral-500">Out</span>
                <span className="text-slate-700 dark:text-neutral-200">{formatCompactCurrency(kpis.expense ?? 0)}</span>
              </span>
            </div>
          )
        }
      >
        {isLoading ? <Sk h="h-64" /> : monthlyTrendData.length === 0
          ? <div className="h-64 flex items-center justify-center text-sm text-slate-400">No data</div>
          : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }} barGap={4}>
                <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-slate-100 dark:text-white/5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#737373', fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} width={60} />
                <Tooltip content={<Tip />} cursor={{ fill: 'currentColor', className: 'text-slate-50 dark:text-white/5' }} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 12, fontWeight: 500, paddingTop: 16 }} />
                <Bar dataKey="income" name="Income" fill={C.income} radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" name="Expenses" fill={C.expense} radius={[4, 4, 0, 0]} barSize={20} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
      </Card>

      {/* ── CASH FLOW DYNAMICS + CATEGORY DISTRIBUTION ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Cash Flow Dynamics — kept exactly */}
        <Card title="Cash Flow Dynamics" className="lg:col-span-3">
          {isLoading ? <Sk h="h-60" /> : timelineData.length === 0
            ? <div className="h-60 flex items-center justify-center text-sm text-slate-400">No data</div>
            : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={timelineData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.net} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={C.net} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-slate-100 dark:text-white/5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} dy={10} minTickGap={30} />
                  <YAxis tick={{ fontSize: 11, fill: '#737373', fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} width={60} />
                  <Tooltip content={<Tip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '4 4', className: 'text-slate-200 dark:text-white/10' }} />
                  <ReferenceLine y={0} stroke={C.expense} strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
                  <Area type="monotone" dataKey="balance" name="Balance" stroke={C.net} strokeWidth={2} fill="url(#gBal)" dot={false} activeDot={{ r: 4 }} />
                  <Bar dataKey="income" name="In" fill={C.income} radius={[2, 2, 0, 0]} barSize={4} opacity={0.6} />
                  <Bar dataKey="expense" name="Out" fill={C.expense} radius={[2, 2, 0, 0]} barSize={4} opacity={0.6} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
        </Card>

        {/* Category Distribution — redesigned */}
        <Card title="Category Distribution" className="lg:col-span-2">
          {isLoading ? <Sk h="h-60" /> : allCats.length === 0
            ? <div className="h-60 flex items-center justify-center text-sm text-slate-400">No data</div>
            : (
              <div className="flex flex-col items-center gap-4">
                {/* Donut with centre total */}
                <div className="relative w-full" style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={allCats.slice(0, 10)} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none" dataKey="size">
                        {allCats.slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={CAT[i % CAT.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500">Total</span>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{formatCompactCurrency(totalCatSpend)}</span>
                  </div>
                </div>
                {/* Single-col legend */}
                <div className="w-full space-y-2.5">
                  {allCats.slice(0, 7).map((c: any, i: number) => {
                    const pct = totalCatSpend > 0 ? (c.size / totalCatSpend) * 100 : 0
                    return (
                      <div key={i} className="flex items-center gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CAT[i % CAT.length] }} />
                        <span className="text-xs text-slate-600 dark:text-neutral-400 truncate flex-1">{c.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-neutral-500 shrink-0">{pct.toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
        </Card>
      </div>

      {/* ── 365-DAY ACTIVITY LOG — kept exactly ────────────────────────────── */}
      <Card title={period === 'all_time' ? "Activity Log" : "365-Day Activity Log"} headerRight={
        period === 'all_time' && compare.availableYears && compare.availableYears.length > 0 && (
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
      }>
        {isLoading ? <Sk h="h-32" /> : !heatmapGrid
          ? <div className="h-32 flex items-center justify-center text-sm text-slate-400">No heatmap data</div>
          : (
            <div className="overflow-x-auto pb-2">
              <ActivityHeatmap grid={heatmapGrid} maxTotal={heatmapMaxTotal} />
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-4 ml-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Income</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Less</span>
                    {[0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
                      <div key={i} className="h-3 w-3 rounded-[3px]" style={{ background: C.income, opacity: o }} />
                    ))}
                    <span className="text-[10px] text-slate-400">More</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Expense</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Less</span>
                    {[0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
                      <div key={i} className="h-3 w-3 rounded-[3px]" style={{ background: C.expense, opacity: o }} />
                    ))}
                    <span className="text-[10px] text-slate-400">More</span>
                  </div>
                </div>
              </div>
            </div>
          )}
      </Card>

      {/* ── CATEGORY BREAKDOWN + SPEND BY WEEKDAY ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Category Breakdown — kept exactly */}
        <Card title="Category Breakdown" className="lg:col-span-3" noPad>
          {isLoading ? <div className="p-5"><Sk h="h-72" /></div> : allCats.length === 0
            ? <div className="h-72 flex items-center justify-center text-sm text-slate-400">No data</div>
            : (
              <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[350px] overflow-y-auto">
                {allCats.map((c: any, i: number) => {
                  const pct = totalCatSpend > 0 ? (c.size / totalCatSpend) * 100 : 0
                  const color = CAT[i % CAT.length]
                  return (
                    <div key={i} className="px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between mb-2 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-slate-400 w-4 shrink-0">{i + 1}</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-neutral-200 truncate">{c.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-sm font-mono font-medium text-slate-900 dark:text-white">{formatCompactCurrency(c.size)}</span>
                          <span className="block text-[10px] font-mono text-slate-500 mt-0.5">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </Card>

        {/* Spend by Weekday — redesigned header with peak chip */}
        <Card
          title="Spend by Weekday"
          className="lg:col-span-2"
          headerRight={
            peakDay && !isLoading && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400">
                <span>Peak</span>
                <span className="font-black">{peakDay.day}</span>
              </div>
            )
          }
        >
          {isLoading ? <Sk h="h-72" /> : (
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={weekdayData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={18} layout="vertical">
                <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-slate-100 dark:text-white/5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#737373', fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} />
                <YAxis type="category" dataKey="day" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: 'currentColor', className: 'text-slate-50 dark:text-white/5' }} />
                <Bar dataKey="total" name="Spent" radius={[0, 4, 4, 0]}>
                  {weekdayData.map((d: any, i: number) => (
                    <Cell key={i} fill={d.total === maxWeekday ? C.expense : C.net} fillOpacity={d.total === maxWeekday ? 1 : 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── PAYMENT METHODS + ANOMALY DETECTION ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Payment Method Share — redesigned as ranked list */}
        <Card
          title="Payment Method Share"
          headerRight={
            !isLoading && paymentMethodData.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-neutral-500">
                {paymentMethodData.length} {paymentMethodData.length === 1 ? 'method' : 'methods'}
              </span>
            )
          }
        >
          {isLoading ? <Sk h="h-56" /> : paymentMethodData.length === 0
            ? <div className="h-56 flex items-center justify-center text-sm text-slate-400">No data</div>
            : (
              <div className="space-y-4">
                {[...paymentMethodData]
                  .sort((a: any, b: any) => b.value - a.value)
                  .map((d: any, i: number) => {
                    const pct = totalPayments > 0 ? (d.value / totalPayments) * 100 : 0
                    const color = CAT[i % CAT.length]
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-mono font-bold text-slate-400 w-4 shrink-0 tabular-nums">{i + 1}</span>
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200 truncate">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{formatCompactCurrency(d.value)}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
        </Card>

        {/* Anomaly Detection — redesigned header + inline chip legend */}
        <Card
          title="Anomaly Detection"
          headerRight={
            !isLoading && (
              <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                anomalyTxns.length > 0
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
              }`}>
                <AlertTriangle className="h-3 w-3" />
                <span>{anomalyTxns.length} {anomalyTxns.length === 1 ? 'event' : 'events'}</span>
              </div>
            )
          }
        >
          {isLoading ? <Sk h="h-56" /> : anomalyData.length === 0
            ? <div className="h-56 flex items-center justify-center text-sm text-slate-400">No transaction data</div>
            : (
              <>
                {/* Inline chip legend — replaces Recharts Legend */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: C.net, opacity: 0.6 }} />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Normal</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-neutral-400 ml-0.5">{normalTxns.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: C.expense }} />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Anomaly</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-neutral-400 ml-0.5">{anomalyTxns.length}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                    <XAxis dataKey="rawDate" type="number" domain={['auto', 'auto']} tick={false} axisLine={false} tickLine={false} name="Date" />
                    <YAxis dataKey="amount" tick={{ fontSize: 11, fill: '#737373', fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} width={60} name="Amount" />
                    <ZAxis range={[40, 40]} />
                    <Tooltip content={<ScatterTip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '4 4', className: 'text-slate-200 dark:text-white/10' }} />
                    <Scatter name="Normal" data={normalTxns} fill={C.net} fillOpacity={0.4} />
                    <Scatter name="Anomaly" data={anomalyTxns} fill={C.expense} fillOpacity={0.9} />
                  </ScatterChart>
                </ResponsiveContainer>
              </>
            )}
        </Card>
      </div>

      {/* ── CATEGORY × MONTH PIVOT TABLE — redesigned ─────────────────────── */}
      {(isLoading || pivotRows.length > 0) && (
        <Card
          title="Category × Month Matrix"
          noPad
          headerRight={
            !isLoading && (
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-neutral-500">
                {pivotRows.length} {pivotRows.length === 1 ? 'category' : 'categories'}
              </span>
            )
          }
        >
          {isLoading ? <div className="p-5"><Sk h="h-60" /></div> :
            pivotRows.length === 0
              ? <div className="p-5"><div className="h-60 flex items-center justify-center text-sm text-slate-400">No data</div></div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-neutral-800/60">
                        <th className="sticky left-0 bg-slate-50 dark:bg-neutral-800/60 z-10 text-left px-3 sm:px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest text-slate-500 dark:text-neutral-400 border-b border-slate-200/80 dark:border-neutral-700">
                          Category
                        </th>
                        {pivotCols.map(col => (
                          <th key={col} className="text-right px-2 sm:px-4 py-3.5 font-bold text-[10px] uppercase tracking-widest text-slate-500 dark:text-neutral-400 border-b border-slate-200/80 dark:border-neutral-700 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                        <th className="text-right px-3 sm:px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-neutral-300 border-b border-slate-200/80 dark:border-neutral-700">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pivotRows.map((row: any, i: number) => {
                        const color = CAT[i % CAT.length]
                        const rowMax = Math.max(...pivotCols.map(c => row[c] ?? 0), 1)
                        return (
                          <tr
                            key={i}
                            className={`transition-colors group hover:bg-slate-50 dark:hover:bg-white/[0.025] ${
                              i % 2 !== 0 ? 'bg-slate-50/50 dark:bg-neutral-800/20' : ''
                            }`}
                          >
                            <td className="sticky left-0 bg-white dark:bg-neutral-900 group-hover:bg-slate-50 dark:group-hover:bg-neutral-800/50 z-10 px-3 sm:px-5 py-3 border-r border-slate-100 dark:border-neutral-800">
                              <div className="flex items-center gap-2.5">
                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                                <span className="font-semibold text-slate-900 dark:text-neutral-200 truncate max-w-[80px] sm:max-w-[120px]">
                                  {row.category}
                                </span>
                              </div>
                            </td>
                            {pivotCols.map(col => {
                              const val = row[col] ?? 0
                              const heat = val > 0 ? Math.min(val / rowMax, 1) : 0
                              const alpha = Math.round(heat * 0.4 * 255).toString(16).padStart(2, '0')
                              return (
                                <td key={col} className="px-1 sm:px-4 py-3 text-right">
                                  {val > 0 ? (
                                    <span
                                      className="inline-block font-mono font-semibold text-slate-900 dark:text-white px-1.5 sm:px-2 py-1 rounded-lg"
                                      style={{ background: color + alpha }}
                                    >
                                      {formatCompactCurrency(val)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 dark:text-neutral-700 font-mono">—</span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="px-3 sm:px-5 py-3 text-right">
                              <span className="font-mono font-black text-slate-900 dark:text-white">
                                {formatCompactCurrency(Number(row.total ?? 0))}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
        </Card>
      )}

    </div>
  )
}
