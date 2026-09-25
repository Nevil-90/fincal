'use client'

import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  leftIcon?: React.ReactNode
  selectSize?: 'xs' | 'sm' | 'md'
  wrapperClassName?: string
}

export const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(function CustomSelect(
  {
    label,
    leftIcon,
    selectSize = 'md',
    wrapperClassName = '',
    className = '',
    id,
    required,
    disabled,
    children,
    ...rest
  },
  ref
) {
  const sizeStyles = {
    xs: 'h-7 pl-2.5 pr-7 text-xs',
    sm: 'h-8 pl-3 pr-8 text-xs',
    md: 'h-10 pl-3.5 pr-8 text-xs'
  }

  const iconLeftPad = leftIcon ? (selectSize === 'xs' ? 'pl-7' : selectSize === 'sm' ? 'pl-8' : 'pl-9') : ''

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 min-h-[16px] leading-none select-none"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 dark:text-rose-400 ml-0.5 font-bold">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center shrink-0">
            {leftIcon}
          </div>
        )}
        <select
          ref={ref}
          id={id}
          required={required}
          disabled={disabled}
          className={`w-full appearance-none [-webkit-appearance:none] [-moz-appearance:none] font-medium rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#16161a] text-slate-900 dark:text-white transition-all cursor-pointer outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 hover:border-slate-300 dark:hover:border-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed flex items-center ${sizeStyles[selectSize]} ${iconLeftPad} ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-zinc-500 transition-colors shrink-0 ${
            selectSize === 'xs' ? 'h-3 w-3' : selectSize === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          }`}
        />
      </div>
    </div>
  )
})

export default CustomSelect
