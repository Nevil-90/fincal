/**
 * Cross-browser, timezone-safe date utilities.
 * Handles local date formatting without UTC midnight shifts in Safari and Chrome.
 */

/**
 * Formats a date string (e.g. "YYYY-MM-DD" or ISO timestamp) into a clean,
 * localized display string (e.g., "29 Aug 2026").
 *
 * Avoids the notorious JavaScript/WebKit timezone bug where `new Date("YYYY-MM-DD")`
 * is parsed as UTC midnight and rolls back to the previous day in western timezones.
 */
export function formatDateForDisplay(
  dateStr: string | null | undefined,
  fallback: string = 'Select Date',
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    return fallback
  }

  const trimmed = dateStr.trim()

  try {
    // If format is YYYY-MM-DD, parse year, month, day explicitly as local numbers
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number)
      const localDate = new Date(year, month - 1, day)
      if (isNaN(localDate.getTime())) return fallback
      return localDate.toLocaleDateString('en-GB', options)
    }

    // Otherwise parse standard date string
    const parsedDate = new Date(trimmed)
    if (isNaN(parsedDate.getTime())) return fallback
    return parsedDate.toLocaleDateString('en-GB', options)
  } catch {
    return fallback
  }
}

/**
 * Safely parses a "YYYY-MM-DD" or ISO string into a local Date object.
 * Returns null if invalid or empty.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return null
  const trimmed = dateStr.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return isNaN(localDate.getTime()) ? null : localDate
  }
  const d = new Date(trimmed)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Formats a Date object into a standard "YYYY-MM-DD" string in local time.
 */
export function formatToDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns today's date formatted as "YYYY-MM-DD" in the user's local timezone.
 */
export function getTodayDateString(): string {
  return formatToDateString(new Date())
}

/**
 * Safely invokes `showPicker()` on an HTMLInputElement (e.g. input[type="date"]).
 * Handles older Safari / iOS versions where showPicker is either unsupported
 * or throws SecurityError / NotAllowedError on delayed gestures.
 */
export function safeShowPicker(inputEl: HTMLInputElement | null | undefined): void {
  if (!inputEl) return

  try {
    if (typeof inputEl.showPicker === 'function') {
      inputEl.showPicker()
    } else {
      inputEl.focus()
    }
  } catch {
    try {
      inputEl.focus()
    } catch {
      // Ignore if focus fails
    }
  }
}
