'use client'

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
}

export default function OtpInput({ value, onChange }: OtpInputProps) {
  const inputsRef = useRef<HTMLInputElement[]>([])

  const otpArray = value.split('').concat(Array(6).fill('')).slice(0, 6)

  // Focus the first input on load
  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '')
    if (!cleanVal) {
      const newOtp = [...otpArray]
      newOtp[index] = ''
      onChange(newOtp.join(''))
      return
    }

    const singleDigit = cleanVal.slice(-1)
    const newOtp = [...otpArray]
    newOtp[index] = singleDigit
    const newOtpString = newOtp.join('')
    onChange(newOtpString)

    if (index < 5 && singleDigit) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        const newOtp = [...otpArray]
        newOtp[index - 1] = ''
        onChange(newOtp.join(''))
        inputsRef.current[index - 1]?.focus()
      } else {
        const newOtp = [...otpArray]
        newOtp[index] = ''
        onChange(newOtp.join(''))
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
      e.preventDefault()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus()
      e.preventDefault()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6)
    if (pastedData) {
      onChange(pastedData)
      const focusIndex = Math.min(pastedData.length, 5)
      inputsRef.current[focusIndex]?.focus()
    }
  }

  return (
    <div className="flex justify-between gap-2.5 mt-3 max-w-sm mx-auto">
      {otpArray.map((digit, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            delay: index * 0.03
          }}
          className="relative flex-1 aspect-square max-w-[48px] sm:max-w-[52px]"
        >
          <input
            ref={(el) => {
              if (el) inputsRef.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-full h-full rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16161a] text-center text-base font-semibold tabular-nums text-slate-900 dark:text-white focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 outline-none transition-all shadow-xs"
          />
        </motion.div>
      ))}
    </div>
  )
}
