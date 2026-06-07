// Hook that loads and persists the user's bottom-nav tab preferences.
// Deduplicates concurrent fetches with a shared promise and syncs updates
// across component instances via a custom browser event.

import { useState, useEffect } from 'react'

export const VALID_NAV_TABS = ['overview', 'transactions', 'goals', 'recurring', 'analytics', 'calendar', 'traveling', 'admin']
const DEFAULT_SLOTS = ['overview', 'transactions', 'goals', 'recurring']

const filterValidSlots = (slots: string[]) => slots.filter(s => VALID_NAV_TABS.includes(s))

let fetchPromise: Promise<string[]> | null = null;

export function useNavPreferences() {
  const [slots, setSlots] = useState<string[]>(DEFAULT_SLOTS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchPreferences = async () => {
      try {
        if (!fetchPromise) {
          fetchPromise = fetch('/api/user/preferences').then(async (response) => {
            if (response.ok) {
              const data = await response.json()
              return data.preferences ? filterValidSlots(data.preferences) : DEFAULT_SLOTS
            }
            return DEFAULT_SLOTS
          }).finally(() => {
            setTimeout(() => { fetchPromise = null }, 1000)
          })
        }
        
        const validSlots = await fetchPromise
        if (mounted && validSlots) {
          setSlots(validSlots)
        }
      } catch (error) {
        console.error('Failed to fetch nav preferences:', error)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchPreferences()

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      if (mounted && customEvent.detail?.preferences) {
        setSlots(filterValidSlots(customEvent.detail.preferences))
      }
    }
    
    window.addEventListener('nav-preferences-updated', handleUpdate)

    return () => {
      mounted = false
      window.removeEventListener('nav-preferences-updated', handleUpdate)
    }
  }, [])

  const updateSlots = async (newSlots: string[]) => {
    const validSlots = filterValidSlots(newSlots)
    setSlots(validSlots)

    window.dispatchEvent(new CustomEvent('nav-preferences-updated', { 
      detail: { preferences: validSlots } 
    }))

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: validSlots })
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save nav preferences:', error)
    }
  }

  return {
    slots,
    updateSlots,
    isLoading
  }
}
