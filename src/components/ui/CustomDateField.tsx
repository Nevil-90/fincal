'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  X,
  Sparkles,
  Check
} from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isYesterday,
  isTomorrow
} from 'date-fns'
import { formatDateForDisplay, parseLocalDate, formatToDateString, getTodayDateString } from '@/lib/dateUtils'

export interface CustomDateFieldProps {
  value?: string | null
  onChange: (value: string) => void
  label?: string
  id?: string
  name?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  containerClassName?: string
  min?: string
  max?: string
  size?: 'default' | 'sm' | 'xs'
  hideRelativeBadge?: boolean
}

export default function CustomDateField({
  value,
  onChange,
  label,
  id,
  name,
  placeholder = 'Select date (DD MMM YYYY)',
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  min,
  max,
  size = 'default',
  hideRelativeBadge = false
}: CustomDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Track the currently viewed month in the calendar
  const initialDate = useMemo(() => {
    return parseLocalDate(value) || new Date()
  }, [value])

  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate)

  // Update calendar view month if value changes externally while closed
  useEffect(() => {
    if (!isOpen) {
      const parsed = parseLocalDate(value)
      if (parsed) {
        setCurrentMonth(parsed)
      }
    }
  }, [value, isOpen])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Position state for portal popover
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; isAbove: boolean }>({
    top: 0,
    left: 0,
    width: 320,
    isAbove: false
  })

  // Synchronous coordinate calculator
  const calculateCoords = useCallback(() => {
    if (!triggerRef.current) return null
    const rect = triggerRef.current.getBoundingClientRect()
    const popoverHeight = 360
    const popoverWidth = Math.min(320, Math.max(280, window.innerWidth - 16))

    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const isAbove = spaceBelow < popoverHeight && spaceAbove > popoverHeight

    let left = rect.left
    if (left + popoverWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - popoverWidth - 8)
    }

    const top = isAbove ? rect.top - popoverHeight - 8 : rect.bottom + 8

    return {
      top: Math.max(8, top),
      left: Math.max(8, left),
      width: popoverWidth,
      isAbove
    }
  }, [])

  // Update position on scroll/resize
  const updatePosition = useCallback(() => {
    const nextCoords = calculateCoords()
    if (nextCoords) {
      setCoords(nextCoords)
      setIsPositioned(true)
    }
  }, [calculateCoords])

  const handleOpen = () => {
    if (disabled) return
    if (!isOpen) {
      const nextCoords = calculateCoords()
      if (nextCoords) {
        setCoords(nextCoords)
        setIsPositioned(true)
      }
      const current = parseLocalDate(value) || new Date()
      setCurrentMonth(current)
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      updatePosition()
      const handleResizeOrScroll = () => updatePosition()
      window.addEventListener('resize', handleResizeOrScroll)
      window.addEventListener('scroll', handleResizeOrScroll, true)
      return () => {
        window.removeEventListener('resize', handleResizeOrScroll)
        window.removeEventListener('scroll', handleResizeOrScroll, true)
      }
    }
  }, [isOpen, updatePosition])

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Selected date object
  const selectedDate = useMemo(() => parseLocalDate(value), [value])

  // Days matrix for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  // Min / Max constraints
  const minDate = useMemo(() => parseLocalDate(min), [min])
  const maxDate = useMemo(() => parseLocalDate(max), [max])

  const isDayDisabled = useCallback((day: Date) => {
    if (minDate && day < minDate) return true
    if (maxDate && day > maxDate) return true
    return false
  }, [minDate, maxDate])

  const handleSelectDay = (day: Date) => {
    if (isDayDisabled(day)) return
    const formatted = formatToDateString(day)
    onChange(formatted)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Quick preset shortcuts
  const selectToday = () => {
    const today = new Date()
    if (isDayDisabled(today)) return
    onChange(formatToDateString(today))
    setCurrentMonth(today)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const selectYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (isDayDisabled(yesterday)) return
    onChange(formatToDateString(yesterday))
    setCurrentMonth(yesterday)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Human readable badge (e.g. "Today", "Yesterday", "Tomorrow", or day of week)
  const relativeBadge = useMemo(() => {
    if (!selectedDate) return null
    if (isToday(selectedDate)) return 'Today'
    if (isYesterday(selectedDate)) return 'Yesterday'
    if (isTomorrow(selectedDate)) return 'Tomorrow'
    return format(selectedDate, 'EEE')
  }, [selectedDate])

  // Size styling tokens
  const sizeStyles = {
    default: 'h-10 px-3 text-xs',
    sm: 'h-8 px-2.5 text-xs',
    xs: 'h-7 px-2 text-[11px]'
  }[size]

  return (
    <div className={`w-full relative ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 min-h-[16px] leading-none select-none"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 dark:text-rose-400 ml-0.5 font-bold">*</span>}
        </label>
      )}

      {/* Hidden input for HTML form validation & submission */}
      {name && (
        <input
          type="hidden"
          id={id}
          name={name}
          value={value || ''}
          required={required}
          disabled={disabled}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full rounded-xl border transition-all duration-150 flex items-center justify-between text-left select-none ${
          disabled
            ? 'bg-slate-100 dark:bg-[#121215] border-slate-200 dark:border-white/[0.04] text-slate-400 dark:text-zinc-600 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 bg-white dark:bg-[#16161a] ring-1 ring-blue-500/40 text-slate-900 dark:text-white shadow-xs'
            : 'border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#16161a] hover:bg-slate-100 dark:hover:bg-[#1a1a20] hover:border-slate-300 dark:hover:border-white/[0.15] text-slate-800 dark:text-zinc-200'
        } ${sizeStyles} ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CalendarIcon
            className={`shrink-0 transition-colors ${
              size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'
            } ${
              value
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-slate-400 dark:text-zinc-500'
            }`}
          />

          <span
            className={`truncate font-medium ${
              value
                ? 'text-slate-900 dark:text-white tabular-nums'
                : 'text-slate-400 dark:text-zinc-500 font-normal'
            }`}
          >
            {value ? formatDateForDisplay(value) : placeholder}
          </span>
        </div>

        {/* Relative date pill or format cue indicator */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
          {value && relativeBadge && !hideRelativeBadge && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-200/60 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 border border-slate-300/50 dark:border-white/[0.06]">
              {relativeBadge}
            </span>
          )}
          <ChevronDown
            className={`transition-transform duration-200 text-slate-400 dark:text-zinc-500 shrink-0 ${
              size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
            } ${
              isOpen ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Popover Calendar rendered into Portal */}
      {isOpen && isPositioned && mounted && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Calendar Date Picker"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 9999
          }}
          className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-2xl p-3.5 select-none animate-fadeIn"
        >
          {/* Header: Month & Year Navigator */}
          <div className="flex items-center justify-between gap-1 mb-2.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setCurrentMonth(prev => subYears(prev, 1))}
                title="Previous Year"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                title="Previous Month"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-center font-semibold text-xs text-slate-900 dark:text-white">
              <span>{format(currentMonth, 'MMMM yyyy')}</span>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                title="Next Month"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(prev => addYears(prev, 1))}
                title="Next Year"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span
                key={day}
                className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 py-0.5"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isCurrentMonthDay = isSameMonth(day, currentMonth)
              const isDaySelected = selectedDate ? isSameDay(day, selectedDate) : false
              const isTodayDay = isToday(day)
              const disabledDay = isDayDisabled(day)

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-full rounded-xl text-xs font-semibold tabular-nums flex items-center justify-center relative transition-all duration-100 ${
                    disabledDay
                      ? 'opacity-20 cursor-not-allowed text-slate-300 dark:text-neutral-700'
                      : isDaySelected
                      ? 'bg-blue-600 text-white font-bold shadow-sm scale-[1.02] z-10 ring-2 ring-blue-500/30'
                      : isTodayDay
                      ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/50'
                      : isCurrentMonthDay
                      ? 'text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                      : 'text-slate-400 dark:text-neutral-600 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {format(day, 'd')}
                  {isTodayDay && !isDaySelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Quick Presets & Actions Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={selectToday}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-[#16161a] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={selectYesterday}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-[#16161a] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
              >
                Yesterday
              </button>
            </div>

            <div className="flex items-center gap-1">
              {value && !required && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setIsOpen(false)
                  }}
                  className="px-2 py-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>

          {/* Format Cue & Helper */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
            <span>Format: <strong className="font-semibold text-slate-600 dark:text-zinc-300">DD MMM YYYY</strong></span>
            <span className="tabular-nums">e.g. 23 Sep 2026</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
