'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTour, TourStep, TourStepInput } from './TourContext'
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Loader2 } from 'lucide-react'

// Hook to observe element position
function useTargetRect(selector?: string, active?: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  
  useEffect(() => {
    if (!active || !selector) {
      setRect(null)
      return
    }

    const updateRect = () => {
      const selectorParts = selector.split(',').map(s => s.trim())
      let el: Element | undefined
      
      for (const part of selectorParts) {
        if (!part) continue
        const elements = Array.from(document.querySelectorAll(part))
        el = elements.find(e => {
          const r = e.getBoundingClientRect()
          // We only check horizontal visibility to filter out off-screen sidebars.
          // We DO NOT check vertical visibility, because we want to find elements that are 
          // scrolled out of view so we can automatically scroll the user down to them!
          const isVisibleHorizontally = r.right > 1 && r.left < window.innerWidth - 1
          
          return r.width > 0 && r.height > 0 && isVisibleHorizontally
        })
        if (el) break
      }

      if (el) {
        // Auto scroll into view with some padding
        const elRect = el.getBoundingClientRect()
        const isOutOfViewport = 
          elRect.top < 100 || 
          elRect.bottom > (window.innerHeight || document.documentElement.clientHeight) - 100
        
        if (isOutOfViewport) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        
        // Wait a tick for smooth scroll to start, then update rect repeatedly for a short duration
        // to track the scrolling element.
        setRect(el.getBoundingClientRect())
      } else {
        setRect(null)
      }
    }

    updateRect()
    
    // Poll position while active (to handle scrolling/resizing)
    const interval = setInterval(updateRect, 50)
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [selector, active])

  return rect
}

export function TourOverlay() {
  const { isActive, currentStepIndex, steps, endTour, nextStep, prevStep } = useTour()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isActive || steps.length === 0) return null

  return createPortal(
    <TourRenderer 
      step={steps[currentStepIndex]} 
      totalSteps={steps.length}
      currentIndex={currentStepIndex}
      onNext={nextStep}
      onPrev={prevStep}
      onEnd={endTour}
    />,
    document.body
  )
}

