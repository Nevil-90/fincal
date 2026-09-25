// Wraps next-themes' ThemeProvider and syncs the selected theme with the
// backend (GET on mount, POST on change) so it persists across devices.
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
      defaultTheme="dark" 
      enableSystem
      storageKey="theme"
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
  const isInitializedRef = React.useRef(false)
  const prevThemeRef = React.useRef<string | undefined>(undefined)

  React.useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const fetchTheme = async () => {
      try {
        const localTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
        const res = await fetch('/api/user/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.theme && data.theme !== 'system' && !localTheme) {
            setTheme(data.theme)
            prevThemeRef.current = data.theme
          } else if (localTheme) {
            prevThemeRef.current = localTheme
            if (data.theme !== localTheme) {
              await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: localTheme }),
              })
            }
          } else {
            prevThemeRef.current = theme
          }
        }
      } catch (err) {
        console.error('Failed to sync theme from backend', err)
      }
    }
    fetchTheme()
  }, [setTheme, theme])

  // Only save when user actually toggles/changes the theme
  React.useEffect(() => {
    if (!isInitializedRef.current || !prevThemeRef.current) return
    if (theme && theme !== prevThemeRef.current) {
      prevThemeRef.current = theme
      fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      }).catch((err) => {
        console.error('Failed to save theme to backend', err)
      })
    }
  }, [theme])

  return null
}
