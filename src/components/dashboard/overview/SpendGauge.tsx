'use client'

import React from 'react'

interface SpendGaugeProps {
  pct: number
}

export default React.memo(function SpendGauge({ pct }: SpendGaugeProps) {
  const clamped = Math.min(pct, 100)
  const r = 58
  const circ = 2 * Math.PI * r
  const stroke = circ * (1 - clamped / 100)
  
  // Clean, high-contrast dynamic status color
  const color = clamped >= 100 
    ? '#f43f5e' // rose
    : clamped >= 80 
    ? '#f59e0b' // amber
    : '#10b981' // emerald

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width="136" height="136" viewBox="0 0 140 140" className="shrink-0 drop-shadow-sm">
        {/* Background Track */}
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="11"
          className="stroke-slate-100 dark:stroke-neutral-800/90"
        />
        {/* Animated Radial Track */}
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeDasharray={circ}
          strokeDashoffset={stroke}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease' }}
        />
      </svg>
      {/* Centered Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white leading-none">
          {Math.round(clamped)}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 mt-1">
          budget
        </span>
      </div>
    </div>
  )
})
