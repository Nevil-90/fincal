'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

export function SwrProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false, // Prevents cascade of API calls on network reconnect
        dedupingInterval: 60000,      // 60s: prevents redundant re-fetches on page navigation
      }}
    >
      {children}
    </SWRConfig>
  )
}
