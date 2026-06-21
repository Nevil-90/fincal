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
    <div className="flex justify-between gap-3 mt-4 max-w-sm mx-auto">
      {otpArray.map((digit, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 22,
            delay: index * 0.04
          }}
          whileHover={{ scale: 1.05 }}
          className="relative flex-1 aspect-square max-w-[50px] xs:max-w-[56px]"
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
            className="w-full h-full rounded-2xl border border-slate-800 bg-slate-950 text-center text-lg font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 shadow-inner"
          />
        </motion.div>
      ))}
    </div>
  )
}
