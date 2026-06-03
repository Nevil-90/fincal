'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

export function SwrProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
