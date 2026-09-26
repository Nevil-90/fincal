// Locks/unlocks body scroll when a modal or overlay is open.
// Prevents iOS Safari background scroll and keyboard-induced viewport leak.

import { useEffect } from 'react'

let lockCount = 0
let scrollPosition = 0

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return

    lockCount++
    if (lockCount === 1) {
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPosition}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollPosition)
      }
    }
  }, [isLocked])
}
