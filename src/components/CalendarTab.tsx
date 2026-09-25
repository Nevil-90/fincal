// Interactive financial calendar with month, week, and agenda views.
// Shows per-day transaction chips, spending intensity heat, and an upcoming-events sidebar.
'use client'

import { useMemo, useState, useEffect } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
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
  ArrowDownRight,
  Plus,
  Play,
  Pause
} from 'lucide-react'
import { formatCurrency } from '@/lib/financial-utils'
import { SkeletonCalendar } from './ui/SkeletonCard'
import { useTransactions } from '@/hooks/useApi'
import AddTransactionForm from './AddTransactionForm'
import RecurringForm from './recurring/RecurringForm'
import type { RecurringFormData } from './recurring/types'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  title?: string
  description?: string | null
  notes?: string | null
  paymentMethod: string | null
  source: string | null
  date: string
  recurringTransactionId?: string
  isScheduled?: boolean
  isPaused?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CalendarTabProps {
}

type ViewMode = 'month' | 'week' | 'agenda'
type TypeFilter = 'all' | 'income' | 'expense' | 'recurring'

const CARD = "rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs"

const TYPE_THEME = {
  income: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200/80 dark:border-emerald-800/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    icon: ArrowDownRight,
    label: 'Income',
    hoverBg: 'hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50',
  },
  expense: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200/70 dark:border-rose-800/30',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500 dark:bg-rose-400',
    icon: ArrowUpRight,
    label: 'Expense',
    hoverBg: 'hover:bg-rose-100/70 dark:hover:bg-rose-900/40',
  },
  recurring: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200/70 dark:border-blue-800/40',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500 dark:bg-blue-400',
    icon: Repeat,
    label: 'Recurring',
    hoverBg: 'hover:bg-blue-100/70 dark:hover:bg-blue-900/50',
  },
  scheduled: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200/80 dark:border-indigo-800/40 border-dashed',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
    icon: Clock,
    label: 'Scheduled',
    hoverBg: 'hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40',
  },
  paused: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300/80 dark:border-amber-500/30 border-dashed',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500 dark:bg-amber-400',
    icon: Pause,
    label: 'Paused Recurring',
    hoverBg: 'hover:bg-amber-100/70 dark:hover:bg-amber-900/40',
  }
} as const

