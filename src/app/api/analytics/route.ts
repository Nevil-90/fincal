import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  format, subDays, subMonths, startOfMonth, endOfMonth, 
  startOfYear, isAfter, isBefore, differenceInDays, 
  addDays, eachDayOfInterval 
} from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const dateFilter = searchParams.get('dateFilter') || 'this_month'
    const compareYearStr = searchParams.get('compareYear')
    const compareMonthStr = searchParams.get('compareMonth')
    const compareYear = compareYearStr ? parseInt(compareYearStr) : new Date().getFullYear()
    const compareMonth = compareMonthStr ? parseInt(compareMonthStr) : new Date().getMonth() + 1


    // 1. Fetch all transactions (Node can handle 100k rows in memory easily)
    // We only select the fields needed for math to reduce memory footprint
    const [allTransactions, goals] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null
        },
        select: {
          id: true,
          type: true,
          amount: true,
          category: true,
          description: true,
          date: true,
          paymentMethod: true
        },
        orderBy: { date: 'asc' }
      }),
      prisma.savingsGoal.findMany({
        where: { userId }
      })
    ])

    // --- TRANSLATING useAnalyticsData LOGIC TO SERVER ---
    const now = new Date()

    // ─── Filtered Transactions ───
    let startDate: Date
    let endDate: Date = now

    switch (dateFilter) {
      case 'this_month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'last_3_months':
        startDate = startOfMonth(subMonths(now, 2))
        break
      case 'last_6_months':
        startDate = startOfMonth(subMonths(now, 5))
        break
      case 'last_12_months':
        startDate = startOfMonth(subMonths(now, 11))
        break
      case 'ytd':
        startDate = startOfYear(now)
        break
      case 'all_time':
      default:
        startDate = new Date(0)
        break
    }

    const filteredTransactions = allTransactions.filter(t => {
      const d = new Date(t.date)
      return isAfter(d, startDate) && isBefore(d, addDays(endDate, 1))
    })

    const expenses = filteredTransactions.filter(t => t.type === 'expense')
    const incomes = filteredTransactions.filter(t => t.type === 'income')

    // ─── Executive KPIs ───
    const income = incomes.reduce((sum, t) => sum + Number(t.amount), 0)
    const expense = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
    const netFlow = income - expense
    const savingsRate = income > 0 ? (netFlow / income) * 100 : 0
    const daysInPeriod = filteredTransactions.length > 0
      ? Math.max(1, differenceInDays(
        new Date(filteredTransactions[filteredTransactions.length - 1].date),
        new Date(filteredTransactions[0].date)
      ))
      : 1
    const burnRate = expense / daysInPeriod
    const kpis = { income, expense, netFlow, savingsRate, burnRate }

    // ─── Overview: Monthly Trend ───
    const monthlyData: Record<string, { month: string; income: number; expense: number; sortKey: number }> = {}
    allTransactions.forEach(t => {
      const date = new Date(t.date)
      const monthKey = format(date, 'MMM yyyy')
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expense: 0, sortKey: startOfMonth(date).getTime() }
      }
      if (t.type === 'income') monthlyData[monthKey].income += Number(t.amount)
      else monthlyData[monthKey].expense += Number(t.amount)
    })
    const monthlyTrendData = Object.values(monthlyData).sort((a, b) => a.sortKey - b.sortKey).slice(-6)

    // ─── Overview: Heatmap ───
    const today = new Date()
    const heatmapStartDate = subDays(today, 364)
    const days = eachDayOfInterval({ start: heatmapStartDate, end: today })
    const dailyTotals: Record<string, { income: number; expense: number }> = {}
    
    allTransactions.forEach(t => {
      const k = format(new Date(t.date), 'yyyy-MM-dd')
      if (!dailyTotals[k]) dailyTotals[k] = { income: 0, expense: 0 }
      if (t.type === 'income') dailyTotals[k].income += Number(t.amount)
      else dailyTotals[k].expense += Number(t.amount)
    })
    const heatmapData = days.map(d => {
      const k = format(d, 'yyyy-MM-dd')
      const totals = dailyTotals[k] || { income: 0, expense: 0 }
      return { date: d, key: k, income: totals.income, expense: totals.expense, total: totals.income + totals.expense }
    })
    
    // Grid Generation (for heatmap rendering)
    const firstDow = heatmapData[0].date.getDay()
    const padded: (typeof heatmapData[0] | null)[] = Array(firstDow).fill(null).concat(heatmapData)
    const totalWeeks = Math.ceil(padded.length / 7)
    const rows: (typeof heatmapData[0] | null)[][] = Array.from({ length: 7 }, () => [])
    for (let w = 0; w < totalWeeks; w++) {
      for (let d = 0; d < 7; d++) {
        const idx = w * 7 + d
        rows[d].push(idx < padded.length ? padded[idx] : null)
      }
    }
    const months: { label: string; col: number }[] = []
    let lastMonth = -1
    rows[0].forEach((cell, colIdx) => {
      if (cell && cell.date.getMonth() !== lastMonth) {
        lastMonth = cell.date.getMonth()
        months.push({ label: format(cell.date, 'MMM'), col: colIdx })
      }
    })
    const heatmapGrid = { rows, months, totalWeeks }
    const heatmapMaxTotal = Math.max(...heatmapData.map(d => d.total), 1)

    // ─── Cash Flow: Timeline ───
    const timelineDailyMap: Record<string, { date: string; income: number; expense: number; balance: number }> = {}
    let runningBalance = 0
    filteredTransactions.forEach(t => {
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
    })
    const timelineData = Object.values(timelineDailyMap)

    // ─── Cash Flow: Sankey ───
    let sankeyData: { nodes: { name: string }[]; links: { source: number; target: number; value: number }[] } | null = null
    if (incomes.length > 0 || expenses.length > 0) {
      const totalIncome = Math.max(kpis.income, 1)
      const totalExpense = kpis.expense
      const savings = Math.max(0, totalIncome - totalExpense)

      const catMap: Record<string, number> = {}
      expenses.forEach(t => {
        catMap[t.category || 'Unknown'] = (catMap[t.category || 'Unknown'] || 0) + Number(t.amount)
      })

      const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1])
      const topCats = sortedCats.slice(0, 5)
      const otherCatsAmount = sortedCats.slice(5).reduce((sum, [, amt]) => sum + amt, 0)

      const nodes = [{ name: 'Total Income' }, { name: 'Expenses' }, { name: 'Savings' }]
      const links = []

      if (totalExpense > 0) links.push({ source: 0, target: 1, value: totalExpense })
      if (savings > 0) links.push({ source: 0, target: 2, value: savings })

      let nodeIndex = 3
      topCats.forEach(([catName, amt]) => {
        nodes.push({ name: catName })
        links.push({ source: 1, target: nodeIndex, value: amt })
        nodeIndex++
      })
      if (otherCatsAmount > 0) {
        nodes.push({ name: 'Other Expenses' })
        links.push({ source: 1, target: nodeIndex, value: otherCatsAmount })
      }

      const deficit = totalExpense - kpis.income
      if (deficit > 0) {
        const defNodeIdx = nodes.push({ name: 'Deficit (Overspend)' }) - 1
        links.push({ source: defNodeIdx, target: 1, value: deficit })
      }
      sankeyData = { nodes, links }
    }

    // ─── Categories: Treemap ───
    const catMapTree: Record<string, number> = {}
    expenses.forEach(t => {
      catMapTree[t.category || 'Unknown'] = (catMapTree[t.category || 'Unknown'] || 0) + Number(t.amount)
    })
    const children = Object.entries(catMapTree).map(([name, size]) => ({ name, size })).sort((a, b) => b.size - a.size)
    const treemapData = children.length > 0 ? [{ name: 'Expenses', children }] : []

    // ─── Categories: Pivot Table ───
    const pivotMonthKeys = Array.from(new Set(allTransactions.map(t => format(new Date(t.date), 'MMM yyyy'))))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6)
    const pivotCatMap: Record<string, Record<string, number>> = {}
    allTransactions.filter(t => t.type === 'expense').forEach(t => {
      const mKey = format(new Date(t.date), 'MMM yyyy')
      if (pivotMonthKeys.includes(mKey)) {
        if (!pivotCatMap[t.category || 'Unknown']) pivotCatMap[t.category || 'Unknown'] = {}
        pivotCatMap[t.category || 'Unknown'][mKey] = (pivotCatMap[t.category || 'Unknown'][mKey] || 0) + Number(t.amount)
      }
    })
    const pivotRows = Object.entries(pivotCatMap).map(([category, monthsData]) => {
      const rowData: Record<string, string | number> = { category }
      let total = 0
      pivotMonthKeys.forEach(m => {
        rowData[m] = monthsData[m] || 0
        total += rowData[m]
      })
      rowData.total = total
      return rowData
    }).sort((a, b) => Number(b.total) - Number(a.total))
    const pivotTableData = { columns: pivotMonthKeys, rows: pivotRows }

    // ─── Payment Methods ───
    const paymentMethodMap: Record<string, number> = {}
    expenses.forEach(t => {
      const method = t.paymentMethod || 'Unknown'
      paymentMethodMap[method] = (paymentMethodMap[method] || 0) + Number(t.amount)
    })
    const paymentMethodData = Object.entries(paymentMethodMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // ─── Behaviors: Anomaly Detection ───
    interface Anomaly {
      id: string
      index: number
      date: string
      rawDate: number
      amount: number
      category: string | null
      description: string
      isAnomaly: boolean
    }
    let anomalyData: Anomaly[] = []
    if (expenses.length > 0) {
      const amounts = expenses.map(t => Number(t.amount))
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length)
      
      anomalyData = expenses.map((t, i) => {
        const amt = Number(t.amount)
        const isAnomaly = amt > mean + (stdDev * 1.5)
        return {
          id: t.id,
          index: i,
          date: format(new Date(t.date), 'MMM dd'),
          rawDate: new Date(t.date).getTime() + i, 
          amount: amt,
          category: t.category,
          description: t.description || 'Unknown',
          isAnomaly
        }
      })
    }

    // ─── Behaviors: Radar ───
    const radarCatMap: Record<string, { total: number; count: number }> = {}
    expenses.forEach(t => {
      const cat = t.category || 'Unknown'
      if (!radarCatMap[cat]) radarCatMap[cat] = { total: 0, count: 0 }
      radarCatMap[cat].total += Number(t.amount)
      radarCatMap[cat].count += 1
    })
    const averageExpense = kpis.expense / (Object.keys(radarCatMap).length || 1)
    const radarData = Object.entries(radarCatMap)
      .map(([subject, data]) => ({ subject, amount: data.total, fullMark: Math.max(data.total, averageExpense * 2) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)

    // ─── Behaviors: Weekday Habits ───
    const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const totals = [0, 0, 0, 0, 0, 0, 0]
    const counts = [0, 0, 0, 0, 0, 0, 0]
    expenses.forEach(t => {
      const dayIdx = new Date(t.date).getDay()
      totals[dayIdx] += Number(t.amount)
      counts[dayIdx] += 1
    })
    const weekdayData = daysArr.map((day, i) => ({
      day: day.substring(0, 3),
      total: totals[i],
      count: counts[i],
      average: counts[i] > 0 ? totals[i] / counts[i] : 0
    }))

    // ─── Forecasting: Goal Projection ───
    interface GoalForecast {
      goalName: string
      data: { date: string; amount: number; target: number }[]
      monthsToCompletion: number
    }
    let goalForecastData: GoalForecast | null = null
    if (goals.length > 0) {
      const activeGoal = [...goals].sort((a, b) => b.priority - a.priority).find(g => !g.isCompleted)
      if (activeGoal) {
        const historyMonths = 3
        const recentDate = subMonths(now, historyMonths)
        const recentTx = allTransactions.filter(t => isAfter(new Date(t.date), recentDate))
        const inc = recentTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const exp = recentTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        const avgMonthlySavings = Math.max(0, (inc - exp) / historyMonths)

        if (avgMonthlySavings > 0) {
          let current = Number(activeGoal.currentAmount)
          const target = Number(activeGoal.targetAmount)
          const projection = []
          let projectionDate = new Date()

          projection.push({ date: format(projectionDate, 'MMM yyyy'), amount: current, target })

          let failsafe = 0
          while (current < target && failsafe < 24) {
            projectionDate = addDays(projectionDate, 30)
            current += avgMonthlySavings
            projection.push({ date: format(projectionDate, 'MMM yyyy'), amount: Math.min(current, target), target })
            failsafe++
          }
          goalForecastData = { goalName: activeGoal.name, data: projection, monthsToCompletion: failsafe }
        }
      }
    }

    // ─── Compare Tab Logic ───
    const asDate = (val: Date | string) => new Date(val)
    const calcSummary = (entries: { type: string; amount: any; date: Date | string }[]) => {
      const income = entries.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
      const expenses = entries.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
      const savings = income - expenses
      const count = entries.length
      const avgValue = count > 0 ? entries.reduce((sum, t) => sum + Number(t.amount), 0) / count : 0
      return { income, expenses, savings, count, avgValue }
    }
    const filterByPeriod = (entries: { type: string; amount: any; date: Date | string }[], year: number, month?: number) => {
      return entries.filter(entry => {
        const date = asDate(entry.date)
        if (date.getFullYear() !== year) return false
        if (month && date.getMonth() + 1 !== month) return false
        return true
      })
    }
    const calcDelta = (current: number, previous: number) => {
      const delta = current - previous
      const pct = previous === 0 ? null : (delta / previous) * 100
      const direction = delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down'
      return { delta, pct, direction }
    }

    const currentPeriodTransactions = filterByPeriod(allTransactions, compareYear, compareMonth)
    const prevMonth = compareMonth === 1 ? 12 : compareMonth - 1
    const prevYear = compareMonth === 1 ? compareYear - 1 : compareYear
    const previousPeriodTransactions = filterByPeriod(allTransactions, prevYear, prevMonth)
    const sameMonthLastYearTransactions = filterByPeriod(allTransactions, compareYear - 1, compareMonth)

    const currentSummary = calcSummary(currentPeriodTransactions)
    const previousSummary = calcSummary(previousPeriodTransactions)
    const sameMonthLastYearSummary = calcSummary(sameMonthLastYearTransactions)

    const compareMetrics = [
      { label: 'Total Income', current: currentSummary.income, previous: previousSummary.income, isCurrency: true },
      { label: 'Total Expenses', current: currentSummary.expenses, previous: previousSummary.expenses, isCurrency: true },
      { label: 'Net Savings', current: currentSummary.savings, previous: previousSummary.savings, isCurrency: true },
      { label: 'Transaction Count', current: currentSummary.count, previous: previousSummary.count, isCurrency: false },
      { label: 'Average Transaction', current: currentSummary.avgValue, previous: previousSummary.avgValue, isCurrency: true }
    ].map(metric => ({
      ...metric,
      delta: calcDelta(metric.current, metric.previous)
    }))

    // Available years for dropdown
    const yrs = [...new Set(allTransactions.map(t => asDate(t.date).getFullYear()))]
    if (!yrs.includes(new Date().getFullYear())) yrs.push(new Date().getFullYear())
    const availableYears = yrs.sort((a, b) => b - a)

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
        availableYears
      },
      filteredTransactionsCount: filteredTransactions.length
    })

  } catch (error: unknown) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
