'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export interface TourStepInput {
  id: string
  label: string
  type: string
  placeholder: string
  icon?: any
}

export interface TourStep {
  target?: string // CSS selector. If undefined, it's a centered modal step.
  title: string
  content: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  disableBeacon?: boolean
  onBeforeActive?: () => void | Promise<void> // Hook to e.g. change tabs before showing this step
  inputs?: TourStepInput[]
}

interface TourContextType {
  isActive: boolean
  currentStepIndex: number
  steps: TourStep[]
  startTour: (steps: TourStep[]) => void
  endTour: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number) => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [steps, setSteps] = useState<TourStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const startTour = useCallback(async (newSteps: TourStep[]) => {
    setSteps(newSteps)
    setCurrentStepIndex(0)
    
    // Execute first step's hook if it exists
    if (newSteps[0]?.onBeforeActive) {
      await newSteps[0].onBeforeActive()
    }
    
    setIsActive(true)
  }, [])

  const endTour = useCallback(() => {
    setIsActive(false)
    setSteps([])
    setCurrentStepIndex(0)
  }, [])

  const goToStep = useCallback(async (index: number) => {
    if (index >= 0 && index < steps.length) {
      if (steps[index].onBeforeActive) {
        await steps[index].onBeforeActive()
      }
      setCurrentStepIndex(index)
    } else if (index >= steps.length) {
      endTour()
    }
  }, [steps, endTour])

  const nextStep = useCallback(() => goToStep(currentStepIndex + 1), [currentStepIndex, goToStep])
  const prevStep = useCallback(() => goToStep(currentStepIndex - 1), [currentStepIndex, goToStep])

  return (
    <TourContext.Provider value={{ isActive, currentStepIndex, steps, startTour, endTour, nextStep, prevStep, goToStep }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
