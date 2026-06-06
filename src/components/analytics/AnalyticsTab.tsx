'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  ComposedChart,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis,
  Sankey,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import {
  Activity, TrendingUp, Calendar, Download, AlertTriangle,
  Target, Zap, PieChart as PieChartIcon, BarChart2,
  ShieldAlert, Table as TableIcon, Clock, ArrowRightLeft,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { useEnhancedStaticData } from '@/lib/enhanced-static-data-manager'
import { useAnalytics } from '@/hooks/useApi'
import {
  COLORS, RADAR_COLORS, SCATTER_COLORS,
  cardClasses, headerClasses, subHeaderClasses,
  type AnalyticsTabProps, type DateFilter, type SubTab
} from './types'

export default function AnalyticsTab({ goals }: AnalyticsTabProps) {
  const { data: staticData } = useEnhancedStaticData()
  const [dateFilter, setDateFilter] = useState<DateFilter>('this_month')
  const [activeTab, setActiveTab] = useState<SubTab>('overview')
  const [heatmapTooltip, setHeatmapTooltip] = useState<{ x: number; y: number; date: string; income: number; expense: number } | null>(null)

  // Compare Tab State
  const [compareYear, setCompareYear] = useState<number>(new Date().getFullYear())
  const [compareMonth, setCompareMonth] = useState<number>(new Date().getMonth() + 1)

  const { analyticsData, isLoading } = useAnalytics(dateFilter, compareYear, compareMonth)

  // Use empty fallbacks while loading
  const {
    kpis = { netFlow: 0, savingsRate: 0, burnRate: 0 } as any,
    monthlyTrendData = [] as any[],
    heatmapData = [] as any[],
    heatmapGrid = { rows: [] as any[][], months: [] as any[], totalWeeks: 0 } as any,
    heatmapMaxTotal = 1 as number,
    timelineData = [] as any[],
    sankeyData = null as any,
    treemapData = [] as any[],
    pivotTableData = { columns: [] as string[], rows: [] as any[] } as any,
    paymentMethodData = [] as any[],
    anomalyData = [] as any[],
    radarData = [] as any[],
    weekdayData = [] as any[],
    goalForecastData = null as any,
    compare = {
      metrics: [] as any[],
      currentSummary: { income: 0, expenses: 0, savings: 0, count: 0, avgValue: 0 } as any,
      previousSummary: { income: 0, expenses: 0, savings: 0, count: 0, avgValue: 0 } as any,
      sameMonthLastYearSummary: { income: 0, expenses: 0, savings: 0, count: 0, avgValue: 0 } as any,
      availableYears: [new Date().getFullYear()] as number[]
    }
  } = analyticsData || {}

  const formatDeltaPct = (pct: number | null) => {
    if (pct === null || Number.isNaN(pct)) return 'n/a'
    return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
  }
  const formatDeltaValue = (value: number) => {
    if (value === 0) return formatCurrency(0)
    return `${value > 0 ? '+' : ''}${formatCurrency(value)}`
  }
  const formatCountDelta = (value: number) => {
    if (value === 0) return '0'
    return `${value > 0 ? '+' : ''}${value}`
  }

  const calcDelta = (current: number, previous: number) => {
    const delta = current - previous
    const pct = previous === 0 ? null : (delta / previous) * 100
    const direction = delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down'
    return { delta, pct, direction }
  }

  const { currentSummary, previousSummary, sameMonthLastYearSummary, availableYears, metrics: compareMetrics } = compare
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const getHeatColor = (cell: { income: number; expense: number; total: number }): string => {
    if (cell.total === 0) return 'bg-slate-100 dark:bg-neutral-800 '
    const ratio = cell.total / heatmapMaxTotal
    if (cell.income > cell.expense) {
      if (ratio < 0.25) return 'bg-emerald-200'
      if (ratio < 0.50) return 'bg-emerald-300'
      if (ratio < 0.75) return 'bg-emerald-400'
      return 'bg-emerald-500'
    }
    if (ratio < 0.15) return 'bg-blue-200'
    if (ratio < 0.35) return 'bg-blue-300'
    if (ratio < 0.55) return 'bg-blue-400'
    if (ratio < 0.75) return 'bg-blue-500'
    return 'bg-blue-600'
  }



  return (
    <div className="space-y-4 sm:space-y-6 pb-12 font-sans min-h-screen -mx-4 -mt-4 px-3 py-5 sm:p-8 rounded-tl-3xl transition-colors duration-200">

      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white ">Financial Intelligence</h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400  mt-1">Professional analytics and data deep-dives.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto overflow-hidden">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-neutral-700  bg-white dark:bg-neutral-900 p-1 shadow-sm overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
            {(['this_month', 'last_3_months', 'last_6_months', 'last_12_months', 'ytd', 'all_time'] as DateFilter[]).map(f => {
              const labelMap: Record<DateFilter, string> = {
                'this_month': '1M',
                'last_3_months': '3M',
                'last_6_months': '6M',
                'last_12_months': '1Y',
                'ytd': 'YTD',
                'all_time': 'ALL'
              }
              return (
                <button key={f} onClick={() => setDateFilter(f)}
                  className={`flex-1 text-center px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${dateFilter === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-neutral-400  hover:text-slate-700 dark:text-neutral-300  hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-800 '}`}
                >
                  {labelMap[f]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-1 sm:gap-2 pb-2 border-b border-slate-200 dark:border-neutral-700  min-w-max">
          {(['overview', 'cashflow', 'compare', 'categories', 'behaviors', 'forecasting'] as SubTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap -mb-[1px] border-b-2 ${activeTab === tab ? 'text-blue-600 dark:text-blue-400 border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-neutral-400  border-transparent hover:text-slate-800 dark:text-neutral-200  hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-800 /50'}`}
            >
              {tab === 'compare' ? 'Compare' : tab.charAt(0).toUpperCase() + tab.slice(1).replace('flow', ' Flow')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-neutral-700 border-t-blue-600 dark:border-t-blue-500"></div>
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-neutral-400">Crunching the numbers...</p>
        </div>
      ) : (
        <>
          {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 pt-2 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
        <div className={cardClasses}>
          <div className="flex items-center gap-2 mb-1"><Activity className="h-4 w-4 text-slate-400 dark:text-neutral-500 " /><h3 className="text-xs font-bold text-slate-500 dark:text-neutral-400  uppercase tracking-wider">Net Cash Flow</h3></div>
          <span className={`text-2xl font-black tracking-tight ${kpis.netFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(kpis.netFlow)}</span>
        </div>
        <div className={cardClasses}>
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-slate-400 dark:text-neutral-500 " /><h3 className="text-xs font-bold text-slate-500 dark:text-neutral-400  uppercase tracking-wider">Savings Rate</h3></div>
          <div className="flex items-baseline gap-1"><span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white ">{kpis.savingsRate.toFixed(1)}%</span><span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 ">of income</span></div>
        </div>
        <div className={cardClasses}>
          <div className="flex items-center gap-2 mb-1"><Zap className="h-4 w-4 text-slate-400 dark:text-neutral-500 " /><h3 className="text-xs font-bold text-slate-500 dark:text-neutral-400  uppercase tracking-wider">Avg Daily Burn</h3></div>
          <div className="flex items-baseline gap-1"><span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white ">{formatCurrency(kpis.burnRate)}</span><span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 ">/ day</span></div>
        </div>
        <div className={cardClasses}>
          <div className="flex items-center gap-2 mb-1"><Target className="h-4 w-4 text-slate-400 dark:text-neutral-500 " /><h3 className="text-xs font-bold text-slate-500 dark:text-neutral-400  uppercase tracking-wider">Active Goals</h3></div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white ">{goals.filter(g => !g.isCompleted).length}</span>
        </div>
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Heatmap */}
          {heatmapData.filter((d: any) => d.total > 0).length > 5 && (
            <div className={cardClasses + ' p-6 sm:p-7 relative overflow-hidden shadow-md'}>
              <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-neutral-800  pb-4">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white ">Financial Activity Timeline</h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400  mt-0.5">365-day cashflow velocity heatmap</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-neutral-400 ">
                  <div className="flex items-center gap-1.5"><div className="h-3.5 w-3.5 rounded-[4px] bg-emerald-500" /><span>Income</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-3.5 w-3.5 rounded-[4px] bg-blue-500" /><span>Expenses</span></div>
                </div>
              </div>
              <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div style={{ minWidth: `${(heatmapGrid.totalWeeks || 53) * 22 + 45}px` }}>
                  <div className="flex items-end ml-[42px] mb-2.5 h-4 relative">
                    {heatmapGrid.months?.map((m: any, i: number) => (
                      <div key={`m-${i}`} className="absolute text-xs font-bold text-slate-400 dark:text-neutral-500 " style={{ left: `${m.col * 22}px` }}>{m.label}</div>
                    ))}
                  </div>
                  <div className="flex gap-0">
                    <div className="flex flex-col justify-between pr-2.5 shrink-0" style={{ height: `${7 * 22 - 4}px`, width: '38px' }}>
                      {['Sun', '', 'Tue', '', 'Thu', '', 'Sat'].map((lbl, i) => (
                        <span key={i} className="text-xs font-bold text-slate-400 dark:text-neutral-500  leading-none" style={{ height: '18px', display: 'flex', alignItems: 'center' }}>{lbl}</span>
                      ))}
                    </div>
                    <div className="flex flex-col gap-[4px]">
                      {heatmapGrid.rows?.map((row: any, rowIdx: number) => (
                        <div key={rowIdx} className="flex gap-[4px]">
                          {row.map((cell: any, colIdx: number) => {
                            if (!cell) return <div key={`e-${rowIdx}-${colIdx}`} className="h-[18px] w-[18px] rounded-[5px] bg-slate-50 dark:bg-neutral-800/50 /50" />
                            const color = getHeatColor(cell)
                            return (
                              <div key={cell.key} className={`h-[18px] w-[18px] rounded-[5px] transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-blue-400/40 hover:scale-110 shadow-sm ${color}`}
                                onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHeatmapTooltip({ x: r.left + r.width / 2, y: r.top - 8, date: format(cell.date, 'MMM dd, yyyy'), income: cell.income, expense: cell.expense }) }}
                                onMouseLeave={() => setHeatmapTooltip(null)}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 dark:border-neutral-800  pt-4 text-xs font-bold text-slate-400 dark:text-neutral-500 ">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded-[4px] bg-emerald-500" />
                    <span>Net Income</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded-[4px] bg-blue-500" />
                    <span>Net Expenses</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Less Activity</span>
                  <div className="flex gap-[3px]">
                    <div className="h-3.5 w-3.5 rounded-[4px] bg-slate-100 dark:bg-neutral-800 " />
                    <div className="h-3.5 w-3.5 rounded-[4px] bg-blue-100 dark:bg-blue-900/40" />
                    <div className="h-3.5 w-3.5 rounded-[4px] bg-blue-200" />
                    <div className="h-3.5 w-3.5 rounded-[4px] bg-blue-400" />
                    <div className="h-3.5 w-3.5 rounded-[4px] bg-blue-600" />
                  </div>
                  <span>More Activity</span>
                </div>
              </div>

              {heatmapTooltip && (
                <div className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-xl" style={{ left: `${heatmapTooltip.x}px`, top: `${heatmapTooltip.y}px`, transform: 'translate(-50%, -100%)' }}>
                  <p className="font-bold">{heatmapTooltip.date}</p>
                  {heatmapTooltip.income > 0 && <p className="text-emerald-300 mt-0.5">+{formatCurrency(heatmapTooltip.income)} income</p>}
                  {heatmapTooltip.expense > 0 && <p className="text-blue-300 mt-0.5">-{formatCurrency(heatmapTooltip.expense)} expense</p>}
                  {heatmapTooltip.income === 0 && heatmapTooltip.expense === 0 && <p className="text-slate-400 dark:text-neutral-500  mt-0.5">No activity</p>}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:[&>*:last-child:nth-child(odd)]:col-span-2">
            {/* Monthly Trend */}
            <div className={cardClasses}>
              <div className="mb-6 flex items-center gap-2"><BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" /><div><h3 className={headerClasses}>Income vs Expense Trend</h3><p className={subHeaderClasses}>Last 6 months comparison</p></div></div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods */}
            <div className={cardClasses}>
              <div className="mb-6 flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" /><div><h3 className={headerClasses}>Payment Methods</h3><p className={subHeaderClasses}>How you pay for things.</p></div></div>
              {(() => {
                const data = paymentMethodData
                if (data.length === 0) return <div className="flex h-48 items-center justify-center text-slate-400 dark:text-neutral-500  text-sm font-semibold">No expense data.</div>
                return (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={4} dataKey="value">
                          {data.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CASH FLOW TAB ═══ */}
      {activeTab === 'cashflow' && (
        <div className="grid grid-cols-1 gap-6 animate-fadeIn">
          <div className={cardClasses}>
            <div className="mb-6 flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-teal-600" /><div><h3 className={headerClasses}>Cash Flow Dynamics</h3><p className={subHeaderClasses}>Sankey mapping of Income flowing into Expenses and Savings.</p></div></div>
            <div className="h-[250px] sm:h-[400px] w-full">
              {sankeyData && sankeyData.nodes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Sankey data={sankeyData} nodePadding={50} margin={{ left: 20, right: 20, top: 20, bottom: 20 }} link={{ stroke: '#CBD5E1', strokeOpacity: 0.3 }}>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', padding: '10px' }} />
                  </Sankey>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-slate-400 dark:text-neutral-500  text-sm font-semibold">Insufficient data to map flow.</div>}
            </div>
          </div>

          <div className={cardClasses}>
            <div className="mb-6 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" /><div><h3 className={headerClasses}>Cumulative Trajectory</h3><p className={subHeaderClasses}>Historical timeline of income, expenses, and cumulative balance.</p></div></div>
            <div className="h-64 sm:h-80 w-full">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.8} />
                    <Bar yAxisId="left" dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.8} />
                    <Line yAxisId="right" type="monotone" dataKey="balance" name="Cumulative Balance" stroke="#3B82F6" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-slate-400 dark:text-neutral-500  text-sm font-semibold">No timeline data available.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CATEGORIES TAB ═══ */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 gap-6 animate-fadeIn">
          <div className={cardClasses}>
            <div className="mb-5 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className={headerClasses}>Top Spending Categories</h3>
                <p className={subHeaderClasses}>Ranked by total spend — where your money is going.</p>
              </div>
            </div>
            {(() => {
              const sorted = treemapData.length > 0 ? treemapData[0].children.slice(0, 10).map((c: any) => [c.name, c.size]) : []
              const grandTotal = sorted.reduce((s: any, [, v]: any) => s + v, 0)
              if (sorted.length === 0) return (
                <div className="flex h-40 items-center justify-center text-slate-400 dark:text-neutral-500  text-sm font-semibold">No expense data available.</div>
              )
              return (
                <div className="space-y-3 max-h-[380px] overflow-y-auto overscroll-contain pr-1">
                  {sorted.map(([cat, amount]: any, i: number) => {
                    const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0
                    const barColors = [
                      'bg-indigo-500', 'bg-blue-500', 'bg-violet-500', 'bg-sky-500',
                      'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500',
                      'bg-orange-500', 'bg-rose-500'
                    ]
                    return (
                      <div key={cat} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 dark:text-neutral-500  w-5 shrink-0">#{i + 1}</span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200  truncate">{cat}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 ">{pct.toFixed(1)}%</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white  tabular-nums">{formatCurrency(amount)}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-neutral-800  rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColors[i % barColors.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          <div className={cardClasses}>
            <div className="mb-6 flex items-center gap-2"><TableIcon className="h-5 w-5 text-slate-600 dark:text-neutral-400 " /><div><h3 className={headerClasses}>Cross-Tab Matrix (Pivot Data)</h3><p className={subHeaderClasses}>Exact numerical spending per category over the last 6 months.</p></div></div>
            <div className="overflow-x-auto overscroll-contain border border-slate-200 dark:border-neutral-700  rounded-xl scrollbar-thin">
              <table className="w-full min-w-[640px] sm:min-w-full text-left text-xs sm:text-sm text-slate-600 dark:text-neutral-400 ">
                <thead className="bg-slate-50 dark:bg-neutral-800/50  text-[10px] sm:text-xs uppercase text-slate-700 dark:text-neutral-300  border-b border-slate-200 dark:border-neutral-700 ">
                  <tr>
                    <th className="sticky left-0 z-20 bg-slate-50 dark:bg-neutral-800/50  px-2.5 py-2.5 sm:px-4 sm:py-3 font-bold border-r border-slate-200 dark:border-neutral-700  shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">Category</th>
                    {pivotTableData.columns.map((col: any) => <th key={col} className="px-2 py-2.5 sm:px-4 sm:py-3 font-bold text-right whitespace-nowrap">{col}</th>)}
                    <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 font-bold text-right bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotTableData.rows.length > 0 ? pivotTableData.rows.map((row: any, idx: number) => (
                    <tr key={row.category} className={`border-b border-slate-100 dark:border-neutral-800  ${idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-slate-50 dark:bg-neutral-800/50 '}`}>
                      <td className={`sticky left-0 z-10 px-2.5 py-2 sm:px-4 sm:py-3 font-semibold border-r border-slate-200 dark:border-neutral-700  text-xs sm:text-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] ${idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-slate-50 dark:bg-neutral-800/50 '}`}>{row.category}</td>
                      {pivotTableData.columns.map((col: any) => <td key={col} className="px-2 py-2 sm:px-4 sm:py-3 text-right tabular-nums text-xs sm:text-sm whitespace-nowrap">{row[col] > 0 ? formatCurrency(row[col]) : '-'}</td>)}
                      <td className="px-2.5 py-2 sm:px-4 sm:py-3 font-bold text-right tabular-nums bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs sm:text-sm whitespace-nowrap">{formatCurrency(row.total)}</td>
                    </tr>
                  )) : <tr><td colSpan={pivotTableData.columns.length + 2} className="px-4 py-8 text-center text-slate-400 dark:text-neutral-500 ">No data available for pivot view.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BEHAVIORS TAB ═══ */}
      {activeTab === 'behaviors' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fadeIn xl:[&>*:last-child:nth-child(odd)]:col-span-2">
          <div className={`xl:col-span-2 ${cardClasses}`}>
            <div className="mb-6 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" /><div><h3 className={headerClasses}>Anomaly Detection Engine</h3><p className={subHeaderClasses}>Identifies unusual spending spikes outside your standard deviation (Red points).</p></div></div>
            <div className="h-[250px] sm:h-[400px] w-full">
              {anomalyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="rawDate" type="number" scale="linear" domain={['dataMin', 'dataMax']} tickFormatter={(tick) => format(tick, 'MMM dd')} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} allowDuplicatedCategory={false} />
                    <YAxis dataKey="amount" type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <ZAxis dataKey="amount" range={[50, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-xl border border-slate-200 dark:border-neutral-700  bg-white dark:bg-neutral-900 p-3 shadow-lg">
                              <p className="font-bold text-slate-900 dark:text-white ">{data.description}</p>
                              <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400  uppercase mt-1">{data.category}</p>
                              <p className={`text-lg font-black mt-2 ${data.isAnomaly ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{formatCurrency(data.amount)}</p>
                              <p className="text-xs text-slate-400 dark:text-neutral-500  mt-1">{data.date}</p>
                              {data.isAnomaly && <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-md uppercase"><AlertTriangle className="h-3 w-3" /> Statistical Anomaly</div>}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Scatter name="Normal" data={anomalyData.filter((d: any) => !d.isAnomaly)} fill={SCATTER_COLORS.normal} fillOpacity={0.6} />
                    <Scatter name="Anomaly" data={anomalyData.filter((d: any) => d.isAnomaly)} fill={SCATTER_COLORS.anomaly} fillOpacity={0.8} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-slate-400 dark:text-neutral-500  text-sm font-semibold">Insufficient data for anomaly detection.</div>}
            </div>
          </div>

          <div className={cardClasses}>
            <div className="mb-6 flex items-center gap-2"><Target className="h-5 w-5 text-purple-600 dark:text-purple-400" /><div><h3 className={headerClasses}>Category Imprint</h3><p className={subHeaderClasses}>Your spending fingerprint across top categories.</p></div></div>
            <div className="h-64 sm:h-80 w-full flex items-center justify-center">
              {radarData.length > 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#E2E8F0" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} /><PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                    <Radar name="Spent" dataKey="amount" stroke={RADAR_COLORS.stroke} strokeWidth={2} fill={RADAR_COLORS.fill} fillOpacity={0.4} />
                    <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(value: number) => formatCurrency(value)} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-slate-400 dark:text-neutral-500  text-sm font-semibold text-center px-6">Requires expenses in at least 3 categories.</div>}
            </div>
          </div>

          <div className={cardClasses}>
            <div className="mb-6 flex items-center gap-2"><Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" /><div><h3 className={headerClasses}>Weekday Spending Habits</h3><p className={subHeaderClasses}>When do you spend the most during the week?</p></div></div>
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} formatter={(value: number) => [formatCurrency(value), 'Total Spent']} />
                  <Bar dataKey="total" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {weekdayData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={['Sat', 'Sun'].includes(entry.day) ? '#EF4444' : '#F59E0B'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 text-center text-xs text-slate-500 dark:text-neutral-400 ">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1 align-middle"></span> Weekend
                <span className="inline-block w-3 h-3 bg-amber-500 rounded-sm ml-3 mr-1 align-middle"></span> Weekday
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ═══ COMPARE TAB ═══ */}
      {activeTab === 'compare' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Comparison Period Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-slate-200 dark:border-neutral-700  shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white ">Historical Comparison Analysis</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400  mt-0.5">Select a month to audit financial performance against previous periods.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={compareYear}
                onChange={e => setCompareYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-neutral-800/50  border border-slate-200 dark:border-neutral-700  text-slate-800 dark:text-neutral-200  text-xs font-bold rounded-xl px-2.5 py-2 outline-none cursor-pointer shadow-sm"
              >
                {availableYears.map((y: any) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={compareMonth}
                onChange={e => setCompareMonth(Number(e.target.value))}
                className="bg-slate-50 dark:bg-neutral-800/50  border border-slate-200 dark:border-neutral-700  text-slate-800 dark:text-neutral-200  text-xs font-bold rounded-xl px-2.5 py-2 outline-none cursor-pointer shadow-sm"
              >
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Key Metrics Comparison Grid */}
          <div className={cardClasses}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className={headerClasses}>Key Period metrics</h3>
                <p className={subHeaderClasses}>Detailed comparison vs previous month</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500  uppercase tracking-widest">MoM DELTAS</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
              {compareMetrics.map((metric: any) => (
                <div key={metric.label} className="rounded-xl border border-slate-100 dark:border-neutral-800  bg-slate-50 dark:bg-neutral-800/50 /50 p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 ">{metric.label}</p>
                  <p className="mt-2 text-base sm:text-lg font-black text-slate-900 dark:text-white ">
                    {metric.isCurrency ? formatCurrency(metric.current) : metric.current}
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-neutral-400 ">
                    <p className="text-[10px] text-slate-400 dark:text-neutral-500 ">Prev: {metric.isCurrency ? formatCurrency(metric.previous) : metric.previous}</p>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="font-bold text-[10px] sm:text-xs text-slate-700 dark:text-neutral-300 ">
                        {metric.isCurrency ? formatDeltaValue(metric.delta.delta) : formatCountDelta(metric.delta.delta)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        metric.delta.direction === 'up'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                          : metric.delta.direction === 'down'
                            ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                            : 'bg-slate-200 text-slate-600 dark:text-neutral-400 '
                      }`}>
                        {metric.delta.direction}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500  mt-0.5">{formatDeltaPct(metric.delta.pct)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MoM vs YoY Side-by-Side Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current vs Previous Month (MoM) */}
            <div className={cardClasses}>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-neutral-800  pb-3">
                <div>
                  <h3 className={headerClasses}>Month-over-Month (MoM)</h3>
                  <p className={subHeaderClasses}>Comparison against immediately preceding month</p>
                </div>
                <span className="text-xs font-black text-slate-500 dark:text-neutral-400  bg-slate-100 dark:bg-neutral-800  px-2.5 py-1 rounded-lg">
                  {MONTH_NAMES[compareMonth - 1]} {compareYear} vs {compareMonth === 1 ? MONTH_NAMES[11] : MONTH_NAMES[compareMonth - 2]} {compareMonth === 1 ? compareYear - 1 : compareYear}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Income', current: currentSummary.income, previous: previousSummary.income },
                  { label: 'Expenses', current: currentSummary.expenses, previous: previousSummary.expenses },
                  { label: 'Savings', current: currentSummary.savings, previous: previousSummary.savings },
                  { label: 'Transactions', current: currentSummary.count, previous: previousSummary.count, isCount: true }
                ].map((item: any) => {
                  const delta = calcDelta(item.current, item.previous)
                  return (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-neutral-800  bg-slate-50 dark:bg-neutral-800/50 /50 px-4 py-3 hover:bg-slate-50  dark:hover:bg-neutral-800/50  transition-colors">
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-neutral-300 ">{item.label}</span>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900 dark:text-white ">{item.isCount ? item.current : formatCurrency(item.current)}</p>
                        <p className={`text-[10px] sm:text-xs font-bold ${
                          delta.direction === 'up' && item.label !== 'Expenses' ? 'text-emerald-600 dark:text-emerald-400' :
                          delta.direction === 'down' && item.label === 'Expenses' ? 'text-emerald-600 dark:text-emerald-400' :
                          delta.direction === 'flat' ? 'text-slate-500 dark:text-neutral-400 ' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.isCount ? formatCountDelta(delta.delta) : formatDeltaValue(delta.delta)} ({formatDeltaPct(delta.pct)})
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Current vs Same Month Last Year (YoY) */}
            <div className={cardClasses}>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-neutral-800  pb-3">
                <div>
                  <h3 className={headerClasses}>Year-over-Year (YoY)</h3>
                  <p className={subHeaderClasses}>Comparison against same calendar month last year</p>
                </div>
                <span className="text-xs font-black text-slate-500 dark:text-neutral-400  bg-slate-100 dark:bg-neutral-800  px-2.5 py-1 rounded-lg">
                  {MONTH_NAMES[compareMonth - 1]} {compareYear} vs {MONTH_NAMES[compareMonth - 1]} {compareYear - 1}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Income', current: currentSummary.income, previous: sameMonthLastYearSummary.income },
                  { label: 'Expenses', current: currentSummary.expenses, previous: sameMonthLastYearSummary.expenses },
                  { label: 'Savings', current: currentSummary.savings, previous: sameMonthLastYearSummary.savings },
                  { label: 'Transactions', current: currentSummary.count, previous: sameMonthLastYearSummary.count, isCount: true }
                ].map((item: any) => {
                  const delta = calcDelta(item.current, item.previous)
                  return (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-neutral-800  bg-slate-50 dark:bg-neutral-800/50 /50 px-4 py-3 hover:bg-slate-50  dark:hover:bg-neutral-800/50  transition-colors">
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-neutral-300 ">{item.label}</span>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900 dark:text-white ">{item.isCount ? item.current : formatCurrency(item.current)}</p>
                        <p className={`text-[10px] sm:text-xs font-bold ${
                          delta.direction === 'up' && item.label !== 'Expenses' ? 'text-emerald-600 dark:text-emerald-400' :
                          delta.direction === 'down' && item.label === 'Expenses' ? 'text-emerald-600 dark:text-emerald-400' :
                          delta.direction === 'flat' ? 'text-slate-500 dark:text-neutral-400 ' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.isCount ? formatCountDelta(delta.delta) : formatDeltaValue(delta.delta)} ({formatDeltaPct(delta.pct)})
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ═══ FORECASTING TAB ═══ */}
      {activeTab === 'forecasting' && (
        <div className="grid grid-cols-1 gap-6 animate-fadeIn">
          {goalForecastData && !Array.isArray(goalForecastData) ? (
            <div className={cardClasses}>
              <div className="mb-6 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><div><h3 className={headerClasses}>Goal Trajectory Forecast</h3><p className={subHeaderClasses}>Projected completion for top priority: <strong className="text-slate-700 dark:text-neutral-300 ">{goalForecastData.goalName}</strong></p></div></div>
              <div className="h-64 sm:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={goalForecastData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs><linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="amount" name="Projected Savings" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorGoal)" />
                    <Line type="step" dataKey="target" name="Target" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 dark:bg-neutral-800/50  p-4 border border-slate-100 dark:border-neutral-800 ">
                <p className="text-sm text-slate-600 dark:text-neutral-400 ">Based on your last 3 months average savings rate, you are projected to hit this goal in approx. <strong className="font-bold text-emerald-600 dark:text-emerald-400">{goalForecastData.monthsToCompletion} months</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-400 dark:text-neutral-500  text-sm font-semibold border border-slate-200 dark:border-neutral-700  border-dashed rounded-2xl bg-white dark:bg-neutral-900">
              No active savings goals with positive savings rate to forecast.
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  )
}
