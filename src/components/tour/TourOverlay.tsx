'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTour, TourStep, TourStepInput } from './TourContext'
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Loader2 } from 'lucide-react'
import { useUser } from '@/hooks/useApi'

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
          const isVisibleHorizontally = r.right > 1 && r.left < window.innerWidth - 1
          return r.width > 0 && r.height > 0 && isVisibleHorizontally
        })
        if (el) break
      }

      if (el) {
        const elRect = el.getBoundingClientRect()
        const isOutOfViewport = 
          elRect.top < 100 || 
          elRect.bottom > (window.innerHeight || document.documentElement.clientHeight) - 100
        
        if (isOutOfViewport) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        
        setRect(el.getBoundingClientRect())
      } else {
        setRect(null)
      }
    }

    updateRect()
    
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
  const { mutate } = useUser()
  
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
    const tooltipHeightEst = 250
    
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
    
    if ((finalPlacement === 'left' || finalPlacement === 'right') && rect.bottom > window.innerHeight - 150) {
      finalPlacement = 'top'
    }

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
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
        ) : (
          <>
            <motion.div 
              className="absolute top-0 left-0 right-0 bg-black/75 backdrop-blur-sm"
              animate={{ height: rect.top }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
            <motion.div 
              className="absolute left-0 bg-black/75 backdrop-blur-sm"
              animate={{ top: rect.top, height: rect.height, width: rect.left }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
            <motion.div 
              className="absolute right-0 bg-black/75 backdrop-blur-sm"
              animate={{ top: rect.top, height: rect.height, width: window.innerWidth - rect.right }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-sm"
              animate={{ top: rect.bottom, height: window.innerHeight - rect.bottom }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
            
            {/* Glowing border around cutout */}
            <motion.div
              className="absolute border-2 border-blue-500/80 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] pointer-events-none"
              animate={{ 
                top: rect.top, 
                left: rect.left, 
                width: rect.width, 
                height: rect.height 
              }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
          </>
        )}
      </AnimatePresence>

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
                 finalPlacement === 'bottom' ? rect.bottom + 14 : 
                 finalPlacement === 'top' ? rect.top - 14 : 
                 rect.top + rect.height / 2,
            left: tooltipLeft,
            x: '0%',
            y: tooltipY
          }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        >
          {/* Tooltip Card */}
          <motion.div layout className="bg-white dark:bg-[#121215] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] w-80 max-w-[calc(100vw-32px)] overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="px-5 py-4"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {step.title}
                </h3>
                <div className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {step.content}
                </div>
                
                {/* Inputs rendering for setup steps */}
                {step.inputs && step.inputs.length > 0 && (
                  <div className="mt-3.5 space-y-2.5">
                    {step.inputs.map(input => (
                      <div key={input.id}>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">{input.label}</label>
                        <input
                          type={input.type}
                          placeholder={input.placeholder}
                          value={formData[input.id] || ''}
                          onChange={e => setFormData(prev => ({ ...prev, [input.id]: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-[#16161a] border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            <div className="bg-slate-50 dark:bg-[#16161a] px-4 py-2.5 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between shrink-0">
              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-blue-500' : 'w-1.5 bg-slate-200 dark:bg-white/[0.12]'}`}
                  />
                ))}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1.5">
                {currentIndex > 0 && (
                  <button 
                    type="button"
                    onClick={onPrev}
                    disabled={isSubmitting}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                {currentIndex < totalSteps - 1 ? (
                  <button 
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button 
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true)
                      try {
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
                        await mutate()
                      } finally {
                        setIsSubmitting(false)
                        onEnd()
                      }
                    }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Finish <Check className="h-3.5 w-3.5" /></>}
                  </button>
                )}
              </div>
            </div>
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={async () => {
                setIsSubmitting(true)
                try {
                  await fetch('/api/user/complete-onboarding', { method: 'POST' })
                  await mutate()
                } finally {
                  setIsSubmitting(false)
                  onEnd()
                }
              }}
              className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors z-30"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
