// Interactive financial calendar with month, week, and agenda views.
// Shows per-day transaction chips, spending intensity heat, and an upcoming-events sidebar.
'use client'

import { useMemo, useState } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  differenceInCalendarDays
} from 'date-fns'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Repeat,
  CreditCard,
  Banknote,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { useTransactions } from '@/hooks/useApi'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  paymentMethod: string | null
  source: string | null
  date: string
  recurringTransactionId?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CalendarTabProps {
}

type ViewMode = 'month' | 'week' | 'agenda'
type TypeFilter = 'all' | 'income' | 'expense' | 'recurring'

const CARD = "rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"

const TYPE_THEME = {
  income: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    icon: ArrowDownRight,
    label: 'Income',
    hoverBg: 'hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50',
  },
  expense: {
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500 dark:bg-rose-400',
    icon: ArrowUpRight,
    label: 'Expense',
    hoverBg: 'hover:bg-rose-100/60 dark:hover:bg-rose-900/50',
  },
  recurring: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
    icon: Repeat,
    label: 'Recurring',
    hoverBg: 'hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50',
  }
} as const

const getTheme = (t: Transaction) => {
  if (t.recurringTransactionId) return TYPE_THEME.recurring
  return TYPE_THEME[t.type]
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE = 3

function CalendarTab({}: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>('month')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useScrollLock(!!selectedDay || !!selectedTransaction)

  // ─── Calendar Grid ───
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)

  const { transactions: fetchedTransactions, isLoading: fetchLoading } = useTransactions(1, 1000, {
    startDate: format(gridStart, 'yyyy-MM-dd'),
    endDate: format(gridEnd, 'yyyy-MM-dd')
  })
  
  const transactions = fetchedTransactions || []

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return transactions.filter(t => {
      if (typeFilter === 'recurring' && !t.recurringTransactionId) return false
      if (typeFilter === 'income' && t.type !== 'income') return false
      if (typeFilter === 'expense' && t.type !== 'expense') return false
      if (q) {
        const haystack = [t.category, t.description || '', t.paymentMethod || '', t.source || ''].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [transactions, typeFilter, searchQuery])

  const txByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    filteredTransactions.forEach(t => {
      const key = format(new Date(t.date), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    })
    // Sort each day's transactions by amount descending
    map.forEach((arr) => arr.sort((a, b) => b.amount - a.amount))
    return map
  }, [filteredTransactions])

  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let d = gridStart
    while (d <= gridEnd) {
      days.push(d)
      d = addDays(d, 1)
    }
    return days
  }, [gridStart, gridEnd])

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  const monthStats = useMemo(() => {
    let income = 0, expense = 0, txCount = 0
    filteredTransactions.forEach(t => {
      const d = new Date(t.date)
      if (isSameMonth(d, currentDate)) {
        txCount++
        if (t.type === 'income') income += t.amount
        else expense += t.amount
      }
    })
    return { income, expense, net: income - expense, txCount }
  }, [filteredTransactions, currentDate])

  const upcoming = useMemo(() => {
    const today = startOfDay(new Date())
    const end = addDays(today, 7)
    return filteredTransactions
      .filter(t => {
        const d = new Date(t.date)
        return d >= today && d <= end
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  }, [filteredTransactions])

  const goNext = () => {
    if (view === 'month' || view === 'agenda') setCurrentDate(addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
  }
  const goPrev = () => {
    if (view === 'month' || view === 'agenda') setCurrentDate(subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
  }
  const goToday = () => setCurrentDate(new Date())

  const headerLabel = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy')
    if (view === 'week') {
      const ws = startOfWeek(currentDate)
      const we = endOfWeek(currentDate)
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
    }
    return format(currentDate, 'MMMM yyyy')
  }, [currentDate, view])

  const getDayIntensity = (date: Date): string => {
    const key = format(date, 'yyyy-MM-dd')
    const dayTx = txByDate.get(key) || []
    const totalExpense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalIncome = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

    if (totalIncome > 0 && totalExpense === 0) {
      return 'dark:bg-emerald-900/10'
    }
    if (totalExpense === 0) return ''
    if (totalExpense <= 500)  return 'bg-rose-50/30  dark:bg-rose-950/20'
    if (totalExpense <= 2000) return 'bg-rose-50/50  dark:bg-rose-950/30'
    if (totalExpense <= 5000) return 'bg-rose-100/40 dark:bg-rose-950/40'
    return 'bg-rose-100/60 dark:bg-rose-950/50'
  }

  const renderChip = (t: Transaction) => {
    const theme = getTheme(t)
    return (
      <button
        key={t.id}
        onClick={(e) => { e.stopPropagation(); setSelectedTransaction(t) }}
        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold truncate transition-colors ${theme.bg} ${theme.text} ${theme.hoverBg}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${theme.dot}`} />
        <span className="truncate">{t.description || t.category}</span>
        <span className={`ml-auto font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      </button>
    )
  }

  const renderFullRow = (t: Transaction) => {
    const theme = getTheme(t)
    const Icon = theme.icon
    return (
      <button
        key={t.id}
        onClick={() => setSelectedTransaction(t)}
        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md ${theme.bg} ${theme.border}`}
      >
        <div className={`flex items-center justify-center h-9 w-9 rounded-xl ${theme.bg} ${theme.text} shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-bold truncate ${theme.text}`}>{t.description || t.category}</p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">{t.category} · {format(new Date(t.date), 'hh:mm a')}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
          </p>
          {t.paymentMethod && (
            <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{t.paymentMethod}</p>
          )}
        </div>
      </button>
    )
  }

  const renderMonthView = () => (
    <div className={`${CARD} overflow-hidden`}>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-neutral-800">
        {DAY_LABELS.map(label => (
          <div key={label} className="px-2 py-3 text-center text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const dayTx = txByDate.get(key) || []
          const inMonth = isSameMonth(day, monthStart)
          const today = isToday(day)
          const intensity = getDayIntensity(day)
          const visible = dayTx.slice(0, MAX_VISIBLE)
          const overflow = dayTx.length - visible.length

          const dayIncome = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
          const dayExpense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

          return (
            <div
              key={key}
              onClick={() => setSelectedDay(day)}
              className={`
                min-h-[60px] sm:min-h-[130px] border-b border-r border-slate-100 dark:border-neutral-800 p-1 sm:p-2 cursor-pointer
                transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-neutral-800/50
                ${!inMonth ? 'opacity-40' : ''} ${intensity}
              `}
            >
              {/* Date number + spending summary */}
              <div className="flex items-start justify-between mb-0.5 sm:mb-1.5">
                <span className={`
                  inline-flex items-center justify-center text-[10px] sm:text-xs font-bold
                  ${today
                    ? 'h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-blue-600 text-white shadow-sm'
                    : 'h-5 w-5 sm:h-7 sm:w-7 rounded-full text-slate-700 dark:text-neutral-300'
                  }
                `}>
                  {format(day, 'd')}
                </span>

                {dayTx.length > 0 && (
                  <div className="hidden sm:flex flex-col items-end gap-0.5">
                    {dayIncome > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">
                        -{formatCurrency(dayExpense)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Transaction chips (Desktop) */}
              <div className="hidden sm:block space-y-1">
                {visible.map(t => renderChip(t))}
                {overflow > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedDay(day) }}
                    className="w-full text-center text-[10px] font-bold text-blue-600 hover:text-blue-800 py-0.5 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>

              {/* Colored dot indicators (Mobile) */}
              <div className="flex sm:hidden flex-wrap justify-center gap-0.5 mt-1">
                {dayTx.slice(0, 3).map((t, idx) => {
                  const theme = getTheme(t)
                  return (
                    <span
                      key={`${t.id}-${idx}`}
                      className={`h-1.5 w-1.5 rounded-full ${theme.dot}`}
                    />
                  )
                })}
                {dayTx.length > 3 && (
                  <span className="text-[8px] leading-none font-bold text-blue-600">+</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderWeekView = () => (
    <div className={`${CARD} overflow-hidden`}>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-neutral-800">
            {weekDays.map(day => {
              const today = isToday(day)
              return (
                <div key={day.toISOString()} className={`px-3 py-3 text-center border-r border-slate-100 dark:border-neutral-800 last:border-r-0 ${today ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase">{format(day, 'EEE')}</p>
                  <p className={`text-lg font-black mt-0.5 ${today ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map(day => {
              const key = format(day, 'yyyy-MM-dd')
              const dayTx = txByDate.get(key) || []

              return (
                <div key={key} className="border-r border-slate-100 dark:border-neutral-800 last:border-r-0 p-2 space-y-1.5">
                  {dayTx.length === 0 ? (
                    <p className="text-[10px] text-slate-300 dark:text-neutral-600 text-center mt-4">No activity</p>
                  ) : (
                    dayTx.map(t => renderChip(t))
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  const renderAgendaView = () => {
    const sortedTx = [...filteredTransactions]
      .filter(t => isSameMonth(new Date(t.date), currentDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const groups = new Map<string, Transaction[]>()
    sortedTx.forEach(t => {
      const key = format(new Date(t.date), 'yyyy-MM-dd')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    })

    if (groups.size === 0) {
      return (
        <div className={`${CARD} flex flex-col items-center justify-center py-16 text-slate-400 dark:text-neutral-500`}>
          <CalendarIcon className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-semibold">No transactions this month</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {Array.from(groups.entries()).map(([dateKey, txs]) => {
          const date = new Date(dateKey)
          const dayIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
          const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

          return (
            <div key={dateKey} className={CARD}>
              {/* Day header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className={`flex flex-col items-center justify-center h-11 w-11 rounded-xl ${isToday(date) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'}`}>
                    <span className="text-[10px] font-bold uppercase leading-none mt-0.5">{format(date, 'EEE')}</span>
                    <span className="text-lg font-black leading-none">{format(date, 'd')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{format(date, 'EEEE, MMMM d')}</p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">{txs.length} transaction{txs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {dayIncome > 0 && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                      +{formatCurrency(dayIncome)}
                    </span>
                  )}
                  {dayExpense > 0 && (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 rounded-full">
                      -{formatCurrency(dayExpense)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions */}
              <div className="p-3 space-y-2">
                {txs.map(t => renderFullRow(t))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-5 font-sans pb-24 md:pb-0">
      {/* ─── Top Bar: Title + Navigation ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Financial Calendar</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Track spending patterns and financial activity over time.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/50 p-1">
            {([
              { key: 'month' as ViewMode, icon: LayoutGrid, label: 'Month' },
              { key: 'week' as ViewMode, icon: CalendarIcon, label: 'Week' },
              { key: 'agenda' as ViewMode, icon: List, label: 'Agenda' }
            ]).map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === v.key
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
                }`}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1">
            <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-slate-500 dark:text-neutral-400">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-900 dark:text-white min-w-[150px] text-center">
              {headerLabel}
            </span>
            <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-slate-500 dark:text-neutral-400">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={goToday}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 shadow-sm hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white hover:border-blue-600 dark:hover:border-blue-500 transition-all"
          >
            Today
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'}`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Filters Bar (Collapsible) ─── */}
      {showFilters && (
        <div className={`${CARD} p-4 flex flex-wrap items-center gap-3 animate-fadeIn`}>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/50 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="text-sm bg-transparent focus:outline-none w-48 placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/50 p-1">
            {(['all', 'income', 'expense', 'recurring'] as TypeFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === f
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Month Summary Cards ─── */}
      {view !== 'agenda' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`${CARD} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Income</span>
            </div>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(monthStats.income)}</p>
          </div>

          <div className={`${CARD} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Expense</span>
            </div>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(monthStats.expense)}</p>
          </div>

          <div className={`${CARD} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Net Flow</span>
            </div>
            <p className={`text-lg font-black ${monthStats.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(monthStats.net)}
            </p>
          </div>

          <div className={`${CARD} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Transactions</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{monthStats.txCount}</p>
          </div>
        </div>
      )}

      {/* ─── Loading State ─── */}
      {fetchLoading && (
        <div className={`${CARD} p-12 text-center animate-pulse`}>
          <p className="text-sm text-slate-400 dark:text-neutral-500 font-semibold">Loading financial calendar...</p>
        </div>
      )}

      {/* ─── Calendar Views ─── */}
      {!fetchLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {/* Main calendar area */}
          <div className="xl:col-span-3">
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'agenda' && renderAgendaView()}
          </div>

          {/* Sidebar: Upcoming + Legend */}
          <div className="space-y-4">
            {/* Upcoming transactions */}
            {upcoming.length > 0 && (
              <div className={CARD}>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming (7 days)</h3>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {upcoming.map(t => {
                    const theme = getTheme(t)
                    const daysAway = differenceInCalendarDays(new Date(t.date), new Date())
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTransaction(t)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${theme.bg} ${theme.hoverBg}`}
                      >
                        <div className={`h-2 w-2 rounded-full shrink-0 ${theme.dot}`} />
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-xs font-bold truncate ${theme.text}`}>{t.description || t.category}</p>
                          <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                            {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                          </p>
                        </div>
                        <span className={`text-xs font-black ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className={`${CARD} p-4`}>
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-3">Legend</h3>
              <div className="space-y-2">
                {Object.entries(TYPE_THEME).map(([key, theme]) => (
                  <div key={key} className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">{theme.label}</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 dark:border-neutral-800 pt-2 mt-2">
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500">Cells with a pink tint indicate higher spending days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Day Detail Sheet (when clicking a day in month view) ─── */}
      {selectedDay && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-neutral-950/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center" onClick={() => setSelectedDay(null)}>
          <div
            className="bg-white dark:bg-neutral-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl ${isToday(selectedDay) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'}`}>
                  <span className="text-[10px] font-bold uppercase">{format(selectedDay, 'EEE')}</span>
                  <span className="text-xl font-black">{format(selectedDay, 'd')}</span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{format(selectedDay, 'EEEE, MMMM d')}</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">{format(selectedDay, 'yyyy')}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="h-4 w-4 text-slate-500 dark:text-neutral-400" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
              {(txByDate.get(format(selectedDay, 'yyyy-MM-dd')) || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-neutral-500">
                  <CalendarIcon className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No transactions on this day</p>
                </div>
              ) : (
                (txByDate.get(format(selectedDay, 'yyyy-MM-dd')) || []).map(t => renderFullRow(t))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Transaction Detail Sheet ─── */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-neutral-950/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center" onClick={() => setSelectedTransaction(null)}>
          <div
            className="bg-white dark:bg-neutral-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const t = selectedTransaction
              const theme = getTheme(t)
              const Icon = theme.icon
              return (
                <>
                  <div className={`px-6 py-5 ${theme.bg} border-b ${theme.border}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-xl bg-white/60 dark:bg-black/20 ${theme.text}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${theme.text}`}>{theme.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400">{format(new Date(t.date), 'EEEE, MMM d, yyyy · hh:mm a')}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedTransaction(null)} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-black/20 transition-colors">
                        <X className="h-4 w-4 text-slate-500 dark:text-neutral-400" />
                      </button>
                    </div>

                    <p className={`text-3xl font-black mt-4 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                  </div>

                  <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Category</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{t.category}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Payment</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{t.paymentMethod || '—'}</p>
                      </div>
                      {t.description && (
                        <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Description</p>
                          <p className="text-sm text-slate-700 dark:text-neutral-300 mt-1">{t.description}</p>
                        </div>
                      )}
                      {t.source && (
                        <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Source</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{t.source}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarTab