// SWR-based data fetching hooks for all major API resources.
// Each hook returns { data, isLoading, isError, mutate } shaped for its domain.

import useSWR from 'swr'

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true
  refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
    .then(r => r.ok)
    .catch(() => false)
    .finally(() => {
      isRefreshing = false
      refreshPromise = null
    })
  return refreshPromise
}

export const fetcher = async (url: string) => {
  let res = await fetch(url)
  if (res.status === 401) {
    // Attempt silent token refresh before giving up
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        // Retry the original request with the new token
        res = await fetch(url)
      }
    }
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 404) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && url === '/api/auth/me') {
        window.location.href = '/login'
      }
    }
    const error = new Error('An error occurred while fetching the data.')
    error.message = await res.text()
    throw error
  }
  return res.json()
}

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/me', fetcher, {
    shouldRetryOnError: false
  })
  return {
    user: data?.user,
    isLoading,
    isError: error,
    mutate
  }
}

export function useTransactions(page: number = 1, limit: number = 50, filters: Record<string, string | number | undefined> = {}) {
  const { user } = useUser()
  const isTourActive = user && !user.hasCompletedOnboarding

  let url = `/api/transactions?page=${page}&limit=${limit}`
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      url += `&${key}=${value}`
    }
  }
  const { data, error, isLoading, mutate } = useSWR(isTourActive ? null : url, fetcher, {
    keepPreviousData: true,
    shouldRetryOnError: false
  })

  return {
    transactions: (data?.transactions || []) as any[],
    pagination: data?.pagination,
    monthlyBudget: data?.monthlyBudget,
    isLoading,
    isError: error,
    mutate
  }
}

export function useTransactionSummary(month?: number | null, year?: number | null, keepPreviousData = false) {
  const { user } = useUser()
  const isTourActive = user && !user.hasCompletedOnboarding

  const shouldFetch = !(month === null && year === null) && !isTourActive

  const url = shouldFetch
    ? (() => {
      const u = '/api/transactions/summary'
      const params: string[] = []
      if (year) params.push(`year=${year}`)
      if (month) params.push(`month=${month}`)
      return params.length > 0 ? `${u}?${params.join('&')}` : u
    })()
    : null

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    shouldRetryOnError: false,
    keepPreviousData,
  })

  return {
    summary: data,
    isLoading,
    isError: error,
    mutate
  }
}

export function useGoals() {
  const { user } = useUser()
  const isTourActive = user && !user.hasCompletedOnboarding

  const { data, error, isLoading, mutate } = useSWR(isTourActive ? null : '/api/goals', fetcher, {
    shouldRetryOnError: false
  })
  return {
    goals: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useTravelEntries(page: number = 1, limit: number = 10) {
  const { user } = useUser()
  const isTourActive = user && !user.hasCompletedOnboarding

  const { data, error, isLoading, mutate } = useSWR(isTourActive ? null : `/api/travel?page=${page}&limit=${limit}`, fetcher, {
    shouldRetryOnError: false
  })
  return {
    entries: data?.travelEntries || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate
  }
}

export function useTravelAnalytics(year: number) {
  const { user } = useUser()
  const isTourActive = user && !user.hasCompletedOnboarding

  const { data, error, isLoading, mutate } = useSWR(isTourActive ? null : `/api/travel/analytics?type=overview&year=${year}`, fetcher, {
    shouldRetryOnError: false
  })
  return {
    analytics: data,
    isLoading,
    isError: error,
    mutate
  }
}

export function useAnalytics(dateFilter: string = 'this_month', heatmapYear?: number, compareYear?: number, compareMonth?: number) {
  const { user } = useUser()
  const isTourActive = user && !user.hasCompletedOnboarding

  let url = `/api/analytics?dateFilter=${dateFilter}`
  if (heatmapYear) url += `&heatmapYear=${heatmapYear}`
  if (compareYear) url += `&compareYear=${compareYear}`
  if (compareMonth) url += `&compareMonth=${compareMonth}`

  const { data, error, isLoading, mutate } = useSWR(isTourActive ? null : url, fetcher, {
    shouldRetryOnError: false,
    keepPreviousData: true
  })

  return {
    analyticsData: data,
    isLoading,
    isError: error,
    mutate
  }
}
