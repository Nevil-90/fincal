// Touch-swipeable row for mobile list items. Reveals action slots on
// left/right swipe with a resistance effect; triggers callbacks at threshold.
'use client'

import { useState, useRef, useEffect } from 'react'

interface SwipeableRowProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  swipeThreshold?: number
  className?: string
}

export default function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftContent,
  rightContent,
  swipeThreshold = 75,
  className = ''
}: SwipeableRowProps) {
  const [offset, setOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef<number | null>(null)
  const currentX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    currentX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return
    currentX.current = e.touches[0].clientX
    
    const diff = currentX.current - startX.current
    
    if (diff > 0 && !onSwipeRight) return
    if (diff < 0 && !onSwipeLeft) return

    const visualOffset = diff * 0.55
    setOffset(Math.max(-90, Math.min(90, visualOffset)))
  }

  const handleTouchEnd = () => {
    if (startX.current === null || currentX.current === null) {
      setIsSwiping(false)
      setOffset(0)
      return
    }

    const diff = currentX.current - startX.current

    if (diff > swipeThreshold && onSwipeRight) {
      onSwipeRight()
    } else if (diff < -swipeThreshold && onSwipeLeft) {
      onSwipeLeft()
    }

    setIsSwiping(false)
    setOffset(0)
    startX.current = null
    currentX.current = null
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl group ${className}`}>
      {/* Action Underlays */}
      <div className="absolute inset-0 flex items-center justify-between px-2 text-white pointer-events-none">
        <div className={`flex items-center justify-start w-1/2 h-full rounded-l-xl transition-opacity duration-150 ${offset > 10 ? 'opacity-100' : 'opacity-0'}`}>
          {leftContent}
        </div>
        <div className={`flex items-center justify-end w-1/2 h-full rounded-r-xl transition-opacity duration-150 ${offset < -10 ? 'opacity-100' : 'opacity-0'}`}>
          {rightContent}
        </div>
      </div>

      {/* Row Foreground */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full bg-white dark:bg-[#121215] rounded-xl touch-pan-y ${isSwiping ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
