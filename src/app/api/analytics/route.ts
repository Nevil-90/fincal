import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  format, subDays, subMonths, startOfMonth, endOfMonth,
  startOfYear, differenceInDays, addDays, eachDayOfInterval
} from 'date-fns'

// ─── Raw-query result types ────────────────────────────────────────────────
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

    // ─── Date window calculation ───────────────────────────────────────────
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

    const heatmapStart   = subDays(now, 364)
    const pivotStart     = startOfMonth(subMonths(now, 5))
    const prevMonth      = compareMonth === 1 ? 12 : compareMonth - 1
    const prevYear       = compareMonth === 1 ? compareYear - 1 : compareYear

    // ═══════════════════════════════════════════════════════════════════════
    // Phase 1 — 12 parallel SQL aggregations (tiny result sets, no row dumps)
    //   Before: 1 query returning ALL rows → JS computed everything
    //   After:  SQL does the grouping → Node only receives aggregated numbers
    // ═══════════════════════════════════════════════════════════════════════
    const [
      monthlyRows,    // monthly income/expense for trend chart
      dailyRows,      // daily totals for heatmap (365 days)
      categoryRows,   // expense by category for treemap/sankey/radar
      paymentRows,    // expense by payment method
      weekdayRows,    // expense by day-of-week
      catMonthRows,   // category × month for pivot table
      kpiRows,        // income + expense aggregates for selected period
      currentRows,    // compare: current month
      prevRows,       // compare: previous month
      sameYearRows,   // compare: same month last year
      goals,          // savings goals (small, needed for forecast)
      recentAgg,      // last-3-months aggregate for goal projection
    ] = await Promise.all([

      // 1. Monthly trend — SQL groups by month, returns ~12 rows max
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') AS month,
          type,
          SUM(amount::numeric)                           AS total,
          DATE_TRUNC('month', date)                      AS sort_key
        FROM transactions
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND date >= ${startOfMonth(subMonths(now, 11))}
        GROUP BY DATE_TRUNC('month', date), type
        ORDER BY DATE_TRUNC('month', date) ASC
      `,

      // 2. Daily heatmap — 365 aggregated rows instead of all individual rows
      prisma.$queryRaw<DailyRow[]>`
        SELECT
          TO_CHAR(date, 'YYYY-MM-DD')                                            AS day,
          SUM(CASE WHEN type = 'income'  THEN amount::numeric ELSE 0 END)        AS income,
          SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END)        AS expense
        FROM transactions
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND date >= ${heatmapStart}
        GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
      `,

      // 3. Category breakdown for selected period
      prisma.$queryRaw<CategoryRow[]>`
        SELECT
          COALESCE(category, 'Unknown') AS category,
          SUM(amount::numeric)          AS total
        FROM transactions
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND type    = 'expense'
          AND date   >= ${startDate}
          AND date   <= ${endDate}
        GROUP BY category
        ORDER BY total DESC
      `,

      // 4. Payment methods for selected period
      prisma.$queryRaw<PaymentRow[]>`
        SELECT
          COALESCE("paymentMethod", 'Unknown') AS method,
          SUM(amount::numeric)                 AS total
        FROM transactions
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND type    = 'expense'
          AND date   >= ${startDate}
          AND date   <= ${endDate}
        GROUP BY "paymentMethod"
        ORDER BY total DESC
      `,

      // 5. Weekday habits — 7 rows
      prisma.$queryRaw<WeekdayRow[]>`
        SELECT
          EXTRACT(DOW FROM date)::int  AS dow,
          SUM(amount::numeric)         AS total,
          COUNT(*)::int                AS cnt
        FROM transactions
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND type    = 'expense'
          AND date   >= ${startDate}
          AND date   <= ${endDate}
        GROUP BY EXTRACT(DOW FROM date)
      `,

      // 6. Category × month pivot (last 6 months)
      prisma.$queryRaw<CatMonthRow[]>`
        SELECT
          COALESCE(category, 'Unknown')              AS category,
          TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') AS month,
          DATE_TRUNC('month', date)                  AS sort_key,
          SUM(amount::numeric)                       AS total
        FROM transactions
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND type    = 'expense'
          AND date   >= ${pivotStart}
        GROUP BY category, DATE_TRUNC('month', date)
        ORDER BY DATE_TRUNC('month', date) ASC
      `,

      // 7. KPI aggregates for selected period (income + expense sums + date range)
      prisma.$queryRaw<PeriodAgg[]>`
        SELECT
          type,
          SUM(amount::numeric)  AS total,
          COUNT(*)::int         AS cnt,
          MIN(date)             AS first_date,
          MAX(date)             AS last_date
        FROM transactions
        WHERE "userId" = ${userId}
          AND "deletedAt" IS NULL
          AND date >= ${startDate}
          AND date <= ${endDate}
        GROUP BY type
      `,

      // 8. Compare: current month
      prisma.$queryRaw<PeriodAgg[]>`
        SELECT type, SUM(amount::numeric) AS total, COUNT(*)::int AS cnt
        FROM transactions
        WHERE "userId" = ${userId} AND "deletedAt" IS NULL
          AND EXTRACT(YEAR  FROM date)::int = ${compareYear}
          AND EXTRACT(MONTH FROM date)::int = ${compareMonth}
        GROUP BY type
      `,

      // 9. Compare: previous month
      prisma.$queryRaw<PeriodAgg[]>`
        SELECT type, SUM(amount::numeric) AS total, COUNT(*)::int AS cnt
        FROM transactions
        WHERE "userId" = ${userId} AND "deletedAt" IS NULL
          AND EXTRACT(YEAR  FROM date)::int = ${prevYear}
          AND EXTRACT(MONTH FROM date)::int = ${prevMonth}
        GROUP BY type
      `,

      // 10. Compare: same month last year
      prisma.$queryRaw<PeriodAgg[]>`
        SELECT type, SUM(amount::numeric) AS total, COUNT(*)::int AS cnt
        FROM transactions
        WHERE "userId" = ${userId} AND "deletedAt" IS NULL
          AND EXTRACT(YEAR  FROM date)::int = ${compareYear - 1}
          AND EXTRACT(MONTH FROM date)::int = ${compareMonth}
        GROUP BY type
      `,

      // 11. Goals (small table, needed for projection)
      prisma.savingsGoal.findMany({ where: { userId } }),

      // 12. Last 3-month aggregate for goal forecast
      prisma.$queryRaw<PeriodAgg[]>`
        SELECT type, SUM(amount::numeric) AS total
        FROM transactions
        WHERE "userId" = ${userId} AND "deletedAt" IS NULL
          AND date >= ${subMonths(now, 3)}
        GROUP BY type
      `,
    ])

    // ═══════════════════════════════════════════════════════════════════════
    // Phase 2 — Fetch individual rows ONLY for the selected period
    //   Needed for: anomaly detection (needs per-row amounts) + cash flow timeline
    //   Scoped to selected period only (not the full year like before)
    // ═══════════════════════════════════════════════════════════════════════
    const detailedTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: { gte: startDate, lte: endDate },
      },
      select: {
        id: true, type: true, amount: true,
        category: true, description: true, date: true, paymentMethod: true,
      },
      orderBy: { date: 'asc' },
    })

    const expenses = detailedTransactions.filter(t => t.type === 'expense')

    // ─── KPIs ─────────────────────────────────────────────────────────────
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

    // ─── Monthly Trend (last 6) ────────────────────────────────────────────
    const monthMap: Record<string, { month: string; income: number; expense: number; sortKey: number }> = {}
    for (const row of monthlyRows) {
      if (!monthMap[row.month]) {
        monthMap[row.month] = { month: row.month, income: 0, expense: 0, sortKey: new Date(row.sort_key).getTime() }
      }
      if (row.type === 'income') monthMap[row.month].income = Number(row.total)
      else                       monthMap[row.month].expense = Number(row.total)
    }
    const monthlyTrendData = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey).slice(-6)

    // ─── Heatmap (365-day grid from SQL daily aggregates) ─────────────────
    const today          = new Date()
    const heatmapStartDate = subDays(today, 364)
    const days           = eachDayOfInterval({ start: heatmapStartDate, end: today })
    const dailyMap: Record<string, { income: number; expense: number }> = {}
    for (const row of dailyRows) {
      dailyMap[row.day] = { income: Number(row.income), expense: Number(row.expense) }
    }
    const heatmapData = days.map(d => {
      const k      = format(d, 'yyyy-MM-dd')
      const totals = dailyMap[k] || { income: 0, expense: 0 }
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

    // ─── Cash Flow Timeline (from per-row data — needed for running balance) ─
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

    // ─── Sankey (from SQL category aggregates) ────────────────────────────
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

    // ─── Treemap (from SQL category aggregates) ───────────────────────────
    const children   = categoryRows.map(r => ({ name: r.category, size: Number(r.total) }))
    const treemapData = children.length > 0 ? [{ name: 'Expenses', children }] : []

    // ─── Pivot Table (from SQL catMonth aggregates) ───────────────────────
    const pivotMonthKeys = [...new Set(catMonthRows.map(r => r.month))].slice(-6)
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

    // ─── Payment Methods (from SQL) ───────────────────────────────────────
    const paymentMethodData = paymentRows.map(r => ({ name: r.method, value: Number(r.total) }))

    // ─── Anomaly Detection (needs per-row amounts for stdDev) ────────────
    interface Anomaly {
      id: string; index: number; date: string; rawDate: number
      amount: number; category: string | null; description: string; isAnomaly: boolean
    }
    let anomalyData: Anomaly[] = []
    if (expenses.length > 0) {
      const amounts = expenses.map(t => Number(t.amount))
      const mean    = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const stdDev  = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length)
      anomalyData   = expenses.map((t, i) => {
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
    }

    // ─── Radar (from SQL category aggregates) ────────────────────────────
    const avgExpensePerCat = expense / (categoryRows.length || 1)
    const radarData = categoryRows.slice(0, 6).map(r => ({
      subject:  r.category,
      amount:   Number(r.total),
      fullMark: Math.max(Number(r.total), avgExpensePerCat * 2),
    }))

    // ─── Weekday Habits (from SQL) ────────────────────────────────────────
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

    // ─── Goal Forecast (from SQL recent aggregate) ────────────────────────
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

    // ─── Compare Tab ──────────────────────────────────────────────────────
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

    // Available years for dropdown (from monthly trend data)
    const availableYears = [
      ...new Set([
        ...monthlyRows.map(r => new Date(r.sort_key).getFullYear()),
        new Date().getFullYear(),
      ]),
    ].sort((a, b) => b - a)

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
