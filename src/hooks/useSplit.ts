// SWR hooks for the Bill Split feature

import useSWR, { mutate as globalMutate } from 'swr'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

const swrOptions = {
  dedupingInterval: 30_000,
  keepPreviousData: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export function useSplitGroups() {
  const { data, error, isLoading, mutate } = useSWR('/api/split/groups', fetcher, swrOptions)
  return {
    groups: data?.groups ?? [],
    isLoading,
    error,
    mutate,
  }
}

export function useSplitGroup(groupId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    groupId ? `/api/split/groups/${groupId}` : null,
    fetcher,
    swrOptions
  )
  return {
    group: data ?? null,
    isLoading,
    error,
    mutate,
  }
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export function useSplitExpenses(groupId: string | null, filter?: string) {
  const key = groupId
    ? `/api/split/groups/${groupId}/expenses${filter && filter !== 'all' ? `?filter=${filter}` : ''}`
    : null
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions)
  return {
    expenses: data?.expenses ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    mutate,
  }
}

// ─── Balances ─────────────────────────────────────────────────────────────────

export function useSplitBalances(groupId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    groupId ? `/api/split/groups/${groupId}/balances` : null,
    fetcher,
    swrOptions
  )
  return {
    balances: data?.balances ?? [],
    totalOwedToYou: data?.totalOwedToYou ?? 0,
    totalYouOwe: data?.totalYouOwe ?? 0,
    netBalance: data?.netBalance ?? 0,
    isFullySettled: data?.isFullySettled ?? false,
    currency: data?.currency ?? 'INR',
    isLoading,
    error,
    mutate,
  }
}

// ─── Participants ─────────────────────────────────────────────────────────────

export function useSplitParticipants(search?: string) {
  const key = `/api/split/participants${search ? `?search=${encodeURIComponent(search)}` : ''}`
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOptions)
  return {
    participants: data?.participants ?? [],
    isLoading,
    error,
    mutate,
  }
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

export function invalidateSplitGroup(groupId: string) {
  globalMutate(`/api/split/groups/${groupId}`)
  globalMutate(`/api/split/groups/${groupId}/expenses`)
  globalMutate(`/api/split/groups/${groupId}/balances`)
  globalMutate('/api/split/groups')
}
