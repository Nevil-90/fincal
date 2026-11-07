'use client'

import { useEffect } from 'react'

export function VisualViewportHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => {
      const vv = window.visualViewport
      if (vv) {
        const vvHeight = vv.height
        const vvTop = vv.offsetTop
        // Calculate the height of the virtual keyboard
        const keyboardHeight = Math.max(0, window.innerHeight - vvHeight - vvTop)

        document.documentElement.style.setProperty('--vv-height', `${vvHeight}px`)
        document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`)
        document.documentElement.style.setProperty('--vv-top', `${vvTop}px`)
      } else {
        document.documentElement.style.setProperty('--vv-height', `${window.innerHeight}px`)
        document.documentElement.style.setProperty('--keyboard-height', '0px')
        document.documentElement.style.setProperty('--vv-top', '0px')
      }
    }

    update()

    // Prevent iOS Safari from scrolling window.scrollY when an input is focused inside a modal drawer
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const tagName = target.tagName ? target.tagName.toUpperCase() : ''
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        if (document.body.style.position === 'fixed' || target.closest('[data-modal-drawer]')) {
          requestAnimationFrame(() => {
            if (window.scrollY !== 0) {
              window.scrollTo(0, 0)
            }
          })
        }
      }
    }

    const handleWindowScroll = () => {
      if (document.body.style.position === 'fixed' && window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
    }

    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', update)
      vv.addEventListener('scroll', update)
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
    document.addEventListener('focusin', handleFocusIn, { passive: true })

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update)
        vv.removeEventListener('scroll', update)
      }
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', handleWindowScroll)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [])

  return null
}