const getTheme = (t: Transaction) => {
  if (t.isPaused) return TYPE_THEME.paused
  if (t.isScheduled) return TYPE_THEME.scheduled
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

  // Modals for adding from calendar
  const [addTxnDate, setAddTxnDate] = useState<string | null>(null)
  const [addRecDate, setAddRecDate] = useState<string | null>(null)
  
  const [recFormData, setRecFormData] = useState<RecurringFormData>({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    paymentMethod: '',
    source: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    splitType: 'personal',
  })
  const [recFormLoading, setRecFormLoading] = useState(false)

  useScrollLock(!!selectedDay || !!selectedTransaction || !!addTxnDate || !!addRecDate)

  // ─── Calendar Grid ───
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)

  const { transactions: fetchedTransactions, isLoading: fetchLoading, mutate: mutateTransactions } = useTransactions(1, 1000, {
    startDate: format(gridStart, 'yyyy-MM-dd'),
    endDate: format(gridEnd, 'yyyy-MM-dd')
  })

  const [recurringList, setRecurringList] = useState<any[]>([])

  const fetchRecurring = () => {
    fetch('/api/recurring')
      .then(res => res.ok ? res.json() : [])
      .then(data => setRecurringList(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => {
    fetchRecurring()
  }, [])

  const projectedRecurringTransactions = useMemo(() => {
    const projected: Transaction[] = []
    if (!recurringList.length) return projected

    recurringList.forEach(rec => {
      const isPaused = !rec.isActive || rec.isPaused
      const start = new Date(rec.startDate)
      
      let d = new Date(start)
      // Fast forward d until it reaches or passes gridStart
      while (d < gridStart) {
        if (rec.frequency === 'daily') d = addDays(d, 1)
        else if (rec.frequency === 'weekly') d = addWeeks(d, 1)
        else if (rec.frequency === 'monthly') d = addMonths(d, 1)
        else if (rec.frequency === 'yearly') d = addMonths(d, 12)
        else break
      }

      let count = 0
      while (d <= gridEnd && count < 60) {
        count++
        if (d >= gridStart) {
          const dateStr = format(d, 'yyyy-MM-dd')
          const alreadyExists = (fetchedTransactions || []).some(
            (t: any) => t.recurringTransactionId === rec.id && format(new Date(t.date), 'yyyy-MM-dd') === dateStr
          )
          if (!alreadyExists) {
            projected.push({
              id: `proj-${rec.id}-${dateStr}`,
              type: rec.type,
              amount: Number(rec.amount),
              category: rec.category,
              title: rec.description || rec.category,
              description: rec.description,
              paymentMethod: rec.paymentMethod || null,
              source: rec.source || null,
              date: dateStr,
              recurringTransactionId: rec.id,
              isScheduled: true,
              isPaused: Boolean(isPaused)
            })
          }
        }
        if (rec.frequency === 'daily') d = addDays(d, 1)
        else if (rec.frequency === 'weekly') d = addWeeks(d, 1)
        else if (rec.frequency === 'monthly') d = addMonths(d, 1)
        else if (rec.frequency === 'yearly') d = addMonths(d, 12)
        else break
      }
    })

    return projected
  }, [recurringList, gridStart, gridEnd, fetchedTransactions])

  const allTransactions = useMemo(() => {
    return [...(fetchedTransactions || []), ...projectedRecurringTransactions]
  }, [fetchedTransactions, projectedRecurringTransactions])
  
  const handleAddRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recFormData.amount || !recFormData.category) return
    setRecFormLoading(true)
    try {
      if (recFormData.frequency === 'one-time') {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: recFormData.type,
            amount: parseFloat(recFormData.amount),
            category: recFormData.category,
            title: recFormData.description.trim() || 'One-Time Subscription',
            date: addRecDate || recFormData.startDate,
            paymentMethod: recFormData.paymentMethod || null,
            source: recFormData.source || null,
            notes: recFormData.notes || null,
            isOneTimeSubscription: true,
          }),
        })
        if (response.ok) {
          setAddRecDate(null)
          mutateTransactions()
        }
      } else {
        const response = await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...recFormData, startDate: addRecDate || recFormData.startDate }),
        })
        if (response.ok) {
          setAddRecDate(null)
          mutateTransactions()
        }
      }
    } finally {
      setRecFormLoading(false)
    }
  }

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allTransactions.filter(t => {
      if (typeFilter === 'recurring' && !t.recurringTransactionId) return false
      if (typeFilter === 'income' && t.type !== 'income') return false
      if (typeFilter === 'expense' && t.type !== 'expense') return false
      if (q) {
        const haystack = [t.category, t.title || '', t.description || '', t.notes || '', t.paymentMethod || '', t.source || ''].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [allTransactions, typeFilter, searchQuery])

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
    let income = 0, expense = 0, scheduledExpense = 0, txCount = 0
    filteredTransactions.forEach(t => {
      const d = new Date(t.date)
      if (isSameMonth(d, currentDate)) {
        txCount++
        if (t.isScheduled) {
          if (!t.isPaused && t.type === 'expense') scheduledExpense += t.amount
        } else {
          if (t.type === 'income') income += t.amount
          else expense += t.amount
        }
      }
    })
    return {
      income,
      expense,
      scheduledExpense,
      net: income - expense - scheduledExpense,
      txCount
    }
  }, [filteredTransactions, currentDate])

  const todayTransactions = useMemo(() => {
    const today = startOfDay(new Date())
    return filteredTransactions
      .filter(t => {
        const d = new Date(t.date)
        return isSameDay(d, today) && !t.isScheduled
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [filteredTransactions])

  const upcoming = useMemo(() => {
    const today = startOfDay(new Date())
    const end = addDays(today, 7)
    return filteredTransactions
      .filter(t => {
        const d = new Date(t.date)
        // If it's a scheduled bill, include today or future up to 7 days
        if (t.isScheduled) {
          return d >= today && d <= end
        }
        // If it's a regular transaction, only include future dates (tomorrow onwards)
        return isAfter(d, endOfDay(today)) && d <= end
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


  const renderChip = (t: Transaction) => {
    const theme = getTheme(t)
    const isIncome = t.type === 'income'
    const isPaused = Boolean(t.isPaused)
    return (
      <button
        key={t.id}
        onClick={(e) => { e.stopPropagation(); setSelectedTransaction(t) }}
        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium truncate transition-all duration-150 border cursor-pointer ${
          isPaused
            ? 'bg-amber-50/70 dark:bg-amber-950/20 text-slate-700 dark:text-neutral-300 border-amber-300/70 dark:border-amber-500/30 opacity-80 hover:opacity-100'
            : isIncome
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50'
            : 'bg-slate-50 dark:bg-[#181820] text-slate-800 dark:text-neutral-200 border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#202028]'
        } ${t.isScheduled && !isPaused ? 'border-dashed border-indigo-400/60 dark:border-indigo-500/50' : ''} ${isPaused ? 'border-dashed' : ''}`}
        title={isPaused ? `${t.title || t.description || t.category} (Recurring - Paused)` : undefined}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isPaused ? 'bg-amber-500 dark:bg-amber-400' : theme.dot}`} />
        {isPaused ? (
          <Pause className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
        ) : t.isScheduled ? (
          <Clock className="w-2.5 h-2.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
        ) : null}
        <span className={`truncate ${isPaused ? 'line-through text-slate-500 dark:text-neutral-400' : 'text-slate-900 dark:text-neutral-200 font-semibold'}`}>
          {t.title || t.description || t.category}
        </span>
        {isPaused && (
          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
            (Paused)
          </span>
        )}
        <span className={`ml-auto font-bold tabular-nums whitespace-nowrap ${
          isPaused
            ? 'text-slate-500 dark:text-neutral-400'
            : isIncome
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-slate-900 dark:text-neutral-100'
        }`}>
          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      </button>
    )
  }

  const renderFullRow = (t: Transaction) => {
    const theme = getTheme(t)
    const isIncome = t.type === 'income'
    const isPaused = Boolean(t.isPaused)
    const Icon = isPaused ? Pause : theme.icon
    return (
      <button
        key={t.id}
        onClick={() => setSelectedTransaction(t)}
        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border ${
          isPaused
            ? 'border-dashed border-amber-300/80 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15'
            : t.isScheduled 
            ? 'border-dashed border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-500/5' 
            : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#16161a]'
        } hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all duration-150 cursor-pointer`}
      >
        <div className={`flex items-center justify-center h-8.5 w-8.5 rounded-xl ${
          isPaused
            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-800/50'
            : `${theme.bg} ${theme.text} border ${theme.border}`
        } shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-xs font-semibold truncate ${isPaused ? 'text-slate-600 dark:text-neutral-300 line-through' : 'text-slate-900 dark:text-white'}`}>
              {t.title || t.description || t.category}
            </p>
            {isPaused ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 flex items-center gap-1">
                <Pause className="w-2.5 h-2.5" /> Paused
              </span>
            ) : t.isScheduled ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                Scheduled
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
            <span>{t.category}</span>
            {t.paymentMethod && (
              <>
                <span>•</span>
                <span>{t.paymentMethod}</span>
              </>
            )}
            {isPaused && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">Recurring paused</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold tabular-nums ${
            isPaused
              ? 'text-slate-500 dark:text-neutral-400'
              : isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-900 dark:text-white'
          }`}>
            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
          </p>
          {isPaused ? (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">Paused</p>
          ) : t.isScheduled ? (
            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5">Upcoming</p>
          ) : t.paymentMethod ? (
            <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{t.paymentMethod}</p>
          ) : null}
        </div>
      </button>
    )
  }

  const renderMonthView = () => (
    <div className={`${CARD} overflow-hidden`}>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
        {DAY_LABELS.map(label => (
          <div key={label} className="px-2 py-3 text-center text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
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
          const visible = dayTx.slice(0, MAX_VISIBLE)
          const overflow = dayTx.length - visible.length

          const dayIncome = dayTx.filter(t => t.type === 'income' && !t.isPaused).reduce((s, t) => s + t.amount, 0)
          const dayExpense = dayTx.filter(t => t.type === 'expense' && !t.isPaused).reduce((s, t) => s + t.amount, 0)

          return (
            <div
              key={key}
              onClick={() => setSelectedDay(day)}
              className={`
                min-h-[65px] sm:min-h-[125px] border-b border-r border-slate-200/80 dark:border-white/[0.06] [&:nth-child(7n)]:border-r-0 p-1.5 sm:p-2 cursor-pointer
                transition-colors duration-150
                ${inMonth 
                  ? 'bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-[#17171d]' 
                  : 'bg-slate-50/50 dark:bg-[#0c0c0e]/80 text-slate-400 dark:text-neutral-600 hover:bg-slate-100/50 dark:hover:bg-[#101013]'
                }
              `}
            >
              {/* Date number + spending summary */}
              <div className="flex items-start justify-between mb-1 sm:mb-1.5">
                <span className={`
                  inline-flex items-center justify-center text-xs font-bold tabular-nums
                  ${today
                    ? 'h-6 w-6 sm:h-7 sm:w-7 rounded-xl bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                    : inMonth
                    ? 'h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-slate-800 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white'
                    : 'h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-slate-400 dark:text-neutral-600'
                  }
                `}>
                  {format(day, 'd')}
                </span>

                {dayTx.length > 0 && (
                  <div className="hidden sm:flex flex-col items-end gap-0.5">
                    {dayIncome > 0 && (
                      <span className="text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                        +{formatCurrency(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-[10px] font-bold tabular-nums text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1 py-0.5 rounded border border-rose-200/60 dark:border-rose-800/40">
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
                    className="w-full text-center text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 py-0.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>

              {/* Colored dot indicators (Mobile) */}
              <div className="flex sm:hidden flex-wrap justify-center gap-1 mt-1">
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
                  <span className="text-[8px] leading-none font-bold text-blue-600 dark:text-blue-400">+</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderWeekView = () => (
    <div className="space-y-3 font-sans">
      {/* 1. Desktop 7-Column Grid (md+) */}
      <div className={`hidden md:block ${CARD} overflow-hidden`}>
        <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          {weekDays.map(day => {
            const today = isToday(day)
            return (
              <div key={day.toISOString()} className={`px-3 py-3 text-center border-r border-slate-200/80 dark:border-white/[0.06] last:border-r-0 ${today ? 'bg-blue-50/80 dark:bg-blue-950/30' : ''}`}>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{format(day, 'EEE')}</p>
                <p className={`text-base font-bold mt-0.5 tabular-nums ${today ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                  {format(day, 'd')}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-7 min-h-[380px]">
          {weekDays.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const dayTx = txByDate.get(key) || []

            return (
              <div key={key} className="border-r border-slate-200/80 dark:border-white/[0.06] last:border-r-0 p-2 space-y-1.5">
                {dayTx.length === 0 ? (
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 text-center mt-4">No activity</p>
                ) : (
                  dayTx.map(t => renderChip(t))
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Mobile 7-Day Card Stack (< md) to Eliminate Horizontal Scrolling */}
      <div className="block md:hidden space-y-2">
        {weekDays.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const dayTx = txByDate.get(key) || []
          const today = isToday(day)
          const dayIncome = dayTx.filter(t => t.type === 'income' && !t.isPaused).reduce((s, t) => s + t.amount, 0)
          const dayExpense = dayTx.filter(t => t.type === 'expense' && !t.isPaused).reduce((s, t) => s + t.amount, 0)

          return (
            <div
              key={key}
              onClick={() => setSelectedDay(day)}
              className={`${CARD} p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center tabular-nums ${today ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-200'}`}>
                    {format(day, 'd')}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{format(day, 'EEEE')}</span>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 ml-1.5">{format(day, 'MMM yyyy')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] tabular-nums font-semibold">
                  {dayIncome > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(dayIncome)}</span>}
                  {dayExpense > 0 && <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(dayExpense)}</span>}
                  {dayIncome === 0 && dayExpense === 0 && <span className="text-slate-400 dark:text-neutral-500 font-normal">No activity</span>}
                </div>
              </div>

              {dayTx.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                  {dayTx.map(t => renderChip(t))}
                </div>
              )}
            </div>
          )
        })}
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
        <div className={`${CARD} flex flex-col items-center justify-center py-16 text-slate-400 dark:text-neutral-400`}>
          <CalendarIcon className="h-10 w-10 mb-3 opacity-30 text-slate-400 dark:text-neutral-500" />
          <p className="text-sm font-semibold text-slate-600 dark:text-neutral-300">No transactions this month</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {Array.from(groups.entries()).map(([dateKey, txs]) => {
          const date = new Date(dateKey)
          const dayIncome = txs.filter(t => t.type === 'income' && !t.isPaused).reduce((s, t) => s + t.amount, 0)
          const dayExpense = txs.filter(t => t.type === 'expense' && !t.isPaused).reduce((s, t) => s + t.amount, 0)

          return (
            <div key={dateKey} className={CARD}>
              {/* Day header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={`flex flex-col items-center justify-center h-10 w-10 rounded-xl ${isToday(date) ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-200'}`}>
                    <span className="text-[9px] font-bold uppercase leading-none mt-0.5">{format(date, 'EEE')}</span>
                    <span className="text-base font-bold leading-none mt-0.5 tabular-nums">{format(date, 'd')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{format(date, 'EEEE, MMMM d')}</p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">{txs.length} transaction{txs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dayIncome > 0 && (
                    <span className="text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      +{formatCurrency(dayIncome)}
                    </span>
                  )}
                  {dayExpense > 0 && (
                    <span className="text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2.5 py-0.5 rounded-full">
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

  if (fetchLoading && (!fetchedTransactions || fetchedTransactions.length === 0)) {
    return <SkeletonCalendar />
  }

  return (
    <div className="space-y-4 font-sans pb-24 md:pb-0">
      {/* ─── Top Bar: Title + Navigation ─── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Calendar</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Track spending patterns and daily cashflow over time.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#121215] p-1">
            {([
              { key: 'month' as ViewMode, icon: LayoutGrid, label: 'Month' },
              { key: 'week' as ViewMode, icon: CalendarIcon, label: 'Week' },
              { key: 'agenda' as ViewMode, icon: List, label: 'Agenda' }
            ]).map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  view === v.key
                    ? 'bg-white dark:bg-[#22222a] text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#121215] p-1">
            <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/[0.06] transition-colors text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white min-w-[140px] text-center">
              {headerLabel}
            </span>
            <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/[0.06] transition-colors text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#121215] text-slate-700 dark:text-neutral-200 shadow-xs hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.06] transition-all"
          >
            Today
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-500 shadow-xs ring-2 ring-blue-500/20' : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#121215] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.06]'}`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Filters Bar (Collapsible) ─── */}
      {showFilters && (
        <div className={`${CARD} p-3 flex flex-wrap items-center gap-3 animate-fadeIn`}>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181b] px-3 py-1.5 w-full sm:w-auto">
            <Search className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="text-base sm:text-xs bg-transparent focus:outline-none w-full sm:w-48 placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-100/80 dark:bg-[#18181b] p-0.5">
            {(['all', 'income', 'expense', 'recurring'] as TypeFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === f
                    ? 'bg-white dark:bg-[#25252d] text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
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
          <div className={`${CARD} p-3.5`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Inflow</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+{formatCurrency(monthStats.income)}</p>
          </div>

          <div className={`${CARD} p-3.5`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Outflow</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">-{formatCurrency(monthStats.expense)}</p>
          </div>

          <div className={`${CARD} p-3.5`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Scheduled Due</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
              {monthStats.scheduledExpense > 0 ? `-${formatCurrency(monthStats.scheduledExpense)}` : '₹0'}
            </p>
          </div>

          <div className={`${CARD} p-3.5`}>
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Forecast Net</span>
            </div>
            <p className={`text-lg font-bold tabular-nums ${monthStats.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(monthStats.net)}
            </p>
          </div>
        </div>
      )}

      {/* ─── Loading State ─── */}
      {fetchLoading && (
        <div className="py-2">
          <SkeletonCalendar />
        </div>
      )}

      {/* ─── Calendar Views ─── */}
      {!fetchLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Main calendar area */}
          <div className="xl:col-span-3">
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'agenda' && renderAgendaView()}
          </div>

          {/* Sidebar: Upcoming + Legend */}
          <div className="space-y-4">
            {/* Today's Recorded Transactions */}
            {todayTransactions.length > 0 && (
              <div className={CARD}>
                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Today's Transactions</h3>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 tabular-nums">
                      {todayTransactions.length}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {todayTransactions.map(t => {
                    const theme = getTheme(t)
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTransaction(t)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#16161a] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <div className={`h-2 w-2 rounded-full shrink-0 ${theme.dot}`} />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {t.title || t.description || t.category}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                            Today · {t.category}
                          </p>
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${
                          t.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upcoming transactions */}
            {upcoming.length > 0 && (
              <div className={CARD}>
                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming (7 days)</h3>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {upcoming.map(t => {
                    const theme = getTheme(t)
                    const daysAway = differenceInCalendarDays(new Date(t.date), new Date())
                    const isPaused = Boolean(t.isPaused)
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTransaction(t)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border ${
                          isPaused
                            ? 'border-dashed border-amber-300/80 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'
                            : 'border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#16161a]'
                        } hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors cursor-pointer`}
                      >
                        <div className={`h-2 w-2 rounded-full shrink-0 ${isPaused ? 'bg-amber-500' : theme.dot}`} />
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className={`text-xs font-semibold truncate ${isPaused ? 'text-slate-600 dark:text-neutral-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                              {t.title || t.description || t.category}
                            </p>
                            {isPaused && (
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                (Paused)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                            {daysAway === 0 ? 'Due Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                          </p>
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${
                          isPaused
                            ? 'text-slate-500 dark:text-neutral-400'
                            : t.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}>
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
              <h3 className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Legend</h3>
              <div className="space-y-2">
                {Object.entries(TYPE_THEME).map(([key, theme]) => (
                  <div key={key} className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                    <span className="text-xs font-medium text-slate-700 dark:text-neutral-300">{theme.label}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200/80 dark:border-white/[0.06] pt-2 mt-2">
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500">Transaction chips are highlighted with category and type colors.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Day Detail Sheet (when clicking a day in month view) ─── */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setSelectedDay(null)}>
          <div
            className="bg-white dark:bg-[#121215] border-t sm:border border-slate-200/80 dark:border-white/[0.08] w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col text-slate-900 dark:text-neutral-100 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="flex sm:hidden justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className={`flex flex-col items-center justify-center h-11 w-11 rounded-xl ${isToday(selectedDay) ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300'}`}>
                  <span className="text-[9px] font-bold uppercase leading-none">{format(selectedDay, 'EEE')}</span>
                  <span className="text-lg font-bold leading-none mt-0.5 tabular-nums">{format(selectedDay, 'd')}</span>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">{format(selectedDay, 'EEEE, MMMM d')}</p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">{format(selectedDay, 'yyyy')}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg text-slate-400 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2 [scrollbar-width:thin]">
              {(txByDate.get(format(selectedDay, 'yyyy-MM-dd')) || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-neutral-400">
                  <CalendarIcon className="h-8 w-8 mb-2.5 opacity-30 text-slate-400 dark:text-neutral-500" />
                  <p className="text-xs sm:text-sm font-semibold mb-4 text-slate-700 dark:text-neutral-300">No transactions on this day</p>
                  <div className="flex items-center justify-center gap-2.5 w-full max-w-xs mx-auto">
                    <button
                      onClick={() => setAddTxnDate(format(selectedDay, 'yyyy-MM-dd'))}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Transaction
                    </button>
                    <button
                      onClick={() => {
                        setRecFormData(prev => ({ ...prev, startDate: format(selectedDay, 'yyyy-MM-dd') }))
                        setAddRecDate(format(selectedDay, 'yyyy-MM-dd'))
                      }}
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Repeat className="h-3.5 w-3.5" /> Recurring
                    </button>
                  </div>
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setSelectedTransaction(null)}>
          <div
            className="bg-white dark:bg-[#121215] border-t sm:border border-slate-200/80 dark:border-white/[0.08] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-neutral-100 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="flex sm:hidden justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
            </div>
            {(() => {
              const t = selectedTransaction
              const theme = getTheme(t)
              const Icon = theme.icon
              return (
                <>
                  <div className={`px-6 py-5 ${theme.bg} border-b ${theme.border}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-xl bg-black/5 dark:bg-black/20 ${theme.text}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text}`}>{theme.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400">{format(new Date(t.date), 'EEEE, MMM d, yyyy · hh:mm a')}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedTransaction(null)} className="p-1.5 rounded-lg text-slate-400 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors">
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <p className={`text-3xl font-bold tabular-nums mt-4 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                  </div>

                  <div className="px-6 py-5 space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06]">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Category</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{t.category}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06]">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Payment</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{t.paymentMethod || '—'}</p>
                      </div>
                      {(t.title || t.description) && (
                        <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06]">
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Title</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{t.title || t.description}</p>
                        </div>
                      )}
                      {t.notes && (
                        <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06]">
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Notes</p>
                          <p className="text-sm text-slate-700 dark:text-neutral-300 mt-1 whitespace-pre-wrap">{t.notes}</p>
                        </div>
                      )}
                      {t.source && (
                        <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-[#16161a] border border-slate-200/80 dark:border-white/[0.06]">
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Source</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{t.source}</p>
                        </div>
                      )}
                      {t.recurringTransactionId && (
                        <div className="col-span-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.06] space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-neutral-400 font-medium">Recurring Subscription</span>
                            <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                              t.isPaused 
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' 
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            }`}>
                              {t.isPaused ? 'Paused' : 'Active'}
                            </span>
                          </div>

                          {t.isPaused ? (
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch('/api/recurring', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: t.recurringTransactionId, isPaused: false })
                                })
                                fetchRecurring()
                                setSelectedTransaction(null)
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>Resume Recurring Subscription</span>
                            </button>
                          ) : t.isScheduled ? (
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch('/api/recurring', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: t.recurringTransactionId, isPaused: true })
                                })
                                fetchRecurring()
                                setSelectedTransaction(null)
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <Pause className="h-3.5 w-3.5" />
                              <span>Pause Recurring Subscription</span>
                            </button>
                          ) : null}
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

      {/* Add Transaction Modals */}
      {addTxnDate && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150" onClick={() => setAddTxnDate(null)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <AddTransactionForm
              initialData={{ date: addTxnDate } as any}
              onTransactionAdded={() => {
                setAddTxnDate(null)
                mutateTransactions()
              }}
              onClose={() => setAddTxnDate(null)}
            />
          </div>
        </div>
      )}
      
      {addRecDate && (
        <RecurringForm
          formData={recFormData}
          setFormData={setRecFormData}
          onSubmit={handleAddRecurringSubmit}
          onCancel={() => setAddRecDate(null)}
          formLoading={recFormLoading}
        />
      )}
    </div>
  )
}

export default CalendarTab