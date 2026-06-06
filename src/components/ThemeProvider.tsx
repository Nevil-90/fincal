'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  )
}

function ThemeSync() {
  const { theme, setTheme } = useTheme()
  const [isSynced, setIsSynced] = React.useState(false)

  // Fetch theme from backend on mount
  React.useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch('/api/user/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme)
          }
        }
      } catch (err) {
        console.error('Failed to sync theme from backend', err)
      } finally {
        setIsSynced(true)
      }
    }
    fetchTheme()
  }, []) // Empty dependency array, run once on mount

  // Sync theme to backend when it changes
  React.useEffect(() => {
    if (!isSynced) return

    const saveTheme = async () => {
      try {
        await fetch('/api/user/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme }),
        })
      } catch (err) {
        console.error('Failed to save theme to backend', err)
      }
    }
    saveTheme()
  }, [theme, isSynced])

  return null
}
