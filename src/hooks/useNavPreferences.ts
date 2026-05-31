import { useState, useEffect } from 'react'

export const VALID_NAV_TABS = ['overview', 'transactions', 'goals', 'recurring', 'analytics', 'calendar', 'traveling', 'admin']
const DEFAULT_SLOTS = ['overview', 'transactions', 'goals', 'recurring']

const filterValidSlots = (slots: string[]) => slots.filter(s => VALID_NAV_TABS.includes(s))

export function useNavPreferences() {
  const [slots, setSlots] = useState<string[]>(DEFAULT_SLOTS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences')
        if (response.ok) {
          const data = await response.json()
          if (mounted && data.preferences) {
            setSlots(filterValidSlots(data.preferences))
          }
        }
      } catch (error) {
        console.error('Failed to fetch nav preferences:', error)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchPreferences()

    // Listen for custom event from other instances
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
    // Optimistic update locally
    setSlots(validSlots)

    // Notify other components instantly (like BottomNav)
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
