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
    xs: 'pl-2.5 pr-7 py-1 text-xs',
    sm: 'pl-3 pr-8 py-1.5 text-xs',
    md: 'pl-3.5 pr-8 py-2 text-sm'
  }

  const iconLeftPad = leftIcon ? (selectSize === 'xs' ? 'pl-7' : 'pl-9') : ''

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <select
          ref={ref}
          id={id}
          required={required}
          disabled={disabled}
          className={`w-full appearance-none [-webkit-appearance:none] [-moz-appearance:none] font-semibold rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50/70 dark:bg-neutral-950 text-slate-900 dark:text-white transition-all cursor-pointer outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed ${sizeStyles[selectSize]} ${iconLeftPad} ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-neutral-500 transition-colors ${
            selectSize === 'xs' ? 'h-3 w-3' : selectSize === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          }`}
        />
      </div>
    </div>
  )
})

export default CustomSelect
