'use client'

import { useEffect, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onExpire: () => void
  duration?: number
}

export default function UndoToast({ message, onUndo, onExpire, duration = 5000 }: UndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onExpire()
    }, duration)

    // Animate progress bar
    if (progressRef.current) {
      progressRef.current.style.transition = `width ${duration}ms linear`
      progressRef.current.style.width = '0%'
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [duration, onExpire])

  const handleUndo = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    onUndo()
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
      <div className="relative bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden w-80">
        <div className="flex items-center gap-3 px-4 py-3">
          <Trash2 className="h-4 w-4 text-slate-400 shrink-0" />
          <p className="text-sm font-semibold flex-1 text-slate-100">{message}</p>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            Undo
          </button>
        </div>
        {/* Progress bar countdown */}
        <div className="h-0.5 bg-slate-700">
          <div
            ref={progressRef}
            className="h-0.5 bg-blue-500 w-full"
          />
        </div>
      </div>
    </div>
  )
}
