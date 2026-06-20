// UTC-based date arithmetic for recurring transactions.
// All functions operate on UTC values to avoid local timezone drift.

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

/**
 * Advances a UTC date by one recurrence interval.
 * Month-based frequencies always snap back to originalDay.
 */
export function advanceByFrequency(
  year: number,
  month: number,
  day: number,
  originalDay: number,
  frequency: string
): { year: number; month: number; day: number } {
  switch (frequency.toLowerCase()) {
    case 'daily':
      return normalise(year, month, day + 1)

    case 'weekly':
      return normalise(year, month, day + 7)

    case 'monthly': {
      const next = normalise(year, month + 1, 1)
      return { ...next, day: Math.min(originalDay, daysInMonth(next.year, next.month)) }
    }

    case 'quarterly': {
      const next = normalise(year, month + 3, 1)
      return { ...next, day: Math.min(originalDay, daysInMonth(next.year, next.month)) }
    }

    case 'yearly':
      return { year: year + 1, month, day }

    default: {
      const next = normalise(year, month + 1, 1)
      return { ...next, day: Math.min(originalDay, daysInMonth(next.year, next.month)) }
    }
  }
}

/**
 * Returns the first nextDue date that falls strictly after `now`,
 * walking forward from startDate by the given frequency.
 */
export function calculateNextDue(startDate: Date, now: Date, frequency: string): Date {
  const originalDay = startDate.getUTCDate()
  let cur = utcTriple(startDate)

  while (toUtcDate(cur) <= now) {
    cur = advanceByFrequency(cur.year, cur.month, cur.day, originalDay, frequency)
  }

  return toUtcDate(cur)
}

/**
 * Returns every occurrence from startDate up to and including now,
 * plus the next future due date.
 */
export function collectOccurrencesUpTo(
  startDate: Date,
  now: Date,
  frequency: string
): { occurrences: Date[]; nextDue: Date } {
  const originalDay = startDate.getUTCDate()
  let cur = utcTriple(startDate)
  const occurrences: Date[] = []

  while (toUtcDate(cur) <= now) {
    occurrences.push(toUtcDate(cur))
    cur = advanceByFrequency(cur.year, cur.month, cur.day, originalDay, frequency)
  }

  return { occurrences, nextDue: toUtcDate(cur) }
}

function normalise(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month, day))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() }
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function utcTriple(d: Date) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() }
}

function toUtcDate({ year, month, day }: { year: number; month: number; day: number }): Date {
  return new Date(Date.UTC(year, month, day))
}
