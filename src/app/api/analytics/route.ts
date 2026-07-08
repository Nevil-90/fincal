import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  format, subDays, subMonths, startOfMonth, endOfMonth,
  startOfYear, differenceInDays, addDays, eachDayOfInterval,
  startOfDay, endOfDay
} from 'date-fns'

type MonthlyRow  = { month: string; type: string; total: number; sort_key: Date }
type DailyRow    = { day: string;   income: number; expense: number }
type CategoryRow = { category: string; total: number }
type PaymentRow  = { method: string;   total: number }
type WeekdayRow  = { dow: number;   total: number; cnt: number }
type CatMonthRow = { category: string; month: string; sort_key: Date; total: number }
type PeriodAgg   = { type: string;  total: number; cnt: number; first_date?: Date; last_date?: Date }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dateFilter    = searchParams.get('dateFilter') || 'this_month'
    const compareYear   = parseInt(searchParams.get('compareYear')  || String(new Date().getFullYear()))
    const compareMonth  = parseInt(searchParams.get('compareMonth') || String(new Date().getMonth() + 1))
    const heatmapYearParam = searchParams.get('heatmapYear')
    const heatmapYear   = heatmapYearParam ? parseInt(heatmapYearParam) : new Date().getFullYear()

    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (dateFilter) {
      case 'this_month':     startDate = startOfMonth(now);          endDate = endOfMonth(now); break
      case 'last_3_months':  startDate = startOfMonth(subMonths(now, 2)); break
      case 'last_6_months':  startDate = startOfMonth(subMonths(now, 5)); break
      case 'last_12_months': startDate = startOfMonth(subMonths(now, 11)); break
      case 'ytd':            startDate = startOfYear(now); break
      default:               startDate = new Date(0); break
    }

    let heatmapStartDate: Date
    let heatmapEndDate: Date
    if (dateFilter === 'all_time') {
      heatmapStartDate = new Date(heatmapYear, 0, 1)
      heatmapEndDate = endOfDay(new Date(heatmapYear, 11, 31))
    } else {
      heatmapStartDate = startOfDay(subDays(now, 364))
      heatmapEndDate = endOfDay(now)
    }

    const prevMonth      = compareMonth === 1 ? 12 : compareMonth - 1
    const prevYear       = compareMonth === 1 ? compareYear - 1 : compareYear
    const sameYearStart = new Date(compareYear - 1, compareMonth - 1, 1)
    const prevMonthStart = new Date(prevYear, prevMonth - 1, 1)
    const recentStart = subMonths(now, 3)

    const queryStartDate = new Date(Math.min(
      startDate.getTime(),
      heatmapStartDate.getTime(),
      sameYearStart.getTime(),
      prevMonthStart.getTime(),
      recentStart.getTime()
    ))

    const [allTransactions, goals, dateBounds] = await Promise.all([
      prisma.transaction.findMany({
        where: { 
          userId, 
          deletedAt: null,
          date: { gte: queryStartDate }
        },
        select: { id: true, type: true, amount: true, category: true, description: true, date: true, paymentMethod: true },
        orderBy: { date: 'asc' }
      }),
      prisma.savingsGoal.findMany({ where: { userId, deletedAt: null } }),
      prisma.transaction.aggregate({
        where: { userId, deletedAt: null },
        _min: { date: true },
        _max: { date: true }
      })
    ])



    const monthlyTrendMap: Record<string, { month: string; type: string; total: number; sort_key: Date }> = {}
    const dailyMap: Record<string, DailyRow> = {}
    const categoryRowsMap: Record<string, number> = {}
    const paymentRowsMap: Record<string, number> = {}
    const weekdayRowsMap: Record<number, { total: number, cnt: number }> = {}
    const catMonthMap: Record<string, number> = {}
    const kpiRowsMap: Record<string, PeriodAgg> = {}
    const currentRowsMap: Record<string, { total: number, cnt: number }> = {}
    const prevRowsMap: Record<string, { total: number, cnt: number }> = {}
    const sameYearRowsMap: Record<string, { total: number, cnt: number }> = {}
    const recentAggMap: Record<string, number> = {}

    const detailedTransactions = []

    for (const t of allTransactions) {
      const amt = Number(t.amount)
      const date = new Date(t.date)
      const type = t.type
      const cat = t.category || 'Unknown'

      // Period checks
      const inPeriod = date >= startDate && date <= endDate
      if (inPeriod) detailedTransactions.push(t)

      // 1. Monthly Trend
      if (inPeriod) {
        const monthStr = format(date, 'MMM yyyy')
        const key = `${monthStr}-${type}`
        if (!monthlyTrendMap[key]) monthlyTrendMap[key] = { month: monthStr, type, total: 0, sort_key: startOfMonth(date) }
        monthlyTrendMap[key].total += amt
      }

      // 2. Daily Heatmap
      if (date >= heatmapStartDate && date <= heatmapEndDate) {
        const dayStr = format(date, 'yyyy-MM-dd')
        if (!dailyMap[dayStr]) dailyMap[dayStr] = { day: dayStr, income: 0, expense: 0 }
        if (type === 'income') dailyMap[dayStr].income += amt
        if (type === 'expense') dailyMap[dayStr].expense += amt
      }
      
      // 3. Category, 4. Payment, 5. Weekday
      if (inPeriod && type === 'expense') {
        categoryRowsMap[cat] = (categoryRowsMap[cat] || 0) + amt
        
        const pm = t.paymentMethod || 'Unknown'
        paymentRowsMap[pm] = (paymentRowsMap[pm] || 0) + amt
        
        const dow = date.getDay()
        if (!weekdayRowsMap[dow]) weekdayRowsMap[dow] = { total: 0, cnt: 0 }
        weekdayRowsMap[dow].total += amt
        weekdayRowsMap[dow].cnt += 1
      }

      // 6. Cat Month Pivot
      if (type === 'expense' && inPeriod) {
        const monthStr = format(date, 'MMM yyyy')
        const key = `${cat}|${monthStr}|${startOfMonth(date).getTime()}`
        catMonthMap[key] = (catMonthMap[key] || 0) + amt
      }

      // 7. KPIs
      if (inPeriod) {
        if (!kpiRowsMap[type]) kpiRowsMap[type] = { type, total: 0, cnt: 0, first_date: date, last_date: date }
        kpiRowsMap[type].total += amt
        kpiRowsMap[type].cnt += 1
        if (date < kpiRowsMap[type].first_date!) kpiRowsMap[type].first_date = date
        if (date > kpiRowsMap[type].last_date!) kpiRowsMap[type].last_date = date
      }

      // 8. Current
      if (date.getFullYear() === compareYear && date.getMonth() + 1 === compareMonth) {
        if (!currentRowsMap[type]) currentRowsMap[type] = { total: 0, cnt: 0 }
        currentRowsMap[type].total += amt
        currentRowsMap[type].cnt += 1
      }

      // 9. Prev
      if (date.getFullYear() === prevYear && date.getMonth() + 1 === prevMonth) {
        if (!prevRowsMap[type]) prevRowsMap[type] = { total: 0, cnt: 0 }
        prevRowsMap[type].total += amt
        prevRowsMap[type].cnt += 1
      }

      // 10. Same Year
      if (date.getFullYear() === compareYear - 1 && date.getMonth() + 1 === compareMonth) {
        if (!sameYearRowsMap[type]) sameYearRowsMap[type] = { total: 0, cnt: 0 }
        sameYearRowsMap[type].total += amt
        sameYearRowsMap[type].cnt += 1
      }

      // 12. Recent
      if (date >= recentStart) {
        recentAggMap[type] = (recentAggMap[type] || 0) + amt
      }
    }

    const monthlyRows = Object.values(monthlyTrendMap).sort((a, b) => a.sort_key.getTime() - b.sort_key.getTime())
    const dailyRows = Object.values(dailyMap)
    const categoryRows = Object.entries(categoryRowsMap).map(([c, t]) => ({ category: c, total: t })).sort((a,b)=>b.total-a.total)
    const paymentRows = Object.entries(paymentRowsMap).map(([m, t]) => ({ method: m, total: t })).sort((a,b)=>b.total-a.total)
    const weekdayRows = Object.entries(weekdayRowsMap).map(([d, data]) => ({ dow: Number(d), total: data.total, cnt: data.cnt }))
    
    const catMonthRows = Object.entries(catMonthMap).map(([key, total]) => {
      const [category, month, sortMs] = key.split('|')
      return { category, month, sort_key: new Date(Number(sortMs)), total }
    }).sort((a, b) => a.sort_key.getTime() - b.sort_key.getTime())

    const kpiRows = Object.values(kpiRowsMap)
    const currentRows = Object.entries(currentRowsMap).map(([type, data]) => ({ type, total: data.total, cnt: data.cnt }))
    const prevRows = Object.entries(prevRowsMap).map(([type, data]) => ({ type, total: data.total, cnt: data.cnt }))
    const sameYearRows = Object.entries(sameYearRowsMap).map(([type, data]) => ({ type, total: data.total, cnt: data.cnt }))
    const recentAgg = Object.entries(recentAggMap).map(([type, total]) => ({ type, total }))

    const expenses = detailedTransactions.filter(t => t.type === 'expense')

    const incomeAgg  = kpiRows.find(r => r.type === 'income')
    const expenseAgg = kpiRows.find(r => r.type === 'expense')
    const income     = Number(incomeAgg?.total  ?? 0)
    const expense    = Number(expenseAgg?.total ?? 0)
    const netFlow    = income - expense
    const savingsRate = income > 0 ? (netFlow / income) * 100 : 0
    const fd = incomeAgg?.first_date ?? expenseAgg?.first_date
    const ld = incomeAgg?.last_date  ?? expenseAgg?.last_date
    const daysInPeriod = fd && ld ? Math.max(1, differenceInDays(new Date(ld), new Date(fd))) : 1
    const burnRate   = expense / daysInPeriod
    const kpis       = { income, expense, netFlow, savingsRate, burnRate }

    const monthMap: Record<string, { month: string; income: number; expense: number; sortKey: number }> = {}
    for (const row of monthlyRows) {
      if (!monthMap[row.month]) {
        monthMap[row.month] = { month: row.month, income: 0, expense: 0, sortKey: new Date(row.sort_key).getTime() }
      }
      if (row.type === 'income') monthMap[row.month].income = Number(row.total)
      else                       monthMap[row.month].expense = Number(row.total)
    }
    const monthlyTrendData = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey)

    const days = eachDayOfInterval({ start: heatmapStartDate, end: heatmapEndDate })
    const heatmapDailyMap: Record<string, { income: number; expense: number }> = {}
    for (const row of dailyRows) {
      heatmapDailyMap[row.day] = { income: Number(row.income), expense: Number(row.expense) }
    }
    const heatmapData = days.map(d => {
      const k      = format(d, 'yyyy-MM-dd')
      const totals = heatmapDailyMap[k] || { income: 0, expense: 0 }
      return { date: d, key: k, income: totals.income, expense: totals.expense, total: totals.income + totals.expense }
    })
    const firstDow   = heatmapData[0].date.getDay()
    const padded: (typeof heatmapData[0] | null)[] = Array(firstDow).fill(null).concat(heatmapData)
    const totalWeeks = Math.ceil(padded.length / 7)
    const rows: (typeof heatmapData[0] | null)[][] = Array.from({ length: 7 }, () => [])
    for (let w = 0; w < totalWeeks; w++) {
      for (let d = 0; d < 7; d++) {
        const idx = w * 7 + d
        rows[d].push(idx < padded.length ? padded[idx] : null)
      }
    }
    const heatmapMonths: { label: string; col: number }[] = []
    let lastMonth = -1
    rows[0].forEach((cell, colIdx) => {
      if (cell && cell.date.getMonth() !== lastMonth) {
        lastMonth = cell.date.getMonth()
        heatmapMonths.push({ label: format(cell.date, 'MMM'), col: colIdx })
      }
    })
    const heatmapGrid     = { rows, months: heatmapMonths, totalWeeks }
    const heatmapMaxTotal = Math.max(...heatmapData.map(d => d.total), 1)

    const timelineDailyMap: Record<string, { date: string; income: number; expense: number; balance: number }> = {}
    let runningBalance = 0
    for (const t of detailedTransactions) {
      const dKey = format(new Date(t.date), 'yyyy-MM-dd')
      if (!timelineDailyMap[dKey]) {
        timelineDailyMap[dKey] = { date: format(new Date(t.date), 'MMM dd'), income: 0, expense: 0, balance: runningBalance }
      }
      if (t.type === 'income') {
        timelineDailyMap[dKey].income += Number(t.amount)
        runningBalance += Number(t.amount)
      } else {
        timelineDailyMap[dKey].expense += Number(t.amount)
        runningBalance -= Number(t.amount)
      }
      timelineDailyMap[dKey].balance = runningBalance
    }
    const timelineData = Object.values(timelineDailyMap)

    let sankeyData: { nodes: { name: string }[]; links: { source: number; target: number; value: number }[] } | null = null
    if (income > 0 || expense > 0) {
      const savings = Math.max(0, income - expense)
      const nodes   = [{ name: 'Total Income' }, { name: 'Expenses' }, { name: 'Savings' }]
      const links: { source: number; target: number; value: number }[] = []
      if (expense  > 0) links.push({ source: 0, target: 1, value: expense })
      if (savings  > 0) links.push({ source: 0, target: 2, value: savings })
      let nodeIndex = 3
      categoryRows.slice(0, 5).forEach(row => {
        nodes.push({ name: row.category })
        links.push({ source: 1, target: nodeIndex++, value: Number(row.total) })
      })
      const otherAmount = categoryRows.slice(5).reduce((s, r) => s + Number(r.total), 0)
      if (otherAmount > 0) {
        nodes.push({ name: 'Other Expenses' })
        links.push({ source: 1, target: nodeIndex, value: otherAmount })
      }
      const deficit = expense - income
      if (deficit > 0) {
        const di = nodes.push({ name: 'Deficit (Overspend)' }) - 1
        links.push({ source: di, target: 1, value: deficit })
      }
      sankeyData = { nodes, links }
    }

    const children   = categoryRows.map(r => ({ name: r.category, size: Number(r.total) }))
    const treemapData = children.length > 0 ? [{ name: 'Expenses', children }] : []

    const pivotMonthKeys = [...new Set(catMonthRows.map(r => r.month))]
    const pivotCatMap: Record<string, Record<string, number>> = {}
    for (const row of catMonthRows) {
      if (!pivotCatMap[row.category]) pivotCatMap[row.category] = {}
      pivotCatMap[row.category][row.month] = Number(row.total)
    }
    const pivotRows = Object.entries(pivotCatMap).map(([category, monthsData]) => {
      const rowData: Record<string, string | number> = { category }
      let total = 0
      pivotMonthKeys.forEach(m => { rowData[m] = monthsData[m] || 0; total += Number(rowData[m]) })
      rowData.total = total
      return rowData
    }).sort((a, b) => Number(b.total) - Number(a.total))
    const pivotTableData = { columns: pivotMonthKeys, rows: pivotRows }

    const paymentMethodData = paymentRows.map(r => ({ name: r.method, value: Number(r.total) }))

    interface Anomaly {
      id: string; index: number; date: string; rawDate: number
      amount: number; category: string | null; description: string; isAnomaly: boolean
    }
    let anomalyData: Anomaly[] = []
    if (expenses.length > 0) {
      const amounts = expenses.map(t => Number(t.amount))
      const mean    = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const stdDev  = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length)
      const rawAnomalies = expenses.map((t, i) => {
        const amt = Number(t.amount)
        return {
          id: t.id, index: i,
          date: format(new Date(t.date), 'MMM dd'),
          rawDate: new Date(t.date).getTime() + i,
          amount: amt, category: t.category,
          description: t.description || 'Unknown',
          isAnomaly: amt > mean + (stdDev * 1.5),
        }
      })
      
      const trueAnomalies = rawAnomalies.filter(a => a.isAnomaly)
      const normalTxns = rawAnomalies.filter(a => !a.isAnomaly)
      
      // Keep all anomalies, but sample normal transactions (max 50) to prevent UI lag
      const sampledNormal = []
      if (normalTxns.length > 50) {
        const step = normalTxns.length / 50
        for (let i = 0; i < 50; i++) {
          sampledNormal.push(normalTxns[Math.floor(i * step)])
        }
      } else {
        sampledNormal.push(...normalTxns)
      }
      
      anomalyData = [...trueAnomalies, ...sampledNormal].sort((a, b) => a.rawDate - b.rawDate)
    }

    const avgExpensePerCat = expense / (categoryRows.length || 1)
    const radarData = categoryRows.slice(0, 6).map(r => ({
      subject:  r.category,
      amount:   Number(r.total),
      fullMark: Math.max(Number(r.total), avgExpensePerCat * 2),
    }))

    const daysArr   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const weekdayData = daysArr.map((day, i) => {
      const row = weekdayRows.find(r => Number(r.dow) === i)
      return {
        day:     day.substring(0, 3),
        total:   row ? Number(row.total) : 0,
        count:   row ? Number(row.cnt)   : 0,
        average: row && Number(row.cnt) > 0 ? Number(row.total) / Number(row.cnt) : 0,
      }
    })

    interface GoalForecast {
      goalName: string
      data: { date: string; amount: number; target: number }[]
      monthsToCompletion: number
    }
    let goalForecastData: GoalForecast | null = null
    if (goals.length > 0) {
      const activeGoal = [...goals].sort((a, b) => b.priority - a.priority).find(g => !g.isCompleted)
      if (activeGoal) {
        const recentIncome  = Number(recentAgg.find(r => r.type === 'income')?.total  ?? 0)
        const recentExpense = Number(recentAgg.find(r => r.type === 'expense')?.total ?? 0)
        const avgMonthlySavings = Math.max(0, (recentIncome - recentExpense) / 3)
        if (avgMonthlySavings > 0) {
          let current          = Number(activeGoal.currentAmount)
          const target         = Number(activeGoal.targetAmount)
          const projection: { date: string; amount: number; target: number }[] = []
          let projectionDate   = new Date()
          projection.push({ date: format(projectionDate, 'MMM yyyy'), amount: current, target })
          let failsafe = 0
          while (current < target && failsafe < 24) {
            projectionDate = addDays(projectionDate, 30)
            current       += avgMonthlySavings
            projection.push({ date: format(projectionDate, 'MMM yyyy'), amount: Math.min(current, target), target })
            failsafe++
          }
          goalForecastData = { goalName: activeGoal.name, data: projection, monthsToCompletion: failsafe }
        }
      }
    }

    const buildSummary = (agg: PeriodAgg[]) => {
      const inc = Number(agg.find(r => r.type === 'income')?.total   ?? 0)
      const exp = Number(agg.find(r => r.type === 'expense')?.total  ?? 0)
      const cnt = Number(agg.find(r => r.type === 'income')?.cnt ?? 0)
              + Number(agg.find(r => r.type === 'expense')?.cnt ?? 0)
      return { income: inc, expenses: exp, savings: inc - exp, count: cnt, avgValue: cnt > 0 ? (inc + exp) / cnt : 0 }
    }
    const calcDelta = (current: number, previous: number) => {
      const delta = current - previous
      const pct   = previous === 0 ? null : (delta / previous) * 100
      return { delta, pct, direction: delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down' }
    }

    const currentSummary          = buildSummary(currentRows)
    const previousSummary         = buildSummary(prevRows)
    const sameMonthLastYearSummary = buildSummary(sameYearRows)

    const compareMetrics = [
      { label: 'Total Income',         current: currentSummary.income,   previous: previousSummary.income,   isCurrency: true },
      { label: 'Total Expenses',       current: currentSummary.expenses, previous: previousSummary.expenses, isCurrency: true },
      { label: 'Net Savings',          current: currentSummary.savings,  previous: previousSummary.savings,  isCurrency: true },
      { label: 'Transaction Count',    current: currentSummary.count,    previous: previousSummary.count,    isCurrency: false },
      { label: 'Average Transaction',  current: currentSummary.avgValue, previous: previousSummary.avgValue, isCurrency: true },
    ].map(m => ({ ...m, delta: calcDelta(m.current, m.previous) }))

    // Available years for dropdown (from DB date bounds)
    const minYear = dateBounds._min?.date ? new Date(dateBounds._min.date).getFullYear() : new Date().getFullYear()
    const maxYear = dateBounds._max?.date ? new Date(dateBounds._max.date).getFullYear() : new Date().getFullYear()
    
    const availableYears: number[] = []
    for (let y = maxYear; y >= minYear; y--) {
      availableYears.push(y)
    }

    return NextResponse.json({
      kpis,
      monthlyTrendData,
      heatmapData,
      heatmapGrid,
      heatmapMaxTotal,
      timelineData,
      sankeyData,
      treemapData,
      pivotTableData,
      paymentMethodData,
      anomalyData,
      radarData,
      weekdayData,
      goalForecastData,
      compare: {
        metrics: compareMetrics,
        currentSummary,
        previousSummary,
        sameMonthLastYearSummary,
        availableYears,
      },
      filteredTransactionsCount: detailedTransactions.length,
    })

  } catch (error: unknown) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
