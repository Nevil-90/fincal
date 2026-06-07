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
}

export default function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftContent,
  rightContent,
  swipeThreshold = 75
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

    const resistance = diff > 0 ? 0.6 : 0.6
    const visualOffset = diff * resistance
    
    setOffset(Math.max(-100, Math.min(100, visualOffset)))
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
    <div className="relative w-full overflow-hidden rounded-2xl group">
      <div className="absolute inset-0 flex items-center justify-between px-0 text-white">
        <div className={`flex items-center justify-start w-1/2 h-full rounded-l-2xl transition-opacity duration-200 ${offset > 10 ? 'opacity-100' : 'opacity-0'}`}>
          {leftContent}
        </div>
        <div className={`flex items-center justify-end w-1/2 h-full rounded-r-2xl transition-opacity duration-200 ${offset < -10 ? 'opacity-100' : 'opacity-0'}`}>
          {rightContent}
        </div>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full bg-white rounded-2xl touch-pan-y ${isSwiping ? '' : 'transition-transform duration-300'}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