function TourRenderer({ step, totalSteps, currentIndex, onNext, onPrev, onEnd }: { 
  step: TourStep, 
  totalSteps: number, 
  currentIndex: number,
  onNext: () => void,
  onPrev: () => void,
  onEnd: () => void 
}) {
  const padding = 8
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const rawRect = useTargetRect(step.target, true)
  
  // Apply padding to the target rect
  const rect = rawRect ? {
    top: Math.max(0, rawRect.top - padding),
    left: Math.max(0, rawRect.left - padding),
    width: rawRect.width + padding * 2,
    height: rawRect.height + padding * 2,
    right: Math.min(window.innerWidth, rawRect.right + padding),
    bottom: Math.min(window.innerHeight, rawRect.bottom + padding)
  } : null

  const isCentered = !step.target || !rect

  let finalPlacement = step.placement
  let tooltipLeft = 0
  let tooltipY = '0%'

  if (rect) {
    const tooltipWidth = Math.min(320, window.innerWidth - 32)
    const tooltipHeightEst = 250 // Rough estimate of tooltip height
    
    // Safe boundary flips
    if (finalPlacement === 'top' && rect.top < tooltipHeightEst) {
      finalPlacement = 'bottom'
    }
    if (finalPlacement === 'bottom' && rect.bottom + tooltipHeightEst > window.innerHeight) {
      finalPlacement = 'top'
    }
    if (finalPlacement === 'left' && rect.left < tooltipWidth + 32) {
      finalPlacement = 'right'
    }
    if (finalPlacement === 'right' && rect.right + tooltipWidth + 32 > window.innerWidth) {
      finalPlacement = 'left'
    }
    
    // Force top placement if element is at the very bottom of the screen (e.g. bottom nav)
    if ((finalPlacement === 'left' || finalPlacement === 'right') && rect.bottom > window.innerHeight - 150) {
      finalPlacement = 'top'
    }

    // Ultimate fallback: If the target is simply massive and neither top nor bottom works,
    // place the tooltip in the dead center of the screen so it overlays the large target.
    if (finalPlacement === 'top' && rect.top < tooltipHeightEst) {
      finalPlacement = 'center'
    }
    
    if (finalPlacement === 'top' || finalPlacement === 'bottom' || !finalPlacement) {
      tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
      tooltipY = finalPlacement === 'top' ? '-100%' : '0%'
    } else if (finalPlacement === 'left') {
      tooltipLeft = rect.left - 16 - tooltipWidth
      tooltipY = '-50%'
    } else if (finalPlacement === 'right') {
      tooltipLeft = rect.right + 16
      tooltipY = '-50%'
    } else if (finalPlacement === 'center') {
      tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2
      tooltipY = '-50%'
    }

    // Clamp horizontal position so it never overflows the screen (16px padding)
    tooltipLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, tooltipLeft))
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* 4-div background mask for backdrop blur effect */}
      <AnimatePresence>
        {isCentered ? (
          <motion.div 
            key="full-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-neutral-950/80 backdrop-blur-sm transition-all duration-300"
          />
        ) : (
          <>
            <motion.div 
              className="absolute top-0 left-0 right-0 bg-slate-900/60 dark:bg-neutral-950/80 backdrop-blur-sm transition-all duration-300"
              animate={{ height: rect.top }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            />
            <motion.div 
              className="absolute left-0 bg-slate-900/60 dark:bg-neutral-950/80 backdrop-blur-sm transition-all duration-300"
              animate={{ top: rect.top, height: rect.height, width: rect.left }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            />
            <motion.div 
              className="absolute right-0 bg-slate-900/60 dark:bg-neutral-950/80 backdrop-blur-sm transition-all duration-300"
              animate={{ top: rect.top, height: rect.height, width: window.innerWidth - rect.right }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-slate-900/60 dark:bg-neutral-950/80 backdrop-blur-sm transition-all duration-300"
              animate={{ top: rect.bottom, height: window.innerHeight - rect.bottom }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            />
            
            {/* Glowing border around cutout */}
            <motion.div
              className="absolute border-2 border-blue-500 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] pointer-events-none transition-all duration-300"
              animate={{ 
                top: rect.top, 
                left: rect.left, 
                width: rect.width, 
                height: rect.height 
              }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Invisible overlay to block clicks on the highlighted element if needed, we just let the main container be pointer-events-auto */}
      <div className="absolute inset-0 z-10" />

      {/* Tooltip Positioning */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <motion.div
          className="absolute pointer-events-auto"
          animate={isCentered ? {
            top: window.innerHeight / 2,
            left: window.innerWidth / 2,
            x: '-50%',
            y: '-50%'
          } : {
            top: finalPlacement === 'center' ? window.innerHeight / 2 :
                 finalPlacement === 'bottom' ? rect.bottom + 16 : 
                 finalPlacement === 'top' ? rect.top - 16 : 
                 rect.top + rect.height / 2,
            left: tooltipLeft,
            x: '0%',
            y: tooltipY
          }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
          {/* Tooltip Card */}
          <motion.div layout className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 w-80 max-w-[calc(100vw-32px)] overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="px-5 py-4"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {step.title}
                </h3>
                <div className="mt-2 text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                  {step.content}
                </div>
                
                {/* Inputs rendering for setup steps */}
                {step.inputs && step.inputs.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {step.inputs.map(input => (
                      <div key={input.id}>
                        <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 mb-1">{input.label}</label>
                        <input
                          type={input.type}
                          placeholder={input.placeholder}
                          value={formData[input.id] || ''}
                          onChange={e => setFormData(prev => ({ ...prev, [input.id]: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            <div className="bg-slate-50 dark:bg-neutral-800/50 px-5 py-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-neutral-700'}`}
                  />
                ))}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                {currentIndex > 0 && (
                  <button 
                    onClick={onPrev}
                    disabled={isSubmitting}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {currentIndex < totalSteps - 1 ? (
                  <button 
                    onClick={onNext}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button 
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true)
                      try {
                        // Process formData if available
                        if (formData['openingBalance'] && parseFloat(formData['openingBalance']) > 0) {
                          await fetch('/api/transactions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: 'income',
                              amount: parseFloat(formData['openingBalance']),
                              category: 'Opening Balance',
                              description: 'Opening Balance',
                              date: new Date().toISOString().split('T')[0],
                            }),
                          })
                        }
                        
                        if (formData['monthlySpendingGoal'] && parseFloat(formData['monthlySpendingGoal']) > 0) {
                          await fetch('/api/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              key: 'monthlySpendingGoal',
                              value: formData['monthlySpendingGoal']
                            })
                          })
                        }
                        
                        await fetch('/api/user/complete-onboarding', { method: 'POST' })
                      } finally {
                        setIsSubmitting(false)
                        onEnd()
                      }
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-70"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finish <Check className="h-4 w-4" /></>}
                  </button>
                )}
              </div>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={() => {
                onEnd()
                fetch('/api/user/complete-onboarding', { method: 'POST' }).catch(() => {})
              }}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors z-30"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
