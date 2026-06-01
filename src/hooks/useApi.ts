import useSWR from 'swr'


export const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    error.message = await res.text()
    throw error
  }
  return res.json()
}

// ----------------------------------------
// Auth Hooks
// ----------------------------------------
export function useUser() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  })
  return {
    user: data?.user,
    isLoading,
    isError: error,
    mutate
  }
}

// ----------------------------------------
// Transaction Hooks
// ----------------------------------------
export function useTransactions(page: number = 1, limit: number = 50, filters: Record<string, string | number | undefined> = {}) {
  let url = `/api/transactions?page=${page}&limit=${limit}`
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      url += `&${key}=${value}`
    }
  }
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, { 
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

export function useAllTransactions() {
  const { data, error, isLoading, mutate } = useSWR('/api/transactions?limit=10000', fetcher, {
    shouldRetryOnError: false
  })
  
  return {
    transactions: (data?.transactions || []) as any[],
    monthlyBudget: data?.monthlyBudget,
    isLoading,
    isError: error,
    mutate
  }
}

export function useTransactionSummary(month?: number, year?: number) {
  let url = '/api/transactions/summary'
  if (month && year) {
    url += `?month=${month}&year=${year}`
  }
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    shouldRetryOnError: false
  })
  
  return {
    summary: data,
    isLoading,
    isError: error,
    mutate
  }
}

// ----------------------------------------
// Goal Hooks
// ----------------------------------------
export function useGoals() {
  const { data, error, isLoading, mutate } = useSWR('/api/goals', fetcher, {
    shouldRetryOnError: false
  })
  return {
    goals: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

// ----------------------------------------
// Travel Hooks
// ----------------------------------------
export function useTravelEntries(page: number = 1, limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR(`/api/travel?page=${page}&limit=${limit}`, fetcher, {
    shouldRetryOnError: false
  })
  return {
    entries: data?.entries || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate
  }
}

export function useTravelAnalytics(year: number) {
  const { data, error, isLoading, mutate } = useSWR(`/api/travel/analytics?type=overview&year=${year}`, fetcher, {
    shouldRetryOnError: false
  })
  return {
    analytics: data,
    isLoading,
    isError: error,
    mutate
  }
}

// ----------------------------------------
// Analytics Hooks
// ----------------------------------------
export function useAnalytics(dateFilter: string = 'this_month', compareYear?: number, compareMonth?: number) {
  let url = `/api/analytics?dateFilter=${dateFilter}`
  if (compareYear) url += `&compareYear=${compareYear}`
  if (compareMonth) url += `&compareMonth=${compareMonth}`
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    shouldRetryOnError: false
  })
  
  return {
    analyticsData: data,
    isLoading,
    isError: error,
    mutate
  }
}

